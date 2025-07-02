import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ArrowLeft, MapPin, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartFlow } from "@/store/cart-flow";
import { useTranslation } from "@/hooks/use-translation";
import { useState, useRef, useEffect } from "react";
import { createOrder } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
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

export default function RightSidebar({ isOpen, onClose }: RightSidebarProps) {
  const cartItems = useCartFlow(state => state.cartItems);
  const removeFromCart = useCartFlow(state => state.removeFromCart);
  const updateQuantity = useCartFlow(state => state.updateQuantity);
  const getCartTotal = useCartFlow(state => state.getCartTotal);
  const clearCart = useCartFlow(state => state.clearCart);
  const isUpdating = useCartFlow(state => state.isUpdating);
  const cartItemsCount = useCartFlow(state => state.getCartItemsCount());
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showCheckout, setShowCheckout] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const shippingFee = 1500; // Fixed shipping fee in IQD
  const totalWithShipping = getCartTotal() + shippingFee;

  const handlePlaceOrder = async () => {
    if (!user) return;
    
    setIsPlacingOrder(true);
    try {
      const orderData = {
        customerName: user.email || 'Customer',
        customerEmail: user.email || '',
        customerPhone: '07123456789', // Default phone
        address: {
          governorate: 'بغداد',
          district: 'الكرخ',
          neighborhood: 'الحارثية',
          street: 'شارع الرشيد',
          houseNumber: '123',
          floorNumber: '1',
          notes: 'تسليم سريع'
        },
        items: cartItems.map(item => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          unit: item.product.unit
        })),
        totalAmount: totalWithShipping,
        status: 'pending' as const,
        orderDate: new Date().toISOString(),
        notes: ''
      };

      await createOrder(orderData);
      clearCart();
      alert('Order placed successfully! Check the admin panel to view orders.');
      setShowCheckout(false);
      onClose();
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };



  const CheckoutScreen = () => (
    <div className="h-full flex flex-col">
      {/* Checkout Header */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-gray-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowCheckout(false)}
          className="hover:bg-gray-100 touch-action-manipulation"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold text-gray-800">{t('checkout')}</h2>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Items List - 40% of screen */}
      <div className="flex-2 overflow-y-auto px-6 py-4 bg-gray-50" style={{ minHeight: '40%' }}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('orderItems')}</h3>
        <div className="space-y-3">
          {cartItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
                <div>
                  <h4 className="font-medium text-gray-800 text-sm">{item.product.name}</h4>
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



      {/* Order Summary */}
      <div className="px-6 py-6 border-t border-gray-100 bg-white">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('orderSummary')}</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{t('subtotal')}:</span>
            <span className="font-medium">{getCartTotal().toFixed(0)} IQD</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{t('shippingFee')}:</span>
            <span className="font-medium">{shippingFee.toFixed(0)} IQD</span>
          </div>
          
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">{t('totalToPay')}:</span>
              <span className="text-xl font-bold text-fresh-green">
                {totalWithShipping.toFixed(0)} IQD
              </span>
            </div>
          </div>
        </div>

        <Button 
          onClick={handlePlaceOrder}
          className="w-full mt-6 bg-fresh-green hover:bg-fresh-green-dark"
          disabled={isPlacingOrder}
        >
          {isPlacingOrder ? 'Placing Order...' : t('placeOrder')}
        </Button>
      </div>
    </div>
  );

  const CartScreen = () => (
    <>
      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <p className="text-gray-500">{t('yourCartIsEmpty')}</p>
          </motion.div>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      disabled={isUpdating || item.quantity <= 1}
                      className="h-6 w-6 bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-full touch-action-manipulation"
                    >
                      <Minus className="h-2.5 w-2.5" />
                    </Button>
                    <span className="min-w-5 text-center font-medium text-xs">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={isUpdating}
                      className="h-6 w-6 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-full touch-action-manipulation"
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
                
                {/* Delete Button (Right Side Middle) - Red Icon Only */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromCart(item.id)}
                  disabled={false}
                  className="hover:bg-red-50 text-red-500 hover:text-red-600 disabled:text-red-300 disabled:cursor-not-allowed touch-action-manipulation h-7 w-7 flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {cartItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-6 py-6 border-t border-gray-100 bg-gray-50"
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-gray-800">Total:</span>
            <span className="text-xl font-bold text-fresh-green">
              {getCartTotal().toFixed(0)} IQD
            </span>
          </div>
          <Button 
            onClick={() => setShowCheckout(true)}
            className="w-full bg-fresh-green hover:bg-fresh-green-dark"
          >
{t('proceedToCheckout')}
          </Button>
        </motion.div>
      )}
    </>
  );

  return (
    <>
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
              {showCheckout ? <CheckoutScreen /> : <CartScreen />}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}