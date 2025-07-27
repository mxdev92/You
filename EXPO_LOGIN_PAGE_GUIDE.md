# 📱 PAKETY Driver Login Page - Expo React Native Guide

## 🎯 Project Overview
Build a professional Arabic login page for PAKETY delivery drivers using Expo React Native with authentication via web API.

## 🔗 API Integration Details

### Production API Base URL
```
https://6b59b381-e4d0-4c17-a9f1-1df7a6597619-00-3rkq1ca0174q0.riker.replit.dev
```

### Required API Endpoints

#### 1. Driver Login (Main)
- **Endpoint**: `POST /api/driver/login`
- **Purpose**: Authenticate driver and create session
- **Request Body**:
```json
{
  "deliveryId": "1",
  "password": "123456"
}
```
- **Success Response (200)**:
```json
{
  "driver": {
    "id": 1,
    "email": "Pd@test.com",
    "fullName": "Driver Test Account",
    "phone": "07710155333",
    "vehicleType": "motorcycle",
    "isActive": true,
    "isOnline": false
  },
  "message": "Welcome back, Driver Test Account! Your delivery ID is 1"
}
```
- **Error Response (401)**:
```json
{
  "message": "Invalid credentials"
}
```

#### 2. Driver Test Login (Debug)
- **Endpoint**: `POST /api/driver/test-login`
- **Purpose**: Test connectivity and credentials without session creation
- **Request Body**: Same as main login
- **Response**: Same structure with success/error indication

#### 3. Driver Session Check
- **Endpoint**: `GET /api/driver/session`
- **Purpose**: Verify if driver is still logged in
- **Headers**: Include session cookies
- **Success Response**: Driver object
- **Error Response**: 401 Not authenticated

### Test Account Credentials
```
Delivery ID: 1
Password: 123456
Driver Name: Driver Test Account
Phone: 07710155333
Vehicle: motorcycle
```

## 📦 Required Dependencies

### Core Dependencies
```bash
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install react-native-vector-icons
```

### For Expo
```bash
expo install expo-font expo-splash-screen
expo install expo-status-bar expo-constants
```

## 🎨 Professional Login Page Design

### 1. Create AuthService (services/AuthService.js)
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://6b59b381-e4d0-4c17-a9f1-1df7a6597619-00-3rkq1ca0174q0.riker.replit.dev';

export class AuthService {
  
  // Test API connectivity first
  static async testConnection(deliveryId, password) {
    try {
      console.log('🧪 Testing API connection...');
      
      const response = await fetch(`${API_BASE}/api/driver/test-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deliveryId: deliveryId.toString(),
          password
        }),
        timeout: 10000 // 10 second timeout
      });

      const data = await response.json();
      console.log('🧪 Connection test:', response.status, data);

      return {
        success: response.ok,
        status: response.status,
        data
      };
      
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return {
        success: false,
        error: error.message || 'Network connection failed'
      };
    }
  }

  // Main login function
  static async loginDriver(deliveryId, password) {
    try {
      console.log('🔐 Attempting driver login...', deliveryId);
      
      const response = await fetch(`${API_BASE}/api/driver/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deliveryId: deliveryId.toString(),
          password
        }),
        credentials: 'include', // Important for session cookies
        timeout: 15000 // 15 second timeout
      });

      const data = await response.json();
      console.log('📱 Login response:', response.status, data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store driver data locally for offline access
      await AsyncStorage.setItem('driver_session', JSON.stringify(data.driver));
      await AsyncStorage.setItem('driver_id', deliveryId.toString());
      await AsyncStorage.setItem('login_time', new Date().toISOString());
      
      return {
        success: true,
        driver: data.driver,
        message: data.message
      };
      
    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        error: error.message || 'Network error - check your internet connection'
      };
    }
  }

  // Get stored driver session
  static async getStoredDriver() {
    try {
      const driverSession = await AsyncStorage.getItem('driver_session');
      return driverSession ? JSON.parse(driverSession) : null;
    } catch (error) {
      console.error('Error getting stored driver:', error);
      return null;
    }
  }

  // Check if driver is logged in
  static async isLoggedIn() {
    const driver = await this.getStoredDriver();
    return !!driver;
  }

  // Clear stored session
  static async clearSession() {
    try {
      await AsyncStorage.multiRemove(['driver_session', 'driver_id', 'login_time']);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }
}
```

### 2. Professional Login Screen (screens/LoginScreen.js)
```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthService } from '../services/AuthService';

