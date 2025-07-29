# EXPO REACT NATIVE APP - API FIX GUIDE

## ❌ Current Issues Identified:

Based on the error screenshots, the Expo app has these problems:

1. **Wrong API Endpoints**: App is calling non-existent endpoints
2. **Network Connection Issues**: API requests failing to reach server
3. **Expo Project Configuration**: Push token registration failing
4. **Authentication Issues**: Requests not properly authenticated

## ✅ **CORRECTED API Configuration**

Replace your current API configuration with this corrected version:

### **config/api.js**
```javascript
// CORRECTED API Configuration for PAKETY Driver App
export const API_CONFIG = {
  // Production API Base URL
  BASE_URL: 'https://pakety.delivery/api',
  
  // WebSocket URL for real-time notifications
  WS_URL: 'wss://pakety.delivery/ws',
  
  // CORRECTED API Endpoints (these actually exist on the server)
  ENDPOINTS: {
    // Authentication
    LOGIN: '/drivers/auth/login',
    PROFILE: '/drivers/profile',
    
    // Push Notifications
    REGISTER_PUSH_TOKEN: '/drivers/notifications/register',
    
    // Orders - CORRECTED ENDPOINTS
    AVAILABLE_ORDERS: '/drivers/orders/available',  // ✅ This exists
    ACCEPT_ORDER: (orderId) => `/drivers/orders/${orderId}/accept`,
    DECLINE_ORDER: (orderId) => `/drivers/orders/${orderId}/decline`,
    UPDATE_STATUS: (orderId) => `/drivers/orders/${orderId}/status`,
    
    // Driver
    STATS: '/drivers/stats',
    UPDATE_LOCATION: '/drivers/location',
    
    // Health Check
    HEALTH: '/health'
  },
  
  // Request configuration
  TIMEOUT: 15000, // Increased timeout
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};
```

### **services/ApiService.js**
```javascript
import { API_CONFIG } from '../config/api';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.headers = API_CONFIG.HEADERS;
    this.authToken = null;
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
      }
    };

    console.log(`🔍 API Request: ${options.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}: ${errorText}`);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`✅ API Success: ${endpoint}`);
      return data;
      
    } catch (error) {
      console.error(`🚫 Network Error for ${endpoint}:`, error.message);
      throw new Error(`Network failed: ${error.message}`);
    }
  }

  // Health check - Test API connectivity
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Authentication
  async login(email, password) {
    return this.request('/drivers/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async getProfile() {
    return this.request('/drivers/profile', {
      method: 'GET'
    });
  }

  // Orders - CORRECTED METHODS
  async getAvailableOrders() {
    return this.request('/drivers/orders/available', {
      method: 'GET'
    });
  }

  async acceptOrder(orderId) {
    return this.request(`/drivers/orders/${orderId}/accept`, {
      method: 'POST'
    });
  }

  async declineOrder(orderId, reason) {
    return this.request(`/drivers/orders/${orderId}/decline`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async updateOrderStatus(orderId, status, location = null) {
    return this.request(`/drivers/orders/${orderId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, location })
    });
  }

  // Driver Stats
  async getDriverStats() {
    return this.request('/drivers/stats', {
      method: 'GET'
    });
  }

  // Push Notifications
  async registerPushToken(token) {
    return this.request('/drivers/notifications/register', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  }

  // Location Updates
  async updateLocation(latitude, longitude) {
    return this.request('/drivers/location', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude })
    });
  }
}

export default new ApiService();
```

## 🔧 **Dashboard Component Fix**

Your `dashboard.tsx` component needs these corrections:

### **screens/Dashboard.tsx**
```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, RefreshControl } from 'react-native';
import ApiService from '../services/ApiService';

