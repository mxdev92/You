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

export class BaileysWhatsAppFreshService {
  private socket: WASocket | null = null;
  private qrCode: string | null = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private otpSessions: Map<string, OTPSession> = new Map();
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly authPath = './whatsapp_session_fresh';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 50;
  private reconnectDelay: number = 2000;
  private connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected' = 'disconnected';
  private lastConnectionTime: number = 0;
  private connectionStabilityCheck: NodeJS.Timeout | null = null;

  constructor() {
    // Only clear sessions if explicitly corrupted, otherwise preserve them
    this.preserveValidSessions();
    
    // Ensure auth directory exists
    if (!fs.existsSync(this.authPath)) {
      fs.mkdirSync(this.authPath, { recursive: true });
    }
  }

  // Only clear corrupted sessions, preserve valid ones for persistent auth
  private preserveValidSessions(): void {
    try {
      // Check if we have a valid session
      const sessionExists = fs.existsSync(this.authPath) && 
                           fs.readdirSync(this.authPath).length > 0;
      
      if (sessionExists) {
        console.log('🔒 Preserving existing WhatsApp session for persistent authentication');
      } else {
        console.log('📱 No existing session found, will require QR scan for initial setup');
      }
      
      // Only clear other session directories that might conflict
      const conflictPaths = [
        './whatsapp_session', 
        './whatsapp_session_simple'
      ];
      
      conflictPaths.forEach(path => {
        if (fs.existsSync(path) && path !== this.authPath) {
          fs.rmSync(path, { recursive: true, force: true });
          console.log(`🧹 Cleared conflicting session: ${path}`);
        }
      });
    } catch (error) {
      console.log('⚠️ Session check warning:', error);
    }
  }

  // Method to manually reset sessions if needed
  public clearAllSessions(): void {
    try {
      const sessionPaths = [
        './whatsapp_session', 
        './whatsapp_session_simple', 
        './whatsapp_session_fresh',
        './baileys_auth_info'
      ];
      
      sessionPaths.forEach(path => {
        if (fs.existsSync(path)) {
          fs.rmSync(path, { recursive: true, force: true });
          console.log(`🧹 Manually cleared session: ${path}`);
        }
      });
    } catch (error) {
      console.log('⚠️ Session clear warning:', error);
    }
  }

  async initialize(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      console.log('🔄 Already initializing or connected');
      return;
    }

    console.log('🚀 Initializing FRESH Baileys WhatsApp service...');
    this.isConnecting = true;

