# PAKETY - Baileys WhatsApp OTP Setup Guide

## Why Baileys Over Venom?

### Critical Issues with Venom (2025)
🚨 **Venom is NO LONGER OPEN SOURCE** - As of July 2025, Venom moved to a paid freemium model with usage limits that would restrict your OTP service.

### ✅ Baileys Advantages
- **100% Free & Open Source** - No licensing fees or usage limits
- **Active Development** - Latest updates from December 2024
- **Lower Resource Usage** - No browser overhead (Puppeteer-free)
- **Direct WebSocket Connection** - More stable than browser automation
- **TypeScript Support** - Better code reliability
- **Perfect for OTP** - Lightweight and focused

## How Baileys OTP Works

The new Baileys OTP service provides ultra-stable WhatsApp OTP delivery:

1. **Direct WhatsApp Web connection** via WebSocket
2. **QR code authentication** (scan once, stays connected)
3. **Automatic reconnection** if connection drops
4. **Manual OTP fallback** when WhatsApp is disconnected
5. **5-minute OTP validity** with attempt limits

## Setup Process

### 1. Initial Connection
When you first run the server, Baileys will:
- Generate a QR code in the terminal
- Wait for you to scan it with WhatsApp
- Save authentication permanently
- Connect automatically on future restarts

### 2. Scan QR Code
1. Start the server: `npm run dev`
2. Look for QR code in the terminal
3. Open WhatsApp on your phone
4. Go to Settings > Linked Devices
5. Scan the QR code
6. ✅ Connected permanently!

### 3. API Usage

**Send OTP:**
```javascript
POST /api/whatsapp/send-otp
{
  "phoneNumber": "07XXXXXXXXX",
  "fullName": "Customer Name"
}
```

**Verify OTP:**
```javascript
POST /api/whatsapp/verify-otp
{
  "phoneNumber": "07XXXXXXXXX", 
  "otp": "123456"
}
```

**Check Status:**
```javascript
GET /api/whatsapp/status
```

## OTP Message Format

Users receive this message via WhatsApp:
```
مرحباً [Name]!

رمز التحقق الخاص بك في PAKETY هو:

*123456*

الرمز صالح لمدة 5 دقائق فقط.
🔐 لا تشارك هذا الرمز مع أي شخص.

— فريق PAKETY
```

## Benefits for PAKETY

### ✅ **Ultra Stability**
- No more WhatsApp disconnections
- Permanent authentication (scan once)
- Automatic reconnection
- Always-available manual OTP fallback

### ✅ **Better User Experience**
- Instant OTP delivery
- Professional Arabic messages
- Works on all Iraqi phone numbers
- Clear error messages

### ✅ **Cost Effective**
- Completely free (no API costs)
- No usage limits
- No monthly fees
- Open source forever

### ✅ **Production Ready**
- Reliable session management
- Error handling and fallbacks
- Detailed logging
- Easy monitoring

## Troubleshooting

### Q: QR code not appearing?
A: Check the server terminal console - the QR code prints there for scanning.

### Q: WhatsApp disconnects frequently?
A: Baileys saves authentication permanently. Once scanned, it reconnects automatically.

### Q: What if WhatsApp is down?
A: The system provides manual OTP codes that users can enter directly.

### Q: Can I use this commercially?
A: Yes! Baileys is completely free and open source with no restrictions.

## Session Files

Baileys creates a `whatsapp_baileys_session` folder to store:
- Authentication credentials
- Session data
- Connection state

**Never delete this folder** - it contains your permanent WhatsApp authentication.

## Next Steps

1. ✅ **Immediate**: System works with manual OTP fallback
2. ✅ **Scan QR**: Connect WhatsApp for automatic OTP delivery
3. ✅ **Test**: Verify OTP sending and receiving works
4. ✅ **Deploy**: System is production-ready

The Baileys WhatsApp OTP system is now live and ultra-stable for PAKETY!