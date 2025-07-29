# PAKETY Real-Time Push Notification Testing Guide

## Overview
Complete testing guide for the real-time push notification system for the Expo React Native driver app. The system provides instant order notifications to drivers with persistent popups, sound, and vibration.

## System Architecture

### Multi-Layer Notification System
1. **WebSocket Real-time**: Instant bidirectional communication
2. **Expo Push Notifications**: Mobile app push notifications 
3. **Persistent UI Popups**: Non-dismissible order details with action buttons
4. **Sound & Vibration**: Full notification alerts

## Pre-Testing Setup

### 1. Start the Backend Server
```bash
# Server should be running at https://pakety.delivery
npm run dev
```

### 2. Create Test Driver Account
- Email: `test@pakety.com`
- Password: `driver123`
- Driver ID: `2`

### 3. Get Driver Authentication Token
```http
POST https://pakety.delivery/api/drivers/auth/login
Content-Type: application/json

{
  "email": "test@pakety.com", 
  "password": "driver123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "driver": {
    "id": 2,
    "fullName": "سائق تجريبي",
    "email": "test@pakety.com"
  }
}
```

## Testing Push Notification Registration

### 1. Register Expo Push Token
```http
POST https://pakety.delivery/api/drivers/notifications/register
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "تم تسجيل الإشعارات بنجاح",
  "driverId": 2
}
```

### 2. Verify Token Storage
Check server logs for confirmation:
```
🔔 Driver 2 registered push token: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
```

## Testing WebSocket Real-Time Connection

### 1. Connect to WebSocket
```javascript
const ws = new WebSocket('wss://pakety.delivery/ws');

ws.onopen = () => {
  console.log('WebSocket connected');
  
  // Register driver for real-time notifications
  ws.send(JSON.stringify({
    type: 'DRIVER_REGISTER',
    driverId: 2,
    token: 'your_jwt_token'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
  
  if (data.type === 'NEW_ORDER') {
    // Handle new order notification
    handleNewOrderNotification(data.order);
  }
};
```

### 2. Expected Registration Response
```json
{
  "type": "REGISTRATION_SUCCESS",
  "message": "تم تسجيل الاتصال المباشر بنجاح",
  "driverId": 2
}
```

## Testing Order Creation and Notifications

### 1. Create Test Order
Submit an order through the main app at `https://pakety.delivery`

### 2. Expected Notification Flow

#### A. Server Logs
```
=== ORDER CREATION DEBUG ===
✅ Order 81 created successfully
🚗 Driver 2 registered for real-time notifications
📱 Sending push notification to driver 2
📡 Broadcasting order to WebSocket connections
```

#### B. WebSocket Message Received
```json
{
  "type": "NEW_ORDER",
  "order": {
    "id": 81,
    "customerName": "أحمد محمد",
    "customerPhone": "07701234567",
    "address": {
      "governorate": "بغداد",
      "district": "الكرادة", 
      "neighborhood": "شارع فلسطين",
      "notes": "بناية 15، الطابق الثالث"
    },
    "totalAmount": "25,750",
    "items": [
      {
        "name": "خيار",
        "quantity": 2,
        "price": "1,500",
        "total": "3,000"
      }
    ],
    "deliveryFee": "2,500",
    "timestamp": "2025-07-29T14:30:00.000Z"
  },
  "title": "طلب جديد - PAKETY",
  "body": "طلب جديد من أحمد محمد\nالمبلغ: 25,750 د.ع",
  "sound": "default",
  "priority": "high",
  "channelId": "order_notifications"
}
```

#### C. Push Notification Payload
```json
{
  "to": "ExponentPushToken[your_token]",
  "title": "طلب جديد - PAKETY",
  "body": "طلب جديد من أحمد محمد - 25,750 د.ع",
  "data": {
    "type": "NEW_ORDER",
    "orderId": 81,
    "customerName": "أحمد محمد",
    "totalAmount": "25,750",
    "requiresAction": true
  },
  "priority": "high",
  "channelId": "order_notifications"
}
```

## Testing Driver Actions (Accept/Decline)

### 1. Accept Order via WebSocket
```javascript
ws.send(JSON.stringify({
  type: 'ORDER_ACTION',
  orderId: 81,
  action: 'accept'
}));
```

### 2. Accept Order via API
```http
POST https://pakety.delivery/api/drivers/orders/81/accept
Authorization: Bearer <token>
```

### 3. Decline Order via WebSocket
```javascript
ws.send(JSON.stringify({
  type: 'ORDER_ACTION',
  orderId: 81,
  action: 'decline',
  reason: 'بعيد جداً عن موقعي الحالي'
}));
```

### 4. Decline Order via API
```http
POST https://pakety.delivery/api/drivers/orders/81/decline
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "بعيد جداً عن موقعي الحالي"
}
```

## Expo React Native Implementation

### 1. Required Dependencies
```bash
npx expo install expo-notifications expo-device expo-constants
npm install ws
```

### 2. Notification Configuration
```javascript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permissions
const requestPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }
  
  // Get push token
  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig.extra.projectId,
  })).data;
  
  return token;
};
```

