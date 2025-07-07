import { 
  makeWASocket, 
  DisconnectReason, 
  fetchLatestBaileysVersion, 
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  WASocket,
  proto,
  generateWAMessageFromContent,
  prepareWAMessageMedia
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';
import QRCode from 'qrcode';

interface OTPSession {
  phoneNumber: string;
  otp: string;
  fullName: string;
  timestamp: number;
  expiresAt: number;
}

export class BaileysWhatsAppService {
  private socket: WASocket | null = null;
  private qrCode: string | null = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private otpSessions: Map<string, OTPSession> = new Map();
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly authPath = './whatsapp_session';

  constructor() {
    // Ensure auth directory exists
    if (!fs.existsSync(this.authPath)) {
      fs.mkdirSync(this.authPath, { recursive: true });
    }
  }

  async initialize(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      console.log('🔄 Baileys WhatsApp already initializing or connected');
      return;
    }

    console.log('🚀 Initializing Baileys WhatsApp service...');
    this.isConnecting = true;

    try {
      // Get latest Baileys version
      const { version, isLatest } = await fetchLatestBaileysVersion();
      console.log(`📱 Using Baileys version ${version}, latest: ${isLatest}`);

      // Setup auth state
      const { state, saveCreds } = await useMultiFileAuthState(this.authPath);

      // Create a proper logger that Baileys expects
      const logger = {
        level: 'silent',
        child: () => logger,
        trace: () => {},
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        fatal: () => {}
      };

      // Create socket
      this.socket = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        printQRInTerminal: false,
        generateHighQualityLinkPreview: true,
        logger: logger,
        syncFullHistory: false,
        markOnlineOnConnect: true
      });

      // Handle connection updates
      this.socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('📱 QR Code received, generating image...');
          try {
            this.qrCode = await QRCode.toDataURL(qr);
            console.log('✅ QR Code generated successfully');
          } catch (error) {
            console.error('❌ Failed to generate QR code:', error);
          }
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          console.log('🔌 Connection closed. Reconnecting:', shouldReconnect);
          
          this.isConnected = false;
          this.isConnecting = false;
          
          if (shouldReconnect) {
            setTimeout(() => this.initialize(), 3000);
          }
        } else if (connection === 'open') {
          console.log('✅ Baileys WhatsApp connected successfully!');
          this.isConnected = true;
          this.isConnecting = false;
          this.qrCode = null; // Clear QR once connected
        }
      });

      // Save credentials when updated
      this.socket.ev.on('creds.update', saveCreds);

      // Handle messages (optional - for future features)
      this.socket.ev.on('messages.upsert', async (m) => {
        // Handle incoming messages if needed
      });

    } catch (error) {
      console.error('❌ Failed to initialize Baileys WhatsApp:', error);
      this.isConnecting = false;
      throw error;
    }
  }

  async sendOTP(phoneNumber: string, fullName: string): Promise<{ success: boolean; otp?: string; note?: string }> {
    if (!this.isConnected || !this.socket) {
      console.log('⚠️ WhatsApp not connected, generating fallback OTP');
      const otp = this.generateOTP();
      this.storeOTPSession(phoneNumber, otp, fullName);
      return {
        success: true,
        otp,
        note: 'WhatsApp not connected - use this OTP code manually'
      };
    }

    try {
      const otp = this.generateOTP();
      this.storeOTPSession(phoneNumber, otp, fullName);

      // Format phone number for WhatsApp (Iraq: +964 -> 964)
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      const message = `مرحباً ${fullName}! 👋

رمز التحقق الخاص بك في تطبيق PAKETY هو:

🔐 ${otp}

⏰ صالح لمدة 10 دقائق فقط
🚚 مرحباً بك في PAKETY - التوصيل السريع!`;

      await this.socket.sendMessage(formattedNumber, { text: message });
      
      console.log(`✅ OTP ${otp} sent successfully to ${phoneNumber}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to send OTP via Baileys:', error);
      
      // Fallback - return OTP for manual delivery
      const otp = this.generateOTP();
      this.storeOTPSession(phoneNumber, otp, fullName);
      return {
        success: true,
        otp,
        note: 'WhatsApp delivery failed - use this OTP code manually'
      };
    }
  }

  async sendOrderInvoice(phoneNumber: string, pdfBuffer: Buffer, orderData: any): Promise<boolean> {
    if (!this.isConnected || !this.socket) {
      console.log('⚠️ WhatsApp not connected, cannot send invoice');
      return false;
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      // Prepare PDF media
      const media = await prepareWAMessageMedia({
        document: pdfBuffer,
        mimetype: 'application/pdf',
        fileName: `PAKETY-Invoice-${orderData.orderId}.pdf`
      }, { upload: this.socket.waUploadToServer });

      const message = `🧾 فاتورة طلبك من PAKETY

📦 رقم الطلب: ${orderData.orderId}
💰 إجمالي المبلغ: ${orderData.total.toLocaleString()} د.ع

شكراً لاختيارك PAKETY! 🚚`;

      await this.socket.sendMessage(formattedNumber, {
        document: media.document,
        caption: message,
        fileName: `PAKETY-Invoice-${orderData.orderId}.pdf`,
        mimetype: 'application/pdf'
      });

      console.log(`✅ Invoice sent successfully to ${phoneNumber}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to send invoice via Baileys:', error);
      return false;
    }
  }

  async sendAdminNotification(orderData: any, pdfBuffer: Buffer): Promise<boolean> {
    if (!this.isConnected || !this.socket) {
      console.log('⚠️ WhatsApp not connected, cannot send admin notification');
      return false;
    }

    try {
      // Fixed admin number: 07710155333
      const adminNumber = this.formatPhoneNumber('07710155333');
      console.log(`📱 Sending admin notification to ${adminNumber}`);
      
      // Prepare PDF media
      const media = await prepareWAMessageMedia({
        document: pdfBuffer,
        mimetype: 'application/pdf',
        fileName: `PAKETY-Admin-Invoice-${orderData.orderId}.pdf`
      }, { upload: this.socket.waUploadToServer });

      // Send admin notification message
      const message = `🔔 طلب جديد في PAKETY!

📋 رقم الطلب: ${orderData.orderId}
👤 اسم العميل: ${orderData.customerName}
📱 رقم العميل: ${orderData.customerPhone}
📍 عنوان التوصيل: ${orderData.address}
💰 المبلغ الإجمالي: ${orderData.total.toLocaleString()} د.ع
🛒 عدد الأصناف: ${orderData.itemCount}

⚡ يرجى تحضير الطلب والتوصيل في أسرع وقت`;

      // Send text message first
      await this.socket.sendMessage(adminNumber, { text: message });
      
      // Send PDF invoice to admin
      await this.socket.sendMessage(adminNumber, {
        document: media.document,
        caption: `📊 فاتورة إدارية - طلب رقم ${orderData.orderId}`,
        fileName: `PAKETY-Admin-Invoice-${orderData.orderId}.pdf`,
        mimetype: 'application/pdf'
      });
      
      console.log('✅ Admin notification and PDF sent successfully to 07710155333');
      return true;
    } catch (error) {
      console.error('❌ Failed to send admin notification:', error);
      return false;
    }
  }

  verifyOTP(phoneNumber: string, inputOTP: string): { valid: boolean; message: string } {
    const session = this.otpSessions.get(phoneNumber);
    
    if (!session) {
      return { valid: false, message: 'لم يتم العثور على رمز OTP لهذا الرقم' };
    }

    if (Date.now() > session.expiresAt) {
      this.otpSessions.delete(phoneNumber);
      return { valid: false, message: 'انتهت صلاحية رمز OTP' };
    }

    if (session.otp === inputOTP) {
      this.otpSessions.delete(phoneNumber);
      return { valid: true, message: 'تم التحقق بنجاح!' };
    }

    return { valid: false, message: 'رمز OTP غير صحيح' };
  }

  private generateOTP(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private storeOTPSession(phoneNumber: string, otp: string, fullName: string): void {
    const session: OTPSession = {
      phoneNumber,
      otp,
      fullName,
      timestamp: Date.now(),
      expiresAt: Date.now() + (this.OTP_EXPIRY_MINUTES * 60 * 1000)
    };
    
    this.otpSessions.set(phoneNumber, session);
    console.log(`📱 OTP ${otp} stored for ${phoneNumber} (expires in ${this.OTP_EXPIRY_MINUTES} minutes)`);
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Iraqi numbers starting with 07
    if (cleaned.startsWith('07')) {
      cleaned = '964' + cleaned.substring(1);
    }
    
    // Add @s.whatsapp.net suffix
    return cleaned + '@s.whatsapp.net';
  }

  async resetSession(): Promise<void> {
    console.log('🔄 Resetting Baileys WhatsApp session...');
    
    try {
      if (this.socket) {
        await this.socket.logout();
        this.socket = null;
      }
    } catch (error) {
      console.log('⚠️ Error during logout:', error);
    }

    // Clear session files
    try {
      if (fs.existsSync(this.authPath)) {
        fs.rmSync(this.authPath, { recursive: true, force: true });
        fs.mkdirSync(this.authPath, { recursive: true });
      }
    } catch (error) {
      console.error('❌ Failed to clear session files:', error);
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.qrCode = null;
    this.otpSessions.clear();

    console.log('✅ Session reset complete');
  }

  getStatus() {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      status: this.isConnected ? 'connected' : this.isConnecting ? 'connecting' : 'disconnected'
    };
  }

  getQRCode(): string | null {
    return this.qrCode;
  }

  private async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.isConnected || !this.socket) {
      console.log('⚠️ WhatsApp not connected');
      return false;
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      await this.socket.sendMessage(formattedNumber, { text: message });
      return true;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      return false;
    }
  }
}

export default BaileysWhatsAppService;