export default function LoginScreen({ navigation }) {
  const [deliveryId, setDeliveryId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);

  // Check if already logged in
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    const isLoggedIn = await AuthService.isLoggedIn();
    if (isLoggedIn) {
      navigation.replace('Dashboard');
    }
  };

  const validateInputs = () => {
    if (!deliveryId.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال رقم التوصيل');
      return false;
    }
    
    if (!password.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال كلمة المرور');
      return false;
    }

    if (isNaN(deliveryId) || parseInt(deliveryId) <= 0) {
      Alert.alert('خطأ', 'رقم التوصيل يجب أن يكون رقم صحيح');
      return false;
    }

    return true;
  };

  const testConnection = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    
    const testResult = await AuthService.testConnection(deliveryId, password);
    
    if (testResult.success) {
      setConnectionTested(true);
      Alert.alert(
        '✅ نجح الاتصال', 
        'تم التحقق من الاتصال بالسيرفر بنجاح\nيمكنك الآن تسجيل الدخول',
        [{ text: 'متابعة', onPress: () => handleLogin() }]
      );
    } else {
      Alert.alert(
        '❌ فشل الاتصال', 
        testResult.error || 'تعذر الاتصال بالسيرفر\nيرجى التحقق من الاتصال بالإنترنت'
      );
    }
    
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    
    const result = await AuthService.loginDriver(deliveryId, password);
    
    if (result.success) {
      Alert.alert(
        '🎉 نجح تسجيل الدخول', 
        `أهلاً وسهلاً ${result.driver.fullName}`,
        [{ 
          text: 'متابعة', 
          onPress: () => navigation.replace('Dashboard') 
        }]
      );
    } else {
      Alert.alert('❌ خطأ في تسجيل الدخول', result.error);
    }
    
    setLoading(false);
  };

  const handleQuickTest = () => {
    setDeliveryId('1');
    setPassword('123456');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Icon name="local-shipping" size={60} color="#FFFFFF" />
            </View>
            <Text style={styles.appTitle}>PAKETY Driver</Text>
            <Text style={styles.subtitle}>تطبيق السائقين</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>تسجيل الدخول</Text>
            
            {/* Delivery ID Input */}
            <View style={styles.inputContainer}>
              <Icon name="badge" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="رقم التوصيل (Delivery ID)"
                placeholderTextColor="#999"
                value={deliveryId}
                onChangeText={setDeliveryId}
                keyboardType="numeric"
                textAlign="right"
                maxLength={10}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="كلمة المرور"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textAlign="right"
                maxLength={50}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Icon 
                  name={showPassword ? "visibility" : "visibility-off"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {!connectionTested ? (
                <TouchableOpacity
                  style={[styles.button, styles.testButton]}
                  onPress={testConnection}
                  disabled={loading}
                >
                  <Icon name="wifi" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>
                    {loading ? 'جاري الاختبار...' : 'اختبار الاتصال'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.loginButton]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  <Icon name="login" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>
                    {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Loading Indicator */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#22C55E" />
                <Text style={styles.loadingText}>جاري المعالجة...</Text>
              </View>
            )}

            {/* Test Account Info */}
            <View style={styles.testInfoContainer}>
              <Text style={styles.testInfoTitle}>للاختبار:</Text>
              <TouchableOpacity onPress={handleQuickTest} style={styles.testInfoButton}>
                <Text style={styles.testInfoText}>رقم التوصيل: 1</Text>
                <Text style={styles.testInfoText}>كلمة المرور: 123456</Text>
                <Text style={styles.testInfoHelper}>اضغط هنا للملء التلقائي</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#22C55E',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 15,
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  testButton: {
    backgroundColor: '#3B82F6',
  },
  loginButton: {
    backgroundColor: '#22C55E',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  testInfoContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  testInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  testInfoButton: {
    alignItems: 'center',
  },
  testInfoText: {
    fontSize: 13,
    color: '#374151',
    textAlign: 'center',
  },
  testInfoHelper: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
});
```

### 3. Navigation Setup (App.js)
```javascript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen'; // Create this next

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## 🔧 Implementation Steps

### Step 1: Project Setup
1. Create new Expo project: `expo init PAKETYDriver`
2. Install all required dependencies
3. Set up project structure:
   ```
   src/
   ├── services/
   │   └── AuthService.js
   ├── screens/
   │   ├── LoginScreen.js
   │   └── DashboardScreen.js
   └── components/
   ```

### Step 2: Authentication Service
1. Create `AuthService.js` with API integration
2. Test connection functionality
3. Implement secure login with session storage

### Step 3: Login Screen
1. Create professional Arabic UI
2. Implement form validation
3. Add loading states and error handling
4. Test with provided credentials

### Step 4: Testing Checklist
- [ ] API connectivity test works
- [ ] Login with valid credentials (ID: 1, Password: 123456)
- [ ] Error handling for invalid credentials
- [ ] Session persistence after app restart
- [ ] Proper Arabic text display
- [ ] Loading indicators work correctly

## 🎯 Expected Results
After implementation, you will have:
- Professional Arabic login screen
- Secure API authentication
- Session management
- Error handling
- Test account integration
- Ready for dashboard development

## 🔄 Next Steps
Once login page is complete:
1. Build dashboard screen
2. Add order management
3. Implement notifications
4. Add location services

## 📞 API Support
- Test Account: Delivery ID `1`, Password `123456`
- API Base: Production server running 24/7
- Error Codes: 400 (Bad Request), 401 (Invalid Credentials), 500 (Server Error)