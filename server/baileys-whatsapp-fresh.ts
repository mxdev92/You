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
  private maxReconnectAttempts: number = 15;         // Reduced from 50 to prevent endless loops
  private reconnectDelay: number = 3000;             // Increased base delay
  private stableConnectionTimeout: number = 90000;   // 90 seconds timeout
  private connectionVerificationEnabled: boolean = true;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastSuccessfulConnection: number = 0;
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

      // Create socket with production-grade stability configuration
      this.socket = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        printQRInTerminal: false,
        logger: logger,
        // Production-optimized browser identification
        browser: ['PAKETY-Production', 'Desktop', '1.0.0'],
        
        // CORE STABILITY SETTINGS
        syncFullHistory: false,               // Reduce initial load
        markOnlineOnConnect: false,           // Prevent phone notifications  
        generateHighQualityLinkPreview: false, // Save bandwidth
        
        // TIMEOUT CONFIGURATIONS (Production Values)
        connectTimeoutMs: 90000,              // 90s connection timeout
        defaultQueryTimeoutMs: 90000,         // 90s query timeout  
        keepAliveIntervalMs: 25000,           // 25s keepalive (production stable)
        
        // RETRY LOGIC OPTIMIZATION
        retryRequestDelayMs: 3000,            // 3s retry delay
        maxMsgRetryCount: 5,                  // Increased retry attempts
        
        // MESSAGE HANDLING OPTIMIZATION
        shouldSyncHistoryMessage: () => false,
        shouldIgnoreJid: () => false,
        getMessage: async (key) => {
          return { conversation: 'PAKETY message' }
        },
        
        // ADDITIONAL STABILITY FEATURES
        transactionOpts: {
          maxCommitRetries: 10,
          delayBetweenTriesMs: 2000
        },
        
        // PRODUCTION WEBSOCKET CONFIG
        socketConfig: {
          timeout: 90000
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
          this.lastSuccessfulConnection = Date.now();
          this.connectionQuality = 'excellent';
          
          // Start connection health monitoring
          this.startHealthCheck();
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
            
            // Handle specific error codes with targeted solutions
            if (statusCode === 440) {
              console.log('🔧 440 Login timeout detected - clearing auth state');
              this.clearAllSessions();
            } else if (this.reconnectAttempts > 8 && statusCode !== DisconnectReason.connectionLost) {
              console.log('⚠️ Multiple failures detected, clearing corrupted session');
              this.clearAllSessions();
            }
            
            console.log(`🔄 Fresh reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} (Error: ${statusCode})`);
            
            // Production-grade exponential backoff with jitter
            const baseDelay = 3000; // Start with 3 seconds
            const exponentialDelay = baseDelay * Math.pow(2, Math.min(this.reconnectAttempts - 1, 4));
            const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
            const finalDelay = Math.min(exponentialDelay + jitter, 45000); // Max 45 seconds
            
            console.log(`⏱️ Reconnecting in ${Math.round(finalDelay/1000)}s...`);
            
            setTimeout(async () => {
              try {
                await this.initialize();
              } catch (error) {
                console.error('❌ Fresh reconnection failed:', error);
              }
            }, finalDelay);
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
      
      // Validate PDF buffer
      if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
        console.error('❌ Invalid PDF buffer provided for order invoice');
        return false;
      }

      console.log(`📋 Sending order invoice PDF (${pdfBuffer.length} bytes) to ${phoneNumber}`);

      // Send customer invoice message
      const message = `📋 شكراً لطلبكم من PAKETY!

رقم الطلب: ${order.id}
المبلغ الإجمالي: ${order.totalAmount.toLocaleString()} د.ع

سيتم التواصل معكم لترتيب عملية التسليم في أقرب وقت.

شكراً لثقتكم بنا! 🙏`;

      await this.socket.sendMessage(formattedNumber, { text: message });
      
      // Send PDF invoice directly
      await this.socket.sendMessage(formattedNumber, {
        document: pdfBuffer,
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
      
      // Validate PDF buffer
      if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
        console.error('❌ Invalid PDF buffer provided');
        return { success: false, message: 'Invalid PDF buffer' };
      }

      console.log(`📄 PDF buffer size: ${pdfBuffer.length} bytes`);
      
      // First send the text message
      await this.socket.sendMessage(formattedNumber, { text: message });
      
      // Then send the PDF document using proper file handling
      await this.socket.sendMessage(formattedNumber, {
        document: pdfBuffer,
        fileName: fileName,
        mimetype: 'application/pdf'
      });
      
      console.log(`✅ PDF document sent successfully to ${phoneNumber}`);
      return { success: true, message: 'PDF sent successfully' };
    } catch (error: any) {
      console.error(`❌ PDF document send failed to ${phoneNumber}:`, error);
      // Try sending just the text message if PDF fails
      try {
        const formattedNumber = this.formatPhoneNumber(phoneNumber);
        await this.socket.sendMessage(formattedNumber, { text: `${message}\n\n⚠️ PDF delivery failed, please contact admin for invoice` });
        return { success: false, message: 'PDF failed, text message sent' };
      } catch (textError) {
        console.error('Text message also failed:', textError);
        return { success: false, message: error.message || 'Failed to send PDF' };
      }
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

  // Enhanced connection verification methods
  getConnectionStrength(): 'strong' | 'weak' | 'disconnected' {
    if (!this.isConnected) return 'disconnected';
    
    const timeSinceConnection = Date.now() - this.lastConnectionTime;
    if (timeSinceConnection < 60000 && this.connectionQuality === 'excellent') {
      return 'strong';
    } else if (timeSinceConnection < 120000 && this.connectionQuality !== 'disconnected') {
      return 'weak';
    }
    return 'disconnected';
  }

  /**
   * Enhanced connection verification for critical operations
   */
  async ensureConnectionReady(timeoutMs: number = 30000): Promise<boolean> {
    if (!this.connectionVerificationEnabled) {
      return this.isConnected;
    }

    console.log('🔍 Verifying connection readiness for critical operation...');
    
    const startTime = Date.now();
    const checkInterval = 1000; // Check every second
    
    return new Promise((resolve) => {
      const checkConnection = () => {
        const elapsed = Date.now() - startTime;
        
        if (elapsed > timeoutMs) {
          console.log('❌ Connection verification timeout');
          resolve(false);
          return;
        }
        
        // Check if connection is strong and stable
        if (this.isConnected && this.getConnectionStrength() === 'strong') {
          console.log('✅ Connection verified and ready for critical operation');
          resolve(true);
          return;
        }
        
        // If not ready, wait a bit and check again
        setTimeout(checkConnection, checkInterval);
      };
      
      checkConnection();
    });
  }

  // Enhanced status method with connection strength
  getStatus() {
    return {
      connected: this.isConnected,
      connectionQuality: this.connectionQuality,
      connectionStrength: this.getConnectionStrength(),
      uptime: this.lastConnectionTime ? Date.now() - this.lastConnectionTime : 0,
      reconnectAttempts: this.reconnectAttempts,
      lastSuccessfulConnection: this.lastSuccessfulConnection,
      healthCheckActive: !!this.healthCheckInterval
    };
  }

  // Production-grade connection health monitoring
  private startHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        // Check WebSocket readiness
        const wsReady = this.socket.ws && this.socket.ws.readyState === 1; // WebSocket.OPEN
        
        if (!wsReady) {
          console.log('⚠️ WebSocket connection degraded, triggering reconnection');
          this.isConnected = false;
          this.connectionQuality = 'disconnected';
          // Auto-reconnect will be triggered by the connection.update handler
        } else {
          // Connection is healthy
          this.connectionQuality = 'excellent';
          this.lastSuccessfulConnection = Date.now();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  // Stop health monitoring
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // Enhanced disconnect handling
  async disconnect(): Promise<void> {
    this.stopHealthCheck();
    if (this.socket) {
      try {
        await this.socket.logout();
        this.socket.end();
      } catch (error) {
        console.log('Disconnect cleanup error (expected):', error);
      }
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.socket = null;
  }
}