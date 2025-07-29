# PAKETY Driver App - Expo React Native Guide

## Overview
Professional driver mobile app built with Expo React Native, connecting to PAKETY webapp's driver authentication API for seamless order management and delivery coordination.

## 1. Login Authentication System

### API Endpoint
- **URL**: `https://your-domain.com/api/drivers/auth/login`
- **Method**: POST
- **Content-Type**: application/json

### Request Body
```json
{
  "email": "driver@example.com",
  "password": "password123"
}
```

### Response Format
```json
// Success (200)
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "driver": {
    "id": 1,
    "fullName": "علي أحمد",
    "email": "ali@pakety.com",
    "phone": "07715780083",
    "isActive": true,
    "createdAt": "2025-01-15T10:30:00Z"
  }
}

// Error (401)
{
  "success": false,
  "message": "كلمة المرور غير صحيحة"
}
```

## 2. Required Expo Dependencies

```bash
npx expo install @expo/vector-icons
npx expo install expo-secure-store
npx expo install expo-status-bar
npm install @react-navigation/native
npm install @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context
npm install react-native-paper
```

## 3. Project Structure

```
drivers-app/
├── App.js
├── src/
│   ├── components/
│   │   └── LoginForm.js
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   └── DashboardScreen.js
│   ├── services/
│   │   └── api.js
│   ├── utils/
│   │   └── storage.js
│   └── constants/
│       └── config.js
```

## 4. Implementation Steps

### Step 1: Setup Authentication Service
- Create API service with login endpoint
- Implement secure token storage using Expo SecureStore
- Handle authentication states

### Step 2: Build Login Screen
- Professional Arabic UI with RTL support
- Email and password validation
- Loading states and error handling
- PAKETY branding integration

### Step 3: Authentication Flow
- Automatic token validation on app launch
- Secure session management
- Logout functionality

## 5. Key Features

### Login Screen Features
- ✅ Arabic language support with RTL layout
- ✅ Professional PAKETY branding
- ✅ Email/password validation
- ✅ Secure token storage
- ✅ Loading states and error messages
- ✅ Remember login option
- ✅ Responsive design for all screen sizes

### Security Features
- ✅ JWT token authentication
- ✅ Secure storage with Expo SecureStore
- ✅ Automatic token expiration handling
- ✅ API error handling with user-friendly messages

## 6. Configuration

### API Base URL
Update the base URL in `src/constants/config.js`:
```javascript
export const API_BASE_URL = 'https://your-pakety-domain.com/api';
```

### Authentication Headers
All authenticated requests include:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## 7. Next Steps

1. **Orders Management**: Fetch and display assigned delivery orders
2. **Accept/Decline**: Implement order acceptance and decline functionality  
3. **Real-time Updates**: WebSocket integration for instant order notifications
4. **GPS Tracking**: Location services for delivery tracking
5. **Status Updates**: Order status management during delivery

## 8. Testing

### Test Driver Credentials
- Email: `test@pakety.com`
- Password: `driver123`

### API Testing
Use tools like Postman to test the authentication endpoint before implementing the mobile app.

## 9. Deployment

### Development Build
```bash
npx expo run:android
npx expo run:ios
```

### Production Build
```bash
eas build --platform all
```

This guide provides the foundation for building a professional driver app that integrates seamlessly with the PAKETY webapp's authentication system.