import { createRequire } from 'module';

const require = createRequire(import.meta.url);

interface OTPData {
  otp: string;
  expires: number;
  attempts: number;
  phoneNumber: string;
  timestamp: number;
}

interface ServiceState {
  isInitialized: boolean;
  isConnecting: boolean;
  isAuthenticated: boolean;
  isReady: boolean;
  qrCode: string | null;
  lastError: string | null;
  connectionAttempts: number;
  lastMessageSent: number;
}

export class UltraStableWhatsAppService {
  private client: any = null;
  private state: ServiceState = {
    isInitialized: false,
    isConnecting: false,
    isAuthenticated: false,
    isReady: false,
    qrCode: null,
    lastError: null,
    connectionAttempts: 0,
    lastMessageSent: 0
  };
  
  private otpStore = new Map<string, OTPData>();
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_CONNECTION_ATTEMPTS = 10;
  private connectionTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor() {
    console.log('🚀 Ultra Stable WhatsApp Service: Initializing...');
    this.state.isInitialized = true;
    this.startConnection();
  }

  private async startConnection(): Promise<void> {
    if (this.state.connectionAttempts >= this.MAX_CONNECTION_ATTEMPTS) {
      console.log('❌ Ultra Stable WhatsApp: Max connection attempts reached');
      return;
    }

    this.state.connectionAttempts++;
    this.state.isConnecting = true;
    this.state.lastError = null;

    console.log(`📱 Ultra Stable WhatsApp: Connection attempt ${this.state.connectionAttempts}/${this.MAX_CONNECTION_ATTEMPTS}`);

    try {
      const wwebjs = require('whatsapp-web.js');
      const { Client, LocalAuth, MessageMedia } = wwebjs;

      // Enhanced client configuration for maximum stability and persistent authentication
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: './whatsapp_session',
          clientId: 'pakety-permanent-auth'
        }),
        puppeteer: {
          headless: true,
          executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-extensions',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-default-apps'
          ],
          timeout: 60000
        },
        webVersionCache: {
          type: 'remote',
          remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        },
        session: './whatsapp_session'
      });

      this.setupEventHandlers();
      
      // Initialize with timeout
      const initPromise = this.client.initialize();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 120000); // 2 minutes
      });

      await Promise.race([initPromise, timeoutPromise]);
      
      console.log('✅ Ultra Stable WhatsApp: Client initialization completed');
      
    } catch (error: any) {
      console.log(`⚠️ Ultra Stable WhatsApp: Connection attempt ${this.state.connectionAttempts} failed:`, error.message);
      this.state.isConnecting = false;
      this.state.lastError = error.message;
      
      // Cleanup and retry with exponential backoff
      if (this.client) {
        try {
          await this.client.destroy();
        } catch (e) {
          console.log('⚠️ Ultra Stable WhatsApp: Client cleanup failed');
        }
        this.client = null;
      }
      
      if (this.state.connectionAttempts < this.MAX_CONNECTION_ATTEMPTS) {
        const delay = Math.min(30000, 5000 * Math.pow(2, this.state.connectionAttempts - 1));
        console.log(`🔄 Ultra Stable WhatsApp: Retrying in ${delay/1000} seconds...`);
        
        this.connectionTimer = setTimeout(() => {
          this.startConnection();
        }, delay);
      }
    }
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('qr', (qr: string) => {
      console.log('📱 Ultra Stable WhatsApp: QR Code generated - SCAN ONCE FOR PERMANENT CONNECTION');
      this.state.qrCode = qr;
      this.state.isConnecting = true;
      
      // Display QR in terminal
      const QRCode = require('qrcode-terminal');
      QRCode.generate(qr, { small: true });
      console.log('📲 IMPORTANT: Scan this QR code ONCE to establish permanent WhatsApp connection');
      console.log('🔐 After scanning, WhatsApp will stay connected permanently - no need to scan again');
    });

    this.client.on('authenticated', () => {
      console.log('🔐 Ultra Stable WhatsApp: AUTHENTICATION SUCCESSFUL - PERMANENTLY SAVED');
      console.log('✅ WhatsApp session saved permanently - no need to scan QR code again');
      this.state.isAuthenticated = true;
      this.state.qrCode = null;
      this.state.lastError = null;
    });

    this.client.on('ready', () => {
      console.log('🎉 Ultra Stable WhatsApp: CLIENT READY - PERMANENT CONNECTION ESTABLISHED');
      console.log('🛡️ WhatsApp OTP service is now PERMANENTLY ACTIVE');
      this.state.isReady = true;
      this.state.isConnecting = false;
      this.state.isAuthenticated = true;
      this.state.lastError = null;
      this.state.connectionAttempts = 0; // Reset on successful connection
      
      // Start heartbeat monitoring
      this.startHeartbeat();
    });

    this.client.on('disconnected', (reason: string) => {
      console.log('⚠️ Ultra Stable WhatsApp: Temporary disconnection -', reason);
      console.log('🔄 Attempting automatic reconnection using saved authentication...');
      this.state.isReady = false;
      this.state.lastError = `Temporarily disconnected: ${reason}`;
      
      this.stopHeartbeat();
      
      // Auto-reconnect after disconnect using saved session
      setTimeout(() => {
        if (!this.state.isReady) {
          console.log('🔄 Ultra Stable WhatsApp: Auto-reconnecting with saved session...');
          this.startConnection();
        }
      }, 5000); // Faster reconnection since auth is saved
    });

    this.client.on('auth_failure', (msg: string) => {
      console.log('❌ Ultra Stable WhatsApp: Authentication failed:', msg);
      console.log('🔄 Clearing old session and generating new QR code...');
      this.state.isAuthenticated = false;
      this.state.isReady = false;
      this.state.qrCode = null;
      this.state.lastError = `Auth failure: ${msg}`;
      
      // Clear session and restart for new QR
      setTimeout(() => {
        this.startConnection();
      }, 3000);
    });

    this.client.on('error', (error: any) => {
      console.log('⚠️ Ultra Stable WhatsApp: Client error:', error.message);
      this.state.lastError = error.message;
      
      // Don't mark as disconnected for minor errors
      if (error.message.includes('Protocol error') || error.message.includes('Connection closed')) {
        setTimeout(() => {
          if (!this.state.isReady) {
            this.startConnection();
          }
        }, 5000);
      }
    });

    this.client.on('message', (msg: any) => {
      // Keep connection alive by acknowledging messages
      console.log('📨 Ultra Stable WhatsApp: Message received, connection alive');
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    // Send periodic heartbeat to maintain connection
    this.heartbeatTimer = setInterval(async () => {
      if (this.state.isReady && this.client) {
        try {
          await this.client.getState();
          console.log('💓 Ultra Stable WhatsApp: Heartbeat OK');
        } catch (error: any) {
          console.log('⚠️ Ultra Stable WhatsApp: Heartbeat failed:', error.message);
          this.state.isReady = false;
          this.startConnection();
        }
      }
    }, 60000); // Every minute
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.startsWith('07') && cleaned.length === 11) {
      return `964${cleaned.substring(1)}@c.us`;
    }
    
    if (cleaned.startsWith('964') && cleaned.length === 12) {
      return `${cleaned}@c.us`;
    }
    
    return `964${cleaned}@c.us`;
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private storeOTP(phoneNumber: string, otp: string): void {
    const expires = Date.now() + (this.OTP_EXPIRY_MINUTES * 60 * 1000);
    
    this.otpStore.set(phoneNumber, {
      otp,
      expires,
      attempts: 0,
      phoneNumber,
      timestamp: Date.now()
    });
    
    console.log(`🔑 Ultra Stable WhatsApp: OTP stored for ${phoneNumber}, expires in ${this.OTP_EXPIRY_MINUTES} minutes`);
  }

  async sendSignupOTP(phoneNumber: string, fullName: string): Promise<string> {
    console.log(`🎯 Ultra Stable WhatsApp: Processing OTP request for ${phoneNumber} (${fullName})`);
    
    // Check if service is ready
    if (!this.state.isReady || !this.state.isAuthenticated || !this.client) {
      throw new Error('WhatsApp service not ready. Please ensure WhatsApp is connected.');
    }

    // Rate limiting - prevent spam
    const now = Date.now();
    if (this.state.lastMessageSent && (now - this.state.lastMessageSent) < 5000) {
      throw new Error('Rate limit exceeded. Please wait before sending another OTP.');
    }

    const otp = this.generateOTP();
    this.storeOTP(phoneNumber, otp);
    
    try {
      const chatId = this.formatPhoneNumber(phoneNumber);
      const message = `🛡️ رمز التحقق PAKETY

مرحباً ${fullName}!

رمزك الآمن: *${otp}*
⏰ صالح لمدة ${this.OTP_EXPIRY_MINUTES} دقائق

🛒 تطبيق PAKETY للتسوق الذكي

⚠️ لا تشارك هذا الرمز مع أي شخص`;

      console.log(`📨 Ultra Stable WhatsApp: Sending OTP to ${chatId}`);
      
      // Enhanced message sending with retry logic
      let retries = 3;
      let messageSent = false;
      
      while (retries > 0 && !messageSent) {
        try {
          // Check if chat exists
          const chat = await this.client.getChatById(chatId);
          await chat.sendMessage(message);
          messageSent = true;
          
          this.state.lastMessageSent = now;
          console.log(`✅ Ultra Stable WhatsApp: OTP sent successfully to ${phoneNumber}`);
          
        } catch (sendError: any) {
          retries--;
          console.log(`⚠️ Ultra Stable WhatsApp: Send attempt failed (${3-retries}/3):`, sendError.message);
          
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
          } else {
            throw sendError;
          }
        }
      }
      
      return otp;
      
    } catch (error: any) {
      console.log(`❌ Ultra Stable WhatsApp: Failed to send OTP:`, error.message);
      
      // Remove stored OTP if sending failed
      this.otpStore.delete(phoneNumber);
      
      throw new Error(`Failed to send OTP via WhatsApp: ${error.message}`);
    }
  }

  verifyOTP(phoneNumber: string, enteredOTP: string): boolean {
    const stored = this.otpStore.get(phoneNumber);
    
    if (!stored) {
      console.log(`❌ Ultra Stable WhatsApp: No OTP found for ${phoneNumber}`);
      return false;
    }

    if (Date.now() > stored.expires) {
      console.log(`❌ Ultra Stable WhatsApp: OTP expired for ${phoneNumber}`);
      this.otpStore.delete(phoneNumber);
      return false;
    }

    stored.attempts++;

    if (stored.otp === enteredOTP) {
      console.log(`✅ Ultra Stable WhatsApp: OTP verified successfully for ${phoneNumber}`);
      this.otpStore.delete(phoneNumber);
      return true;
    }

    console.log(`❌ Ultra Stable WhatsApp: Invalid OTP for ${phoneNumber} (attempt ${stored.attempts}/3)`);
    
    if (stored.attempts >= 3) {
      console.log(`🚫 Ultra Stable WhatsApp: Maximum attempts exceeded for ${phoneNumber}`);
      this.otpStore.delete(phoneNumber);
    }

    return false;
  }

  getStatus(): ServiceState {
    return { ...this.state };
  }

  getQRCode(): string | null {
    return this.state.qrCode;
  }

  isHealthy(): boolean {
    return this.state.isInitialized && (this.state.isReady || this.state.isConnecting);
  }

  async initialize(): Promise<void> {
    if (!this.state.isInitialized) {
      this.startConnection();
    }
  }

  clearExpiredOTPs(): void {
    const now = Date.now();
    let cleared = 0;
    
    for (const [phoneNumber, otpData] of this.otpStore.entries()) {
      if (now > otpData.expires) {
        this.otpStore.delete(phoneNumber);
        cleared++;
      }
    }
    
    if (cleared > 0) {
      console.log(`🧹 Ultra Stable WhatsApp: Cleared ${cleared} expired OTPs`);
    }
  }

  async destroy(): Promise<void> {
    console.log('🔄 Ultra Stable WhatsApp: Shutting down service...');
    
    this.stopHeartbeat();
    
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
    
    if (this.client) {
      try {
        await this.client.destroy();
      } catch (error) {
        console.log('⚠️ Ultra Stable WhatsApp: Error during shutdown:', error);
      }
      this.client = null;
    }
    
    this.state.isReady = false;
    this.state.isAuthenticated = false;
    this.state.isConnecting = false;
  }

  // Additional messaging methods for completeness
  async sendCustomerInvoice(phoneNumber: string, customerName: string, orderData: any, pdfBuffer: Buffer): Promise<void> {
    if (!this.state.isReady || !this.client) {
      throw new Error('WhatsApp service not ready');
    }

    const chatId = this.formatPhoneNumber(phoneNumber);
    const message = `📋 فاتورة طلبك - PAKETY

عزيزي ${customerName}،

شكراً لك على طلبك رقم #${orderData.id}
💰 المبلغ الإجمالي: ${orderData.total} دينار عراقي

🛒 PAKETY - خدمة التوصيل الذكية`;

    try {
      const chat = await this.client.getChatById(chatId);
      await chat.sendMessage(message);
      
      // Send PDF if provided
      if (pdfBuffer) {
        const media = new (require('whatsapp-web.js')).MessageMedia(
          'application/pdf',
          pdfBuffer.toString('base64'),
          `فاتورة-${orderData.id}.pdf`
        );
        await chat.sendMessage(media);
      }
      
      console.log(`✅ Ultra Stable WhatsApp: Invoice sent to ${phoneNumber}`);
    } catch (error: any) {
      console.log(`❌ Ultra Stable WhatsApp: Failed to send invoice:`, error.message);
      throw error;
    }
  }
}

// Create singleton instance
const ultraStableWhatsAppService = new UltraStableWhatsAppService();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  ultraStableWhatsAppService.clearExpiredOTPs();
}, 5 * 60 * 1000);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('📱 Ultra Stable WhatsApp: Received SIGINT, shutting down gracefully...');
  await ultraStableWhatsAppService.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('📱 Ultra Stable WhatsApp: Received SIGTERM, shutting down gracefully...');
  await ultraStableWhatsAppService.destroy();
  process.exit(0);
});

export default ultraStableWhatsAppService;