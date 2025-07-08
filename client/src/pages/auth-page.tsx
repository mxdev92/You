import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { useFirebaseAddresses } from '@/hooks/use-firebase-addresses';
import { useLocation } from 'wouter';

interface OTPState {
  confirmationResult: any;
  phoneNumber: string;
  isOTPSent: boolean;
  isVerifying: boolean;
}

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState(1);
  const [otpState, setOtpState] = useState<OTPState>({
    confirmationResult: null,
    phoneNumber: '',
    isOTPSent: false,
    isVerifying: false
  });
  const [otpCode, setOtpCode] = useState('');
  
  // Form data - new flow: 1) Phone verification, 2) Password, 3) Personal details
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    governorate: '',
    district: '',
    landmark: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    registerWithPhoneOTP, 
    verifyOTPAndComplete, 
    registerWithEmailFromPhone,
    login,
    error: authError 
  } = useFirebaseAuth();
  const { addAddress } = useFirebaseAddresses();

  const iraqiGovernorates = [
    'اختر المحافظة', 'بغداد', 'البصرة', 'أربيل', 'نينوى', 'السليمانية', 'الأنبار',
    'ديالى', 'كركوك', 'الأنبار', 'بابل', 'النجف', 'كربلاء', 'واسط', 'ذي قار', 
    'المثنى', 'القادسية', 'ميسان'
  ];

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (mode === 'login') {
      // Login: Phone + Password on single step
      if (!formData.phone.match(/^07\d{9}$/)) {
        newErrors.phone = 'رقم الموبايل يجب أن يبدأ ب 07 ويحتوي على 11 رقم';
      }
      if (formData.password.length < 6) {
        newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      }
    } else if (mode === 'signup') {
      if (stepNumber === 1) {
        // Step 1: Phone verification
        if (!formData.phone.match(/^07\d{9}$/)) {
          newErrors.phone = 'رقم الموبايل يجب أن يبدأ ب 07 ويحتوي على 11 رقم';
        }
        if (otpState.isOTPSent && (!otpCode || otpCode.length !== 4)) {
          newErrors.otp = 'رمز التحقق يجب أن يكون 4 أرقام';
        }
      } else if (stepNumber === 2) {
        // Step 2: Set password
        if (formData.password.length < 6) {
          newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
        }
      } else if (stepNumber === 3) {
        // Step 3: Personal details
        if (!formData.fullName.trim()) {
          newErrors.fullName = 'الاسم الكامل مطلوب';
        }
        if (!formData.governorate || formData.governorate === 'اختر المحافظة') {
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

  const handleNext = async () => {
    if (!validateStep(step)) return;

    if (mode === 'login') {
      // Direct login with phone + password
      await handleLogin();
    } else if (mode === 'signup') {
      if (step === 1 && !otpState.isOTPSent) {
        // Step 1: Send OTP for phone verification
        await sendOTP();
      } else if (step === 1 && otpState.isOTPSent) {
        // Step 1: Verify OTP and move to password step
        await verifyOTP();
      } else if (step === 2) {
        // Step 2: Password validated, move to personal details
        setStep(3);
      } else if (step === 3) {
        // Step 3: Complete signup with personal details
        await handleSubmit();
      }
    }
  };

  const sendOTP = async () => {
    setIsSubmitting(true);
    try {
      const phoneNumber = `+964${formData.phone.substring(1)}`; // Convert 07XXXXXXXXX to +9647XXXXXXXXX
      console.log('Sending OTP to:', phoneNumber);
      
      const confirmationResult = await registerWithPhoneOTP(phoneNumber, formData.fullName);
      
      setOtpState({
        confirmationResult,
        phoneNumber,
        isOTPSent: true,
        isVerifying: false
      });
      
      setStep(2); // Move to OTP verification step
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    setIsSubmitting(true);
    try {
      // Convert phone to email format for Firebase: 07123456789 -> 07123456789@pakety.app
      const emailFromPhone = `${formData.phone}@pakety.app`;
      await login(emailFromPhone, formData.password);
      console.log('Login successful');
      setLocation('/'); // Redirect to home
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOTP = async () => {
    if (!otpState.confirmationResult || !otpCode) return;
    
    setIsSubmitting(true);
    setOtpState(prev => ({ ...prev, isVerifying: true }));
    
    try {
      // Verify OTP and also create Firebase account with email format
      await verifyOTPAndComplete(otpState.confirmationResult, otpCode, formData.fullName);
      
      // Also create email-based account for future login compatibility
      await registerWithEmailFromPhone(formData.phone, formData.password, formData.fullName);
      
      setStep(2); // Move to password step for signup
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
      setOtpState(prev => ({ ...prev, isVerifying: false }));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setIsSubmitting(true);
    try {
      // Complete signup process - add address
      if (mode === 'signup') {
        // Address is added here since user is already authenticated via OTP
        const user = { uid: 'current-user' }; // Will be replaced by actual authenticated user
        
        await addAddress(user.uid, {
          governorate: formData.governorate,
          district: formData.district,
          landmark: formData.landmark,
          fullAddress: `${formData.governorate} - ${formData.district} - ${formData.landmark}`,
          isDefault: true
        });

        console.log('Firebase registration and address creation successful');
        
        // Show welcome message and redirect
        setTimeout(() => {
          alert('اهلا وسهلا بك في تطبيق باكيتي للتوصيل السريع تم انشاء حسابك بنجاح');
          setLocation('/'); // Redirect to home
        }, 1000);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col" dir="rtl">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold font-['Cairo']">
            {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </h1>
          <button
            onClick={() => setLocation('/')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </button>
        </div>
      </div>

      {/* Progress indicator for signup */}
      {mode === 'signup' && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3">
          <div className="max-w-md mx-auto">
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    s <= step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
        >
          {/* Progress Indicator for Signup */}
          {mode === 'signup' && (
            <div className="mb-6">
              <div className="flex items-center justify-between">
                {[1, 2, 3].map((stepNum) => (
                  <div key={stepNum} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step >= stepNum
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {stepNum}
                    </div>
                    {stepNum < 3 && (
                      <div
                        className={`w-12 h-1 mx-2 ${
                          step > stepNum ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400 font-['Cairo']">
                <span>تأكيد الهاتف</span>
                <span>كلمة المرور</span>
                <span>المعلومات الشخصية</span>
              </div>
            </div>
          )}
          {/* Login Form */}
          {mode === 'login' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone" className="text-right block mb-2 font-['Cairo']">رقم الموبايل</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className={`text-left ${errors.phone ? 'border-red-500' : ''}`}
                  dir="ltr"
                  placeholder="07000000000"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1 text-right">{errors.phone}</p>}
              </div>

              <div>
                <Label htmlFor="password" className="text-right block mb-2 font-['Cairo']">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`text-left ${errors.password ? 'border-red-500' : ''}`}
                  dir="ltr"
                  placeholder="ادخل كلمة المرور"
                />
                {errors.password && <p className="text-red-500 text-sm mt-1 text-right">{errors.password}</p>}
              </div>
            </div>
          )}

          {/* Signup Step 1: Phone Verification */}
          {mode === 'signup' && step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold font-['Cairo'] mb-2">تأكيد رقم الهاتف</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">أدخل رقم هاتفك لاستلام رمز التحقق</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone" className="text-right block mb-3 text-sm font-medium font-['Cairo']">
                    رقم الموبايل العراقي
                  </Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 11) {
                          setFormData({...formData, phone: value});
                        }
                      }}
                      className={`h-14 text-lg text-center tracking-wider border-2 rounded-xl font-mono ${
                        errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-green-500'
                      } transition-all duration-200`}
                      dir="ltr"
                      placeholder="07000000000"
                      maxLength={11}
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                      11 رقم
                    </div>
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-2 text-right font-['Cairo'] bg-red-50 p-2 rounded-lg">
                      {errors.phone}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    مثال: 07701234567
                  </p>
                </div>

                {!otpState.isOTPSent && (
                  <Button
                    onClick={handleNext}
                    disabled={isSubmitting || !formData.phone.match(/^07\d{9}$/)}
                    className="w-full h-14 text-lg font-['Cairo'] font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl transition-all duration-200 shadow-lg"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center space-x-2 space-x-reverse">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري الإرسال...</span>
                      </div>
                    ) : (
                      'إرسال رمز التأكيد'
                    )}
                  </Button>
                )}

                {otpState.isOTPSent && (
                  <>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200">
                      <div className="flex items-center justify-center space-x-2 space-x-reverse mb-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600">✓</span>
                        </div>
                        <p className="text-green-700 dark:text-green-300 font-['Cairo'] font-medium">
                          تم إرسال الرمز بنجاح
                        </p>
                      </div>
                      <p className="text-sm text-green-600 text-center font-['Cairo']">
                        إلى الرقم: {otpState.phoneNumber}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="otp" className="text-right block mb-3 text-sm font-medium font-['Cairo']">
                        رمز التحقق (4 أرقام)
                      </Label>
                      <Input
                        id="otp"
                        type="text"
                        value={otpCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 4) {
                            setOtpCode(value);
                          }
                        }}
                        className={`h-14 text-2xl text-center tracking-[0.8em] border-2 rounded-xl font-mono ${
                          errors.otp ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-green-500'
                        } transition-all duration-200`}
                        placeholder="● ● ● ●"
                        maxLength={4}
                        dir="ltr"
                      />
                      {errors.otp && (
                        <p className="text-red-500 text-sm mt-2 text-right font-['Cairo'] bg-red-50 p-2 rounded-lg">
                          {errors.otp}
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={handleNext}
                      disabled={isSubmitting || otpCode.length !== 4}
                      className="w-full h-14 text-lg font-['Cairo'] font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all duration-200 shadow-lg"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center space-x-2 space-x-reverse">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>جاري التحقق...</span>
                        </div>
                      ) : (
                        'تأكيد'
                      )}
                    </Button>

                    <button
                      onClick={async () => {
                        setOtpState(prev => ({ ...prev, isOTPSent: false }));
                        setOtpCode('');
                        await sendOTP();
                      }}
                      className="w-full text-sm text-gray-500 hover:text-green-600 font-['Cairo'] py-2"
                    >
                      إعادة إرسال الرمز
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Signup Step 2: Set Password */}
          {mode === 'signup' && step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold font-['Cairo'] mb-2">تعيين كلمة المرور</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">اختر كلمة مرور قوية لحماية حسابك</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="password" className="text-right block mb-3 text-sm font-medium font-['Cairo']">
                    كلمة المرور
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className={`h-14 text-lg border-2 rounded-xl ${
                      errors.password ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-green-500'
                    } transition-all duration-200`}
                    dir="ltr"
                    placeholder="ادخل كلمة المرور (6 أحرف على الأقل)"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-2 text-right font-['Cairo'] bg-red-50 p-2 rounded-lg">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-right block mb-3 text-sm font-medium font-['Cairo']">
                    تأكيد كلمة المرور
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className={`h-14 text-lg border-2 rounded-xl ${
                      errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-green-500'
                    } transition-all duration-200`}
                    dir="ltr"
                    placeholder="أعد كتابة كلمة المرور"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-2 text-right font-['Cairo'] bg-red-50 p-2 rounded-lg">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-xl">
                  <p className="text-sm text-blue-700 font-['Cairo'] text-right">
                    💡 اختر كلمة مرور تحتوي على 6 أحرف على الأقل لضمان الأمان
                  </p>
                </div>

                <Button
                  onClick={handleNext}
                  disabled={!formData.password || !formData.confirmPassword || formData.password !== formData.confirmPassword || formData.password.length < 6}
                  className="w-full h-14 text-lg font-['Cairo'] font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl transition-all duration-200 shadow-lg"
                >
                  المتابعة إلى المعلومات الشخصية
                </Button>
              </div>
            </div>
          )}

          {/* Signup Step 3: Personal Details */}
          {mode === 'signup' && step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold font-['Cairo'] mb-2">المعلومات الشخصية</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">أكمل معلوماتك لإنهاء إنشاء الحساب</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName" className="text-right block mb-3 text-sm font-medium font-['Cairo']">
                    الاسم
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className={`h-14 text-lg text-right border-2 rounded-xl ${
                      errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-green-500'
                    } transition-all duration-200`}
                    dir="rtl"
                    placeholder="اكتب اسمك الكامل"
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-2 text-right font-['Cairo'] bg-red-50 p-2 rounded-lg">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="governorate" className="text-right block mb-3 text-sm font-medium font-['Cairo']">
                    المحافظة
                  </Label>
                  <select
                    id="governorate"
                    value={formData.governorate}
                    onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                    className={`w-full h-14 text-lg border-2 rounded-xl text-right font-['Cairo'] bg-white ${
                      errors.governorate ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-green-500'
                    } transition-all duration-200`}
                    dir="rtl"
                  >
                    {iraqiGovernorates.map((gov) => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                  {errors.governorate && (
                    <p className="text-red-500 text-sm mt-2 text-right font-['Cairo'] bg-red-50 p-2 rounded-lg">
                      {errors.governorate}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="district" className="text-right block mb-3 text-sm font-medium font-['Cairo']">
                    المنطقة
                  </Label>
                  <Input
                    id="district"
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className={`h-14 text-lg text-right border-2 rounded-xl ${
                      errors.district ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-green-500'
                    } transition-all duration-200`}
                    dir="rtl"
                    placeholder="اكتب اسم المنطقة"
                  />
                  {errors.district && (
                    <p className="text-red-500 text-sm mt-2 text-right font-['Cairo'] bg-red-50 p-2 rounded-lg">
                      {errors.district}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="landmark" className="text-right block mb-3 text-sm font-medium font-['Cairo']">
                    أقرب نقطة دالة
                  </Label>
                  <Input
                    id="landmark"
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    className={`h-14 text-lg text-right border-2 rounded-xl ${
                      errors.landmark ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-green-500'
                    } transition-all duration-200`}
                    dir="rtl"
                    placeholder="مثل: قرب الجامعة، بجانب المستشفى"
                  />
                  {errors.landmark && (
                    <p className="text-red-500 text-sm mt-2 text-right font-['Cairo'] bg-red-50 p-2 rounded-lg">
                      {errors.landmark}
                    </p>
                  )}
                </div>

                <div className="bg-green-50 p-4 rounded-xl">
                  <p className="text-sm text-green-700 font-['Cairo'] text-right">
                    🎉 مرحلة أخيرة! بعد الضغط على "إنشاء الحساب" ستتمكن من التسوق فوراً
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Messages */}
          {(errors.submit || authError) && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mt-4">
              <p className="text-red-700 dark:text-red-300 text-sm text-right font-['Cairo']">
                {errors.submit || authError}
              </p>
            </div>
          )}

          {/* Action Buttons - Only for Login and Step 3 */}
          {mode === 'login' && (
            <div className="mt-6">
              <Button
                onClick={handleNext}
                disabled={isSubmitting}
                className="w-full h-14 text-lg font-['Cairo'] font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl transition-all duration-200 shadow-lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2 space-x-reverse">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري تسجيل الدخول...</span>
                  </div>
                ) : (
                  'تسجيل الدخول'
                )}
              </Button>
            </div>
          )}

          {mode === 'signup' && step === 3 && (
            <div className="flex space-x-reverse space-x-3 mt-6">
              <Button
                onClick={handleNext}
                disabled={isSubmitting}
                className="flex-1 h-14 text-lg font-['Cairo'] font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl transition-all duration-200 shadow-lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2 space-x-reverse">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري إنشاء الحساب...</span>
                  </div>
                ) : (
                  'إنشاء الحساب'
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1 h-14 text-lg font-['Cairo'] border-2 rounded-xl"
              >
                السابق
              </Button>
            </div>
          )}

          {/* Toggle between login/signup */}
          <div className="text-center mt-4">
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setStep(1);
                setErrors({});
                setOtpState({
                  confirmationResult: null,
                  phoneNumber: '',
                  isOTPSent: false,
                  isVerifying: false
                });
                setOtpCode('');
              }}
              className="text-green-600 hover:text-green-700 text-sm font-['Cairo']"
            >
              {mode === 'login' ? 'إنشاء حساب جديد' : 'لدي حساب بالفعل'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}