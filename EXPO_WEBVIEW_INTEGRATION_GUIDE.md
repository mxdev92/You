# PAKETY React Native WebView Integration Guide

## Overview
The PAKETY driver interface is designed to run in an Expo React Native WebView with seamless communication for native notifications. The web app automatically detects when running in React Native and sends notification data to the native app instead of using web-based notifications.

## WebView Communication System

### Message Format
The WebView sends structured JSON messages to React Native for order notifications:

```typescript
interface NotificationMessage {
  type: 'NEW_ORDER_NOTIFICATION' | 'TEST_NOTIFICATION';
  payload: {
    orderId: number;
    customerName: string;
    customerPhone: string;
    totalAmount: string;
    address: string;
    items: Array<{
      id: number;
      name: string;
      quantity: number;
      price: number;
      total: string;
    }>;
    timestamp: number;
  };
}
```

### Communication Methods
The WebView uses multiple communication methods for maximum compatibility:

1. **Standard React Native WebView**: `window.ReactNativeWebView.postMessage()`
2. **iOS WebKit**: `window.webkit.messageHandlers.ReactNativeWebView.postMessage()`
3. **Custom Android Bridge**: `window.ReactNativeWebViewBridge.postMessage()`

## React Native Implementation

### 1. WebView Setup
```jsx
import { WebView } from 'react-native-webview';

export default function DriverScreen() {
  const handleWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'NEW_ORDER_NOTIFICATION' || message.type === 'TEST_NOTIFICATION') {
        handleOrderNotification(message.payload);
      }
    } catch (error) {
      console.error('Failed to parse WebView message:', error);
    }
  };

  return (
    <WebView
      source={{ uri: 'https://pakety.delivery/driver' }}
      javaScriptEnabled={true}
      onMessage={handleWebViewMessage}
      style={{ flex: 1 }}
    />
  );
}
```

### 2. Native Notification Handler
```jsx
import { Vibration, Alert } from 'react-native';
import { Audio } from 'expo-av';

const handleOrderNotification = async (orderData) => {
  // Play beautiful notification sound
  await playNotificationSound();
  
  // Trigger elegant vibration pattern
  Vibration.vibrate([300, 100, 200, 100, 200]); // First harmonic
  setTimeout(() => {
    Vibration.vibrate([150, 50, 150]); // Second harmonic
  }, 400);
  
  // Show native alert
  Alert.alert(
    '🚨 طلب جديد - PAKETY',
    `👤 العميل: ${orderData.customerName}\n💰 المبلغ: ${orderData.totalAmount} د.ع\n📍 ${orderData.address}\n\n⚡ يرجى الرد بسرعة!`,
    [
      { text: 'قبول', onPress: () => acceptOrder(orderData.orderId) },
      { text: 'رفض', onPress: () => declineOrder(orderData.orderId) }
    ]
  );
};
```

### 3. Audio Implementation
```jsx
import { Audio } from 'expo-av';

const playNotificationSound = async () => {
  try {
    // Load and play elegant notification sound
    const { sound } = await Audio.Sound.createAsync(
      require('./assets/notification-sound.mp3')
    );
    
    await sound.playAsync();
    
    // Unload after playing
    setTimeout(() => {
      sound.unloadAsync();
    }, 3000);
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
};
```

## WebView Detection
The web app automatically detects React Native WebView environment using:

```javascript
const isReactNativeWebView = () => {
  return (window as any).ReactNativeWebView !== undefined || 
         (window as any).webkit?.messageHandlers?.ReactNativeWebView !== undefined ||
         navigator.userAgent.includes('ReactNative');
};
```

When running in WebView:
- ✅ Sends notification data to React Native
- ❌ Disables web audio/vibration
- ❌ Disables browser notifications
- ✅ Shows visual UI updates only

## Testing System

### Web Test Button
The green "🎵 تجربة" button automatically adapts:
- **In WebView**: Sends test notification to React Native
- **In Browser**: Plays web audio and vibration

### Test Notification Data
```json
{
  "type": "TEST_NOTIFICATION",
  "payload": {
    "orderId": 999,
    "customerName": "اختبار العميل",
    "customerPhone": "07512345678",
    "totalAmount": "4,500",
    "address": "بغداد - الكرادة",
    "items": [{"id": 1, "name": "خيار", "quantity": 2, "price": 1000, "total": "2,000"}],
    "timestamp": 1753807123456
  }
}
```

## Integration Checklist

### React Native App Setup
- [ ] Install `react-native-webview`
- [ ] Install `expo-av` for audio
- [ ] Add WebView message handler
- [ ] Implement native notification function
- [ ] Add audio assets
- [ ] Test communication

### WebView Configuration
- [ ] Enable JavaScript
- [ ] Set message handler
- [ ] Configure proper URI
- [ ] Test cross-platform compatibility

### Testing
- [ ] Test notification reception
- [ ] Test audio playback
- [ ] Test vibration patterns
- [ ] Test both iOS and Android
- [ ] Verify message parsing

## Production Notes

- The WebView URL should be: `https://pakety.delivery/driver`
- Authentication is handled within the WebView (test@pakety.com / driver123)
- All real-time WebSocket connections work normally within WebView
- The system is fully production-ready with comprehensive error handling

## Error Handling

The system includes fallback mechanisms:
1. If React Native communication fails, web notifications are used
2. Console logging provides debugging information
3. Multiple communication methods ensure compatibility
4. Graceful degradation for unsupported features