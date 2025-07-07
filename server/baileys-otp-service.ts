import P from 'pino';
import { Boom } from '@hapi/boom';
import { randomInt } from 'crypto';
import fs from 'fs';
import path from 'path';

// Baileys WhatsApp OTP Service - Ultra Stable Implementation
class BaileysOTPService {
  private sock: any = null;
  private isConnected = false;
  private isConnecting = false;
  private otpStorage = new Map<string, { code: string; expires: Date; attempts: number }>();
  private sessionPath = './whatsapp_baileys_session';

  constructor() {
    // Ensure session directory exists
    if (!fs.existsSync(this.sessionPath)) {
      fs.mkdirSync(this.sessionPath, { recursive: true });
    }
  }

  // Generate a secure 6-digit OTP code
  private generateOTP(): string {
    return randomInt(100000, 999999).toString();
  }

  // Format Iraqi phone number for WhatsApp
  private formatWhatsAppNumber(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Handle different input formats
    let formatted = '';
    if (cleaned.startsWith('964')) {
      formatted = cleaned;
    } else if (cleaned.startsWith('07')) {
      formatted = `964${cleaned.substring(1)}`;
    } else if (cleaned.length === 10 && cleaned.startsWith('7')) {
      formatted = `964${cleaned}`;
    } else {
      formatted = `964${cleaned}`;
    }
    
    return `${formatted}@s.whatsapp.net`;
  }

  // Initialize WhatsApp connection with Baileys
  async initialize(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      console.log('⚠️ WhatsApp already connecting or connected');
      return;
    }

    this.isConnecting = true;
    console.log('🚀 Initializing Baileys WhatsApp OTP Service...');

    try {
      // Dynamic import of Baileys
      const baileysModule = await import('@whiskeysockets/baileys');
      const makeWASocket = baileysModule.default;
      const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = baileysModule;

      // Get latest Baileys version
      const { version } = await fetchLatestBaileysVersion();
      console.log(`📱 Using Baileys version: ${version}`);

      // Setup multi-file auth state
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);

