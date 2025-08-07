import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

import { loginDriver } from '../services/api';
import { APP_CONFIG, STORAGE_KEYS } from '../constants/config';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ onLogin, navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await SecureStore.getItemAsync('savedEmail');
      const rememberLogin = await SecureStore.getItemAsync(STORAGE_KEYS.REMEMBER_LOGIN);
      
      if (savedEmail && rememberLogin === 'true') {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (error) {
      console.log('Error loading saved credentials:', error);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);

    try {
      const result = await loginDriver(email, password);

      if (result.success) {
        // Save credentials if remember me is checked
        if (rememberMe) {
          await SecureStore.setItemAsync('savedEmail', email);
          await SecureStore.setItemAsync(STORAGE_KEYS.REMEMBER_LOGIN, 'true');
        } else {
          await SecureStore.deleteItemAsync('savedEmail');
          await SecureStore.deleteItemAsync(STORAGE_KEYS.REMEMBER_LOGIN);
        }

        Alert.alert(
          'نجح تسجيل الدخول',
          `مرحباً ${result.driver.fullName}`,
          [
            {
              text: 'موافق',
              onPress: onLogin,
            },
          ]
        );
      } else {
        Alert.alert('خطأ في تسجيل الدخول', result.message);
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>باكيتي</Text>
            <Text style={styles.subLogoText}>تطبيق السواق</Text>
          </View>
          <Ionicons name="car-sport" size={60} color={APP_CONFIG.primaryColor} />
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>تسجيل الدخول</Text>
          <Text style={styles.subtitle}>أدخل بياناتك للوصول إلى حسابك</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="driver@pakety.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>كلمة المرور</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me */}
          <TouchableOpacity
            style={styles.rememberMeContainer}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={styles.checkbox}>
              {rememberMe && (
                <Ionicons name="checkmark" size={16} color={APP_CONFIG.primaryColor} />
              )}
            </View>
            <Text style={styles.rememberMeText}>تذكر بياناتي</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
                <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            مشاكل في تسجيل الدخول؟ تواصل مع الإدارة
          </Text>
          <TouchableOpacity>
            <Text style={styles.contactText}>07511856947</Text>
          </TouchableOpacity>
          
          {/* OTP Test Button */}
          <TouchableOpacity 
            style={styles.otpTestButton}
            onPress={() => navigation.navigate('OTP')}
          >
            <Text style={styles.otpTestText}>اختبار OTP</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_CONFIG.backgroundColor,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    minHeight: height,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: APP_CONFIG.primaryColor,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  subLogoText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 5,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP_CONFIG.textColor,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_CONFIG.textColor,
    marginBottom: 8,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: APP_CONFIG.textColor,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  passwordToggle: {
    padding: 5,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 30,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: APP_CONFIG.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  rememberMeText: {
    fontSize: 14,
    color: APP_CONFIG.textColor,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  loginButton: {
    backgroundColor: APP_CONFIG.primaryColor,
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: APP_CONFIG.primaryColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  buttonIcon: {
    transform: [{ scaleX: -1 }], // Flip icon for RTL
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  contactText: {
    fontSize: 16,
    color: APP_CONFIG.primaryColor,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  otpTestButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: APP_CONFIG.accentColor,
    borderRadius: 10,
    alignItems: 'center',
  },
  otpTestText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
});