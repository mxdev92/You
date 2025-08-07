import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, STORAGE_KEYS } from '../constants/config';

// Login API call
export const loginDriver = async (email, password) => {
  try {
    console.log('🚀 Login attempt:', { email, baseUrl: API_BASE_URL });
    
    const response = await fetch(`${API_BASE_URL}/drivers/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        password: password,
      }),
    });

    console.log('📡 Response status:', response.status);
    
    const data = await response.json();
    console.log('📦 Response data:', data);

    if (data.success) {
      // Store token securely
      await SecureStore.setItemAsync(STORAGE_KEYS.DRIVER_TOKEN, data.token);
      await SecureStore.setItemAsync(STORAGE_KEYS.DRIVER_DATA, JSON.stringify(data.driver));
      
      console.log('✅ Login successful, token stored');
      
      return {
        success: true,
        driver: data.driver,
        token: data.token,
      };
    } else {
      console.log('❌ Login failed:', data.message);
      return {
        success: false,
        message: data.message || 'خطأ في تسجيل الدخول',
      };
    }
  } catch (error) {
    console.error('💥 Login API error:', error);
    return {
      success: false,
      message: 'خطأ في الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.',
    };
  }
};

// Verify token validity
export const verifyToken = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/driver/session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (data.success) {
      // Update stored driver data
      await SecureStore.setItemAsync(STORAGE_KEYS.DRIVER_DATA, JSON.stringify(data.driver));
      return true;
    } else {
      // Token invalid, clean up
      await SecureStore.deleteItemAsync(STORAGE_KEYS.DRIVER_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.DRIVER_DATA);
      return false;
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
};

// Get driver profile
export const getDriverProfile = async () => {
  try {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.DRIVER_TOKEN);
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/driver/session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        driver: data.driver,
      };
    } else {
      return {
        success: false,
        message: data.message || 'فشل في جلب بيانات السائق',
      };
    }
  } catch (error) {
    console.error('Get profile error:', error);
    return {
      success: false,
      message: 'خطأ في الاتصال بالخادم',
    };
  }
};

// Logout function
export const logoutDriver = async () => {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.DRIVER_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.DRIVER_DATA);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REMEMBER_LOGIN);
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};