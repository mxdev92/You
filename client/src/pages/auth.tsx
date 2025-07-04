import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { usePostgresAuth } from '@/hooks/use-postgres-auth';
import { useLocation } from 'wouter';

interface SignupData {
  name: string;
  phone: string;
  password: string;
  governorate: string;
  district: string;
  landmark: string;
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
      await register(email, signupData.password);
      
      // The user should now be logged in and redirected
      setLocation('/');
    } catch (error: any) {
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* App Logo */}
        <div className="text-center mb-8">
          <motion.h1 
            className="text-4xl font-bold text-green-600 mb-2"
            style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            PAKETY
          </motion.h1>
          <motion.p 
            className="text-gray-600"
            style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            تسوق البقالة بسهولة
          </motion.p>
        </div>

        {/* Main Card */}
        <motion.div
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {isLogin ? (
            /* Login Form */
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                تسجيل الدخول
              </h2>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="البريد الإلكتروني"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full h-12 text-right"
                    style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                    dir="rtl"
                  />
                </div>
                
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="كلمة المرور"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full h-12 text-right pr-10"
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
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                >
                  {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-green-600 hover:text-green-700 font-medium"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                >
                  إنشاء حساب جديد
                </button>
              </div>
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
                  <ArrowRight className="h-5 w-5 text-gray-600" />
                </button>
                
                <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  إنشاء حساب جديد
                </h2>
                
                <div className="w-9" /> {/* Spacer */}
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-500 mb-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  <span>الخطوة {signupStep} من 6</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-green-600 h-2 rounded-full"
                    initial={{ width: '16.66%' }}
                    animate={{ width: `${(signupStep / 6) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Step Content */}
              <div className="min-h-[200px]">
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
                        <h3 className="text-lg font-medium text-gray-800 text-center mb-6" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                          ما هو اسمك؟
                        </h3>
                        <Input
                          type="text"
                          placeholder="الاسم الكامل"
                          value={signupData.name}
                          onChange={(e) => setSignupData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full h-12 text-right"
                          style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                          dir="rtl"
                        />
                      </div>
                    )}

                    {signupStep === 2 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-800 text-center mb-6" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                          رقم الموبايل
                        </h3>
                        <Input
                          type="tel"
                          placeholder="07xxxxxxxxx"
                          value={signupData.phone}
                          onChange={(e) => setSignupData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full h-12 text-center"
                          style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                        />
                      </div>
                    )}

                    {signupStep === 3 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-800 text-center mb-6" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                          كلمة المرور
                        </h3>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="كلمة المرور (6 أحرف على الأقل)"
                            value={signupData.password}
                            onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full h-12 text-right pr-10"
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
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-800 text-center mb-6" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                          تسجيل العنوان - المحافظة
                        </h3>
                        <select
                          value={signupData.governorate}
                          onChange={(e) => setSignupData(prev => ({ ...prev, governorate: e.target.value }))}
                          className="w-full h-12 px-3 border border-gray-300 rounded-md text-right"
                          style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                          dir="rtl"
                        >
                          <option value="">اختر المحافظة</option>
                          {iraqiGovernorates.map((gov) => (
                            <option key={gov} value={gov}>{gov}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {signupStep === 5 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-800 text-center mb-6" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                          المنطقة
                        </h3>
                        <Input
                          type="text"
                          placeholder="اسم المنطقة أو الحي"
                          value={signupData.district}
                          onChange={(e) => setSignupData(prev => ({ ...prev, district: e.target.value }))}
                          className="w-full h-12 text-right"
                          style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                          dir="rtl"
                        />
                      </div>
                    )}

                    {signupStep === 6 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-800 text-center mb-6" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                          أقرب نقطة دالة
                        </h3>
                        <Input
                          type="text"
                          placeholder="مثال: قرب مسجد الرحمن، بجانب صيدلية الشفاء"
                          value={signupData.landmark}
                          onChange={(e) => setSignupData(prev => ({ ...prev, landmark: e.target.value }))}
                          className="w-full h-12 text-right"
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
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
                    style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                  >
                    التالي
                  </Button>
                ) : (
                  <Button
                    onClick={handleSignupComplete}
                    disabled={isLoading}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
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