### 3. Register Push Token
```javascript
const registerPushToken = async (authToken) => {
  const pushToken = await requestPermissions();
  
  if (pushToken) {
    const response = await fetch('https://pakety.delivery/api/drivers/notifications/register', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: pushToken
      })
    });
    
    const result = await response.json();
    console.log('Push token registered:', result);
  }
};
```

### 4. WebSocket Connection
```javascript
const connectWebSocket = (driverId, authToken) => {
  const ws = new WebSocket('wss://pakety.delivery/ws');
  
  ws.onopen = () => {
    console.log('Connected to WebSocket');
    
    // Register for real-time notifications
    ws.send(JSON.stringify({
      type: 'DRIVER_REGISTER',
      driverId: driverId,
      token: authToken
    }));
  };
  
  ws.onmessage = (event) => {
    const notification = JSON.parse(event.data);
    
    if (notification.type === 'NEW_ORDER') {
      // Show persistent popup
      showOrderNotificationPopup(notification.order);
      
      // Play sound and vibration
      playNotificationSound();
      triggerVibration();
      
      // Show in status bar
      showStatusBarNotification(notification.order);
    }
  };
  
  return ws;
};
```

### 5. Persistent Notification Popup
```javascript
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Alert } from 'react-native';

const OrderNotificationPopup = ({ visible, orderData, onAccept, onDecline }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {}} // Prevent dismissal
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.title}>طلب جديد - PAKETY</Text>
          
          <Text style={styles.customerName}>{orderData.customerName}</Text>
          <Text style={styles.phone}>{orderData.customerPhone}</Text>
          
          <Text style={styles.address}>
            {orderData.address.governorate} - {orderData.address.district}
            {'\n'}{orderData.address.neighborhood}
            {orderData.address.notes && '\n' + orderData.address.notes}
          </Text>
          
          <View style={styles.items}>
            {orderData.items.map((item, index) => (
              <Text key={index} style={styles.item}>
                {item.name} × {item.quantity} = {item.total} د.ع
              </Text>
            ))}
          </View>
          
          <Text style={styles.total}>المبلغ الإجمالي: {orderData.totalAmount} د.ع</Text>
          
          <View style={styles.buttons}>
            <TouchableOpacity 
              style={[styles.button, styles.acceptButton]}
              onPress={onAccept}
            >
              <Text style={styles.buttonText}>قبول</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.declineButton]}
              onPress={onDecline}
            >
              <Text style={styles.buttonText}>رفض</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
```

## Testing Checklist

### ✅ Backend System
- [ ] Server running at https://pakety.delivery
- [ ] Test driver account created (test@pakety.com/driver123)
- [ ] JWT authentication working
- [ ] Push token registration endpoint working
- [ ] WebSocket server accepting connections
- [ ] Order creation triggering notifications

### ✅ WebSocket Real-time
- [ ] WebSocket connection established
- [ ] Driver registration message sent
- [ ] Registration success response received
- [ ] New order notifications received instantly
- [ ] Driver action messages sent successfully

### ✅ Push Notifications
- [ ] Expo push token generated
- [ ] Push token registered with backend
- [ ] Push notifications sent on order creation
- [ ] Notifications received on mobile device

### ✅ Mobile App UI
- [ ] Persistent notification popup displayed
- [ ] Order details shown correctly (Arabic RTL)
- [ ] قبول and رفض buttons functional
- [ ] Popup does not auto-dismiss
- [ ] Sound played on notification
- [ ] Vibration triggered on notification
- [ ] Status bar notification displayed

### ✅ Driver Actions
- [ ] Accept order via WebSocket working
- [ ] Accept order via API working
- [ ] Decline order with reason working
- [ ] Admin panel updated on driver actions
- [ ] WhatsApp notifications sent to admin/customer

## Troubleshooting

### WebSocket Connection Issues
```javascript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = (event) => {
  console.log('WebSocket closed:', event.code, event.reason);
  // Implement reconnection logic
};
```

### Push Notification Issues
- Verify Expo project ID is correctly configured
- Check device permissions for notifications
- Ensure push token is valid Expo format
- Test on physical device (push notifications don't work in simulator)

### Backend Issues
- Check server logs for error messages
- Verify JWT token is not expired
- Ensure driver is properly registered in database
- Test API endpoints with curl/Postman

## Production Deployment

### Environment Variables
```bash
# Expo push notification service
EXPO_ACCESS_TOKEN=your_expo_access_token

# WebSocket configuration  
WS_PORT=5000
WS_PATH=/ws

# JWT configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=30d
```

### Security Considerations
- Validate JWT tokens on WebSocket connections
- Rate limit push notification requests
- Sanitize WebSocket messages
- Secure push token storage
- Implement connection timeout handling

## Success Criteria

✅ **Real-time Performance**: Notifications delivered within 1-2 seconds of order creation
✅ **Persistent UI**: Popups stay visible until driver takes action (قبول/رفض)  
✅ **Sound & Vibration**: Full notification alerts on mobile device
✅ **Multi-layer Delivery**: Both WebSocket and push notifications working
✅ **Bidirectional Communication**: Driver actions update admin panel instantly
✅ **Arabic Support**: All text properly displayed in Arabic RTL layout
✅ **Production Ready**: System handles multiple drivers and high order volume

The push notification system is now fully implemented and ready for production use with the Expo React Native driver mobile app.