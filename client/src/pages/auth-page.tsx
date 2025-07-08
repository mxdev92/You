import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Phone, Mail, Lock, User, MapPin, CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpCode, setOtpCode] = useState('');
  const [otpState, setOtpState] = useState({
    isOTPSent: false,
    isVerifying: false,
    phoneNumber: '',
    confirmationResult: null as any
  });

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    fullName: '',
    governorate: '',
    district: '',
    landmark: ''
  });

  const {
    registerWithEmailPassword,
    signInWithEmailPassword,
    user,
    loading,
    error: authError
  } = useFirebaseAuth();

  const iraqiGovernorates = [
    'بغداد', 'البصرة', 'أربيل', 'نينوى', 'السليمانية', 'الأنبار',
    'ديالى', 'كركوك', 'بابل', 'النجف', 'كربلاء', 'واسط', 'ذي قار', 
    'المثنى', 'القادسية', 'ميسان'
  ];

  useEffect(() => {
    if (user) {
      setLocation('/');
    }
  }, [user, setLocation]);

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (mode === 'login') {
      // Login validation
      if (!formData.email.includes('@')) {
        newErrors.email = 'البريد الإلكتروني غير صحيح';
      }
      if (formData.password.length < 6) {
        newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      }
    } else if (mode === 'signup') {
      if (stepNumber === 1) {
        // Step 1: Email & Password with Firebase
        if (!formData.email.includes('@')) {
          newErrors.email = 'البريد الإلكتروني غير صحيح';
        }
        if (formData.password.length < 6) {
          newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
        }
      } else if (stepNumber === 2) {
        // Step 2: WhatsApp verification
        if (!formData.phone.match(/^07\d{9}$/)) {
          newErrors.phone = 'رقم الواتساب يجب أن يبدأ ب 07 ويحتوي على 11 رقم';
        }
        if (otpState.isOTPSent && (!otpCode || otpCode.length !== 4)) {
          newErrors.otp = 'رمز التحقق يجب أن يكون 4 أرقام';
        }
      } else if (stepNumber === 3) {
        // Step 3: Delivery information
        if (!formData.fullName.trim()) {
          newErrors.fullName = 'الاسم الكامل مطلوب';
        }
        if (!formData.governorate) {
          newErrors.governorate = 'المحافظة مطلوبة';
        }
        if (!formData.district.trim()) {
          newErrors.district = 'المنطقة مطلوبة';
        }
        if (!formData.landmark.trim()) {
          newErrors.landmark = 'أقرب نقطة دالة مطلوبة';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFirebaseSignup = async () => {
    if (!validateStep(1)) return;
    
    setIsSubmitting(true);
    try {
      const user = await registerWithEmailPassword(formData.email, formData.password);
      console.log('Firebase signup successful:', user.email);
      setStep(2); // Move to WhatsApp verification
    } catch (error: any) {
      console.error('Firebase signup failed:', error);
      setErrors({ submit: error.message || 'فشل في إنشاء الحساب' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendWhatsAppOTP = async () => {
    if (!formData.phone.match(/^07\d{9}$/)) {
      setErrors({ phone: 'رقم الواتساب يجب أن يبدأ ب 07 ويحتوي على 11 رقم' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber: formData.phone })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setOtpState({
          confirmationResult: result,
          phoneNumber: formData.phone,
          isOTPSent: true,
          isVerifying: false
        });
        
        if (result.otp) {
          console.log('🔑 OTP Code for testing:', result.otp);
        }
      } else {
        setErrors({ submit: result.message || 'فشل في إرسال رمز التحقق' });
      }
    } catch (error: any) {
      console.error('Failed to send OTP:', error);
      setErrors({ submit: 'فشل في إرسال رمز التحقق. تحقق من اتصال الإنترنت' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyWhatsAppOTP = async () => {
    if (!otpCode || otpCode.length !== 4) {
      setErrors({ otp: 'رمز التحقق يجب أن يكون 4 أرقام' });
      return;
    }
    
    setIsSubmitting(true);
    setOtpState(prev => ({ ...prev, isVerifying: true }));
    
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phoneNumber: formData.phone,
          otp: otpCode
        })
      });

      const result = await response.json();
      
      if (response.ok && result.valid) {
        console.log('OTP verified successfully, moving to step 3');
        setStep(3); // Move to delivery information
        setOtpCode('');
      } else {
        setErrors({ submit: result.message || 'رمز التحقق غير صحيح' });
      }
    } catch (error: any) {
      console.error('Failed to verify OTP:', error);
      setErrors({ submit: 'فشل في التحقق من رمز OTP. حاول مرة أخرى' });
    } finally {
      setIsSubmitting(false);
      setOtpState(prev => ({ ...prev, isVerifying: false }));
    }
  };

  const completeSignup = async () => {
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    try {
      // Save delivery information via API
      const response = await fetch('/api/auth/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: formData.phone,
          fullName: formData.fullName,
          governorate: formData.governorate,
          district: formData.district,
          landmark: formData.landmark
        })
      });

      if (response.ok) {
        console.log('Signup completed successfully');
        setLocation('/');
      } else {
        const result = await response.json();
        setErrors({ submit: result.message || 'فشل في حفظ معلومات التوصيل' });
      }
    } catch (error: any) {
      console.error('Failed to complete signup:', error);
      setErrors({ submit: 'فشل في إكمال التسجيل. حاول مرة أخرى' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    if (!validateStep(1)) return;
    
    setIsSubmitting(true);
    try {
      const user = await signInWithEmailPassword(formData.email, formData.password);
      console.log('Firebase login successful:', user.email);
      setLocation('/');
    } catch (error: any) {
      console.error('Firebase login failed:', error);
      setErrors({ submit: error.message || 'فشل في تسجيل الدخول' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressIndicator = () => {
    if (mode === 'login') return null;
    
    return (
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4 space-x-reverse">
          {[1, 2, 3].map((i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all duration-300 ${
                step >= i 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step > i ? <CheckCircle className="w-4 h-4" /> : i}
              </div>
              {i < 3 && (
                <div className={`w-12 h-0.5 transition-all duration-300 ${
                  step > i ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    if (mode === 'login') {
      return (
        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="email"
              placeholder="البريد الإلكتروني"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="h-12 pr-10 text-right font-['Cairo'] border-gray-300 focus:border-green-500 rounded-xl"
              dir="ltr"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div className="relative">
            <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="password"
              placeholder="كلمة المرور"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="h-12 pr-10 text-right font-['Cairo'] border-gray-300 focus:border-green-500 rounded-xl"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm text-center">{errors.submit}</p>
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={isSubmitting}
            className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2 space-x-reverse">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري تسجيل الدخول...</span>
              </div>
            ) : (
              'تسجيل الدخول'
            )}
          </Button>
        </div>
      );
    }

    // Signup mode
    if (step === 1) {
      return (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 font-['Cairo']">إنشاء حساب Firebase</h3>
            <p className="text-sm text-gray-600 mt-1">البريد الإلكتروني وكلمة المرور</p>
          </div>

          <div className="relative">
            <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="email"
              placeholder="البريد الإلكتروني"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="h-12 pr-10 text-right font-['Cairo'] border-gray-300 focus:border-green-500 rounded-xl"
              dir="ltr"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div className="relative">
            <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="password"
              placeholder="كلمة المرور (6 أحرف على الأقل)"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="h-12 pr-10 text-right font-['Cairo'] border-gray-300 focus:border-green-500 rounded-xl"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <div className="relative">
            <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="password"
              placeholder="تأكيد كلمة المرور"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="h-12 pr-10 text-right font-['Cairo'] border-gray-300 focus:border-green-500 rounded-xl"
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm text-center">{errors.submit}</p>
            </div>
          )}

          <Button
            onClick={handleFirebaseSignup}
            disabled={isSubmitting}
            className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2 space-x-reverse">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري إنشاء الحساب...</span>
              </div>
            ) : (
              <>
                <span>إنشاء حساب Firebase</span>
                <ArrowLeft className="w-4 h-4 mr-2" />
              </>
            )}
          </Button>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 font-['Cairo']">تأكيد رقم الواتساب</h3>
            <p className="text-sm text-gray-600 mt-1">سنرسل لك رمز تحقق عبر WhatsApp</p>
          </div>

          <div className="relative">
            <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="tel"
              placeholder="07XXXXXXXXX"
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 11) {
                  setFormData(prev => ({ ...prev, phone: value }));
                }
              }}
              className="h-12 pr-10 text-center font-['Cairo'] font-mono text-lg border-gray-300 focus:border-green-500 rounded-xl"
              maxLength={11}
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>

          {!otpState.isOTPSent ? (
            <Button
              onClick={sendWhatsAppOTP}
              disabled={isSubmitting || !formData.phone.match(/^07\d{9}$/)}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري الإرسال...</span>
                </div>
              ) : (
                <>
                  <Phone className="w-4 h-4 ml-2" />
                  <span>إرسال رمز WhatsApp</span>
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-green-700 text-sm text-center">
                  تم إرسال رمز التحقق إلى {formData.phone}
                </p>
              </div>

              <Input
                type="text"
                placeholder="رمز التحقق (4 أرقام)"
                value={otpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 4) {
                    setOtpCode(value);
                  }
                }}
                className="h-12 text-center text-xl font-mono border-gray-300 focus:border-green-500 rounded-xl tracking-widest"
                maxLength={4}
              />
              {errors.otp && <p className="text-red-500 text-sm mt-1">{errors.otp}</p>}

              <Button
                onClick={verifyWhatsAppOTP}
                disabled={isSubmitting || otpCode.length !== 4}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2 space-x-reverse">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري التحقق...</span>
                  </div>
                ) : (
                  <>
                    <span>تأكيد الرمز</span>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  </>
                )}
              </Button>
            </div>
          )}

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm text-center">{errors.submit}</p>
            </div>
          )}
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 font-['Cairo']">معلومات التوصيل</h3>
            <p className="text-sm text-gray-600 mt-1">اكمل بياناتك لإنهاء التسجيل</p>
          </div>

          <div className="relative">
            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="الاسم الكامل"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              className="h-12 pr-10 text-right font-['Cairo'] border-gray-300 focus:border-green-500 rounded-xl"
            />
            {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
          </div>

          <div className="relative">
            <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Select 
              value={formData.governorate} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, governorate: value }))}
            >
              <SelectTrigger className="h-12 pr-10 text-right font-['Cairo'] border-gray-300 focus:border-green-500 rounded-xl">
                <SelectValue placeholder="اختر المحافظة" />
              </SelectTrigger>
              <SelectContent>
                {iraqiGovernorates.map((gov) => (
                  <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.governorate && <p className="text-red-500 text-sm mt-1">{errors.governorate}</p>}
          </div>

          <Input
            type="text"
            placeholder="المنطقة"
            value={formData.district}
            onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
            className="h-12 text-right font-['Cairo'] border-gray-300 focus:border-green-500 rounded-xl"
          />
          {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district}</p>}

          <Input
            type="text"
            placeholder="أقرب نقطة دالة"
            value={formData.landmark}
            onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
            className="h-12 text-right font-['Cairo'] border-gray-300 focus:border-green-500 rounded-xl"
          />
          {errors.landmark && <p className="text-red-500 text-sm mt-1">{errors.landmark}</p>}

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm text-center">{errors.submit}</p>
            </div>
          )}

          <div className="flex space-x-3 space-x-reverse">
            <Button
              onClick={() => setStep(2)}
              variant="outline"
              className="flex-1 h-12 border-gray-300 text-gray-700 rounded-xl"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              <span>السابق</span>
            </Button>
            
            <Button
              onClick={completeSignup}
              disabled={isSubmitting}
              className="flex-1 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري الحفظ...</span>
                </div>
              ) : (
                'إنهاء التسجيل'
              )}
            </Button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => setLocation('/')}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowRight className="w-5 h-5 ml-1" />
            <span className="font-['Cairo']">العودة للرئيسية</span>
          </button>
          
          <h1 className="text-3xl font-bold text-gray-800 font-['Cairo'] mb-2">PAKETY</h1>
          <p className="text-gray-600 font-['Cairo']">
            {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </p>
        </div>

        {/* Progress Indicator */}
        {renderProgressIndicator()}

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          {renderStepContent()}
        </div>

        {/* Toggle Mode */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setStep(1);
              setErrors({});
              setOtpState({ isOTPSent: false, isVerifying: false, phoneNumber: '', confirmationResult: null });
            }}
            className="text-green-600 hover:text-green-700 font-semibold text-sm font-['Cairo']"
          >
            {mode === 'login' ? 'انشاء حساب' : 'تسجيل الدخول'}
          </button>
        </div>
      </div>
    </div>
  );
}