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

### 2. Environment Variables
Add these to your `.env` file (optional):
```
FAZPASS_GATEWAY_KEY=your_gateway_key_here
```

### 3. Current Configuration
- **Merchant Key**: Already configured in code
- **Gateway Key**: Currently set to `whatsapp_gateway`
- **API Endpoint**: Using `/v1/otp/generate` for unmasked OTP codes

## Important Notes
- The gateway key must match exactly what you created in the Fazpass dashboard
- WhatsApp channel is determined by your gateway configuration, not the API request
- For new WhatsApp numbers, Fazpass may require verification before sending OTPs
- Phone numbers should be in international format (+964XXXXXXXXX)

## Testing
Test the integration by trying to sign up with a WhatsApp number. Check server logs for detailed debugging information.

## Troubleshooting
If OTPs are not being delivered:
1. Verify gateway key matches dashboard configuration
2. Check WhatsApp number is properly associated with WhatsApp
3. Ensure gateway is active and properly configured in dashboard
4. Check Fazpass dashboard logs for delivery status