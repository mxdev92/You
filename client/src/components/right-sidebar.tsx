import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ArrowLeft, MapPin, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { useCartFlow } from "@/store/cart-flow";
import { useTranslation } from "@/hooks/use-translation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useRef, useEffect } from "react";
import { createUserOrder } from "@/lib/firebase-user-data";
import { useAuth } from "@/hooks/use-auth";
import type { CartItem, Product } from "@shared/schema";

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAddresses: () => void;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}

function CustomDropdown({ value, onChange, options, placeholder }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white flex items-center justify-between"
        style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value || placeholder}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto"
          >
            {options.map((option, index) => (
              <motion.button
                key={option}
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-sm text-right hover:bg-green-50 hover:text-green-600 transition-colors text-gray-700"
                style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
              >
                {option}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Global ref to access delivery notes from isolated component
let globalDeliveryNotesRef: { current: string } = { current: '' };

const DeliveryNotesComponent = React.memo(() => {
  const [localNotes, setLocalNotes] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalNotes(value);
    globalDeliveryNotesRef.current = value;
  };
  
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
          ملاحظات للتوصيل:
        </h3>
      </div>
      <textarea
        ref={textareaRef}
        value={localNotes}
        onChange={handleChange}
        placeholder="اكتب أي ملاحظات خاصة للتوصيل..."
        className="w-full p-3 text-sm border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-fresh-green resize-none text-right"
        rows={3}
        style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
        autoComplete="off"
        spellCheck="false"
      />
    </div>
  );
});

DeliveryNotesComponent.displayName = 'DeliveryNotesComponent';

export default function RightSidebar({ isOpen, onClose, onNavigateToAddresses }: RightSidebarProps) {
  const queryClient = useQueryClient();
  
  // Use CartFlow store for cart data
  const { cartItems, isLoading: isLoadingCart, loadCart, updateQuantity: updateCartQuantity, removeFromCart: removeCartItem } = useCartFlow();

  // Use CartFlow store methods directly
  const handleUpdateQuantity = async (id: number, quantity: number) => {
    await updateCartQuantity(id, quantity);
  };

  const handleRemoveItem = async (id: number) => {
    await removeCartItem(id);
  };

  const _updateCartMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const result = await apiRequest('PATCH', `/api/cart/${id}`, { quantity });
      return result;
    },
    onMutate: async ({ id, quantity }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/cart'] });
      
      // Snapshot the previous value
      const previousCart = queryClient.getQueryData(['/api/cart']);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['/api/cart'], (old: any) => {
        if (!old) return old;
        return old.map((item: any) => 
          item.id === id ? { ...item, quantity } : item
        );
      });
      
      return { previousCart };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      queryClient.setQueryData(['/api/cart'], context?.previousCart);
    },
    onSettled: () => {
      // Refetch after success or error
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  const removeCartMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await apiRequest('DELETE', `/api/cart/${id}`);
      return result;
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/cart'] });
      
      // Snapshot the previous value
      const previousCart = queryClient.getQueryData(['/api/cart']);
      
      // Optimistically remove the item
      queryClient.setQueryData(['/api/cart'], (old: any) => {
        if (!old) return old;
        return old.filter((item: any) => item.id !== id);
      });
      
      return { previousCart };
    },
    onError: (err, id, context) => {
      // Rollback on error
      queryClient.setQueryData(['/api/cart'], context?.previousCart);
    },
    onSettled: () => {
      // Refetch after success or error
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', '/api/cart');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

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

  const clearCart = () => {
    clearCartMutation.mutate();
  };
  const [currentView, setCurrentView] = useState<'cart' | 'checkout' | 'final'>('cart');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [addressData, setAddressData] = useState({
    governorate: '',
    district: '',
    neighborhood: '',
    street: '',
    houseNumber: '',
    floorNumber: '',
    nearestLandmark: ''
  });
  const [deliveryTime, setDeliveryTime] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const deliveryNotesRef = useRef<HTMLTextAreaElement>(null);

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

  const iraqiGovernorates = [
    'بغداد', 'نينوى', 'البصرة', 'صلاح الدين', 'دهوك', 'أربيل', 'السليمانية', 
    'ديالى', 'واسط', 'ميسان', 'ذي قار', 'المثنى', 'بابل', 'كربلاء', 'النجف', 
    'الانبار', 'الديوانية', 'كركوك', 'حلبجة'
  ];

  // Use first saved address automatically (addresses removed for database cart system)
  const primaryAddress = null;
  const hasAddress = false;

  const handlePlaceOrder = async () => {
    console.log('Starting order placement...');
    console.log('User:', user);
    console.log('hasAddress:', hasAddress);
    console.log('primaryAddress:', primaryAddress);
    
    if (!hasAddress || !primaryAddress) {
      alert('Please add a delivery address first.');
      setIsPlacingOrder(false);
      return;
    }
    
    // Allow orders without authentication by using address data for customer info
    if (!user) {
      console.log('No user authenticated, using address data for customer info');
    }
    
    if (!deliveryTime) {
      alert('Please select a delivery time.');
      setIsPlacingOrder(false);
      return;
    }
    
    setIsPlacingOrder(true);
    try {
      console.log('Starting order submission...');
      
      const orderData = {
        customerName: addressData.governorate + ' Customer',
        customerEmail: user?.email || 'guest@example.com',
        customerPhone: '07501234567',
        address: {
          governorate: addressData.governorate,
          district: addressData.district,
          neighborhood: addressData.neighborhood,
          street: addressData.street,
          houseNumber: addressData.houseNumber,
          floorNumber: addressData.floorNumber,
          notes: ''
        },
        items: Array.isArray(cartItems) ? cartItems.map((item: CartItem & { product: Product }) => ({
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
      console.log('Order data types:', {
        customerName: typeof orderData.customerName,
        customerEmail: typeof orderData.customerEmail,
        customerPhone: typeof orderData.customerPhone,
        address: typeof orderData.address,
        items: typeof orderData.items,
        totalAmount: typeof orderData.totalAmount,
        status: typeof orderData.status,
        deliveryTime: typeof orderData.deliveryTime,
        notes: typeof orderData.notes
      });
      
      const orderId = await createOrderMutation.mutateAsync(orderData);
      console.log('Order created successfully with ID:', orderId);
      
      clearCart();
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

  const AddressForm = () => (
    <AnimatePresence mode="wait">
      {showAddressForm && (
        <div className="fixed inset-0 z-[60]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowAddressForm(false)}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-4 bg-white rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{t('myAddress')}</h2>
                <button
                  onClick={() => setShowAddressForm(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <span className="text-gray-500 text-lg">×</span>
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 p-4">
              <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={`${addressData.governorate} Customer`}
                    onChange={(e) => {}}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value="07501234567"
                    onChange={(e) => {}}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                {/* Government */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Governorate
                  </label>
                  <CustomDropdown
                    value={addressData.governorate}
                    onChange={(value) => setAddressData({...addressData, governorate: value})}
                    options={iraqiGovernorates}
                    placeholder="Select governorate"
                  />
                </div>

                {/* District */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={addressData.district}
                    onChange={(e) => setAddressData({...addressData, district: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter your district"
                    required
                  />
                </div>

                {/* Nearest Landmark */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nearest Landmark
                  </label>
                  <input
                    type="text"
                    value={addressData.nearestLandmark}
                    onChange={(e) => setAddressData({...addressData, nearestLandmark: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter nearest landmark"
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddressForm(false)}
                    className="flex-1 text-xs py-2 border-red-500 text-red-500 hover:bg-red-50 hover:border-red-600 hover:text-red-600"
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-fresh-green hover:bg-fresh-green-dark text-xs py-2"
                  >
{t('saveAddress')}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );



  const CheckoutScreen = () => (
    <div className="h-full flex flex-col">
      {/* Checkout Header */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-gray-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView('cart')}
          className="hover:bg-gray-100 touch-action-manipulation"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
          تأكيد الطلب
        </h2>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Items List - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-3">
          {cartItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100"
            >
              <div className="flex items-center space-x-3">
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
                <div>
                  <h4 className="font-medium text-gray-800 text-sm" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    {item.product.name}
                  </h4>
                  <p className="text-xs text-gray-500">{item.product.unit}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-800">{item.quantity}x</p>
                <p className="text-fresh-green font-semibold text-sm">
                  {(parseFloat(item.product.price) * item.quantity).toFixed(0)} IQD
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="px-6 py-6 border-t border-gray-100 bg-gray-50">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>السعر الكلي:</span>
            <span className="font-medium">{getCartTotal().toFixed(0)} IQD</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>أجور التوصيل:</span>
            <span className="font-medium">{shippingFee.toFixed(0)} IQD</span>
          </div>
          
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>المبلغ الكلي:</span>
              <span className="text-xl font-bold text-fresh-green">
                {totalWithShipping.toFixed(0)} IQD
              </span>
            </div>
          </div>
        </div>

        <Button 
          onClick={hasAddress ? () => setCurrentView('final') : onNavigateToAddresses}
          className="w-full mt-6 bg-fresh-green hover:bg-fresh-green-dark"
          style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
        >
          {hasAddress ? 'اكمال عملية الطلب' : 'اضافة عنوان توصيل'}
        </Button>
      </div>
    </div>
  );

  const FinalScreen = () => (
    <div className="h-full flex flex-col bg-gray-50" dir="rtl">
      {/* Clean Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div className="w-6" />
        <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
          تأكيد الطلب النهائي
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentView('checkout')}
          className="hover:bg-gray-100 p-2"
        >
          <ArrowLeft className="h-5 w-5 rotate-180" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Delivery Notes - Clean */}
        <DeliveryNotesComponent />

        {/* Address - Clean */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
            العنوان:
          </h3>
          {hasAddress && (
            <div className="space-y-2">
              <p className="text-base font-medium text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                {addressData.governorate} Customer
              </p>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                {addressData.governorate} - طريق {addressData.district}
              </p>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                {addressData.neighborhood}
              </p>
              <p className="text-sm text-gray-900 font-medium" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                07501234567
              </p>
            </div>
          )}
        </div>

        {/* Time Selection - Clean */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
            اختيار وقت التوصيل:
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => setDeliveryTime('8 - 11 صباحا')}
              className={`w-full p-4 text-sm rounded-xl transition-all ${
                deliveryTime === '8 - 11 صباحا' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-blue-50 text-gray-700 hover:bg-blue-100'
              }`}
              style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
            >
              8 - 11 صباحا
            </button>
            <button
              onClick={() => setDeliveryTime('2 - 8 مساءا')}
              className={`w-full p-4 text-sm rounded-xl transition-all ${
                deliveryTime === '2 - 8 مساءا' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-blue-50 text-gray-700 hover:bg-blue-100'
              }`}
              style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
            >
              2 - 8 مساءا
            </button>
          </div>
        </div>

        {/* Total Payment - Clean */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
            المبلغ الكلي الواجب دفعه عند التوصيل:
          </h3>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {totalWithShipping.toFixed(0)} IQD
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button - Clean */}
      <div className="px-4 py-4 bg-white border-t border-gray-200">
        <Button 
          onClick={handlePlaceOrder}
          className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl h-14 text-base font-medium shadow-lg"
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
                  className="text-red-500 h-7 w-7 flex-shrink-0 flex items-center justify-center border-0 outline-0 bg-transparent"
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
    <>
      <AddressForm />
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50">
            {/* Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm touch-action-manipulation"
              onClick={onClose}
            />
            
            {/* Sidebar Content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ 
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.3 
              }}
              className="absolute right-0 w-80 max-w-[85vw] bg-white h-full shadow-2xl rounded-l-3xl flex flex-col safe-area-inset"
            >
              {currentView === 'checkout' ? <CheckoutScreen /> : currentView === 'final' ? <FinalScreen /> : <CartScreen />}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}