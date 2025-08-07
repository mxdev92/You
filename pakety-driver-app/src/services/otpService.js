import { API_BASE_URL } from '../constants/config';

// Send OTP via WhatsApp
export const sendOTP = async (phoneNumber, fullName = 'مستخدم جديد') => {
  try {
    console.log('📱 Sending OTP to:', phoneNumber);
    console.log('🌐 API URL:', `${API_BASE_URL}/whatsapp/send-otp`);
    
    const response = await fetch(`${API_BASE_URL}/whatsapp/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber.trim(),
        fullName: fullName,
      }),
    });

    console.log('📊 Response status:', response.status);
    const data = await response.json();
    console.log('📋 Response data:', data);

    if (response.ok) {
      return {
        success: true,
        message: data.message || 'تم إرسال رمز التحقق إلى تطبيق الواتساب',
        delivered: data.delivered,
        // For development/fallback mode
        otp: data.otp || null,
      };
    } else {
      return {
        success: false,
        message: data.message || 'فشل في إرسال رمز التحقق',
      };
    }
  } catch (error) {
    console.error('❌ Send OTP error:', error);
    return {
      success: false,
      message: 'خطأ في الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.',
    };
  }
};

// Verify OTP code
export const verifyOTP = async (phoneNumber, otp) => {
  try {
    console.log('🔐 Verifying OTP for:', phoneNumber);
    
    const response = await fetch(`${API_BASE_URL}/whatsapp/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber.trim(),
        otp: otp.trim(),
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        valid: data.valid,
        message: data.message || 'تم التحقق بنجاح',
      };
    } else {
      return {
        success: false,
        message: data.message || 'رمز التحقق غير صحيح',
      };
    }
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    return {
      success: false,
      message: 'خطأ في الاتصال بالخادم',
    };
  }
};

// Format Iraqi phone number (ensure it starts with 07 and is 11 digits)
export const formatPhoneNumber = (phone) => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 964, remove country code
  if (cleaned.startsWith('964')) {
    return '0' + cleaned.slice(3);
  }
  
  // If it doesn't start with 0, add it
  if (!cleaned.startsWith('0')) {
    return '07' + cleaned;
  }
  
  return cleaned;
};

// Validate Iraqi phone number format
export const validatePhoneNumber = (phone) => {
  const cleaned = formatPhoneNumber(phone);
  
  // Must be exactly 11 digits and start with 07
  return cleaned.length === 11 && cleaned.startsWith('07');
};