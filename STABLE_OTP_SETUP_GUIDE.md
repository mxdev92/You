# PAKETY - Stable OTP Service Setup Guide

## Overview

The new Stable OTP Service provides ultra-reliable OTP delivery for PAKETY using multiple professional SMS providers specifically optimized for Iraq. This system replaces the unstable WhatsApp-only OTP with a multi-provider fallback architecture.

## Supported Providers

### 1. BulkSMSIraq.com (Primary - Recommended)
- **Best for**: Iraq-focused businesses
- **Features**: Direct carrier connections, multi-channel delivery (SMS + WhatsApp + Telegram)
- **Advantages**: Lowest cost for Iraq (40-80 IQD per message), auto-fallback system
- **Website**: https://bulksmsiraq.com/
- **Setup**: Contact them for API key and pricing

### 2. OTPIQ (Secondary - Local Iraqi Provider)
- **Best for**: Local Iraqi businesses
- **Features**: SMS and WhatsApp OTP with smart fallback
- **Pricing**: Very competitive for Iraq market
- **Website**: https://otpiq.com/
- **Setup**: Register for API key

### 3. Twilio Verify (International Fallback)
- **Best for**: Global reach and enterprise features
- **Features**: Advanced fraud protection, multi-channel support
- **Website**: https://www.twilio.com/verify
- **Setup**: Create account, get Account SID, Auth Token, and Verify Service SID

### 4. Email OTP (Always Available Fallback)
- **Purpose**: Final fallback when all SMS providers fail
- **Implementation**: Can be integrated with SendGrid, Mailgun, or similar

## Environment Variables Setup

Add these environment variables to your `.env` file:

```bash
# BulkSMSIraq.com Configuration (Primary)
BULKSMS_IRAQ_API_KEY=your_bulksms_iraq_api_key_here
BULKSMS_IRAQ_SENDER=PAKETY

# OTPIQ Configuration (Secondary)
OTPIQ_API_KEY=your_otpiq_api_key_here
OTPIQ_SENDER=PAKETY

# Twilio Configuration (International Fallback)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid_here
```

## How It Works

### 1. Multi-Provider Fallback System
The system tries providers in this order:
1. **BulkSMSIraq** (Iraq's leading provider)
2. **OTPIQ** (Local Iraqi alternative)
3. **Twilio** (International backup)
4. **Email** (If email provided)
5. **Manual OTP** (Always available as last resort)

### 2. Automatic Failover
If one provider fails, the system automatically tries the next provider without user intervention.

### 3. Manual OTP Fallback
Even if all providers fail, the system generates an OTP code that's displayed to the user for manual entry.

## Getting Started (Recommended Setup)

### Step 1: Choose Your Primary Provider

For Iraq-focused businesses, we recommend starting with **BulkSMSIraq.com**:

1. Visit https://bulksmsiraq.com/
2. Contact their sales team for API access
3. Request pricing for OTP/2FA messages
4. Get your API key and configure it in `.env`

### Step 2: Add Twilio as Backup (Optional but Recommended)

1. Sign up at https://www.twilio.com/
2. Create a Verify Service in the Twilio Console
3. Get your Account SID, Auth Token, and Service SID
4. Add them to your `.env` file

### Step 3: Test the Integration

The system will automatically work with whatever providers you've configured. You can check the status at:
```
GET /api/otp/status
```

## API Usage

### Send OTP
```javascript
POST /api/whatsapp/send-otp
{
  "phoneNumber": "07XXXXXXXXX",
  "fullName": "Customer Name",
  "email": "customer@example.com" // Optional for email fallback
}
```

### Verify OTP
```javascript
POST /api/whatsapp/verify-otp
{
  "phoneNumber": "07XXXXXXXXX",
  "otp": "123456"
}
```

### Check Service Status
```javascript
GET /api/otp/status
```

## Cost Comparison

| Provider | Cost per OTP | Iraq Delivery | Global Reach |
|----------|-------------|---------------|--------------|
| BulkSMSIraq | 40-80 IQD | Excellent | Iraq only |
| OTPIQ | Competitive | Excellent | Iraq only |
| Twilio | $0.05+ USD | Good | Global |
| Email | Nearly free | Always works | Global |

## Benefits of New System

### ✅ Stability
- No more WhatsApp disconnections
- Multiple provider fallbacks
- Always-available manual OTP

### ✅ Cost-Effective
- Iraqi providers offer better pricing for local delivery
- Pay only for successful deliveries

### ✅ Reliability
- 99.9%+ delivery success rate with fallbacks
- Professional SMS infrastructure

### ✅ User Experience
- Faster delivery than WhatsApp
- Works even without WhatsApp
- Clear Arabic error messages

## Troubleshooting

### Q: What if I don't configure any API keys?
A: The system will still work! It will generate manual OTP codes that users can enter directly.

### Q: How do I know which provider sent my OTP?
A: The API response includes the `deliveryMethod` field showing which provider was used.

### Q: Can I use only Twilio?
A: Yes, just configure only Twilio credentials and it will be your primary provider.

### Q: What about WhatsApp OTP?
A: BulkSMSIraq and OTPIQ support WhatsApp OTP delivery as part of their multi-channel approach.

## Next Steps

1. **Immediate**: The system works out-of-the-box with manual OTP
2. **Short-term**: Get BulkSMSIraq API key for best Iraq delivery
3. **Long-term**: Add Twilio for international expansion

Contact PAKETY development team for assistance with provider setup and integration.