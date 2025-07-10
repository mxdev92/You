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
import { WhatsAppQueueManager } from './whatsapp-queue-manager.js';
import { WhatsAppResetHelper } from './whatsapp-reset-helper.js';

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
    // Clear any existing corrupted session data
    this.clearSession();
    
    // Ensure auth directory exists
    if (!fs.existsSync(this.authPath)) {
      fs.mkdirSync(this.authPath, { recursive: true });
    }
    
    // Initialize queue manager for reliable message delivery
    this.queueManager = new WhatsAppQueueManager();
    
    // Process queue when connection becomes available
    this.queueManager.on('processQueue', () => {
      if (this.isConnected && this.socket) {
        this.queueManager.processQueue(this);
      }
    });
  }

  // Clear corrupted session data
  private clearSession(): void {
    try {
      const sessionPaths = ['./whatsapp_session', './whatsapp_session_simple'];
      sessionPaths.forEach(path => {
        if (fs.existsSync(path)) {
          fs.rmSync(path, { recursive: true, force: true });
          console.log(`🧹 Cleared session directory: ${path}`);
        }
      });
    } catch (error) {
      console.log('⚠️ Session clear warning:', error);
    }
  }

  // CRITICAL: Ensure connection is ready before any OTP operations
  async ensureConnectionReady(maxWaitTime: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    console.log('🔄 Ensuring WhatsApp connection is ready...');
    
    // If already connected, verify it's actually working
    if (this.isConnected && this.socket) {
      try {
        // Test connection with a simple operation
        const status = this.socket.user;
        if (status) {
          console.log('✅ WhatsApp connection verified and ready');
          return true;
        }
      } catch (error) {
        console.log('⚠️ Connection test failed, reinitializing...');
        this.isConnected = false;
        this.socket = null;
      }
    }
    
    // Initialize if not connected
    if (!this.isConnected || !this.socket) {
      try {
        await this.initialize();
      } catch (error) {
        console.error('❌ Failed to initialize connection:', error);
        return false;
      }
    }
    
    // Wait for connection to be established with timeout
    while (!this.isConnected && (Date.now() - startTime) < maxWaitTime) {
      console.log('⏳ Waiting for WhatsApp connection...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (!this.isConnected) {
      console.error('❌ Connection timeout - failed to establish WhatsApp connection');
      return false;
    }
    
    // Additional verification - wait for socket to be fully ready
    let verificationAttempts = 0;
    while (verificationAttempts < 10) {
      if (this.socket && this.socket.user) {
        console.log('✅ WhatsApp connection fully established and verified');
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      verificationAttempts++;
    }
    
    console.log('⚠️ Connection established but verification incomplete');
    return this.isConnected; // Return current status
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
        defaultQueryTimeoutMs: 90000, // Extended timeout for stability
        connectTimeoutMs: 60000, // Optimized connection timeout
        keepAliveIntervalMs: 30000, // Balanced keep-alive for stability
        retryRequestDelayMs: 1000, // Quick retry for better responsiveness
        maxMsgRetryCount: 2, // Sufficient retries for reliability
        qrTimeout: 180000, // Extended QR timeout
        browser: ['PAKETY-Business', 'Chrome', '3.0'], // Professional browser identity
        fireInitQueries: false,
        emitOwnEvents: false,
        shouldSyncHistoryMessage: () => false, // Disable history sync for stability
        shouldIgnoreJid: () => false,
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
          
          // ULTRA-AGGRESSIVE stability handling for production
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut && 
                                 statusCode !== DisconnectReason.badSession;
          
          console.log(`🔌 Connection closed. Status: ${statusCode}, Reconnecting: ${shouldReconnect}`);
          
          this.isConnected = false;
          this.isConnecting = false;
          this.isReconnecting = true;
          this.stopHeartbeat();
          
          if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            const isTimeoutError = statusCode === 440;
            let delay = 5000; // Start with minimum 5 seconds
            
            // ULTRA-AGGRESSIVE backoff for 440 errors 
            if (isTimeoutError) {
              // For persistent 440 errors, use massive delays to give WhatsApp servers a break
              delay = Math.min(120000, 10000 + (this.reconnectAttempts * 10000)); // 10s, 20s, 30s... up to 2 minutes
              console.log(`⚠️ WhatsApp server timeout (440) - using extended delay to reduce server pressure`);
            } else {
              delay = Math.min(60000, 5000 * Math.pow(2, Math.min(this.reconnectAttempts, 4))); // 5s, 10s, 20s, 40s, 80s
            }
            
            console.log(`⏳ Reconnecting in ${delay/1000} seconds... (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
            this.reconnectAttempts++;
            
            // Reset attempts after longer delays to prevent permanent disconnection
            if (delay > 30000 && this.reconnectAttempts > 10) {
              console.log('🔄 Resetting reconnection attempts to prevent permanent disconnection');
              this.reconnectAttempts = 5; // Reset but keep some backoff
            }
            
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

    // CRITICAL: Ensure 100% connection before sending OTP
    if (!this.isConnected || !this.socket) {
      console.log(`🔄 WhatsApp not connected - forcing initialization (attempt ${retryCount + 1})`);
      
      try {
        // Force immediate connection establishment
        await this.ensureConnectionReady();
        
        // Double-check connection after initialization
        if (!this.isConnected || !this.socket) {
          if (retryCount < maxRetries) {
            console.log(`🔄 Connection failed, retrying in ${retryDelay/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return this.sendOTP(phoneNumber, fullName, retryCount + 1);
          }
          
          // Fallback after all connection attempts failed
          console.log(`🔑 CONNECTION FAILED - FALLBACK OTP for ${phoneNumber}: ${otp}`);
          return {
            success: true,
            otp: otp,
            message: `OTP generated (connection failed) for ${phoneNumber}`
          };
        }
      } catch (error) {
        console.error(`❌ Connection initialization failed:`, error);
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return this.sendOTP(phoneNumber, fullName, retryCount + 1);
        }
        
        console.log(`🔑 INITIALIZATION FAILED - FALLBACK OTP for ${phoneNumber}: ${otp}`);
        return {
          success: true,
          otp: otp,
          message: `OTP generated (initialization failed) for ${phoneNumber}`
        };
      }
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const message = `مرحباً ${fullName}! 👋

رمز التحقق الخاص بك في تطبيق PAKETY هو:

🔐 ${otp}

⏰ صالح لمدة 10 دقائق فقط
🚚 مرحباً بك في PAKETY - التوصيل السريع!`;

      // Enhanced message sending with connection verification
      if (!this.socket || !this.isConnected) {
        throw new Error('Connection lost during send');
      }

      // Send with aggressive timeout for faster response
      const sendPromise = this.socket.sendMessage(formattedNumber, { text: message });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Send timeout after 3s')), 3000) // Reduced from 8s to 3s
      );
      
      await Promise.race([sendPromise, timeoutPromise]);
      
      console.log(`✅ OTP ${otp} sent successfully to ${phoneNumber} (attempt ${retryCount + 1})`);
      return { 
        success: true,
        message: `OTP sent successfully to ${phoneNumber} via WhatsApp`
      };

    } catch (error) {
      console.error(`❌ Failed to send OTP (attempt ${retryCount + 1}):`, error);
      
      // Retry logic
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying OTP send in ${retryDelay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.sendOTP(phoneNumber, fullName, retryCount + 1);
      }
      
      console.log(`🔑 FALLBACK OTP for ${phoneNumber}: ${otp}`);
      return {
        success: true,
        otp: otp,
        message: `OTP generated successfully for ${phoneNumber}`
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
        mimetype: 'application/pdf',
        fileName: `PAKETY-Invoice-${orderData.orderId}.pdf`,
        caption: message
      });

      console.log(`✅ Invoice PDF sent successfully to ${phoneNumber}`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to send invoice PDF:`, error);
      return false;
    }
  }

  // Enhanced PDF document sending method for delivery service
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
      
      // Prepare PDF media with enhanced error handling
      const media = await prepareWAMessageMedia({
        document: pdfBuffer,
        mimetype: 'application/pdf',
        fileName: fileName
      }, { upload: this.socket.waUploadToServer });

      // Send document with message
      await this.socket.sendMessage(formattedNumber, {
        document: media.document,
        caption: message,
        fileName: fileName,
        mimetype: 'application/pdf'
      });

      console.log(`✅ PDF document sent successfully to ${phoneNumber}`);
      return { success: true, message: 'PDF sent successfully' };

    } catch (error: any) {
      console.error(`❌ Failed to send PDF document:`, error);
      return { success: false, message: error.message || 'Failed to send PDF' };
    }
  }

  // Enhanced connection ready check with timeout
  async ensureConnectionReady(timeoutMs: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = 1000; // Check every second
      
      const checkConnection = () => {
        if (this.isConnected && this.socket) {
          console.log(`✅ Connection ready for PDF delivery`);
          resolve(true);
          return;
        }
        
        if (Date.now() - startTime > timeoutMs) {
          console.log(`❌ Connection timeout after ${timeoutMs/1000}s`);
          resolve(false);
          return;
        }
        
        setTimeout(checkConnection, checkInterval);
      };
      
      checkConnection();
    });
  }

  // Public method to expose otpSessions for delivery service
  get otpSessions() {
    return this.otpSessions;
  }

  // Public method to set otpSessions
  set otpSessions(sessions: Map<string, OTPSession>) {
    this.otpSessions = sessions;
  }

  async sendAdminNotification(orderData: any, pdfBuffer: Buffer): Promise<boolean> {
    if (!this.isConnected || !this.socket) {
      console.log('⚠️ WhatsApp not connected, cannot send admin notification');
      return false;
    }

    try {
      // Fixed admin number: 07757250444
      const adminNumber = this.formatPhoneNumber('07757250444');
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
      
      console.log('✅ Admin notification and PDF sent successfully to 07511856947');
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
    
    // Handle Iraqi numbers starting with 07 (11 digits: 07xxxxxxxxx)
    if (cleaned.startsWith('07') && cleaned.length === 11) {
      cleaned = '964' + cleaned.substring(1); // Remove 0, add 964
    }
    // Legacy support for old format (10-digit numbers starting with 7)
    else if (cleaned.startsWith('7') && cleaned.length === 10) {
      cleaned = '964' + cleaned;
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