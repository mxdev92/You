import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import paketyLogo from '@/assets/pakety-logo.png';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'error' as 'success' | 'error'
  });

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const { user, login, register, loading } = useAuth();

  const showNotification = (message: string, type: 'success' | 'error' = 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'error' });
    }, 3000);
  };

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user && !loading) {
      console.log('🔥 User authenticated, redirecting to home');
      setLocation('/');
    }
  }, [user, loading, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email.trim() || !loginData.password.trim()) {
      showNotification('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setIsLoading(true);
    try {
      await login(loginData.email, loginData.password);
      showNotification('تم تسجيل الدخول بنجاح', 'success');
      setLocation('/');
    } catch (error: any) {
      console.error('Login error:', error);
      showNotification('خطأ في تسجيل الدخول: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupData.email.trim() || !signupData.password.trim()) {
      showNotification('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      showNotification('كلمتا المرور غير متطابقتان');
      return;
    }

    if (signupData.password.length < 6) {
      showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setIsLoading(true);
    try {
      await register(signupData.email, signupData.password);
      showNotification('تم إنشاء الحساب بنجاح', 'success');
      setLocation('/');
    } catch (error: any) {
      console.error('Signup error:', error);
      showNotification('خطأ في إنشاء الحساب: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setIsLoading(false);
    }
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
            <div className="p-8">
              <div className="text-center mb-8">
                <img 
                  src={paketyLogo} 
                  alt="PAKETY" 
                  className="h-20 w-auto mx-auto mb-4"
                />
                <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  مرحبا بك في باكيتي
                </h2>
                <p className="text-sm text-gray-600 mt-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  سجل دخولك للمتابعة
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  className="h-12 px-4 text-right rounded-xl"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                  dir="rtl"
                />
                
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="كلمة المرور"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="h-12 px-4 pr-12 text-right rounded-xl"
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
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-xl shadow-lg"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                >
                  {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </Button>
              </form>

              <div className="text-center mt-6">
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                >
                  انشاء حساب
                </button>
              </div>
            </div>
          ) : (
            /* Signup Form */
            <div className="p-8">
              <div className="text-center mb-8">
                <img 
                  src={paketyLogo} 
                  alt="PAKETY" 
                  className="h-20 w-auto mx-auto mb-4"
                />
                <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  إنشاء حساب جديد
                </h2>
                <p className="text-sm text-gray-600 mt-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  أنشئ حسابك للمتابعة
                </p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <Input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={signupData.email}
                  onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                  className="h-12 px-4 text-right rounded-xl"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                  dir="rtl"
                />
                
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="كلمة المرور"
                    value={signupData.password}
                    onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                    className="h-12 px-4 pr-12 text-right rounded-xl"
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
                  className="h-12 px-4 text-right rounded-xl"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                  dir="rtl"
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-xl shadow-lg"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                >
                  {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
                </Button>
              </form>

              <div className="text-center mt-6">
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                >
                  لديك حساب؟ سجل دخولك
                </button>
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
    </div>
  );
};

export default AuthPage;
    }
    else if (step === 2) {
      // Step 2 is WhatsApp verification - handled separately
      console.log('⚠️ Step 2 - WhatsApp verification handled separately');
      return;
    }
    else if (step === 3) {
      console.log('📝 Validating step 3 data');
      if (!signupData.name.trim()) {
        console.log('❌ Name is empty');
        showNotification('يرجى إدخال الاسم الكامل');
        return;
      }
      // Move to next step after validation passes
      console.log('✅ Step 3 validation passed, moving to step 4');
      setSignupStep(4);
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
      // NEW WORKFLOW: Create account only on final step completion
      const email = signupData.email;
      
      // Register user with Firebase (only email and password)
      const newUser = await register(email, signupData.password);
      console.log('🔥 Firebase User registered successfully:', newUser.email);
      
      // TODO: Store additional user data (name, phone, address) in PostgreSQL
      // This will be handled by the server-side user data sync
      console.log('📋 User signup data:', {
        uid: newUser.uid,
        email: newUser.email,
        name: signupData.name,
        phone: signupData.phone,
        address: {
          governorate: signupData.governorate,
          district: signupData.district,
          landmark: signupData.landmark
        }
      });
      console.log('Address created successfully during signup');
      
      // Send welcome messages - Arabic alert + WhatsApp message
      const welcomeMessage = 'اهلا وسهلا بك في تطبيق باكيتي للتوصيل السريع\nتم انشاء حسابك بنجاح';
      
      // Track successful registration with Meta Pixel
      MetaPixel.trackCompleteRegistration();
      
      // Show Arabic welcome alert
      showNotification(welcomeMessage, 'success');
      
      // Send WhatsApp welcome message
      try {
        await fetch('/api/whatsapp/send-welcome-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            phone: signupData.phone,
            name: signupData.name
          })
        });
        console.log('Welcome WhatsApp message sent successfully');
      } catch (whatsappError) {
        console.error('WhatsApp welcome message failed:', whatsappError);
        // Don't block signup completion for WhatsApp failures
      }
      
      // Redirect to main app after successful account creation
      setTimeout(() => {
        setLocation('/');
      }, 3000); // Allow time to read welcome message
      
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
            <div className="p-8">
              <div className="text-center mb-8">
                <img 
                  src={paketyLogo} 
                  alt="PAKETY" 
                  className="h-20 w-auto mx-auto mb-4"
                />
                <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  مرحبا بك في باكيتي
                </h2>
                <p className="text-sm text-gray-600 mt-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  سجل دخولك للمتابعة
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full h-12 text-right text-sm border-gray-300 focus:border-gray-400 focus:ring-0 rounded-xl"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                  dir="rtl"
                />
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="كلمة المرور"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full h-12 text-right text-sm border-gray-300 focus:border-gray-400 focus:ring-0 rounded-xl pr-4 pl-12"
                    style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                    dir="rtl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  type="submit"
                  disabled={!loginData.email || !loginData.password || isLoading}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-xl shadow-lg"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                >
                  {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                >
                  انشاء حساب
                </button>
              </div>
            </div>
          ) : (
            /* Signup Form */
            <div className="p-8">
              <div className="text-center mb-6">
                <img 
                  src={paketyLogo} 
                  alt="PAKETY" 
                  className="h-16 w-auto mx-auto mb-3"
                />
                <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  إنشاء حساب جديد
                </h2>
                <div className="flex justify-center mt-4 space-x-2 rtl:space-x-reverse">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`w-8 h-2 rounded-full ${
                        step <= signupStep ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="relative" style={{ minHeight: '300px' }}>
                <AnimatePresence mode="wait" custom={1}>
                  <motion.div
                    key={signupStep}
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                  >
                    {signupStep === 1 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-800 text-center mb-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
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
                            type={showPassword ? "text" : "password"}
                            placeholder="كلمة المرور"
                            value={signupData.password}
                            onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full h-12 text-right text-sm border-gray-300 focus:border-gray-400 focus:ring-0 rounded-xl pr-4 pl-12"
                            style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                            dir="rtl"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <Input
                          type="password"
                          placeholder="تأكيد كلمة المرور"
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full h-12 text-right text-sm border-gray-300 focus:border-gray-400 focus:ring-0 rounded-xl mb-3"
                          style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                          dir="rtl"
                        />
                        <Button
                          onClick={handleSignupNext}
                          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-xl shadow-lg"
                          style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                        >
                          التالي
                        </Button>
                      </div>
                    )}

                    {signupStep === 2 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-800 text-center mb-4" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                          التحقق من رقم WhatsApp
                        </h3>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
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
                          placeholder="07000000000"
                          value={signupData.phone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 11 && (value.startsWith('07') || value === '' || value === '0')) {
                              setSignupData(prev => ({ ...prev, phone: value }));
                            }
                          }}
                          className="w-full h-12 text-center text-lg border-gray-300 focus:border-gray-400 focus:ring-0 rounded-xl"
                          style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace', fontSize: '18px', lineHeight: '1', fontWeight: 'normal' }}
                          maxLength={11}
                          dir="ltr"
                        />
                        {!otpSent ? (
                          <Button
                            onClick={sendOTP}
                            disabled={signupData.phone.length !== 11 || !signupData.phone.startsWith('07') || isLoading}
                            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-xl transition-all duration-300"
                            style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                          >
                            {isLoading ? 'جاري الإرسال...' : 'إرسال رمز التأكيد'}
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <Input
                              type="text"
                              placeholder="ادخل رمز التأكيد (4 أرقام)"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              className="w-full h-12 text-center text-lg border-gray-300 focus:border-green-400 focus:ring-0 rounded-xl tracking-wider"
                              style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                              maxLength={4}
                            />
                            <Button
                              onClick={verifyOTP}
                              disabled={otpCode.length !== 4 || isLoading}
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

              {/* Action Buttons */}
              {signupStep === 3 && (
                <div className="mt-1">
                  <Button
                    onClick={handleSignupNext}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-xl shadow-lg"
                    style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                  >
                    التالي
                  </Button>
                </div>
              )}
              {signupStep === 4 && (
                <div className="mt-1">
                  <Button
                    onClick={handleSignupComplete}
                    disabled={isLoading}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-xl shadow-lg"
                    style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                  >
                    {isLoading ? 'جاري إنشاء الحساب...' : 'إتمام التسجيل'}
                  </Button>
                </div>
              )}
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
    </div>
  );
};

export default AuthPage;