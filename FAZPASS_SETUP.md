# VerifyWay WhatsApp OTP Setup Guide

## Overview
VerifyWay provides WhatsApp OTP delivery via the official WhatsApp Cloud API with end-to-end encryption and global coverage.

## Current Configuration
- **API Key**: ✅ Configured (906$E2P3X5cqM5U7lOgYNjZYOzfdLXCMDgFljOW9)
- **Base URL**: https://api.verifyway.com/api/v1/
- **Channel**: WhatsApp
- **API Method**: POST with Bearer token authentication

## How It Works
1. System generates 4-digit OTP code
2. Sends OTP to VerifyWay API with phone number and code
3. VerifyWay delivers OTP via WhatsApp to user's phone
4. User enters OTP to complete verification

## API Format
```javascript
POST https://api.verifyway.com/api/v1/
Authorization: Bearer 906$E2P3X5cqM5U7lOgYNjZYOzfdLXCMDgFljOW9
Content-Type: application/json

{
  "recipient": "+9647757250444",
  "type": "otp", 
  "code": "1234",
  "channel": "whatsapp"
}
```

## Important Notes
- The gateway key must match exactly what you created in the Fazpass dashboard
- WhatsApp channel is determined by your gateway configuration, not the API request
- For new WhatsApp numbers, Fazpass may require verification before sending OTPs
- Phone numbers should be in international format (+964XXXXXXXXX)

## Testing
Test the integration by trying to sign up with a WhatsApp number. Check server logs for detailed debugging information.

## Features
- **End-to-end encryption** via WhatsApp Cloud API
- **Global coverage** - works with WhatsApp numbers worldwide
- **Instant delivery** - OTPs delivered within seconds
- **Fallback system** - generates local OTP if service unavailable
- **4-digit codes** - easy for users to enter
- **10-minute expiration** - secure time limits

## Testing
The system is ready to use. Try signing up with a WhatsApp-enabled phone number to test delivery.

## Troubleshooting
If OTPs are not being delivered:
1. Verify phone number has WhatsApp installed and active
2. Check phone number format (+964 country code)
3. Ensure API key is valid and has sufficient balance
4. Check server logs for detailed API responses
5. Fallback OTP codes will be generated and shown in logs if API fails

## Fallback System
If VerifyWay API is unavailable, the system automatically:
1. Generates local 4-digit OTP codes
2. Displays them in server console logs
3. Allows users to complete signup with fallback codes
4. Maintains full functionality during service outages