# Meta WhatsApp Business API Setup Guide

## Current Configuration
- **Access Token**: ⚠️ NEEDS TO BE REGENERATED WITH PROPER PERMISSIONS
- **Phone Number ID**: 655810796856265
- **WhatsApp Business Account ID**: 211058550432159

## Status
✅ Access token updated and working with proper permissions
✅ Phone number ID updated to 675759472293180 (Test Number)
✅ Phone number access: SUCCESS
✅ Message sending: SUCCESS to approved numbers
✅ OTP system working with Iraqi phone number +964 775 725 0444
✅ WhatsApp OTP delivery confirmed working
⚠️ PRODUCTION REQUIREMENT: Need to submit for Business Verification to message any number

## Production Setup Required
To send OTP to any phone number (not just allowed list), you must:
1. Submit WhatsApp Business Account for verification
2. Add business information (name, website, privacy policy)
3. Wait for Facebook approval (typically 1-3 days)
4. Once approved, any phone number can receive messages

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
- **CRITICAL**: Recipient phone numbers must be added to allowed list in Meta console
- During development, only whitelisted numbers can receive messages

## Current Issue
The API is returning permission errors, indicating the access token lacks the required WhatsApp Business messaging permissions.

## Solution
1. ✅ COMPLETED: Generated new access token with proper permissions
2. ✅ COMPLETED: Updated phone number ID to 675759472293180
3. ✅ COMPLETED: Phone number access working successfully
4. 🔄 NEXT STEP: Add recipient phone numbers to allowed list in Meta console
5. Go to "Send and receive messages" section → Add recipient phone numbers
6. Test by sending a message directly from the API Setup page first

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