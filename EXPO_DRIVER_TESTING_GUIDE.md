# PAKETY Driver App - Testing & Setup Guide

## Step 1: Test Driver Authentication API

### 1.1 Create Test Driver Account
1. Navigate to admin panel: `https://your-domain.com/admin`
2. Login with admin credentials
3. Click "السواق" (Drivers) tab
4. Click "إضافة سائق جديد" (Add New Driver)
5. Fill in test data:
   ```
   Full Name: سائق تجريبي
   Phone: 07712345678
   Email: test@pakety.com
   Password: driver123
   ```
6. Click "إضافة السائق" (Add Driver)

### 1.2 Test API Endpoint
Test the authentication endpoint using curl:

```bash
# Test successful login
curl -X POST http://localhost:5000/api/drivers/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@pakety.com", "password": "driver123"}'

# Expected Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "driver": {
    "id": 1,
    "fullName": "سائق تجريبي",
    "email": "test@pakety.com",
    "phone": "07712345678",
    "isActive": true,
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

```bash
# Test invalid credentials
curl -X POST http://localhost:5000/api/drivers/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@pakety.com", "password": "wrongpassword"}'

# Expected Response:
{
  "success": false,
  "message": "كلمة المرور غير صحيحة"
}
```

### 1.3 Test Token Verification
```bash
# Use token from login response
TOKEN="your-jwt-token-here"

curl -X GET http://localhost:5000/api/drivers/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Expected Response:
{
  "success": true,
  "driver": {
    "id": 1,
    "fullName": "سائق تجريبي",
    "email": "test@pakety.com",
    "phone": "07712345678",
    "isActive": true,
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

## Step 2: Setup Expo React Native App

### 2.1 Install Dependencies
```bash
cd driver-app
npm install

# Install Expo CLI if not already installed
npm install -g @expo/cli
```

### 2.2 Configure API Base URL
Edit `src/constants/config.js`:

```javascript
// For production
export const API_BASE_URL = 'https://your-pakety-domain.com/api';

// For local development (replace with your local IP)
// export const API_BASE_URL = 'http://192.168.1.100:5000/api';
```

### 2.3 Find Your Local IP Address
```bash
# On Windows
ipconfig | findstr "IPv4"

# On macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Example result: 192.168.1.100
```

## Step 3: Run and Test Mobile App

### 3.1 Start Development Server
```bash
cd driver-app
npm start
```

This will open Expo DevTools in your browser.

### 3.2 Install Expo Go App
- **Android**: Download from Google Play Store
- **iOS**: Download from App Store
- Search for "Expo Go"

### 3.3 Connect Device to App
1. Ensure your phone and computer are on the same Wi-Fi network
2. Open Expo Go app on your phone
3. Scan the QR code from Expo DevTools

### 3.4 Test Login Flow
1. App should open to login screen
2. Enter test credentials:
   - Email: `test@pakety.com`
   - Password: `driver123`
3. Tap "تسجيل الدخول" (Login)
4. Should show success alert and navigate to dashboard
5. Dashboard should display driver information

## Step 4: Troubleshooting

### Common Issues and Solutions

#### 4.1 "Network request failed"
**Problem**: App cannot connect to API
**Solutions**:
- Verify API base URL in `config.js`
- Check if server is running on port 5000
- Use your computer's IP address, not localhost
- Disable firewall temporarily

#### 4.2 "البريد الإلكتروني غير مسجل"
**Problem**: Driver account not found
**Solutions**:
- Verify driver was created in admin panel
- Check email spelling
- Ensure driver is marked as "active"

#### 4.3 App crashes on login
**Problem**: Authentication errors
**Solutions**:
- Check server logs for errors
- Verify JWT_SECRET is set
- Test API endpoint with curl first

#### 4.4 QR code doesn't work
**Problem**: Expo connection issues
**Solutions**:
- Try manual connection using IP address
- Restart Expo development server
- Check Wi-Fi network connection

## Step 5: Production Deployment

### 5.1 Build APK for Android
```bash
# Install EAS CLI
npm install -g @expo/cli@latest

# Login to Expo
expo login

# Build for Android
expo build:android
```

### 5.2 Update API URL for Production
Before building, update `config.js`:
```javascript
export const API_BASE_URL = 'https://pakety.delivery/api';
```

## Step 6: Verification Checklist

- [ ] Admin panel shows driver account
- [ ] API authentication endpoint works with curl
- [ ] Expo app installs and runs
- [ ] Login screen displays in Arabic
- [ ] Successful login redirects to dashboard
- [ ] Dashboard shows driver information
- [ ] Logout function works
- [ ] "Remember me" saves credentials
- [ ] Invalid login shows error message

## Contact Support

- **Technical Issues**: 07511856947
- **Admin Access**: Use webapp admin panel
- **API Testing**: Use provided curl commands

This completes Phase 1 of the PAKETY driver app with professional authentication system.