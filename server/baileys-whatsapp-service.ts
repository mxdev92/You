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
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 50;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastHeartbeat: number = 0;
  private connectionStabilityInterval: NodeJS.Timeout | null = null;
  private reconnectDelay: number = 1000;
  private isReconnecting: boolean = false;

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

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('🚫 Maximum reconnection attempts reached. Stopping.');
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

      // Create socket with enhanced stability settings
      this.socket = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        printQRInTerminal: false,
        generateHighQualityLinkPreview: false, // Disable to reduce bandwidth
        logger: logger,
        syncFullHistory: false,
        markOnlineOnConnect: false, // Keep false for production stability
        defaultQueryTimeoutMs: 60000, // Increase timeout to 60 seconds
        connectTimeoutMs: 60000, // Increase connection timeout
        keepAliveIntervalMs: 30000, // Optimized keep-alive interval
        retryRequestDelayMs: 1000, // Increase retry delay
        maxMsgRetryCount: 3, // Reduce retries to prevent timeout
        qrTimeout: 120000, // Increase QR timeout to 2 minutes
        browser: ['PAKETY', 'Desktop', '3.0'], // Stable browser info
        fireInitQueries: false, // Disable initial queries that can cause timeouts
        emitOwnEvents: false, // Disable own events to reduce load
        getMessage: async (key) => {
          return {
            conversation: 'Baileys message placeholder'
          }
        }
      });

      // Handle connection updates with enhanced stability
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
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          
          // Enhanced handling for production stability
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut && 
                                 statusCode !== DisconnectReason.badSession;
          
          console.log(`🔌 Connection closed. Status: ${statusCode}, Reconnecting: ${shouldReconnect}`);
          
          this.isConnected = false;
          this.isConnecting = false;
          this.isReconnecting = true;
          this.stopHeartbeat();
          
          if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            // Enhanced delay calculation for 440 errors
            const isTimeoutError = statusCode === 440;
            let delay = 1000; // Start with 1 second for all errors
            
            // For persistent 440 errors, implement progressive backoff
            if (isTimeoutError && this.reconnectAttempts > 3) {
              delay = Math.min(10000, 1000 + (this.reconnectAttempts * 500)); // Cap at 10 seconds
            } else if (!isTimeoutError) {
              delay = Math.min(30000, 3000 * Math.pow(2, Math.min(this.reconnectAttempts, 4))); // Exponential backoff
            }
            
            console.log(`⏳ Reconnecting in ${delay/1000} seconds... (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
            this.reconnectAttempts++;
            
            setTimeout(() => {
              this.isReconnecting = false;
              this.initialize();
            }, delay);
          } else {
            console.log('🚫 Not reconnecting - max attempts reached or logout/bad session');
            this.reconnectAttempts = 0;
            this.isReconnecting = false;
          }
        } else if (connection === 'open') {
          console.log('✅ Baileys WhatsApp connected successfully!');
          this.isConnected = true;
          this.isConnecting = false;
          this.qrCode = null; // Clear QR once connected
          this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
          this.startHeartbeat(); // Start heartbeat monitoring
        } else if (connection === 'connecting') {
          console.log('🔄 WhatsApp connecting...');
          this.isConnecting = true;
          this.isConnected = false;
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

  async sendOTP(phoneNumber: string, fullName: string, retryCount: number = 0): Promise<{ success: boolean; otp?: string; note?: string }> {
    const maxRetries = 3;
    const retryDelay = 2000;
    
    // Generate OTP once and reuse for retries
    const otp = retryCount === 0 ? this.generateOTP() : this.getStoredOTP(phoneNumber);
    if (retryCount === 0) {
      this.storeOTPSession(phoneNumber, otp, fullName);
    }

    if (!this.isConnected || !this.socket) {
      console.log(`⚠️ WhatsApp not connected (attempt ${retryCount + 1})`);
      
      // If reconnecting, wait and retry
      if (this.isReconnecting && retryCount < maxRetries) {
        console.log(`🔄 Waiting for reconnection, retrying OTP in ${retryDelay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.sendOTP(phoneNumber, fullName, retryCount + 1);
      }
      
      return {
        success: true,
        otp,
        note: 'WhatsApp disconnected - use this OTP code manually'
      };
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const message = `مرحباً ${fullName}! 👋

رمز التحقق الخاص بك في تطبيق PAKETY هو:

🔐 ${otp}

⏰ صالح لمدة 10 دقائق فقط
🚚 مرحباً بك في PAKETY - التوصيل السريع!`;

      // Send with timeout protection
      const sendPromise = this.socket.sendMessage(formattedNumber, { text: message });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Send timeout')), 8000)
      );
      
      await Promise.race([sendPromise, timeoutPromise]);
      
      console.log(`✅ OTP ${otp} sent successfully to ${phoneNumber} (attempt ${retryCount + 1})`);
      return { success: true };

    } catch (error) {
      console.error(`❌ Failed to send OTP (attempt ${retryCount + 1}):`, error);
      
      // Retry logic
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying OTP send in ${retryDelay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.sendOTP(phoneNumber, fullName, retryCount + 1);
      }
      
      console.log(`📝 All retries failed. OTP for manual verification: ${otp}`);
      return {
        success: true,
        otp,
        note: 'WhatsApp delivery failed after retries - use this OTP manually'
      };
    }
  }

  // Helper method to get stored OTP for retries
  private getStoredOTP(phoneNumber: string): string {
    const session = this.otpSessions.get(phoneNumber);
    return session ? session.otp : this.generateOTP();
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
    
    this.stopHeartbeat(); // Stop heartbeat before reset
    
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
    this.reconnectAttempts = 0; // Reset reconnect attempts

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

  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing heartbeat
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.socket) {
        this.lastHeartbeat = Date.now();
        // Send a very lightweight ping to keep connection alive
        try {
          this.socket.sendPresenceUpdate('available');
        } catch (error) {
          console.log('⚠️ Heartbeat failed, connection may be lost');
          // Don't force disconnect here, let Baileys handle it
        }
      }
    }, 60000); // Heartbeat every 60 seconds (less frequent to avoid timeouts)
    
    console.log('💓 Heartbeat monitoring started (60s intervals)');
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('💔 Heartbeat monitoring stopped');
    }
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