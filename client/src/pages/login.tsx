import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePostgresAuth } from "@/hooks/use-postgres-auth";
import { useLocation } from "wouter";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const { login, register, loading, error } = usePostgresAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && password !== confirmPassword) {
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
      setLocation("/");
    } catch (err) {
      // Error is handled by useAuth hook
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-fresh-green/20 via-white to-fresh-green/10 flex items-center justify-center p-4 sm:p-6 lg:p-8" style={{ fontFamily: 'Cairo, sans-serif' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm sm:max-w-md mx-auto"
      >
        {/* Logo and Header */}
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            className="mx-auto mb-4 sm:mb-6 flex items-center justify-center"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-fresh-green drop-shadow-xl" style={{ fontFamily: 'Cairo, sans-serif' }}>
              YALLA JEETEK
            </h1>
          </motion.div>
          <p className="text-gray-600 text-base sm:text-lg">
            {isLogin ? 'مرحباً بعودتك' : 'إنشاء حساب جديد'}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {isLogin ? 'قم بتسجيل الدخول للمتابعة' : 'انضم إلينا اليوم'}
          </p>
        </div>

        {/* Auth Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100"
        >
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                البريد الإلكتروني
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني"
                  className="pl-10 sm:pl-12 h-11 sm:h-12 rounded-xl border-gray-200 focus:border-fresh-green focus:ring-fresh-green/20 text-base"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                كلمة المرور
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="pl-10 sm:pl-12 pr-10 sm:pr-12 h-11 sm:h-12 rounded-xl border-gray-200 focus:border-fresh-green focus:ring-fresh-green/20 text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 touch-manipulation"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Register only) */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  تأكيد كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أكد كلمة المرور"
                    className="pl-10 sm:pl-12 h-11 sm:h-12 rounded-xl border-gray-200 focus:border-fresh-green focus:ring-fresh-green/20 text-base"
                    required
                  />
                </div>
                {password !== confirmPassword && confirmPassword && (
                  <p className="text-sm text-red-500">كلمات المرور غير متطابقة</p>
                )}
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl"
              >
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || (!isLogin && password !== confirmPassword)}
              className="w-full h-11 sm:h-12 bg-fresh-green hover:bg-green-600 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center group shadow-lg hover:shadow-xl text-base touch-manipulation"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                  {isLogin ? 'جاري تسجيل الدخول...' : 'جاري إنشاء الحساب...'}
                </>
              ) : (
                <>
                  {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
                  <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-5 sm:mt-6 text-center">
            <p className="text-gray-600 text-sm">
              {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail("");
                setPassword("");
                setConfirmPassword("");
              }}
              className="mt-2 text-fresh-green hover:text-green-600 font-semibold transition-colors text-sm touch-manipulation"
            >
              {isLogin ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
            </button>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center mt-4 sm:mt-6 space-y-2"
        >
          <p className="text-xs text-gray-400 px-2">
            بالمتابعة، أنت توافق على شروط الخدمة وسياسة الخصوصية
          </p>
          <div className="text-xs text-gray-300 font-medium space-y-1">
            <p>This app was built by MX 2025</p>
            <p>For more information mxdev92@gmail.com</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}