import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { useFirebaseAddresses } from '@/hooks/use-firebase-addresses';
import { useTranslation } from '@/hooks/use-translation';

interface FirebaseSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

interface OTPState {
  confirmationResult: any;
  phoneNumber: string;
  isOTPSent: boolean;
  isVerifying: boolean;
}

export default function FirebaseSignupModal({ isOpen, onClose, initialMode = 'login' }: FirebaseSignupModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [step, setStep] = useState(1);
  const [otpState, setOtpState] = useState<OTPState>({
    confirmationResult: null,
    phoneNumber: '',
    isOTPSent: false,
    isVerifying: false
  });
  const [otpCode, setOtpCode] = useState('');
  
  // Form data - hybrid phone + password system
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
  const { t } = useTranslation();

  const iraqiGovernorates = [
    'بغداد', 'نينوى', 'البصرة', 'صلاح الدين', 'دهوك', 'أربيل', 'السليمانية', 
    'ديالى', 'كركوك', 'الأنبار', 'بابل', 'النجف', 'كربلاء', 'واسط', 'ذي قار', 
    'المثنى', 'القادسية', 'ميسان'
  ];

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      // Phone validation for both login and signup
      if (!formData.phone.match(/^07\d{9}$/)) {
        newErrors.phone = 'رقم الموبايل يجب أن يبدأ ب 07 ويحتوي على 11 رقم';
      }
      
      // Password validation for both login and signup
      if (formData.password.length < 6) {
        newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      }

      if (mode === 'signup') {
        if (!formData.fullName.trim()) {
          newErrors.fullName = 'الاسم الكامل مطلوب';
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
        }
      }
    } else if (stepNumber === 2 && mode === 'signup' && otpState.isOTPSent) {
      // OTP validation for signup only
      if (!otpCode || otpCode.length !== 6) {
        newErrors.otp = 'رمز التحقق يجب أن يكون 6 أرقام';
      }
    } else if (stepNumber === 3 && mode === 'signup') {
      // Address validation for signup only
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
        // Send OTP for signup
        await sendOTP();
      } else if (step === 2 && otpState.isOTPSent) {
        // Verify OTP and move to address step
        await verifyOTP();
      } else if (step === 3) {
        // Complete signup with address
        await handleSubmit();
      }
    }
  };

  const sendOTP = async () => {
    setIsSubmitting(true);
    try {
      const phoneNumber = `+964${formData.phone.substring(1)}`; // Convert 07XXXXXXXXX to +9647XXXXXXXXX
      console.log('Sending OTP to:', phoneNumber);
      
      const confirmationResult = mode === 'login' 
        ? await loginWithPhoneOTP(phoneNumber)
        : await registerWithPhoneOTP(phoneNumber, formData.fullName);
      
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
      onClose();
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
      
      setStep(3); // Move to address step for signup
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
        
        // Show welcome message
        setTimeout(() => {
          alert('اهلا وسهلا بك في تطبيق باكيتي للتوصيل السريع تم انشاء حسابك بنجاح');
          onClose();
        }, 1000);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      password: '',
      confirmPassword: '',
      governorate: '',
      district: '',
      landmark: ''
    });
    setErrors({});
    setStep(1);
    setOtpState({
      confirmationResult: null,
      phoneNumber: '',
      isOTPSent: false,
      isVerifying: false
    });
    setOtpCode('');
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {step > 1 && mode === 'signup' && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {mode === 'signup' && (
              <div className="mt-4 flex items-center space-x-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      s <= step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            )}
            
            {mode === 'login' && (
              <div className="mt-4 flex items-center space-x-2">
                <div className="h-2 flex-1 rounded-full bg-green-500" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step 1: Phone & Password */}
            {step === 1 && (
              <div className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <Label htmlFor="fullName">الاسم الكامل</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className={errors.fullName ? 'border-red-500' : ''}
                      dir="rtl"
                      placeholder="اكتب اسمك الكامل"
                    />
                    {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                  </div>
                )}

                <div>
                  <Label htmlFor="phone">رقم الموبايل</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className={errors.phone ? 'border-red-500' : ''}
                    dir="ltr"
                    placeholder="07000000000"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className={errors.password ? 'border-red-500' : ''}
                    dir="ltr"
                    placeholder="ادخل كلمة المرور"
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                {mode === 'signup' && (
                  <div>
                    <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className={errors.confirmPassword ? 'border-red-500' : ''}
                      dir="ltr"
                      placeholder="أعد كتابة كلمة المرور"
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                  </div>
                )}

                {mode === 'signup' && !otpState.isOTPSent && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      📱 سنرسل لك رمز التحقق عبر رسالة نصية لتأكيد رقم الهاتف
                    </p>
                  </div>
                )}

                {mode === 'signup' && otpState.isOTPSent && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      ✅ تم إرسال رمز التحقق إلى {otpState.phoneNumber}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: OTP Verification (Signup only) */}
            {step === 2 && mode === 'signup' && otpState.isOTPSent && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">تأكيد رقم الهاتف</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    أدخل رمز التحقق المرسل إلى {otpState.phoneNumber}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="otp">رمز التحقق</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className={errors.otp ? 'border-red-500 text-center text-lg tracking-widest' : 'text-center text-lg tracking-widest'}
                    placeholder="123456"
                    maxLength={6}
                    dir="ltr"
                  />
                  {errors.otp && <p className="text-red-500 text-sm mt-1">{errors.otp}</p>}
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    ⏱️ لم تستلم الرمز؟ تحقق من رسائل SMS أو انتظر دقيقة وأعد المحاولة
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Address (Signup only) */}
            {step === 3 && mode === 'signup' && (
              <div className="space-y-4">
                <div>
                  <select
                    value={formData.governorate}
                    onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-right"
                  >
                    <option value="">اختر المحافظة</option>
                    {iraqiGovernorates.map((gov) => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                  {errors.governorate && <p className="text-red-500 text-sm mt-1">{errors.governorate}</p>}
                </div>

                <div>
                  <Input
                    type="text"
                    placeholder="المنطقة"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="text-right"
                  />
                  {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district}</p>}
                </div>

                <div>
                  <Input
                    type="text"
                    placeholder="أقرب نقطة دالة"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    className="text-right"
                  />
                  {errors.landmark && <p className="text-red-500 text-sm mt-1">{errors.landmark}</p>}
                </div>
              </div>
            )}

            {/* Errors */}
            {authError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm text-center">{authError}</p>
              </div>
            )}

            {errors.submit && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm text-center">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 space-y-3">
              <Button
                onClick={mode === 'login' || step === 3 ? handleSubmit : handleNext}
                disabled={isSubmitting}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري المعالجة...</span>
                  </div>
                ) : mode === 'login' ? (
                  'تسجيل الدخول'
                ) : step === 3 ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Check className="w-4 h-4" />
                    <span>إنشاء الحساب</span>
                  </div>
                ) : (
                  'التالي'
                )}
              </Button>

              <div className="text-center">
                <button
                  onClick={switchMode}
                  className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-medium"
                >
                  {mode === 'login' ? 'انشاء حساب' : 'لديك حساب؟ تسجيل الدخول'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}