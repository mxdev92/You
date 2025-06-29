import { motion, AnimatePresence } from "framer-motion";
import { User, Wallet, ShoppingBag, Settings, LogOut, MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KiwiLogo } from "@/components/ui/kiwi-logo";
import { LanguageSelector } from "@/components/language-selector";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { useState, useRef, useEffect } from "react";

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShippingFormProps {
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

function ShippingForm({ isOpen, onClose }: ShippingFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    government: '',
    fullAddress: ''
  });

  const iraqiGovernorates = [
    'بغداد', 'نينوى', 'البصرة', 'صلاح الدين', 'دهوك', 'أربيل', 'السليمانية', 
    'ديالى', 'واسط', 'ميسان', 'ذي قار', 'المثنى', 'بابل', 'كربلاء', 'النجف', 
    'الانبار', 'الديوانية', 'كركوك', 'حلبجة'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    onClose();
  };

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
            className="absolute inset-4 bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">My Address</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <span className="text-gray-500 text-xl">×</span>
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                {/* Government */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Government (State)
                  </label>
                  <CustomDropdown
                    value={formData.government}
                    onChange={(value) => setFormData({...formData, government: value})}
                    options={iraqiGovernorates}
                    placeholder="Select your government"
                  />
                </div>

                {/* Full Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Address
                  </label>
                  <textarea
                    value={formData.fullAddress}
                    onChange={(e) => setFormData({...formData, fullAddress: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                    placeholder="Enter your complete address"
                    required
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
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

export default function LeftSidebar({ isOpen, onClose }: LeftSidebarProps) {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const [showShippingForm, setShowShippingForm] = useState(false);
  
  const menuItems = [
    { icon: User, label: t('profile'), href: "#" },
    { icon: MapPin, label: 'My Address', href: "#", onClick: () => setShowShippingForm(true) },
    { icon: Wallet, label: t('wallet'), href: "#" },
    { icon: ShoppingBag, label: t('orders'), href: "#" },
  ];

  const handleLogout = async () => {
    await signOut();
    onClose();
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
            {/* Top Section */}
            <div className="flex-1 pt-8 pb-4">
              <div className="px-6 mb-8">
                <div className="flex items-center space-x-3 mb-3">
                  <KiwiLogo size={36} />
                  <h2 className="text-2xl font-bold text-gray-800">{t('appName')}</h2>
                </div>
                <p className="text-gray-500 text-sm mt-1">{t('welcomeBackSidebar')}</p>
                {user?.email && (
                  <p className="text-xs text-gray-400 mt-1 truncate">{user.email}</p>
                )}
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

            {/* Bottom Section */}
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
          </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Shipping Form Modal */}
      <ShippingForm 
        isOpen={showShippingForm} 
        onClose={() => setShowShippingForm(false)} 
      />
    </>
  );
}
