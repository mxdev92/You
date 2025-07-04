import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { useCartFlow } from "@/store/cart-flow";
import { useTranslation } from "@/hooks/use-translation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePostgresAuth } from "@/hooks/use-postgres-auth";
import { usePostgresAddressStore } from "@/store/postgres-address-store";
import type { CartItem, Product } from "@shared/schema";

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAddresses: () => void;
}

export default function RightSidebar({ isOpen, onClose, onNavigateToAddresses }: RightSidebarProps) {
  const queryClient = useQueryClient();
  
  // Use CartFlow store for cart data
  const { cartItems, isLoading: isLoadingCart, loadCart, updateQuantity: updateCartQuantity, removeFromCart: removeCartItem, clearCart: clearCartFlow } = useCartFlow();
  
  // PostgreSQL authentication and address integration
  const { user: postgresUser } = usePostgresAuth();
  const { addresses, loadAddresses } = usePostgresAddressStore();

  // Auto-load addresses when user is authenticated
  useEffect(() => {
    if (postgresUser && postgresUser.id) {
      console.log('Right sidebar: Auto-loading addresses for user:', postgresUser.id);
      loadAddresses(postgresUser.id);
    }
  }, [postgresUser, loadAddresses]);

  // Use CartFlow store methods directly
  const handleUpdateQuantity = async (id: number, quantity: number) => {
    await updateCartQuantity(id, quantity);
  };

  const handleRemoveItem = async (id: number) => {
    await removeCartItem(id);
  };

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return apiRequest('POST', '/api/orders', orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
  });

  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Calculate cart totals
  const getCartTotal = () => {
    if (!Array.isArray(cartItems)) return 0;
    return cartItems.reduce((sum: number, item: CartItem & { product: Product }) => {
      return sum + (parseFloat(item.product.price) * item.quantity);
    }, 0);
  };

  const getCartItemsCount = () => {
    if (!Array.isArray(cartItems)) return 0;
    return cartItems.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
  };

  const updateQuantity = (id: number, quantity: number) => {
    handleUpdateQuantity(id, quantity);
  };

  const removeFromCart = (id: number) => {
    handleRemoveItem(id);
  };

  const [currentView, setCurrentView] = useState<'cart' | 'checkout' | 'final'>('cart');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState<string>('');
  const globalDeliveryNotesRef = useRef<string>('');

  // Prevent background scrolling when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const shippingFee = 1500; // Fixed shipping fee in IQD
  const totalWithShipping = getCartTotal() + shippingFee;

  const deliveryTimes = [
    '8 - 11 صباحا',
    '11 - 2 ظهرا', 
    '2 - 5 مساءا',
    '5 - 8 مساءا'
  ];

  // Use first saved address automatically from PostgreSQL
  const primaryAddress = addresses.length > 0 ? addresses[0] : null;
  const hasAddress = addresses.length > 0 && postgresUser !== null;

  const handlePlaceOrder = async () => {
    console.log('Starting order placement...');
    console.log('User:', user);
    console.log('hasAddress:', hasAddress);
    console.log('primaryAddress:', primaryAddress);
    
    if (!hasAddress || !primaryAddress) {
      alert('يرجى إضافة عنوان التوصيل أولاً');
      return;
    }

    if (!deliveryTime) {
      alert('يرجى اختيار وقت التوصيل');
      return;
    }

    setIsPlacingOrder(true);

    try {
      console.log('Starting order submission...');
      
      const orderData = {
        customerName: postgresUser?.email?.split('@')[0] || 'عميل',
        customerEmail: postgresUser?.email || 'no-email@example.com',
        customerPhone: primaryAddress.notes ? primaryAddress.notes.split(' - ')[1] || '07501234567' : '07501234567',
        address: {
          governorate: primaryAddress.governorate,
          district: primaryAddress.district,
          neighborhood: primaryAddress.neighborhood,
          notes: primaryAddress.notes
        },
        items: cartItems ? cartItems.map(item => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          unit: item.product.unit
        })) : [],
        totalAmount: getCartTotal(),
        status: 'pending',
        deliveryTime: deliveryTime,
        notes: globalDeliveryNotesRef.current || ''
      };

      console.log('Order data prepared:', orderData);
      
      const orderId = await createOrderMutation.mutateAsync(orderData);
      console.log('Order created successfully with ID:', orderId);
      
      // Clear cart using CartFlow store for immediate UI update
      await clearCartFlow();
      console.log('Cart cleared successfully');
      
      // Also reload cart to ensure consistency
      await loadCart();
      
      // Invalidate order queries to refresh order history
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      console.log('Order history cache invalidated');
      
      alert('تم تقديم الطلب بنجاح! يمكنك مراجعة الطلب في لوحة الإدارة.');
      setCurrentView('cart');
      onClose();
    } catch (error: any) {
      console.error('Error placing order:', error);
      console.error('Error details:', error.message);
      alert(`فشل في تقديم الطلب: ${error.message || 'خطأ غير معروف'}. يرجى المحاولة مرة أخرى.`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const CheckoutScreen = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setCurrentView('cart')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
          تأكيد الطلب النهائي
        </h2>
        <div className="w-8" />
      </div>

      {/* Main Content - 3 Fields Only, No Scrolling */}
      <div className="flex-1 px-4 py-4 space-y-4">
        
        {/* 1. ملاحظات */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
            ملاحظات للتوصيل:
          </h3>
          <textarea 
            placeholder="اكتب أي ملاحظات خاصة للتوصيل..."
            className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 resize-none"
            style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
            rows={2}
            maxLength={150}
            value={globalDeliveryNotesRef.current || ''}
            onChange={(e) => {
              globalDeliveryNotesRef.current = e.target.value;
            }}
          />
        </div>

        {/* 2. أوقات التوصيل */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
            اختيار وقت التوصيل:
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {deliveryTimes.map((time) => (
              <button
                key={time}
                onClick={() => setDeliveryTime(time)}
                className={`px-2 py-2 rounded-lg text-xs border transition-all ${
                  deliveryTime === time
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-green-300'
                }`}
                style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* 3. المبلغ الكلي */}
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
            المبلغ الكلي الواجب دفعه عند التوصيل:
          </h3>
          <div className="text-center">
            <p className="text-xl font-bold text-green-600">
              {totalWithShipping.toFixed(0)} IQD
            </p>
            <p className="text-xs text-gray-600 mt-1" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
              يشمل رسوم التوصيل {shippingFee} د.ع
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="px-4 py-3 bg-white border-t border-gray-200">
        <Button 
          onClick={handlePlaceOrder}
          className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg h-12 text-sm font-medium"
          disabled={isPlacingOrder || !deliveryTime}
          style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
        >
          {isPlacingOrder ? 'جاري تنفيذ الطلب...' : 'تأكيد الطلب'}
        </Button>
      </div>
    </div>
  );

  const CartScreen = () => (
    <>
      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isLoadingCart ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading cart...</p>
          </div>
        ) : !cartItems || cartItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t('yourCartIsEmpty')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center space-x-3 py-3 border-b border-gray-100"
              >
                {/* Product Image */}
                <img
                  src={item.product?.imageUrl || '/placeholder-image.jpg'}
                  alt={item.product?.name || 'Product'}
                  className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                />
                
                {/* Content (Three Lines) */}
                <div className="flex-1 min-w-0">
                  {/* Line 1: Product Name */}
                  <div className="mb-1">
                    <h4 className="font-medium text-gray-800 text-xs">{item.product?.name || 'Unknown Product'}</h4>
                  </div>
                  
                  {/* Line 2: Price */}
                  <div className="mb-1">
                    <p className="text-fresh-green font-semibold text-xs">
                      {item.product?.price ? (parseFloat(item.product.price) * item.quantity).toFixed(0) : '0'} IQD
                    </p>
                  </div>
                  
                  {/* Line 3: Quantity Controls */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateQuantity(item.id, Math.max(1, item.quantity - 1));
                      }}
                      disabled={item.quantity <= 1}
                      className="h-6 w-6 bg-red-500 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center border-0 outline-0"
                    >
                      <Minus className="h-2.5 w-2.5" />
                    </button>
                    <span className="min-w-5 text-center font-medium text-xs">{item.quantity}</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateQuantity(item.id, item.quantity + 1);
                      }}
                      className="h-6 w-6 bg-green-500 text-white rounded-full flex items-center justify-center border-0 outline-0"
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
                
                {/* Delete Button (Right Side Middle) - Red Icon Only */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFromCart(item.id);
                  }}
                  className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {cartItems.length > 0 && (
        <div className="px-6 py-6 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-gray-800">Total:</span>
            <span className="text-xl font-bold text-fresh-green">
              {getCartTotal().toFixed(0)} IQD
            </span>
          </div>
          <Button 
            onClick={() => setCurrentView('checkout')}
            className="w-full bg-fresh-green hover:bg-fresh-green-dark"
            style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
          >
            اكمال عملية الطلب
          </Button>
        </div>
      )}
    </>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black bg-opacity-50"
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
              <h2 className="text-xl font-bold text-gray-800">{t('cart')}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close cart"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            {currentView === 'cart' ? <CartScreen /> : <CheckoutScreen />}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}