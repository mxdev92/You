import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ArrowLeft, MapPin, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { useCartFlow } from "@/store/cart-flow";
import { useTranslation } from "@/hooks/use-translation";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useRef, useEffect } from "react";
import { usePostgresAuth } from "@/hooks/use-postgres-auth";
import { usePostgresAddressStore } from "@/store/postgres-address-store";
import { formatPrice } from "@/lib/utils";
import type { CartItem, Product } from "@shared/schema";
import { MetaPixel } from "@/lib/meta-pixel";
import { Link, useLocation } from "wouter";
import { useDeliveryFee } from "@/hooks/use-settings";
import { usePromotions } from "@/hooks/use-promotions";
import PromotionProgressBar from "@/components/promotion-progress-bar";

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
  const [, setLocation] = useLocation();
  
  // Use CartFlow store for cart data
  const { cartItems, isLoading: isLoadingCart, loadCart, updateQuantity: updateCartQuantity, removeFromCart: removeCartItem, clearCart: clearCartFlow } = useCartFlow();
  
  // PostgreSQL authentication and address integration
  const { user: postgresUser } = usePostgresAuth();
  const { addresses, loadAddresses } = usePostgresAddressStore();

  // Auto-load addresses only once when user is authenticated
  useEffect(() => {
    if (postgresUser?.id) {
      console.log('Right sidebar: Auto-loading addresses for user:', postgresUser.id);
      loadAddresses(postgresUser.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postgresUser?.id]); // Only depend on user ID, not entire user object

  // Use CartFlow store methods directly
  const handleUpdateQuantity = async (id: number, quantity: number) => {
    await updateCartQuantity(id, quantity);
  };

  const handleRemoveItem = async (id: number) => {
    await removeCartItem(id);
  };



  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest('POST', '/api/orders', orderData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
  });

  const { t } = useTranslation();
  
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
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'error'
  });
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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet'>('cash');
  const deliveryNotesRef = useRef<HTMLTextAreaElement>(null);

  // Get wallet balance
  const { data: walletData } = useQuery({
    queryKey: ['/api/wallet/balance'],
    enabled: !!postgresUser,
    retry: 1
  });

  const showNotification = (message: string, type: 'success' | 'error' = 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'error' });
    }, 3000);
  };

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

  // Get dynamic delivery fee from settings
  const { deliveryFee: baseDeliveryFee } = useDeliveryFee();
  
  // App services fee (constant)
  const appServicesFee = 500;
  
  // Use stable promotion calculations - NO refetching on cart changes
  const cartTotal = getCartTotal();
  const promotion = usePromotions(cartTotal, baseDeliveryFee);
  
  // Extract values from promotion hook for easy access
  const hasPromotionFreeDelivery = promotion.hasFreeDelivery;
  const promotionDiscount = promotion.discount;
  const shippingFee = baseDeliveryFee; // Keep for display reference
  
  // Calculate coupon discount
  const getCouponDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'amount') {
      return Math.min(appliedCoupon.amount, cartTotal);
    }
    return 0;
  };
  
  // Calculate final shipping fee (considering free delivery coupons AND promotions)
  const getFinalShippingFee = () => {
    if (appliedCoupon && appliedCoupon.type === 'free_delivery') {
      return 0;
    }
    return promotion.deliveryFee;
  };
  
  const couponDiscount = getCouponDiscount();
  const finalShippingFee = getFinalShippingFee();
  // Ensure total never goes negative
  const totalWithShipping = Math.max(0, cartTotal - couponDiscount - promotionDiscount + finalShippingFee + appServicesFee);
  
  // Apply coupon function
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('الرجاء إدخال رمز الكوبون');
      return;
    }
    
    try {
      const response = await apiRequest('POST', '/api/coupons/validate', { code: couponCode });
      const coupon = await response.json();
      setAppliedCoupon(coupon);
      setCouponError('');
      setNotification({
        show: true,
        message: `تم تطبيق كوبون "${coupon.name}" بنجاح!`,
        type: 'success'
      });
      setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
    } catch (error: any) {
      setCouponError(error.message || 'كوبون غير صالح');
      setAppliedCoupon(null);
    }
  };
  
  // Remove coupon function
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const iraqiGovernorates = [
    'بغداد', 'نينوى', 'البصرة', 'صلاح الدين', 'دهوك', 'أربيل', 'السليمانية', 
    'ديالى', 'واسط', 'ميسان', 'ذي قار', 'المثنى', 'بابل', 'كربلاء', 'النجف', 
    'الانبار', 'الديوانية', 'كركوك', 'حلبجة'
  ];

  // Use first saved address automatically from PostgreSQL
  const primaryAddress = addresses.length > 0 ? addresses[0] : null;
  const hasAddress = addresses.length > 0;

  const handlePlaceOrder = async () => {
    console.log('Starting order placement...');
    console.log('User:', postgresUser);
    console.log('hasAddress:', hasAddress);
    console.log('primaryAddress:', primaryAddress);
    
    // Check if user is authenticated
    if (!postgresUser) {
      showNotification('يرجى تسجيل الدخول أولاً لإتمام الطلب');
      setIsPlacingOrder(false);
      return;
    }

    if (!hasAddress || !primaryAddress) {
      showNotification('يرجى إضافة عنوان للتوصيل أولاً');
      setIsPlacingOrder(false);
      return;
    }
    
    if (!deliveryTime) {
      showNotification('يرجى اختيار وقت التوصيل');
      setIsPlacingOrder(false);
      return;
    }

    // Check if cart has items
    if (!cartItems || cartItems.length === 0) {
      showNotification('يرجى إضافة منتجات إلى السلة أولاً');
      setIsPlacingOrder(false);
      return;
    }

    // Check wallet balance only for wallet payments
    if (paymentMethod === 'wallet') {
      const walletBalance = walletData?.balance || 0;
      if (walletBalance < totalWithShipping) {
        showNotification(`رصيد المحفظة غير كافي. الرصيد الحالي: ${formatPrice(walletBalance)} دينار والمطلوب: ${formatPrice(totalWithShipping)} دينار. يرجى شحن المحفظة أولاً`);
        setIsPlacingOrder(false);
        return;
      }
    }
    
    setIsPlacingOrder(true);
    try {
      console.log('Starting order submission...');
      
      // Use phone from user profile (required for authenticated users)
      const customerPhone = postgresUser.phone;
      const customerName = postgresUser.fullName || postgresUser.email.split('@')[0];
      
      const orderData = {
        customerName: customerName,
        customerEmail: postgresUser.email,
        customerPhone: customerPhone,
        address: {
          governorate: primaryAddress.governorate,
          district: primaryAddress.district,
          neighborhood: primaryAddress.neighborhood,
          notes: primaryAddress.neighborhood // Only store landmark/neighborhood, not phone
        },
        items: [
          // Regular cart items
          ...(Array.isArray(cartItems) ? cartItems.map((item: CartItem & { product: Product }) => ({
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            unit: item.product.unit
          })) : []),
          // Add App Services Fee as a separate item
          {
            productId: 'app_services',
            productName: 'آب سيرفز',
            quantity: '1',
            price: appServicesFee.toString(),
            unit: 'خدمة'
          }
        ],
        totalAmount: getCartTotal() + appServicesFee,
        paymentMethod: paymentMethod,
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
      
      const order = await createOrderMutation.mutateAsync(orderData);
      console.log('Order created successfully:', order);
      
      const orderId = order.id;
      if (!orderId) {
        throw new Error('No order ID received from server');
      }

      // Deduct amount from wallet only for wallet payments
      if (paymentMethod === 'wallet') {
        try {
          await apiRequest('POST', '/api/wallet/charge', { 
            amount: -totalWithShipping, // Negative amount for payment
            description: `دفع طلب #${orderId} - ${formatPrice(totalWithShipping)} دينار`
          });
          console.log('Wallet payment processed successfully');
        } catch (walletError) {
          console.error('Wallet payment failed:', walletError);
          // Order is already created, so we just warn the user
          showNotification('تم إنشاء الطلب ولكن فشل خصم المبلغ من المحفظة', 'error');
        }
      } else {
        console.log('Cash on delivery - no wallet deduction needed');
      }
      
      // Track successful purchase with Meta Pixel
      MetaPixel.trackPurchase(orderData.totalAmount + (shippingFee || 0) + appServicesFee, orderId.toString()); // Include delivery fee and app services fee
      
      // Clear cart using CartFlow store for immediate UI update
      await clearCartFlow();
      console.log('Cart cleared successfully');
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/transactions'] });
      console.log('Caches invalidated');
      
      // Store order details temporarily for the confirmation page
      localStorage.setItem('lastOrderId', orderId.toString());
      localStorage.setItem('lastOrderTotal', totalWithShipping.toString());
      
      // Navigate to order confirmation page
      setLocation(`/order-confirmation?orderId=${orderId}&totalAmount=${totalWithShipping}`);
      onClose();
    } catch (error: any) {
      console.error('Error placing order:', error);
      console.error('Error details:', error.message);
      showNotification(`فشل في تقديم الطلب: ${error.message || 'خطأ غير معروف'}. يرجى المحاولة مرة أخرى.`);
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

      {/* Cart Items - Scrollable */}
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
                  {(parseFloat(item.product.price) * parseFloat(item.quantity)).toFixed(0)} IQD
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Address Section - Fixed */}
      {hasAddress && primaryAddress && (
        <div className="flex-shrink-0 px-6 py-3 border-t border-gray-100">
          <div className="bg-white rounded-lg p-3 border border-green-200" dir="rtl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                عنوان التوصيل:
              </h3>
              <MapPin className="h-4 w-4 text-green-600" />
            </div>
            <div className="space-y-1 text-xs" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
              <div className="flex items-start gap-2">
                <span className="font-medium text-gray-500">الاسم:</span>
                <span className="text-gray-800 font-medium">
                  {postgresUser?.fullName || postgresUser?.email?.split('@')[0] || 'غير محدد'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-gray-500">الرقم:</span>
                <span className="text-gray-800 font-medium">{postgresUser?.phone || 'غير محدد'}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-gray-500">العنوان:</span>
                <span className="text-gray-800">{primaryAddress.governorate} - {primaryAddress.district}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Section - Fixed */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-gray-100" dir="rtl">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
            كوبون الخصم
          </h3>
          
          {appliedCoupon ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">{appliedCoupon.name}</p>
                  <p className="text-xs text-green-600">
                    {appliedCoupon.type === 'amount' 
                      ? `خصم ${formatPrice(appliedCoupon.amount)} د.ع` 
                      : 'توصيل مجاني'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeCoupon}
                  className="text-green-600 hover:text-green-800 hover:bg-green-100"
                  data-testid="button-remove-coupon"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="أدخل رمز الكوبون"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                  data-testid="input-coupon-code"
                />
                {couponError && (
                  <p className="text-xs text-red-600 mt-1">{couponError}</p>
                )}
              </div>
              <Button
                onClick={applyCoupon}
                variant="outline"
                size="sm"
                className="px-4 border-green-500 text-green-600 hover:bg-green-50"
                data-testid="button-apply-coupon"
              >
                تطبيق
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Total & Button - Fixed */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between mb-4" dir="rtl">
          <span className="text-base font-semibold text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>المبلغ الاجمالي:</span>
          <span className="text-lg font-bold text-fresh-green">
            {formatPrice(cartTotal + promotion.deliveryFee - promotionDiscount - couponDiscount)} IQD
          </span>
        </div>

        <Button 
          onClick={hasAddress ? () => setCurrentView('final') : onNavigateToAddresses}
          className="w-full bg-fresh-green hover:bg-fresh-green-dark"
          style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
        >
          {hasAddress ? 'اكمال عملية الطلب' : 'اضافة عنوان توصيل'}
        </Button>
      </div>
    </div>
  );

  const FinalScreen = () => (
    <div className="h-full flex flex-col bg-gray-50" dir="rtl">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="w-6" />
        <h2 className="text-base font-semibold text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
          تأكيد الطلب النهائي
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentView('checkout')}
          className="hover:bg-gray-100 p-1.5"
        >
          <ArrowLeft className="h-4 w-4 rotate-180" />
        </Button>
      </div>

      {/* Compact Content - No Scrolling */}
      <div className="flex-1 px-4 py-3 space-y-3 overflow-hidden">
        {/* Delivery Notes - Clean */}
        <DeliveryNotesComponent />


        {/* Time Selection - Compact */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <h3 className="text-xs font-medium text-gray-700 mb-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
            اختيار وقت التوصيل:
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDeliveryTime('8 - 11 صباحا')}
              className={`p-2 text-xs rounded-lg transition-all ${
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
              className={`p-2 text-xs rounded-lg transition-all ${
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

        {/* Payment Method Selection - Compact */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <h3 className="text-xs font-medium text-gray-700 mb-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
            طرق الدفع:
          </h3>
          <div className="space-y-2">
            {/* Cash on Delivery Option - Primary */}
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`w-full p-3 rounded-lg transition-all border-2 ${
                paymentMethod === 'cash' 
                  ? 'bg-green-50 border-green-500 text-green-700' 
                  : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}
              style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
            >
              <div className="flex items-center justify-between">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === 'cash' ? 'border-green-500' : 'border-gray-300'
                }`}>
                  {paymentMethod === 'cash' && <div className="w-3 h-3 rounded-full bg-green-500" />}
                </div>
                <span className="text-sm font-medium">الدفع عند الاستلام</span>
              </div>
            </button>

            {/* Wallet Payment Option */}
            <button
              onClick={() => setPaymentMethod('wallet')}
              className={`w-full p-3 rounded-lg transition-all border-2 ${
                paymentMethod === 'wallet' 
                  ? 'bg-green-50 border-green-500 text-green-700' 
                  : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}
              style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
            >
              <div className="flex items-center justify-between">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === 'wallet' ? 'border-green-500' : 'border-gray-300'
                }`}>
                  {paymentMethod === 'wallet' && <div className="w-3 h-3 rounded-full bg-green-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">المحفظة</span>
                  <span className="text-xs opacity-75">({formatPrice(walletData?.balance || 0)} IQD)</span>
                </div>
              </div>
              {paymentMethod === 'wallet' && walletData && walletData.balance < totalWithShipping && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-1.5 text-center">
                  رصيد غير كافي
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Total - Using correct calculation from cart */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-green-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
              {formatPrice(cartTotal + promotion.deliveryFee - promotionDiscount - couponDiscount)} IQD
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button - Compact */}
      <div className="px-4 py-3 bg-white border-t border-gray-200">
        <Button 
          onClick={handlePlaceOrder}
          className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg h-12 text-sm font-medium shadow-lg"
          disabled={isPlacingOrder || !deliveryTime || (paymentMethod === 'wallet' && walletData && walletData.balance < totalWithShipping)}
          style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
        >
          {isPlacingOrder ? 'جاري تنفيذ الطلب...' : 
           (paymentMethod === 'wallet' && walletData && walletData.balance < totalWithShipping) ? 'رصيد غير كافي' : 'تأكيد الطلب'}
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
                        const currentQty = parseFloat(item.quantity);
                        let newQuantity;
                        if (currentQty === 1) {
                          newQuantity = 0.5; // 1kg → 0.5kg
                        } else if (currentQty > 1) {
                          newQuantity = currentQty - 1; // 2kg → 1kg, 3kg → 2kg, etc.
                        } else {
                          newQuantity = 0.5; // Keep at minimum
                        }
                        updateQuantity(item.id, newQuantity);
                      }}
                      disabled={parseFloat(item.quantity) <= 0.5}
                      className="h-6 w-6 disabled:cursor-not-allowed text-black rounded-full flex items-center justify-center border-0 outline-0"
                      style={{ backgroundColor: parseFloat(item.quantity) <= 0.5 ? '#fbbf24' : '#22c55e' }}
                    >
                      <Minus className="h-2.5 w-2.5" />
                    </button>
                    <span className="min-w-5 text-center font-medium text-xs">{parseFloat(item.quantity) % 1 === 0 ? parseInt(item.quantity) : parseFloat(item.quantity)}</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const currentQty = parseFloat(item.quantity);
                        let newQuantity;
                        if (currentQty === 0.5) {
                          newQuantity = 1; // 0.5kg → 1kg
                        } else {
                          newQuantity = currentQty + 1; // 1kg → 2kg, 2kg → 3kg, etc.
                        }
                        updateQuantity(item.id, newQuantity);
                      }}
                      className="h-6 w-6 text-black rounded-full flex items-center justify-center border-0 outline-0"
                      style={{ backgroundColor: '#22c55e' }}
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
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          {/* Promotion Progress Bar */}
          <PromotionProgressBar cartTotal={cartTotal} />
          
          {/* Price Breakdown - Stable calculations */}
          <div className="space-y-2 mb-3" dir="rtl">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>المجموع:</span>
              <span className="text-sm font-medium">{formatPrice(cartTotal)} IQD</span>
            </div>
            
            {/* Delivery Fee */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>اجور التوصيل:</span>
              {hasPromotionFreeDelivery ? (
                <span className="text-sm font-medium flex items-center gap-2">
                  <span className="text-green-600 font-semibold">مجاني</span>
                  <span className="line-through text-gray-400 text-xs">{formatPrice(baseDeliveryFee)}</span>
                </span>
              ) : (
                <span className="text-sm font-medium">{formatPrice(baseDeliveryFee)} IQD</span>
              )}
            </div>
            
            {/* Discount */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>الخصومات:</span>
              <span className={`text-sm font-medium ${promotionDiscount > 0 ? 'text-green-600' : ''}`}>
                {promotionDiscount > 0 ? `-${formatPrice(promotionDiscount)} IQD` : '0 IQD'}
              </span>
            </div>
            
            {/* Total */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-base font-semibold text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>المبلغ الاجمالي:</span>
              <span className="text-lg font-bold text-fresh-green">
                {formatPrice(cartTotal + promotion.deliveryFee - promotionDiscount)} IQD
              </span>
            </div>
          </div>
          
          <Button 
            onClick={() => {
              MetaPixel.trackInitiateCheckout(cartTotal + baseDeliveryFee + appServicesFee);
              setCurrentView('checkout');
            }}
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

      {/* Custom Notification Modal */}
      {notification.show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
          onClick={() => setNotification({ show: false, message: '', type: 'error' })}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 ${
              notification.type === 'error' ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  notification.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                  {notification.type === 'error' ? '❌' : '✅'}
                </div>
                <p 
                  className="text-gray-800 dark:text-gray-200 text-sm font-medium leading-relaxed"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                  dir="rtl"
                >
                  {notification.message}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setNotification({ show: false, message: '', type: 'error' })}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl text-sm font-medium transition-colors"
                style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
              >
                حسناً
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}