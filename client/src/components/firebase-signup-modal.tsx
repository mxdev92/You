import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { useFirebaseAddresses } from '@/hooks/use-firebase-addresses';
import { useTranslation } from '@/hooks/use-translation';

interface FirebaseSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export default function FirebaseSignupModal({ isOpen, onClose, initialMode = 'login' }: FirebaseSignupModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    governorate: '',
    district: '',
    landmark: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register, error: authError } = useFirebaseAuth();
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
      if (!formData.email.includes('@')) {
        newErrors.email = 'البريد الإلكتروني غير صحيح';
      }
      if (formData.password.length < 6) {
        newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      }
      if (mode === 'signup' && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
      }
    } else if (stepNumber === 2 && mode === 'signup') {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'الاسم الكامل مطلوب';
      }
      if (!formData.phone.match(/^07\d{9}$/)) {
        newErrors.phone = 'رقم الموبايل يجب أن يبدأ ب 07 ويحتوي على 11 رقم';
      }
    } else if (stepNumber === 3 && mode === 'signup') {
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

  const handleNext = () => {
    if (validateStep(step)) {
      if (mode === 'login') {
        handleSubmit();
      } else {
        setStep(step + 1);
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
        console.log('Firebase login successful');
        onClose();
      } else {
        // Complete signup process
        const user = await register(formData.email, formData.password, formData.fullName, formData.phone);
        
        // Add address after successful registration using actual user
        if (user) {
          await addAddress(user.uid, {
            governorate: formData.governorate,
            district: formData.district,
            landmark: formData.landmark,
            fullAddress: `${formData.governorate} - ${formData.district} - ${formData.landmark}`,
            isDefault: true
          });
        }

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
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      phone: '',
      governorate: '',
      district: '',
      landmark: ''
    });
    setErrors({});
    setStep(1);
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
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step 1: Email & Password */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="البريد الإلكتروني"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="text-right"
                    dir="ltr"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="كلمة المرور"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="text-right pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                {mode === 'signup' && (
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="تأكيد كلمة المرور"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="text-right pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Personal Info (Signup only) */}
            {step === 2 && mode === 'signup' && (
              <div className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="الاسم الكامل"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="text-right"
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <Input
                    type="tel"
                    placeholder="07000000000"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 11) {
                        setFormData({ ...formData, phone: value });
                      }
                    }}
                    className="text-left font-mono"
                    dir="ltr"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
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