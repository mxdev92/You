# Meta WhatsApp Business API Setup Guide

## Current Configuration
- **Access Token**: EAAW1nntqY4IBPP6FScewbcj4StKsoovDIGLXYfxwt5UgmRAQWZAiWAZCpEBUA8NBZAyMPhyugk79Ui7sB10GFifAH0lkbQpCHRG8VR17ZAq9Nu0r0yUIOHUoIZCYrlQIQnrZCoelGifzFCQkanby5Hz675QUlpQDZBCjZColSZAXHqiPkmI21aVVvmI6gqTBiCPd0MWWzCxVDW337p4UQRxbtfCNaDE4gQb3lMIdzz8ZAW7hUZD
- **Phone Number ID**: 655810796856265
- **WhatsApp Business Account ID**: 211058550432159

## Required Permissions
The Meta access token needs these permissions:
1. **whatsapp_business_messaging** - Send messages via WhatsApp Business API
2. **whatsapp_business_management** - Manage WhatsApp Business settings
3. **pages_show_list** - Access to business pages
4. **pages_messaging** - Send messages from business pages

## Setup Steps
1. Go to Meta Developer Console: https://developers.facebook.com/apps/
2. Select your app
3. Navigate to WhatsApp → Configuration
4. Add the required permissions to your access token
5. Verify the phone number is properly registered and active

## Current Issue
The API is returning permission errors, indicating the access token lacks the required WhatsApp Business messaging permissions.

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