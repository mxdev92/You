import { motion, AnimatePresence } from "framer-motion";
import { User, Wallet, ShoppingBag, Settings, LogOut, MapPin, ChevronDown, ArrowLeft, ArrowRight, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KiwiLogo } from "@/components/ui/kiwi-logo";
import { LanguageSelector } from "@/components/language-selector";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/hooks/use-language";
import { useAddressStore } from "@/store/address-store";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Order } from "@shared/schema";

function OrdersHistoryContent() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
  });

  const handleDownloadInvoice = async (orderId: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/invoice`, {
        method: 'GET',
      });
      
      if (!response.ok) throw new Error('Failed to download invoice');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="px-6 py-4">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="px-6 py-8 text-center">
        <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
          لا توجد طلبات حتى الآن
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 space-y-4">
      {orders.map((order: Order) => (
        <div key={order.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            {/* Order Info - Right Side */}
            <div className="flex-1 text-right">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  رقم الطلبية: #{order.id}
                </p>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  السعر الكلي: {order.totalAmount.toLocaleString()} د.ع
                </p>
                <p className="text-xs text-gray-500" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  التاريخ: {new Date(order.orderDate).toLocaleDateString('ar-IQ')}
                </p>
              </div>
            </div>

            {/* Download Button - Left Side */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownloadInvoice(order.id)}
              className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'menu' | 'addresses' | 'settings' | 'profile' | 'orders' | 'login-prompt';
  setCurrentView: (view: 'menu' | 'addresses' | 'settings' | 'profile' | 'orders' | 'login-prompt') => void;
}

interface ShippingFormProps {
  isOpen: boolean;
  onClose: () => void;
  addressData: any;
  setAddressData: any;
  onSubmit: (e: React.FormEvent) => void;
  iraqiGovernorates: string[];
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
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto"
            style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
          >
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0"
                style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
              >
                {option}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShippingForm({ isOpen, onClose, addressData, setAddressData, onSubmit, iraqiGovernorates }: ShippingFormProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
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
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <span className="text-gray-500 text-lg">×</span>
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 p-4">
              <form onSubmit={onSubmit} className="space-y-3">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={addressData.fullName}
                    onChange={(e) => setAddressData({...addressData, fullName: e.target.value})}
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
                    value={addressData.phoneNumber}
                    onChange={(e) => setAddressData({...addressData, phoneNumber: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                {/* Government */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Government (State)
                  </label>
                  <CustomDropdown
                    value={addressData.government}
                    onChange={(value) => setAddressData({...addressData, government: value})}
                    options={iraqiGovernorates}
                    placeholder="Select your government"
                  />
                </div>

                {/* Full Address */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Full Address
                  </label>
                  <textarea
                    value={addressData.fullAddress}
                    onChange={(e) => setAddressData({...addressData, fullAddress: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                    placeholder="Enter your complete address"
                    required
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-1">
                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 text-sm rounded-lg font-semibold transition-colors"
                  >
                    Save Address
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}



export default function LeftSidebar({ isOpen, onClose, currentView, setCurrentView }: LeftSidebarProps) {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const { addresses: savedAddresses, addAddress } = useAddressStore();
  const [addressData, setAddressData] = useState({
    fullName: '',
    phoneNumber: '',
    government: '',
    district: '',
    nearestLandmark: ''
  });

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
  
  const handleMenuItemClick = (targetView: string, action?: () => void) => {
    if (!user) {
      // If user is not authenticated, show login prompt
      setCurrentView('login-prompt');
      return;
    }
    // If authenticated, proceed with the action
    if (action) {
      action();
    }
  };

  const menuItems = [
    { icon: User, label: t('profile'), href: "#", onClick: () => handleMenuItemClick('profile', () => setCurrentView('profile')) },
    { icon: MapPin, label: 'عنوان التوصيل', href: "#", onClick: () => handleMenuItemClick('addresses', () => setCurrentView('addresses')) },
    { icon: Wallet, label: t('wallet'), href: "#", onClick: () => handleMenuItemClick('wallet') },
    { icon: ShoppingBag, label: 'طلباتي', href: "#", onClick: () => handleMenuItemClick('orders', () => setCurrentView('orders')) },
    { icon: Settings, label: t('settings'), href: "#", onClick: () => handleMenuItemClick('settings', () => setCurrentView('settings')) },
  ];

  const handleLogout = async () => {
    await signOut();
    onClose();
  };

  const iraqiGovernorates = [
    'بغداد', 'نينوى', 'البصرة', 'صلاح الدين', 'دهوك', 'أربيل', 'السليمانية', 
    'ديالى', 'واسط', 'ميسان', 'ذي قار', 'المثنى', 'بابل', 'كربلاء', 'النجف', 
    'الانبار', 'الديوانية', 'كركوك', 'حلبجة'
  ];

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add new address using the store
    addAddress({
      fullName: addressData.fullName,
      phoneNumber: addressData.phoneNumber,
      government: addressData.government,
      district: addressData.district,
      nearestLandmark: addressData.nearestLandmark,
    });
    
    // Reset form and close
    setAddressData({
      fullName: '',
      phoneNumber: '',
      government: '',
      district: '',
      nearestLandmark: ''
    });
    setShowAddressForm(false);
  };

  return (
    <>
      <AnimatePresence mode="wait">
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
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ 
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.3 
            }}
            className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl rounded-r-3xl flex flex-col safe-area-inset"
          >
            {currentView === 'login-prompt' ? (
              // Login Prompt View
              <div className="flex-1 pt-8 pb-4 flex flex-col items-center justify-center text-center">
                <div className="px-6">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  
                  {/* Title */}
                  <h2 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    مرحباً بك!
                  </h2>
                  
                  {/* Description */}
                  <p className="text-gray-600 mb-8 leading-relaxed" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    للوصول إلى ملفك الشخصي وطلباتك وعناوين التوصيل، يرجى تسجيل الدخول أولاً
                  </p>
                  
                  {/* Action Buttons */}
                  <div className="space-y-3 w-full">
                    <Button
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                      onClick={() => {
                        onClose();
                        setLocation('/login');
                      }}
                    >
                      تسجيل الدخول
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full border-2 border-green-500 text-green-600 font-medium py-3 rounded-xl hover:bg-green-50 transition-all duration-200"
                      style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                      onClick={() => {
                        onClose();
                        setLocation('/login');
                      }}
                    >
                      إنشاء حساب جديد
                    </Button>
                    
                    <Button
                      variant="ghost"
                      className="w-full text-gray-500 font-medium py-2 rounded-xl hover:bg-gray-50 transition-all duration-200"
                      style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                      onClick={() => setCurrentView('menu')}
                    >
                      العودة للقائمة
                    </Button>
                  </div>
                </div>
              </div>
            ) : currentView === 'settings' ? (
              // Settings View
              <div className="flex-1 pt-8 pb-4">
                {/* Settings Header */}
                <div className="px-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentView('menu')}
                      className="hover:bg-gray-100 ml-4"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      الإعدادات
                    </h2>
                  </div>
                </div>

                {/* Settings Content */}
                <div className="px-6 py-6 space-y-6">
                  {/* App Preferences Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      تفضيلات التطبيق
                    </h3>
                    
                    {/* Language Setting */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                          اللغة
                        </span>
                      </div>
                      <LanguageSelector />
                    </div>
                  </div>
                </div>
              </div>
            ) : currentView === 'profile' ? (
              // Profile View
              <div className="flex-1 pt-8 pb-4" dir="rtl">
                {/* Profile Header */}
                <div className="px-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentView('menu')}
                      className="hover:bg-gray-100 ml-4"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      الملف الشخصي
                    </h2>
                  </div>
                </div>

                {/* Profile Content */}
                <div className="px-6 py-4 space-y-4">
                  {/* User Avatar Section */}
                  <div className="flex flex-col items-center py-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-3 shadow-md">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      {user?.displayName || user?.email?.split('@')[0] || 'مستخدم'}
                    </h3>
                    <p className="text-sm text-gray-500" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      عضو نشط
                    </p>
                  </div>

                  {/* Information Cards */}
                  <div className="space-y-3">
                    {/* Name Card */}
                    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-0.5" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                              الاسم الكامل
                            </p>
                            <p className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                              {user?.displayName || user?.email?.split('@')[0] || 'غير محدد'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Email Card */}
                    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-0.5" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                              البريد الإلكتروني
                            </p>
                            <p className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                              {user?.email || 'غير محدد'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Phone Card */}
                    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                            <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-0.5" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                              رقم الهاتف
                            </p>
                            <p className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                              {user?.phoneNumber || 'غير محدد'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Password Card */}
                    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                            <svg className="h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-0.5" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                              كلمة المرور
                            </p>
                            <p className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                              ••••••••••
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-gray-500 hover:text-gray-700 px-2 h-6"
                          style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                        >
                          تغيير
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="pt-4 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50 h-10 flex items-center gap-2"
                      onClick={handleLogout}
                      style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                    >
                      تسجيل الخروج
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : currentView === 'addresses' ? (
              // Addresses View
              <div className="h-full flex flex-col">
                {/* Addresses Header */}
                <div className="flex items-center px-6 py-6 border-b border-gray-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentView('menu')}
                    className="hover:bg-gray-100 touch-action-manipulation ml-4"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    عنوان التوصيل
                  </h2>
                </div>

                {/* Addresses List */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <div className="space-y-4">
                    {savedAddresses.map((address) => (
                      <div 
                        key={address.id}
                        className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                              {address.fullName}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                              {address.phoneNumber}
                            </p>
                            <p className="text-sm text-gray-700 mt-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                              {address.government}
                            </p>
                            <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                              {address.district}, {address.nearestLandmark}
                            </p>
                          </div>
                          <MapPin className="h-5 w-5 text-green-600 mt-1" />
                        </div>
                      </div>
                    ))}
                    
                    {/* Add New Address Button */}
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Plus className="h-5 w-5 text-gray-400 group-hover:text-green-600" />
                        <span className="text-gray-600 group-hover:text-green-700 font-medium" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                          اضافة عنوان توصيل
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : currentView === 'orders' ? (
              // Orders History View
              <div className="flex-1 pt-8 pb-4" dir="rtl">
                {/* Orders Header */}
                <div className="px-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentView('menu')}
                      className="hover:bg-gray-100 ml-4"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      طلباتي
                    </h2>
                  </div>
                </div>

                {/* Orders Content */}
                <OrdersHistoryContent />
              </div>
            ) : (
              // Menu View
              <div className="flex-1 pt-8 pb-4">
                <div className="px-6 mb-8">
                  {/* Header section hidden as requested */}
                </div>

                <nav className="px-6 space-y-2">
                  {menuItems.map((item, index) => (
                    <Button
                      key={item.label}
                      variant="ghost"
                      className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                      onClick={item.onClick}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.label}
                    </Button>
                  ))}
                </nav>

              </div>
            )}

            {/* Bottom Section - Only show logout in menu view for authenticated users */}
            {currentView === 'menu' && user && (
              <div className="px-6 pb-6">
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  {t('logout')}
                </Button>
              </div>
            )}
            
            {/* Login Button for Non-Authenticated Users */}
            {currentView === 'menu' && !user && (
              <div className="px-6 pb-6">
                <Button
                  onClick={() => setLocation('/login')}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                >
                  تسجيل الدخول
                </Button>
              </div>
            )}
          </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Address Form Modal */}
      <ShippingForm 
        isOpen={showAddressForm} 
        onClose={() => setShowAddressForm(false)}
        addressData={addressData}
        setAddressData={setAddressData}
        onSubmit={handleAddressSubmit}
        iraqiGovernorates={iraqiGovernorates}
      />
    </>
  );
}