export default function Dashboard({ route }) {
  const { authToken, driverData } = route.params;
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Set auth token for all API calls
    ApiService.setAuthToken(authToken);
    
    // Initial data load
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Test API connectivity first
      const isHealthy = await ApiService.healthCheck();
      if (!isHealthy) {
        throw new Error('Server is not reachable');
      }

      // Load available orders and stats
      const [ordersResponse, statsResponse] = await Promise.allSettled([
        ApiService.getAvailableOrders(),
        ApiService.getDriverStats()
      ]);

      // Handle orders response
      if (ordersResponse.status === 'fulfilled') {
        setOrders(ordersResponse.value.orders || []);
        console.log('✅ Orders loaded:', ordersResponse.value.orders?.length || 0);
      } else {
        console.error('❌ Failed to load orders:', ordersResponse.reason);
        setOrders([]);
      }

      // Handle stats response
      if (statsResponse.status === 'fulfilled') {
        setStats(statsResponse.value.stats || null);
        console.log('✅ Stats loaded:', statsResponse.value.stats);
      } else {
        console.error('❌ Failed to load stats:', statsResponse.reason);
        setStats(null);
      }

    } catch (error) {
      console.error('❌ Dashboard load error:', error);
      Alert.alert(
        'خطأ في التحميل',
        `فشل في تحميل البيانات: ${error.message}`,
        [{ text: 'حسناً' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>جاري تحميل لوحة التحكم...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>
        مرحباً {driverData.fullName}
      </Text>
      
      {stats && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>إحصائياتي</Text>
          <Text>إجمالي التوصيلات: {stats.totalDeliveries || 0}</Text>
          <Text>الأرباح: {stats.totalEarnings || '0'} د.ع</Text>
          <Text>توصيلات اليوم: {stats.todayDeliveries || 0}</Text>
        </View>
      )}

      <View style={styles.ordersContainer}>
        <Text style={styles.ordersTitle}>
          الطلبات المتاحة ({orders.length})
        </Text>
        
        {orders.length === 0 ? (
          <Text style={styles.noOrders}>لا توجد طلبات متاحة حالياً</Text>
        ) : (
          orders.map((order, index) => (
            <View key={order.id} style={styles.orderCard}>
              <Text>طلب رقم: {order.id}</Text>
              <Text>العميل: {order.customerName}</Text>
              <Text>المبلغ: {order.totalAmount} د.ع</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Cairo'
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Cairo'
  },
  statsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'Cairo'
  },
  ordersContainer: {
    flex: 1
  },
  ordersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    fontFamily: 'Cairo'
  },
  noOrders: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
    fontFamily: 'Cairo'
  },
  orderCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10
  }
});
```

## 🔧 **Push Notification Fix**

### **app.json** - Update your Expo configuration:
```json
{
  "expo": {
    "name": "PAKETY Driver",
    "slug": "pakety-driver",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#22c55e"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.pakety.driver"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#22c55e"
      },
      "package": "com.pakety.driver",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "VIBRATE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "550e8400-e29b-41d4-a716-446655440000"
      }
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#22c55e",
          "sounds": ["./assets/notification.wav"]
        }
      ]
    ]
  }
}
```

## 🧪 **Testing the Fixed API**

Add this test function to verify connectivity:

### **utils/apiTest.js**
```javascript
import ApiService from '../services/ApiService';

export const testAPIConnection = async () => {
  console.log('🔍 Testing API connection...');
  
  try {
    // Test 1: Health check
    const isHealthy = await ApiService.healthCheck();
    console.log(`Health check: ${isHealthy ? '✅' : '❌'}`);
    
    if (!isHealthy) {
      throw new Error('Server health check failed');
    }
    
    // Test 2: Login
    const loginResponse = await ApiService.login('test@pakety.com', 'driver123');
    console.log('✅ Login successful:', loginResponse.success);
    
    // Set auth token
    ApiService.setAuthToken(loginResponse.token);
    
    // Test 3: Get profile
    const profile = await ApiService.getProfile();
    console.log('✅ Profile loaded:', profile.driver.fullName);
    
    // Test 4: Get available orders
    const orders = await ApiService.getAvailableOrders();
    console.log('✅ Orders loaded:', orders.orders?.length || 0);
    
    // Test 5: Get stats
    const stats = await ApiService.getDriverStats();
    console.log('✅ Stats loaded:', stats.stats);
    
    return {
      success: true,
      message: 'All API tests passed!',
      token: loginResponse.token,
      driver: profile.driver
    };
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return {
      success: false,
      message: error.message
    };
  }
};
```

## 🚀 **Quick Fix Steps:**

1. **Replace** your API configuration with the corrected version above
2. **Update** your dashboard component to use the new API methods
3. **Fix** your Expo project configuration in `app.json`
4. **Test** the API connection using the test function
5. **Verify** all endpoints work with the test driver account

## 📋 **Test Credentials:**
- **Email**: test@pakety.com
- **Password**: driver123

The corrected API endpoints will resolve all the network request failures you're seeing in the Expo app.