import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { sendOTP, verifyOTP, validatePhoneNumber } from '../services/otpService';
import { APP_CONFIG } from '../constants/config';

const OTPScreen = ({ navigation, route }) => {
  const { phoneNumber, onSuccess } = route.params || {};
  
  const [phone, setPhone] = useState(phoneNumber || '');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isPhoneStep, setIsPhoneStep] = useState(!phoneNumber);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const otpRefs = useRef([]);

  useEffect(() => {
    if (!isPhoneStep && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPhoneStep, timer]);

  const handleSendOTP = async () => {
    if (!validatePhoneNumber(phone)) {
      Alert.alert('خطأ', 'يرجى إدخال رقم موبايل صحيح (07xxxxxxxxx)');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await sendOTP(phone, 'مستخدم جديد');
      
      if (result.success) {
        setIsPhoneStep(false);
        setTimer(60);
        setCanResend(false);
        Alert.alert(
          'تم الإرسال', 
          result.message,
          [{ text: 'موافق' }]
        );
        
        // If OTP is provided (fallback mode), show it
        if (result.otp) {
          Alert.alert(
            'رمز التحقق (وضع التجريب)',
            `الرمز: ${result.otp}`,
            [{ text: 'موافق' }]
          );
        }
      } else {
        Alert.alert('خطأ', result.message);
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إرسال رمز التحقق');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 4) {
      Alert.alert('خطأ', 'يرجى إدخال رمز التحقق كاملاً');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await verifyOTP(phone, otpCode);
      
      if (result.success && result.valid) {
        Alert.alert(
          'تم التحقق',
          'تم التحقق من رقم الهاتف بنجاح',
          [
            {
              text: 'موافق',
              onPress: () => {
                if (onSuccess) {
                  onSuccess(phone);
                } else {
                  navigation.goBack();
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('خطأ', result.message);
        // Clear OTP inputs on error
        setOtp(['', '', '', '']);
        otpRefs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في التحقق من الرمز');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
    
    // Auto-verify when all digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.length === 4) {
      setTimeout(() => handleVerifyOTP(), 500);
    }
  };

  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  if (isPhoneStep) {
    return (
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.title}>تحقق من رقم الهاتف</Text>
          <Text style={styles.subtitle}>
            يرجى إدخال رقم الهاتف لإرسال رمز التحقق عبر الواتساب
          </Text>

          <TextInput
            style={styles.phoneInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="07xxxxxxxxx"
            keyboardType="phone-pad"
            maxLength={11}
            textAlign="center"
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>إرسال رمز التحقق</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>أدخل رمز التحقق</Text>
        <Text style={styles.subtitle}>
          تم إرسال رمز التحقق إلى {phone} عبر الواتساب
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => otpRefs.current[index] = ref}
              style={styles.otpInput}
              value={digit}
              onChangeText={text => handleOtpChange(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleVerifyOTP}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>تحقق</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          {canResend ? (
            <TouchableOpacity onPress={handleSendOTP}>
              <Text style={styles.resendText}>إعادة إرسال الرمز</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>
              إعادة الإرسال خلال {timer} ثانية
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setIsPhoneStep(true)}
        >
          <Text style={styles.backButtonText}>تغيير رقم الهاتف</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_CONFIG.backgroundColor,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP_CONFIG.textColor,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  phoneInput: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: APP_CONFIG.primaryColor,
    borderRadius: 10,
    fontSize: 18,
    marginBottom: 20,
    backgroundColor: 'white',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 30,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: APP_CONFIG.primaryColor,
    borderRadius: 10,
    fontSize: 24,
    fontWeight: 'bold',
    backgroundColor: 'white',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: APP_CONFIG.primaryColor,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendContainer: {
    marginBottom: 20,
  },
  resendText: {
    color: APP_CONFIG.primaryColor,
    fontSize: 16,
    fontWeight: 'bold',
  },
  timerText: {
    color: '#666',
    fontSize: 16,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: APP_CONFIG.primaryColor,
    fontSize: 16,
  },
});

export default OTPScreen;