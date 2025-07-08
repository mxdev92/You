# Fazpass WhatsApp OTP Setup Guide

## Prerequisites
1. Create account at https://dashboard.fazpass.com
2. Configure WhatsApp gateway in your dashboard
3. Get your merchant key and gateway key

## Configuration Steps

### 1. Dashboard Setup
1. Login to https://dashboard.fazpass.com
2. Navigate to **Proxy Menu** → **New Gateway**
3. Select **WhatsApp** as channel
4. Choose your preferred provider
5. Configure message templates and sender settings
6. Save the gateway and note the **Gateway Key**

### 2. Configuration Options

#### Option A: Environment Variable (Recommended)
Add to your `.env` file:
```
FAZPASS_GATEWAY_KEY=your_actual_gateway_key_from_dashboard
```

#### Option B: Direct Code Configuration
Edit `server/fazpass-service.ts` line 32:
```typescript
this.gatewayKey = 'your_actual_gateway_key_from_dashboard';
```

### 3. Current Status
- **Merchant Key**: ✅ Configured
- **Gateway Key**: ❌ Needs configuration (currently using placeholder)
- **API Endpoint**: Using `/v1/otp/generate` for unmasked OTP codes
- **Current Error**: "gateway does not exists" - gateway key must be updated

## Important Notes
- The gateway key must match exactly what you created in the Fazpass dashboard
- WhatsApp channel is determined by your gateway configuration, not the API request
- For new WhatsApp numbers, Fazpass may require verification before sending OTPs
- Phone numbers should be in international format (+964XXXXXXXXX)

## Testing
Test the integration by trying to sign up with a WhatsApp number. Check server logs for detailed debugging information.

## Current Issue
**Error**: "gateway does not exists" (code: 4000201)
**Cause**: The gateway key 'YOUR_GATEWAY_KEY_HERE' is a placeholder

## Quick Fix Steps
1. Login to https://dashboard.fazpass.com
2. Go to your WhatsApp gateway settings
3. Copy the actual gateway key/ID
4. Replace 'YOUR_GATEWAY_KEY_HERE' in the code with your real gateway key

## Troubleshooting
If OTPs are still not being delivered after fixing gateway key:
1. Verify gateway key exactly matches dashboard configuration
2. Check WhatsApp number is properly associated with WhatsApp
3. Ensure gateway is active and properly configured in dashboard
4. Check Fazpass dashboard logs for delivery status
5. Verify your WhatsApp gateway has proper provider configuration

## Temporary Solution
Until the gateway key is fixed, the system generates fallback OTP codes (like 4412) that are displayed in server logs. Users can use these codes to complete signup.