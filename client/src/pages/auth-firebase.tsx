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