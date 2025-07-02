import { motion, AnimatePresence } from "framer-motion";
import { User, Wallet, ShoppingBag, Settings, LogOut, MapPin, ChevronDown, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KiwiLogo } from "@/components/ui/kiwi-logo";
import { LanguageSelector } from "@/components/language-selector";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/hooks/use-language";
import { useAddressStore } from "@/store/address-store";
import { useState, useRef, useEffect } from "react";

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'menu' | 'addresses' | 'settings';
  setCurrentView: (view: 'menu' | 'addresses' | 'settings') => void;
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
  const [showAddressForm, setShowAddressForm] = useState(false);
  const { addresses: savedAddresses, addAddress } = useAddressStore();
  const [addressData, setAddressData] = useState({
    fullName: '',
    phoneNumber: '',
    government: '',
    district: '',
    nearestLandmark: ''
  });
  
  const menuItems = [
    { icon: User, label: t('profile'), href: "#" },
    { icon: MapPin, label: 'عنوان التوصيل', href: "#", onClick: () => setCurrentView('addresses') },
    { icon: Wallet, label: t('wallet'), href: "#" },
    { icon: ShoppingBag, label: t('orders'), href: "#" },
    { icon: Settings, label: t('settings'), href: "#", onClick: () => setCurrentView('settings') },
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
            {currentView === 'settings' ? (
              // Settings View
              <div className="flex-1 pt-8 pb-4">
                {/* Settings Header */}
                <div className="px-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentView('menu')}
                      className="hover:bg-gray-100"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      الإعدادات
                    </h2>
                    <div className="w-10" />
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
            ) : currentView === 'addresses' ? (
              // Addresses View
              <div className="h-full flex flex-col">
                {/* Addresses Header */}
                <div className="flex items-center justify-between px-6 py-6 border-b border-gray-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentView('menu')}
                    className="hover:bg-gray-100 touch-action-manipulation"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    عنوان التوصيل
                  </h2>
                  <div className="w-10" /> {/* Spacer */}
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
                
                {/* Settings Section */}
                <div className="px-6 py-4 border-t border-gray-100 mt-4">
                  <div className="flex items-center space-x-2 mb-4 text-gray-700">
                    <Settings className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('settings')}</span>
                  </div>
                  <LanguageSelector />
                </div>
              </div>
            )}

            {/* Bottom Section - Only show logout in menu view */}
            {currentView === 'menu' && (
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
