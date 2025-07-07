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
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
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
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'error'
  });
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Signup form state
  const [signupData, setSignupData] = useState<SignupData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    governorate: '',
    district: '',
    landmark: ''
  });

  // WhatsApp verification state
  const [whatsappVerification, setWhatsappVerification] = useState({
    phone: '',
    otp: '',
    isVerified: false,
    isLoading: false,
    otpSent: false
  });

  // OTP state for signup flow
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const { user, login, register } = usePostgresAuth();
  const { addAddress } = usePostgresAddressStore();

  const showNotification = (message: string, type: 'success' | 'error' = 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'error' });
    }, 3000);
  };

  // OTP functions for signup flow
  const sendOTP = async () => {
    if (!signupData.phone.trim()) {
      showNotification('يرجى إدخال رقم الموبايل');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/whatsapp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: signupData.phone,
          fullName: 'مستخدم جديد'
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setOtpSent(true);
        // OTP sent to WhatsApp only - no logging of OTP value
        
        showNotification('✅ تم إرسال رمز التحقق عبر WhatsApp - تحقق من رسائل WhatsApp الخاصة بك', 'success');
      } else {
        const errorData = await response.json();
        showNotification('❌ ' + (errorData.message || 'فشل في إرسال رمز التحقق عبر WhatsApp'), 'error');
      }
    } catch (error) {
      showNotification('خطأ في إرسال رمز التحقق');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otpCode.trim()) {
      showNotification('يرجى إدخال رمز التحقق');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/whatsapp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: signupData.phone,
          otp: otpCode
        })
      });

      const data = await response.json();
      
      if (response.ok && data.valid) {
        showNotification('تم التحقق من رقم WhatsApp بنجاح', 'success');
        
        // Reset OTP state and move to next step
        setOtpSent(false);
        setOtpCode('');
        setTimeout(() => {
          setSignupStep(3);
        }, 1000);
      } else {
        showNotification('رمز التحقق غير صحيح أو منتهي الصلاحية');
      }
    } catch (error) {
      showNotification('خطأ في التحقق من الرمز');
    } finally {
      setIsLoading(false);
    }
  };

  // WhatsApp verification functions
  const sendWhatsAppOTP = async () => {
    if (!whatsappVerification.phone.trim()) {
      showNotification('يرجى إدخال رقم الموبايل');
      return;
    }

    setWhatsappVerification(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch('/api/whatsapp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: whatsappVerification.phone,
          fullName: 'مستخدم جديد' // Temporary name for OTP sending
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setWhatsappVerification(prev => ({ ...prev, otpSent: true }));
        showNotification('✅ تم إرسال رمز التحقق بنجاح إلى WhatsApp! افتح تطبيق WhatsApp الآن للحصول على الرمز المكون من 6 أرقام', 'success');
        console.log('✅ OTP Response:', data);
        console.log(`🔑 OTP Code for ${data.phoneNumber}: ${data.otp}`);
        console.log('📱 Please check your WhatsApp for the verification message!');
      } else {
        console.error('❌ OTP Send Error:', data);
        showNotification('فشل في إرسال رمز التحقق: ' + data.message);
        if (data.otp) {
          console.log(`🔑 Fallback OTP Code: ${data.otp}`);
          showNotification(`رمز التحقق الاحتياطي: ${data.otp}`, 'success');
        }
      }
    } catch (error) {
      showNotification('خطأ في إرسال رمز التحقق');
    } finally {
      setWhatsappVerification(prev => ({ ...prev, isLoading: false }));
    }
  };

  const verifyWhatsAppOTP = async () => {
    if (!whatsappVerification.otp.trim()) {
      showNotification('يرجى إدخال رمز التحقق');
      return;
    }

    setWhatsappVerification(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch('/api/whatsapp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: whatsappVerification.phone,
          otp: whatsappVerification.otp
        })
      });

      const data = await response.json();
      
      if (response.ok && data.valid) {
        setWhatsappVerification(prev => ({ ...prev, isVerified: true }));
        setSignupData(prev => ({ ...prev, phone: whatsappVerification.phone }));
        showNotification('تم التحقق من رقم WhatsApp بنجاح', 'success');
        
        // Automatically proceed to next step after successful verification
        setTimeout(() => {
          setSignupStep(3);
        }, 1000);
      } else {
        showNotification('رمز التحقق غير صحيح أو منتهي الصلاحية');
      }
    } catch (error) {
      showNotification('خطأ في التحقق من الرمز');
    } finally {
      setWhatsappVerification(prev => ({ ...prev, isLoading: false }));
    }
  };

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
      showNotification('خطأ في تسجيل الدخول: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setIsLoading(false);
    }
  };

  // Check email availability
  const checkEmailAvailability = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) throw new Error('Failed to check email');
      
      const { exists } = await response.json();
      return !exists; // Return true if available (not exists)
    } catch (error) {
      console.error('Email check error:', error);
      return false;
    }
  };

  // Check phone availability
  const checkPhoneAvailability = async (phone: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone }),
      });
      
      if (!response.ok) throw new Error('Failed to check phone');
      
      const { exists } = await response.json();
      return !exists; // Return true if available (not exists)
    } catch (error) {
      console.error('Phone check error:', error);
      return false;
    }
  };

  const handleSignupNext = async () => {
    const step = signupStep;
    
    if (step === 1) {
      if (!signupData.email.trim()) {
        showNotification('يرجى إدخال البريد الإلكتروني');
        return;
      }
      if (!signupData.email.includes('@')) {
        showNotification('يرجى إدخال بريد إلكتروني صحيح');
        return;
      }
      if (signupData.password.length < 6) {
        showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
      }
      if (signupData.password !== signupData.confirmPassword) {
        showNotification('كلمة المرور وتأكيد كلمة المرور غير متطابقتين');
        return;
      }
      
      // STRICT VALIDATION: Check email uniqueness
      setIsLoading(true);
      const emailAvailable = await checkEmailAvailability(signupData.email);
      setIsLoading(false);
      
      if (!emailAvailable) {
        showNotification('هذا البريد الإلكتروني مستخدم من قبل، يرجى استخدام بريد آخر');
        return;
      }
    }
    if (step === 2) {
      // Step 2 is WhatsApp verification - handled separately
      return;
    }
    if (step === 3) {
      if (!signupData.name.trim()) {
        showNotification('يرجى إدخال الاسم الكامل');
        return;
      }
      if (!signupData.phone.trim()) {
        showNotification('يرجى إدخال رقم الواتساب');
        return;
      }
      
      // STRICT VALIDATION: Check phone uniqueness
      setIsLoading(true);
      const phoneAvailable = await checkPhoneAvailability(signupData.phone);
      setIsLoading(false);
      
      if (!phoneAvailable) {
        showNotification('رقم الواتساب هذا مستخدم من قبل، يرجى استخدام رقم آخر');
        return;
      }
    }
    
    if (step < 4) {
      setSignupStep(step + 1);
    }
  };

  const handleSignupComplete = async () => {
    if (!signupData.governorate) {
      showNotification('يرجى اختيار المحافظة');
      return;
    }
    if (!signupData.district.trim()) {
      showNotification('يرجى إدخال المنطقة');
      return;
    }
    if (!signupData.landmark.trim()) {
      showNotification('يرجى إدخال أقرب نقطة دالة');
      return;
    }

    setIsLoading(true);
    try {
      // Use the actual email from form
      const email = signupData.email;
      
      // Register user with full name and phone
      const newUser = await register(email, signupData.password, signupData.name, signupData.phone);
      console.log('User registered successfully:', newUser);
      
      // Create address record from signup data
      const addressData = {
        userId: newUser.id,
        governorate: signupData.governorate,
        district: signupData.district,
        neighborhood: signupData.landmark,
        notes: signupData.landmark, // Only store landmark/notes, not name or phone
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
      showNotification('خطأ في إنشاء الحساب: ' + (error.message || 'خطأ غير معروف'));
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
                    <span>الخطوة {signupStep} من 4</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <motion.div
                      className="bg-green-600 h-1.5 rounded-full"
                      initial={{ width: '25%' }}
                      animate={{ width: `${(signupStep / 4) * 100}%` }}
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
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium text-gray-800 text-center mb-4" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                            بيانات الحساب
                          </h3>
                          <Input
                            type="email"
                            placeholder="البريد الإلكتروني"
                            value={signupData.email}
                            onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full h-12 text-right text-sm border-gray-300 focus:border-gray-400 focus:ring-0 rounded-xl"
                            style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                            dir="rtl"
                          />
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
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="تأكيد كلمة المرور"
                            value={signupData.confirmPassword}
                            onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full h-12 text-right text-sm border-gray-300 focus:border-gray-400 focus:ring-0 rounded-xl"
                            style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                            dir="rtl"
                          />
                        </div>
                      )}

                      {signupStep === 2 && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium text-gray-800 text-center mb-4" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                            تأكيد الحساب عبر الواتساب
                          </h3>
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                            <div className="flex items-center gap-3 mb-2">
                              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.89 3.548z"/>
                              </svg>
                              <span className="text-sm font-medium text-green-700" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                                سنرسل لك رمز التأكيد عبر الواتساب
                              </span>
                            </div>
                          </div>
                          <Input
                            type="tel"
                            placeholder="رقم الموبايل (07xxxxxxxxx)"
                            value={signupData.phone}
                            onChange={(e) => setSignupData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full h-12 text-center text-sm border-gray-300 focus:border-gray-400 focus:ring-0 rounded-xl"
                            style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                          />
                          {!otpSent ? (
                            <Button
                              onClick={sendOTP}
                              disabled={!signupData.phone.trim() || isLoading}
                              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-xl transition-all duration-300"
                              style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                            >
                              {isLoading ? 'جاري الإرسال...' : 'إرسال رمز التأكيد'}
                            </Button>
                          ) : (
                            <div className="space-y-3">
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 text-center">
                                📱 تحقق من تطبيق WhatsApp للحصول على رمز التأكيد
                              </div>
                              <Input
                                type="text"
                                placeholder="ادخل رمز التأكيد (6 أرقام)"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                className="w-full h-12 text-center text-lg border-gray-300 focus:border-green-400 focus:ring-0 rounded-xl tracking-wider"
                                style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                                maxLength={6}
                              />
                              <Button
                                onClick={verifyOTP}
                                disabled={otpCode.length !== 6 || isLoading}
                                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-xl transition-all duration-300"
                                style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                              >
                                {isLoading ? 'جاري التحقق...' : 'تأكيد الرمز'}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {signupStep === 3 && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium text-gray-800 text-center mb-4" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                            المعلومات الشخصية
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

                      {signupStep === 4 && (
                        <div className="space-y-4 relative z-10" style={{ minHeight: '300px' }}>
                          <h3 className="text-sm font-medium text-gray-800 text-center mb-4" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                            عنوان التوصيل
                          </h3>
                          <div className="relative">
                            <CustomDropdown
                              value={signupData.governorate}
                              onChange={(value) => setSignupData(prev => ({ ...prev, governorate: value }))}
                              options={iraqiGovernorates}
                              placeholder="اختر المحافظة"
                            />
                          </div>
                          <Input
                            type="text"
                            placeholder="اسم المنطقة أو الحي"
                            value={signupData.district}
                            onChange={(e) => setSignupData(prev => ({ ...prev, district: e.target.value }))}
                            className="w-full h-12 text-right text-sm border-gray-300 focus:border-gray-400 focus:ring-0 rounded-xl"
                            style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                            dir="rtl"
                          />
                          <Input
                            type="text"
                            placeholder="أقرب نقطة دالة (مثال: قرب مسجد الرحمن)"
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
                  {signupStep === 1 ? (
                    <Button
                      onClick={handleSignupNext}
                      disabled={isLoading}
                      className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-xl shadow-lg disabled:opacity-50"
                      style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                    >
                      {isLoading ? 'جاري التحقق...' : 'التالي'}
                    </Button>
                  ) : signupStep === 2 ? (
                    null // Step 2 has its own buttons for OTP
                  ) : signupStep === 3 ? (
                    <Button
                      onClick={handleSignupNext}
                      disabled={isLoading}
                      className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-xl shadow-lg disabled:opacity-50"
                      style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                    >
                      {isLoading ? 'جاري التحقق...' : 'التالي'}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  notification.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                  {notification.type === 'error' ? '⚠️' : '✅'}
                </div>
                <p 
                  className="text-gray-800 dark:text-gray-200 text-sm font-medium"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
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
    </div>
  );
};

export default AuthPage;