import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ArrowLeft, MapPin, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="w-full p-3 border border-gray-300 rounded-lg text-right bg-white hover:border-gray-400 focus:border-fresh-green focus:ring-1 focus:ring-fresh-green transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "text-gray-900" : "text-gray-500"}>
          {value || placeholder}
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className="w-full p-3 text-right hover:bg-gray-50 transition-colors"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ShippingFormProps {
  isOpen: boolean;
  onClose: () => void;
}

function ShippingForm({ isOpen, onClose }: ShippingFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    governorate: '',
    district: '',
    neighborhood: '',
    street: '',
    houseNumber: '',
    floorNumber: '',
    notes: '',
    fullAddress: ''
  });

  const iraqiGovernorates = [
    'بغداد', 'نينوى', 'البصرة', 'صلاح الدين', 'دهوك', 'أربيل', 'السليمانية', 
    'ديالى', 'واسط', 'ميسان', 'ذي قار', 'المثنى', 'بابل', 'كربلاء', 'النجف', 
    'القادسية', 'الأنبار', 'كركوك'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullAddress = `${formData.governorate}, ${formData.district}, ${formData.neighborhood}, ${formData.street}, ${formData.houseNumber}${formData.floorNumber ? `, الطابق ${formData.floorNumber}` : ''}${formData.notes ? `, ${formData.notes}` : ''}`;
    setFormData(prev => ({ ...prev, fullAddress }));
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="absolute inset-0 bg-white z-50 overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">{t('shippingAddress')}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  المحافظة *
                </label>
                <CustomDropdown
                  value={formData.governorate}
                  onChange={(value) => setFormData(prev => ({ ...prev, governorate: value }))}
                  options={iraqiGovernorates}
                  placeholder="اختر المحافظة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  القضاء/المنطقة *
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-fresh-green focus:ring-1 focus:ring-fresh-green text-right"
                  placeholder="أدخل القضاء أو المنطقة"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  الحي *
                </label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-fresh-green focus:ring-1 focus:ring-fresh-green text-right"
                  placeholder="أدخل اسم الحي"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  الشارع/الزقاق *
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-fresh-green focus:ring-1 focus:ring-fresh-green text-right"
                  placeholder="أدخل اسم الشارع أو الزقاق"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    رقم الدار *
                  </label>
                  <input
                    type="text"
                    value={formData.houseNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, houseNumber: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-fresh-green focus:ring-1 focus:ring-fresh-green text-right"
                    placeholder="رقم الدار"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    رقم الطابق
                  </label>
                  <input
                    type="text"
                    value={formData.floorNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, floorNumber: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-fresh-green focus:ring-1 focus:ring-fresh-green text-right"
                    placeholder="اختياري"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  ملاحظات إضافية
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-fresh-green focus:ring-1 focus:ring-fresh-green text-right h-24 resize-none"
                  placeholder="معلومات إضافية لتسهيل التوصيل"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-fresh-green hover:bg-green-600 text-white py-3 rounded-lg font-medium"
              >
                حفظ العنوان
              </Button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function RightSidebar({ isOpen, onClose }: RightSidebarProps) {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice, getItemCount, clearCart } = useCart();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    governorate: '',
    district: '',
    neighborhood: '',
    street: '',
    houseNumber: '',
    floorNumber: '',
    notes: '',
    fullAddress: ''
  });

  const shippingFee = 1500;
  const totalWithShipping = getTotalPrice() + shippingFee;

  const handlePlaceOrder = async () => {
    if (!user) return;

    try {
      const orderData = {
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        address: {
          governorate: customerInfo.governorate,
          district: customerInfo.district,
          neighborhood: customerInfo.neighborhood,
          street: customerInfo.street,
          houseNumber: customerInfo.houseNumber,
          floorNumber: customerInfo.floorNumber,
          notes: customerInfo.notes,
        },
        items: cartItems.map(item => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          unit: item.product.unit,
        })),
        totalAmount: totalWithShipping,
        status: 'pending' as const,
        orderDate: new Date().toISOString(),
        notes: customerInfo.notes,
      };

      await createOrder(orderData);
      await clearCart();
      setShowCheckout(false);
      setCustomerInfo({
        name: '', email: '', phone: '', governorate: '', district: '',
        neighborhood: '', street: '', houseNumber: '', floorNumber: '',
        notes: '', fullAddress: ''
      });
      onClose();
    } catch (error) {
      console.error('Order placement failed:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-lg z-50 flex flex-col"
        >
          <ShippingForm
            isOpen={showAddressForm}
            onClose={() => setShowAddressForm(false)}
          />

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-gray-100 rounded-lg touch-action-manipulation"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9m-9 0V9m9 4v10" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">{t('emptyCart')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 text-sm truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-fresh-green font-semibold text-sm">
                        {parseFloat(item.product.price).toFixed(0)} IQD
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                            className="h-6 w-6 bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-full touch-action-manipulation"
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </Button>
                          
                          <span className="text-sm font-medium text-gray-700 min-w-6 text-center">
                            {item.quantity}
                          </span>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={false}
                            className="h-6 w-6 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-full touch-action-manipulation"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </Button>
                        </div>

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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-gray-200 p-4 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('subtotal')}:</span>
                  <span className="font-medium">{getTotalPrice().toFixed(0)} IQD</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('shippingFee')}:</span>
                  <span className="font-medium">1,500 IQD</span>
                </div>
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-gray-800">{t('total')}:</span>
                  <span className="text-fresh-green">{totalWithShipping.toFixed(0)} IQD</span>
                </div>
              </div>

              <Button 
                onClick={() => setShowCheckout(true)}
                className="w-full bg-fresh-green hover:bg-green-600 text-white py-3 rounded-lg font-medium touch-action-manipulation"
              >
                {t('checkout')}
              </Button>
            </div>
          )}

          {/* Checkout Form */}
          <AnimatePresence>
            {showCheckout && (
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="absolute inset-0 bg-white z-50 overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">{t('checkout')}</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowCheckout(false)}
                      className="hover:bg-gray-100 rounded-lg"
                    >
                      <ArrowLeft className="h-6 w-6" />
                    </Button>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handlePlaceOrder(); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('fullName')} *
                      </label>
                      <input
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-fresh-green focus:ring-1 focus:ring-fresh-green"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('email')} *
                      </label>
                      <input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-fresh-green focus:ring-1 focus:ring-fresh-green"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('phoneNumber')} *
                      </label>
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-fresh-green focus:ring-1 focus:ring-fresh-green"
                        required
                      />
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">{t('shippingAddress')}</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowAddressForm(true)}
                          className="hover:bg-gray-100 rounded-lg"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      {customerInfo.fullAddress ? (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {customerInfo.fullAddress}
                          </p>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddressForm(true)}
                          className="w-full border-dashed border-2 border-gray-300 hover:border-fresh-green text-gray-600 hover:text-fresh-green py-8"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <MapPin className="h-8 w-8" />
                            <span>{t('addShippingAddress')}</span>
                          </div>
                        </Button>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">{t('orderSummary')}</h3>
                      <div className="space-y-2 mb-4">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {item.product.name} x {item.quantity}
                            </span>
                            <span className="font-medium">
                              {(parseFloat(item.product.price) * item.quantity).toFixed(0)} IQD
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{t('subtotal')}:</span>
                          <span className="font-medium">{getTotalPrice().toFixed(0)} IQD</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{t('shippingFee')}:</span>
                          <span className="font-medium">1,500 IQD</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                          <span className="text-gray-800">{t('total')}:</span>
                          <span className="text-fresh-green">
                            {totalWithShipping.toFixed(0)} IQD
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.fullAddress}
                      className="w-full bg-fresh-green hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium"
                    >
                      {t('placeOrder')}
                    </Button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}