    try {
      // Get latest version
      const { version, isLatest } = await fetchLatestBaileysVersion();
      console.log(`📱 Using Baileys version ${version.join(',')}, latest: ${isLatest}`);

      // Setup completely fresh auth state
      const { state, saveCreds } = await useMultiFileAuthState(this.authPath);

      // Create minimal logger
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

      // Create socket with ultra-stable configuration
      this.socket = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        printQRInTerminal: false,
        logger: logger,
        browser: ['PAKETY Ultra-Stable', 'Chrome', '122.0.0.0'],
        syncFullHistory: false,
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: false,
        connectTimeoutMs: 120000,
        defaultQueryTimeoutMs: 90000,
        keepAliveIntervalMs: 15000,
        retryRequestDelayMs: 500,
        maxMsgRetryCount: 10,
        shouldSyncHistoryMessage: () => false,
        shouldIgnoreJid: () => false,
        getMessage: async (key) => {
          return { conversation: 'Fresh message' }
        }
      });

      // Handle credentials update
      this.socket.ev.on('creds.update', saveCreds);

      // Handle connection updates
      this.socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        console.log(`🔄 Fresh connection update: ${connection}`);

        if (qr) {
          console.log('📱 Fresh QR Code received, generating...');
          try {
            this.qrCode = await QRCode.toDataURL(qr, {
              errorCorrectionLevel: 'H',
              type: 'image/png',
              quality: 1.0,
              margin: 4,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              },
              width: 400
            });
            console.log('✅ Fresh QR Code generated successfully');
          } catch (error) {
            console.error('❌ QR Code generation failed:', error);
          }
        }

        if (connection === 'open') {
          console.log('🎉 Fresh WhatsApp connected successfully with persistent authentication!');
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.qrCode = null;
          this.lastConnectionTime = Date.now();
        } else if (connection === 'connecting') {
          console.log('🔄 Fresh WhatsApp connecting...');
          this.isConnecting = true;
        } else if (connection === 'close') {
          this.isConnected = false;
          this.isConnecting = false;
          
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          
          console.log(`📤 Fresh connection closed. Status: ${statusCode}, Should reconnect: ${shouldReconnect}`);
          
          if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            
            // Only clear session if we've failed many times AND it's not a network issue
            if (this.reconnectAttempts > 10 && statusCode !== DisconnectReason.connectionLost) {
              console.log('⚠️ Multiple reconnection failures, clearing session as last resort');
              this.clearAllSessions();
            }
            
            console.log(`🔄 Fresh reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} (preserving auth)`);
            
            // Exponential backoff for reconnection
            const delay = Math.min(5000 * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
            setTimeout(async () => {
              try {
                await this.initialize();
              } catch (error) {
                console.error('❌ Fresh reconnection failed:', error);
              }
            }, delay);
          }
        }
      });

    } catch (error) {
      console.error('❌ Fresh WhatsApp initialization failed:', error);
      this.isConnected = false;
      this.isConnecting = false;
      throw error;
    }
  }

  // Get QR code for scanning
  getQRCode(): string | null {
    return this.qrCode;
  }

  // Get connection status
  getStatus() {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      qrAvailable: !!this.qrCode
    };
  }

  // Expose otpSessions for compatibility
  get otpSessions() {
    return this.otpSessions;
  }

  set otpSessions(sessions: Map<string, OTPSession>) {
    this.otpSessions = sessions;
  }

  // Send OTP message
  async sendOTP(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.isConnected || !this.socket) {
      console.log('⚠️ Fresh WhatsApp not connected for OTP');
      return false;
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      await this.socket.sendMessage(formattedNumber, { text: message });
      console.log(`✅ Fresh OTP sent to ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error('❌ Fresh OTP send failed:', error);
      return false;
    }
  }

  // Format phone number for WhatsApp
  private formatPhoneNumber(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.startsWith('07') && cleaned.length === 11) {
      cleaned = '964' + cleaned.substring(1);
    } else if (cleaned.startsWith('7') && cleaned.length === 10) {
      cleaned = '964' + cleaned;
    }
    
    return cleaned + '@s.whatsapp.net';
  }

  // Enhanced connection readiness with persistent authentication
  async ensureConnectionReady(maxWaitTime: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    console.log('🔄 Ensuring fresh WhatsApp connection is ready with persistent auth...');
    
    // If already connected, verify the connection is actually working
    if (this.isConnected && this.socket) {
      try {
        // Test the connection by checking socket state
        if (this.socket.readyState === this.socket.OPEN) {
          console.log('✅ Fresh WhatsApp connection verified and ready');
          return true;
        }
      } catch (error) {
        console.log('⚠️ Connection test failed, will reinitialize');
        this.isConnected = false;
      }
    }
    
    // Initialize or reconnect if needed
    if (!this.isConnected || !this.socket) {
      try {
        await this.initialize();
      } catch (error) {
        console.error('❌ Failed to initialize fresh connection:', error);
        return false;
      }
    }
    
    // Wait for connection with improved checking
    let lastLogTime = 0;
    while (!this.isConnected && (Date.now() - startTime) < maxWaitTime) {
      const now = Date.now();
      if (now - lastLogTime > 5000) { // Log every 5 seconds
        const elapsed = Math.round((now - startTime) / 1000);
        console.log(`⏳ Waiting for fresh WhatsApp connection... (${elapsed}s elapsed)`);
        lastLogTime = now;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (this.isConnected) {
      console.log('✅ Fresh WhatsApp connection established and ready for PDF delivery');
      return true;
    } else {
      console.log('❌ Fresh WhatsApp connection timeout - PDF delivery may fail');
      return false;
    }
  }

  // Check if we have valid saved credentials
  public hasValidCredentials(): boolean {
    try {
      const sessionExists = fs.existsSync(this.authPath) && 
                           fs.readdirSync(this.authPath).length > 0;
      
      if (sessionExists) {
        // Check for key files
        const credsFile = path.join(this.authPath, 'creds.json');
        return fs.existsSync(credsFile);
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // Get connection status with more details
  getDetailedStatus() {
    const hasCredentials = this.hasValidCredentials();
    const uptime = this.lastConnectionTime ? Date.now() - this.lastConnectionTime : 0;
    
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      qrAvailable: !!this.qrCode,
      hasValidCredentials,
      reconnectAttempts: this.reconnectAttempts,
      uptime: Math.round(uptime / 1000), // seconds
      requiresQR: !hasCredentials && !this.isConnected
    };
  }

  // Send admin notification
  async sendAdminNotification(orderData: any, pdfBuffer: Buffer): Promise<boolean> {
    // Ensure connection is ready before sending
    const connectionReady = await this.ensureConnectionReady(15000);
    if (!connectionReady) {
      console.log('⚠️ Fresh WhatsApp connection not ready for admin notification');
      return false;
    }

    try {
      const adminNumber = this.formatPhoneNumber('07511856947'); // Updated admin number
      console.log(`📱 Sending fresh admin notification to ${adminNumber}`);
      
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
      
      console.log('✅ Fresh admin notification and PDF sent successfully to 07757250444');
      return true;
    } catch (error) {
      console.error('❌ Fresh admin notification failed:', error);
      return false;
    }
  }

  // Reset connection completely
  async resetConnection(): Promise<void> {
    console.log('🔄 Resetting fresh WhatsApp connection...');
    
    if (this.socket) {
      this.socket.end();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.qrCode = null;
    this.reconnectAttempts = 0;
    
    // Clear all sessions
    this.clearAllSessions();
    
    // Wait a moment then reinitialize
    setTimeout(() => {
      this.initialize();
    }, 2000);
  }

  // Reset session (alias for compatibility)
  async resetSession(): Promise<void> {
    return this.resetConnection();
  }

  // Verify OTP (required for existing code)
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

  // Send order invoice (required for existing code)
  async sendOrderInvoice(phoneNumber: string, pdfBuffer: Buffer, order: any): Promise<boolean> {
    if (!this.isConnected || !this.socket) {
      console.log('⚠️ Fresh WhatsApp not connected for order invoice');
      return false;
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      // Prepare PDF media
      const media = await prepareWAMessageMedia({
        document: pdfBuffer,
        mimetype: 'application/pdf',
        fileName: `PAKETY-Invoice-${order.id}.pdf`
      }, { upload: this.socket.waUploadToServer });

      // Send customer invoice message
      const message = `📋 شكراً لطلبكم من PAKETY!

رقم الطلب: ${order.id}
المبلغ الإجمالي: ${order.totalAmount.toLocaleString()} د.ع

سيتم التواصل معكم لترتيب عملية التسليم في أقرب وقت.

شكراً لثقتكم بنا! 🙏`;

      await this.socket.sendMessage(formattedNumber, { text: message });
      
      // Send PDF invoice
      await this.socket.sendMessage(formattedNumber, {
        document: media.document,
        caption: `📊 فاتورة طلبكم - رقم ${order.id}`,
        fileName: `PAKETY-Invoice-${order.id}.pdf`,
        mimetype: 'application/pdf'
      });
      
      console.log(`✅ Fresh order invoice sent to ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error('❌ Fresh order invoice send failed:', error);
      return false;
    }
  }

  // Send PDF document (required for ultra-stable PDF delivery)
  async sendPDFDocument(
    phoneNumber: string, 
    pdfBuffer: Buffer, 
    fileName: string, 
    message: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📄 Sending PDF document to ${phoneNumber}`);
      
      if (!this.isConnected || !this.socket) {
        return { success: false, message: 'WhatsApp not connected' };
      }

      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      // Prepare PDF media
      const media = await prepareWAMessageMedia({
        document: pdfBuffer,
        mimetype: 'application/pdf',
        fileName: fileName
      }, { upload: this.socket.waUploadToServer });

      // Send PDF document
      await this.socket.sendMessage(formattedNumber, {
        document: media.document,
        caption: message,
        fileName: fileName,
        mimetype: 'application/pdf'
      });
      
      console.log(`✅ PDF document sent successfully to ${phoneNumber}`);
      return { success: true, message: 'PDF sent successfully' };
    } catch (error: any) {
      console.error(`❌ PDF document send failed to ${phoneNumber}:`, error);
      return { success: false, message: error.message || 'Failed to send PDF' };
    }
  }

  // Send order status update (required for existing code)
  async sendOrderStatusUpdate(phoneNumber: string, customerName: string, order: any, status: string): Promise<boolean> {
    if (!this.isConnected || !this.socket) {
      console.log('⚠️ Fresh WhatsApp not connected for status update');
      return false;
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      const statusMessages: { [key: string]: string } = {
        'pending': '⏳ طلبكم قيد المراجعة',
        'confirmed': '✅ تم تأكيد طلبكم وسيتم التحضير قريباً',
        'preparing': '👨‍🍳 جاري تحضير طلبكم',
        'out-for-delivery': '🚚 طلبكم في الطريق إليكم',
        'delivered': '🎉 تم تسليم طلبكم بنجاح',
        'cancelled': '❌ تم إلغاء طلبكم'
      };

      const message = `📱 تحديث حالة الطلب - PAKETY

👤 عزيز/عزيزة ${customerName}
📋 رقم الطلب: ${order.id}
📊 الحالة: ${statusMessages[status] || status}

شكراً لثقتكم بنا! 🙏`;

      await this.socket.sendMessage(formattedNumber, { text: message });
      console.log(`✅ Fresh status update sent to ${phoneNumber}: ${status}`);
      return true;
    } catch (error) {
      console.error('❌ Fresh status update send failed:', error);
      return false;
    }
  }
}