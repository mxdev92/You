# PAKETY Driver App - باكيتي السواق

Professional React Native mobile application for PAKETY delivery drivers in Iraq.

## Features

### ✅ Phase 1 - Authentication (Completed)
- **Professional Login System**: Secure authentication with JWT tokens
- **Arabic UI Support**: Complete RTL layout with professional Arabic text
- **Secure Token Storage**: Using Expo SecureStore for production-level security
- **Remember Me Function**: Optional credential saving for user convenience
- **Error Handling**: Comprehensive error messages in Arabic
- **Auto-logout**: Automatic session management and token validation

### 🚧 Phase 2 - Order Management (Coming Soon)
- Real-time order notifications
- Accept/Decline order functionality
- Order details and customer information
- GPS navigation integration
- Delivery status updates

### 🚧 Phase 3 - Advanced Features (Future)
- Real-time location tracking
- Earnings dashboard
- Customer communication
- Performance analytics
- Push notifications

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Expo CLI: `npm install -g @expo/cli`
- Physical device or emulator

### Installation

1. **Clone and Setup**
```bash
cd driver-app
npm install
```

2. **Configure API**
Update `src/constants/config.js`:
```javascript
export const API_BASE_URL = 'https://your-pakety-domain.com/api';
```

3. **Run Development**
```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS  
npm run ios
```

## API Integration

### Authentication Endpoint
- **URL**: `/api/drivers/auth/login`
- **Method**: POST
- **Headers**: `Content-Type: application/json`

### Request Format
```json
{
  "email": "driver@pakety.com",
  "password": "password123"
}
```

### Response Format
```json
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
```

## Testing

### Test Driver Account
Use the admin panel to create a test driver account:
- Login to admin panel: `https://your-domain.com/admin`
- Navigate to "السواق" (Drivers) tab
- Add new driver with test credentials

### Example Test Data
```
Email: test@pakety.com
Password: driver123
Full Name: سائق تجريبي
Phone: 07712345678
```

## Architecture

### Project Structure
```
driver-app/
├── App.js                 # Main app navigation
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js      # Authentication screen
│   │   └── DashboardScreen.js  # Main driver dashboard
│   ├── services/
│   │   └── api.js              # API communication
│   ├── constants/
│   │   └── config.js           # App configuration
│   └── utils/
│       └── storage.js          # Secure storage helpers
└── package.json
```

### Security Features
- **JWT Authentication**: 30-day token expiration
- **Secure Storage**: Expo SecureStore for sensitive data
- **Token Validation**: Automatic verification on app launch
- **Session Management**: Proper logout and cleanup

## Deployment

### Development Build
```bash
npx expo run:android  # Android
npx expo run:ios      # iOS
```

### Production Build
```bash
eas build --platform android  # Android APK/AAB
eas build --platform ios      # iOS IPA
```

## Support

- **Technical Support**: 07511856947
- **Admin Panel**: Available at `/admin` route
- **API Documentation**: See `EXPO_DRIVER_APP_GUIDE.md`

## License

MIT License - PAKETY Team 2025