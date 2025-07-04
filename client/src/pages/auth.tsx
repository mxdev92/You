import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { usePostgresAuth } from '@/hooks/use-postgres-auth';
import { usePostgresAddressStore } from '@/store/postgres-address-store';
import { useLocation } from 'wouter';
import paketyLogo from '@/assets/pakety-logo.png';

interface SignupData {
  name: string;
  phone: string;
  password: string;
  governorate: string;
  district: string;
  landmark: string;
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-10 px-3 border border-gray-300 focus:border-gray-400 focus:ring-0 rounded-2xl text-right text-sm shadow-sm hover:shadow-md transition-all duration-300 bg-white flex items-center justify-between"
          style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
        >
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {value || placeholder}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </motion.div>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[100] bg-white border border-gray-200 rounded-xl shadow-xl max-h-40 overflow-y-auto"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
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
                className="w-full px-3 py-2.5 text-sm text-right hover:bg-green-50 hover:text-green-600 transition-colors text-gray-700 first:rounded-t-xl last:rounded-b-xl border-b border-gray-100 last:border-b-0"
                style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
              >
                {option}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [signupStep, setSignupStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Signup form state
  const [signupData, setSignupData] = useState<SignupData>({
    name: '',
    phone: '',
    password: '',
    governorate: '',
    district: '',
    landmark: ''
  });

  const { user, login, register } = usePostgresAuth();
  const { addAddress } = usePostgresAddressStore();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation('/');
    }
  }, [user, setLocation]);

  const iraqiGovernorates = [
    'بغداد', 'نينوى', 'البصرة', 'صلاح الدين', 'دهوك', 'أربيل', 'السليمانية', 
    'ديالى', 'واسط', 'ميسان', 'ذي قار', 'المثنى', 'بابل', 'كربلاء', 'النجف', 
    'الانبار', 'الديوانية', 'كركوك', 'حلبجة'
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) return;
    
    setIsLoading(true);
    try {
      await login(loginData.email, loginData.password);
      setLocation('/');
    } catch (error: any) {
      alert('خطأ في تسجيل الدخول: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupNext = () => {
    const step = signupStep;
    
    if (step === 1 && !signupData.name.trim()) {
      alert('يرجى إدخال الاسم');
      return;
    }
    if (step === 2 && !signupData.phone.trim()) {
      alert('يرجى إدخال رقم الموبايل');
      return;
    }
    if (step === 3 && signupData.password.length < 6) {
      alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (step === 4 && !signupData.governorate) {
      alert('يرجى اختيار المحافظة');
      return;
    }
    if (step === 5 && !signupData.district.trim()) {
      alert('يرجى إدخال المنطقة');
      return;
    }
    
    if (step < 6) {
      setSignupStep(step + 1);
    }
  };

  const handleSignupComplete = async () => {
    if (!signupData.landmark.trim()) {
      alert('يرجى إدخال أقرب نقطة دالة');
      return;
    }

    setIsLoading(true);
    try {
      // Create email from phone number
      const email = `${signupData.phone}@pakety.app`;
      
      // Register user
      const newUser = await register(email, signupData.password);
      console.log('User registered successfully:', newUser);
      
      // Create address record from signup data
      const addressData = {
        userId: newUser.id,
        governorate: signupData.governorate,
        district: signupData.district,
        neighborhood: signupData.landmark,
        notes: `${signupData.name} - ${signupData.phone}`,
        isDefault: true
      };
      
      console.log('Creating address from signup data:', addressData);
      
      // Add the address to the user's profile
      await addAddress(addressData);
      console.log('Address created successfully during signup');
      
      // Redirect to main app
      setLocation('/');
    } catch (error: any) {
      console.error('Signup error:', error);
      alert('خطأ في إنشاء الحساب: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setIsLoading(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >

        {/* Main Card */}
        <motion.div
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-full max-w-sm"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {isLogin ? (
            /* Login Form */
            <div className="p-8 pt-4">
              {/* Logo with Professional Animation */}
              <motion.div 
                className="flex justify-center mb-6"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 120, 
                  damping: 15, 
                  delay: 0.1,
                  duration: 0.6 
                }}
              >
                <motion.img 
                  src={paketyLogo} 
                  alt="PAKETY Logo" 
                  className="w-24 h-24 object-contain"
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                />
              </motion.div>
              
              <motion.form 
                onSubmit={handleLogin} 
                className="space-y-4"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <Input
                    type="email"
                    placeholder="البريد الإلكتروني"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full h-12 text-right pr-3 text-sm border-gray-300 focus:border-gray-400 focus:ring-0 rounded-xl transition-all duration-300 hover:shadow-md focus:shadow-lg"
                    style={{ fontFamily: 'Cairo, system-ui, sans-serif', paddingRight: '12px' }}
                    dir="rtl"
                  />
                </motion.div>
                
                <motion.div 
                  className="relative"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                >
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="كلمة المرور"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full h-12 text-right pr-3 pl-10 text-sm border-gray-300 focus:border-gray-400 focus:ring-0 rounded-xl transition-all duration-300 hover:shadow-md focus:shadow-lg"
                    style={{ fontFamily: 'Cairo, system-ui, sans-serif', paddingRight: '12px' }}
                    dir="rtl"
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </motion.button>
                </motion.div>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
                      style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                    >
                      <motion.span
                        initial={false}
                        animate={isLoading ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
                        transition={isLoading ? { repeat: Infinity, duration: 1.5 } : {}}
                      >
                        {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                      </motion.span>
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.form>
              
              {/* Continue Without Registration Button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.5 }}
                className="mt-4"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => setLocation('/')}
                    className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded-xl border border-gray-300 transition-all duration-300"
                    style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                  >
                    متابعة بدون تسجيل
                  </Button>
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="mt-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
              >
                <motion.button
                  onClick={() => setIsLogin(false)}
                  className="text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors duration-300"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  إنشاء حساب جديد
                </motion.button>
              </motion.div>
            </div>
          ) : (
            /* Signup Form */
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => {
                    if (signupStep === 1) {
                      setIsLogin(true);
                    } else {
                      setSignupStep(signupStep - 1);
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <ArrowLeft className="h-4 w-4 text-gray-600" />
                  </button>
                  
                  <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    إنشاء حساب جديد
                  </h2>
                  
                  <div className="w-6" /> {/* Spacer */}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    <span>الخطوة {signupStep} من 6</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <motion.div
                      className="bg-green-600 h-1.5 rounded-full"
                      initial={{ width: '16.66%' }}
                      animate={{ width: `${(signupStep / 6) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Step Content */}
                <div className="min-h-[120px]">
                  <AnimatePresence mode="wait" custom={signupStep}>
                    <motion.div
                      key={signupStep}
                      custom={signupStep}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.3 }}
                    >
                      {signupStep === 1 && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-gray-800 text-center mb-3" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                            ما هو اسمك؟
                          </h3>
                          <Input
                            type="text"
                            placeholder="الاسم الكامل"
                            value={signupData.name}
                            onChange={(e) => setSignupData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full h-12 text-right text-sm border-gray-300 focus:border-gray-400 focus:ring-0 rounded-xl"
                            style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                            dir="rtl"
                          />
                        </div>
                      )}

                      {signupStep === 2 && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-gray-800 text-center mb-3" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                            رقم الموبايل
                          </h3>
                          <Input
                            type="tel"
                            placeholder="07xxxxxxxxx"
                            value={signupData.phone}
                            onChange={(e) => setSignupData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full h-12 text-center text-sm border-gray-300 focus:border-gray-400 focus:ring-0 rounded-xl"
                            style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                          />
                        </div>
                      )}

                      {signupStep === 3 && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-gray-800 text-center mb-3" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                            كلمة المرور
                          </h3>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="كلمة المرور (6 أحرف على الأقل)"
                              value={signupData.password}
                              onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                              className="w-full h-12 text-right pr-10 text-sm border-gray-300 focus:border-gray-400 focus:ring-0 rounded-xl"
                              style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                              dir="rtl"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {signupStep === 4 && (
                        <div className="space-y-3 relative z-10" style={{ minHeight: '200px' }}>
                          <h3 className="text-sm font-medium text-gray-800 text-center mb-3" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                            تسجيل العنوان - المحافظة
                          </h3>
                          <div className="relative">
                            <CustomDropdown
                              value={signupData.governorate}
                              onChange={(value) => setSignupData(prev => ({ ...prev, governorate: value }))}
                              options={iraqiGovernorates}
                              placeholder="اختر المحافظة"
                            />
                          </div>
                        </div>
                      )}

                      {signupStep === 5 && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-gray-800 text-center mb-3" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                            المنطقة
                          </h3>
                          <Input
                            type="text"
                            placeholder="اسم المنطقة أو الحي"
                            value={signupData.district}
                            onChange={(e) => setSignupData(prev => ({ ...prev, district: e.target.value }))}
                            className="w-full h-12 text-right text-sm border-gray-300 focus:border-gray-400 focus:ring-0 rounded-xl"
                            style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                            dir="rtl"
                          />
                        </div>
                      )}

                      {signupStep === 6 && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-gray-800 text-center mb-3" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                            أقرب نقطة دالة
                          </h3>
                          <Input
                            type="text"
                            placeholder="مثال: قرب مسجد الرحمن، بجانب صيدلية الشفاء"
                            value={signupData.landmark}
                            onChange={(e) => setSignupData(prev => ({ ...prev, landmark: e.target.value }))}
                            className="w-full h-12 text-right text-sm border-gray-300 focus:border-gray-400 focus:ring-0 rounded-xl"
                            style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                            dir="rtl"
                          />
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Action Button */}
                <div className="mt-6">
                  {signupStep < 6 ? (
                    <Button
                      onClick={handleSignupNext}
                      className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-xl shadow-lg"
                      style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                    >
                      التالي
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSignupComplete}
                      disabled={isLoading}
                      className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-xl shadow-lg"
                      style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                    >
                      {isLoading ? 'جاري إنشاء الحساب...' : 'إتمام التسجيل'}
                    </Button>
                  )}
                </div>
              </div>
            )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthPage;