# Meta WhatsApp Business API Setup Guide

## Current Configuration
- **Access Token**: ⚠️ NEEDS TO BE REGENERATED WITH PROPER PERMISSIONS
- **Phone Number ID**: 655810796856265
- **WhatsApp Business Account ID**: 211058550432159

## Status
❌ Current access token lacks required WhatsApp Business permissions
✅ Phone number ID and account ID are correct
🔄 Waiting for new access token with proper permissions

## Required Permissions
The Meta access token needs these permissions:
1. **whatsapp_business_messaging** - Send messages via WhatsApp Business API
2. **whatsapp_business_management** - Manage WhatsApp Business settings
3. **pages_show_list** - Access to business pages
4. **pages_messaging** - Send messages from business pages
5. **ads_read** - Required for Marketing Messages Lite API metrics (optional)

## Setup Steps
1. Go to Meta Developer Console: https://developers.facebook.com/apps/
2. Select your app
3. Navigate to WhatsApp → API Setup
4. Generate access token with required permissions
5. Add phone number and verify it's active
6. Test message sending capability

## Important Notes
- OTP messages use standard Cloud API (not Marketing Messages Lite API)
- Marketing Messages Lite API requires pre-approved templates
- Authentication messages like OTP can use freeform text messages
- Phone number must be verified and active in Meta Business

## Current Issue
The API is returning permission errors, indicating the access token lacks the required WhatsApp Business messaging permissions.

## Solution
1. In the screenshot you shared, click "Generate access token" button
2. Select ALL the required permissions listed above
3. Copy the new token and update it in the Meta service
4. The phone number 655810796856265 should be visible in the "Send and receive messages" section
5. Test by sending a message directly from the API Setup page first

## Test Commands
```bash
# Test phone number access
curl -H "Authorization: Bearer YOUR_TOKEN" "https://graph.facebook.com/v21.0/655810796856265"

# Test message sending
curl -X POST "https://graph.facebook.com/v21.0/655810796856265/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messaging_product": "whatsapp", "to": "9647XXXXXXXXX", "type": "text", "text": {"body": "Test message"}}'
```

## Next Steps
1. Configure proper permissions in Meta Developer Console
2. Regenerate access token with WhatsApp Business permissions
3. Test message sending functionality