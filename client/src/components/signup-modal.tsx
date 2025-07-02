import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { useAddressStore } from "@/store/address-store";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}

function CustomDropdown({ value, onChange, options, placeholder }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white flex items-center justify-between text-right"
        style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value || placeholder}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4"
        >
          ▼
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto"
          >
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-sm text-right hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
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

export default function SignupModal({ isOpen, onClose, onSuccess }: SignupModalProps) {
  const [step, setStep] = useState<'auth' | 'address'>('auth');
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const { addAddress } = useAddressStore();

  const [addressData, setAddressData] = useState({
    fullName: '',
    phoneNumber: '',
    government: '',
    district: '',
    nearestLandmark: ''
  });

  const { login, register } = useAuth();
  const { t } = useTranslation();

  const iraqiGovernorates = [
    'بغداد', 'نينوى', 'البصرة', 'صلاح الدين', 'دهوك', 'أربيل', 'السليمانية', 
    'ديالى', 'واسط', 'ميسان', 'ذي قار', 'المثنى', 'بابل', 'كربلاء', 'النجف', 
    'الانبار', 'الديوانية', 'كركوك', 'حلبجة'
  ];

  const iraqiDistricts = [
    'الأسرى والمفقودين',
    'الأمن الداخلي',
    'الماس تبة',
    'المعارض',
    'المعلمين',
    'المندودة',
    'باروت خانة',
    'باجوان',
    'بنجا علي',
    'بنجة',
    'حي البعث',
    'حي بدر',
    'تل علي',
    'تقاطع الحجاج',
    'حي الجامعة',
    'قرية جيمين',
    'الحجاج',
    'حي الحسين',
    'حي الحواسب',
    'ناحية الرياض',
    'الحورة',
    'حي الخضراء',
    'الدور',
    'دوميز',
    'رأس الجسر',
    'منطقة روانكي',
    'حي الزهراء',
    'ناحية الزاب',
    'الزوراء',
    'ساحة الاحتفالات',
    'شارع سليمانية / الجيمه',
    'سكانيان',
    'سونه كولي',
    'شقق حي الحسين',
    'شارع الجمهورية',
    'شارع الحواسب',
    'شارع القدس',
    'شارع أطلس',
    'شوراو',
    'الصالحي',
    'منطقة الصيادة',
    'حي الصناعي',
    'الضباط',
    'طوزخورماتو',
    'طريق المطار',
    'العروبة',
    'الفيلق',
    'قصاب خانة',
    'قرية النبي ياور',
    'قرة هنجير',
    'كلية القانون',
    'كوباني',
    'الكرامة',
    'كي وان',
    'مجمع كركوك سيتي',
    'قاعدة كيوان الجوية',
    'ليلان',
    'منطقة ٥٥',
    'مجمع مدينتي',
    'ناحية العباسي',
    'ناحية الملتقى',
    'ناحية تازة',
    'حي الوحدة',
    'حي النصر',
    'حي العلماء',
    'حي الشرطة',
    'واحد آذار',
    'واحد حزيران',
    'حي الشهداء',
    'حي النور',
    'حي المنتوجات',
    'حي العسكري',
    'حي القدس'
  ];

  const validateAuthForm = () => {
    if (!authData.email || !authData.password) return false;
    if (!isLogin && (!authData.confirmPassword || authData.password !== authData.confirmPassword)) return false;
    return true;
  };

  const validateAddressForm = () => {
    return addressData.fullName && addressData.phoneNumber && addressData.government && 
           addressData.district && addressData.nearestLandmark;
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAuthForm()) return;

    setIsLoading(true);
    try {
      if (isLogin) {
        await login(authData.email, authData.password);
        onSuccess();
        onClose();
      } else {
        await register(authData.email, authData.password);
        setStep('address');
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert(isLogin ? 'خطأ في تسجيل الدخول' : 'خطأ في إنشاء الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddressForm()) return;

    setIsLoading(true);
    try {
      // Save address to the global store
      addAddress({
        fullName: addressData.fullName,
        phoneNumber: addressData.phoneNumber,
        government: addressData.government,
        district: addressData.district,
        nearestLandmark: addressData.nearestLandmark,
      });
      
      console.log('Address data saved:', addressData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Address save error:', error);
      alert('خطأ في حفظ العنوان');
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setStep('auth');
    setIsLogin(false);
    setAuthData({ email: '', password: '', confirmPassword: '' });
    setAddressData({ fullName: '', phoneNumber: '', government: '', district: '', nearestLandmark: '' });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[70]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-4 bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                {step === 'address' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setStep('auth')}
                    className="hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                <h2 className="text-lg font-semibold text-gray-900 text-center flex-1" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  {step === 'auth' 
                    ? (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب')
                    : 'معلومات العنوان'
                  }
                </h2>
                <button
                  onClick={handleClose}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {step === 'auth' ? (
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      value={authData.email}
                      onChange={(e) => setAuthData({...authData, email: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-right"
                      placeholder="ادخل بريدك الإلكتروني"
                      required
                      style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={authData.password}
                        onChange={(e) => setAuthData({...authData, password: e.target.value})}
                        className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-right"
                        placeholder="ادخل كلمة المرور"
                        required
                        style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password (only for signup) */}
                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                        تأكيد كلمة المرور
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={authData.confirmPassword}
                          onChange={(e) => setAuthData({...authData, confirmPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-right"
                          placeholder="أعد إدخال كلمة المرور"
                          required
                          style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={!validateAuthForm() || isLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-colors"
                    style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                  >
                    {isLoading ? 'جاري التحميل...' : (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب')}
                  </Button>

                  {/* Toggle Auth Mode */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                      style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                    >
                      {isLogin ? 'ليس لديك حساب؟ إنشاء حساب جديد' : 'لديك حساب؟ تسجيل الدخول'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      الاسم
                    </label>
                    <input
                      type="text"
                      value={addressData.fullName}
                      onChange={(e) => setAddressData({...addressData, fullName: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-right"
                      placeholder="ادخل اسمك الكامل"
                      required
                      style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      الرقم
                    </label>
                    <input
                      type="tel"
                      value={addressData.phoneNumber}
                      onChange={(e) => setAddressData({...addressData, phoneNumber: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-right"
                      placeholder="ادخل رقم هاتفك"
                      required
                      style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                    />
                  </div>

                  {/* Government */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      المحافظة
                    </label>
                    <CustomDropdown
                      value={addressData.government}
                      onChange={(value) => setAddressData({...addressData, government: value})}
                      options={iraqiGovernorates}
                      placeholder="اختر محافظتك"
                    />
                  </div>

                  {/* District */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      المنطقة
                    </label>
                    <CustomDropdown
                      value={addressData.district}
                      onChange={(value) => setAddressData({...addressData, district: value})}
                      options={iraqiDistricts}
                      placeholder="اختر منطقتك"
                    />
                  </div>

                  {/* Nearest Landmark */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-right" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      اقرب نقطة دالة
                    </label>
                    <input
                      type="text"
                      value={addressData.nearestLandmark}
                      onChange={(e) => setAddressData({...addressData, nearestLandmark: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-right"
                      placeholder="ادخل اقرب نقطة دالة"
                      required
                      style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={!validateAddressForm() || isLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-colors"
                    style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                  >
                    {isLoading ? 'جاري الحفظ...' : 'إكمال التسجيل'}
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}