      // Create socket connection
      this.sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        browser: Browsers.ubuntu('Chrome'),
        logger: P({ level: 'silent' }),
        getMessage: async (key) => {
          return { conversation: 'Hello' }; // Simple message placeholder
        }
      });

      // Handle connection updates
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('📱 QR Code generated - scan with WhatsApp to connect');
        }

        if (connection === 'close') {
          const { DisconnectReason } = await import('@whiskeysockets/baileys');
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          
          console.log('❌ WhatsApp connection closed. Reconnecting:', shouldReconnect);
          
          if (shouldReconnect) {
            this.isConnected = false;
            this.isConnecting = false;
            // Attempt reconnection after delay
            setTimeout(() => this.initialize(), 5000);
          } else {
            this.isConnected = false;
            this.isConnecting = false;
            console.log('🔐 WhatsApp logged out - QR scan required');
          }
        } else if (connection === 'open') {
          console.log('✅ Baileys WhatsApp connected successfully!');
          this.isConnected = true;
          this.isConnecting = false;
        }
      });

      // Save credentials when updated
      this.sock.ev.on('creds.update', saveCreds);

      // Handle messages (optional - for debugging)
      this.sock.ev.on('messages.upsert', (m) => {
        console.log('📨 Received messages:', m.messages.length);
      });

    } catch (error) {
      console.error('❌ Failed to initialize Baileys WhatsApp:', error);
      this.isConnecting = false;
      this.isConnected = false;
      
      // Retry after delay
      setTimeout(() => this.initialize(), 10000);
    }
  }

  // Send OTP via WhatsApp using Baileys
  async sendOTP(phoneNumber: string, fullName?: string): Promise<{ success: boolean; code: string; method: string; message: string }> {
    const otp = this.generateOTP();
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    // Store OTP for verification
    this.otpStorage.set(phoneNumber, {
      code: otp,
      expires: expiryTime,
      attempts: 0
    });

    console.log(`📱 Generated OTP ${otp} for ${phoneNumber}`);

    // Check if WhatsApp is connected
    if (!this.isConnected || !this.sock) {
      console.log('❌ WhatsApp not connected - providing manual OTP');
      return {
        success: false,
        code: otp,
        method: 'manual',
        message: 'WhatsApp غير متصل. استخدم الرمز المعروض: ' + otp
      };
    }

    try {
      const whatsappNumber = this.formatWhatsAppNumber(phoneNumber);
      
      // Create Arabic OTP message
      const message = fullName 
        ? `مرحباً ${fullName}!\n\nرمز التحقق الخاص بك في PAKETY هو:\n\n*${otp}*\n\nالرمز صالح لمدة 5 دقائق فقط.\n🔐 لا تشارك هذا الرمز مع أي شخص.\n\n— فريق PAKETY`
        : `رمز التحقق الخاص بك في PAKETY هو:\n\n*${otp}*\n\nالرمز صالح لمدة 5 دقائق فقط.\n🔐 لا تشارك هذا الرمز مع أي شخص.`;

      // Send message via Baileys
      await this.sock.sendMessage(whatsappNumber, { text: message });
      
      console.log(`✅ OTP sent successfully to ${phoneNumber} via Baileys WhatsApp`);
      
      return {
        success: true,
        code: otp,
        method: 'baileys_whatsapp',
        message: 'تم إرسال رمز التحقق عبر WhatsApp بنجاح'
      };

    } catch (error) {
      console.error('❌ Failed to send WhatsApp OTP via Baileys:', error);
      
      return {
        success: false,
        code: otp,
        method: 'manual',
        message: 'فشل إرسال WhatsApp. استخدم الرمز المعروض: ' + otp
      };
    }
  }

  // Verify OTP code
  async verifyOTP(phoneNumber: string, code: string): Promise<{ success: boolean; message: string }> {
    const stored = this.otpStorage.get(phoneNumber);
    
    if (!stored) {
      return { success: false, message: 'رمز التحقق غير صالح أو منتهي الصلاحية' };
    }

    // Check if expired
    if (new Date() > stored.expires) {
      this.otpStorage.delete(phoneNumber);
      return { success: false, message: 'رمز التحقق منتهي الصلاحية' };
    }

    // Check attempts limit
    if (stored.attempts >= 3) {
      this.otpStorage.delete(phoneNumber);
      return { success: false, message: 'تم تجاوز عدد المحاولات المسموح' };
    }

    // Check if code matches
    if (stored.code !== code) {
      stored.attempts++;
      return { success: false, message: 'رمز التحقق غير صحيح' };
    }

    // Success - remove OTP
    this.otpStorage.delete(phoneNumber);
    return { success: true, message: 'تم التحقق بنجاح' };
  }

  // Get service status
  getStatus(): any {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      method: 'baileys_whatsapp',
      activeOTPs: this.otpStorage.size,
      sessionPath: this.sessionPath,
      timestamp: new Date().toISOString()
    };
  }

  // Check if WhatsApp number exists
  async checkWhatsAppNumber(phoneNumber: string): Promise<boolean> {
    if (!this.isConnected || !this.sock) {
      return false;
    }

    try {
      const whatsappNumber = this.formatWhatsAppNumber(phoneNumber);
      const exists = await this.sock.onWhatsApp(whatsappNumber);
      return exists.length > 0 && exists[0].exists;
    } catch (error) {
      console.error('Error checking WhatsApp number:', error);
      return false;
    }
  }

  // Cleanup expired OTPs
  clearExpiredOTPs(): void {
    const now = new Date();
    for (const [phone, data] of this.otpStorage.entries()) {
      if (now > data.expires) {
        this.otpStorage.delete(phone);
      }
    }
  }

  // Disconnect WhatsApp
  async disconnect(): Promise<void> {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
  }

  // Force reconnection
  async reconnect(): Promise<void> {
    await this.disconnect();
    setTimeout(() => this.initialize(), 2000);
  }
}

// Export singleton instance
export const baileysOTPService = new BaileysOTPService();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  baileysOTPService.clearExpiredOTPs();
}, 5 * 60 * 1000);

export default baileysOTPService;