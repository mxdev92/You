import { createRequire } from 'module';
import QRCode from 'qrcode-terminal';

const require = createRequire(import.meta.url);

interface OTPData {
  otp: string;
  expires: number;
  attempts: number;
  phoneNumber: string;
  timestamp: number;
}

interface ConnectionState {
  isReady: boolean;
  isConnecting: boolean;
  isAuthenticated: boolean;
  qrCode: string | null;
  retryCount: number;
  lastError: string | null;
}

export class BulletproofWhatsAppService {
  private client: any = null;
  private state: ConnectionState = {
    isReady: false,
    isConnecting: false,
    isAuthenticated: false,
    qrCode: null,
    retryCount: 0,
    lastError: null
  };
  
  private otpStore = new Map<string, OTPData>();
  private connectionPromise: Promise<void> | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  
  private readonly FIXED_ADMIN_WHATSAPP = '07710155333';
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly RECONNECT_DELAY = 5000; // 5 seconds

  constructor() {
    console.log('🛡️ BULLETPROOF WhatsApp Service: Initializing...');
    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown(): void {
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
    process.on('beforeExit', () => this.shutdown());
  }

  private async shutdown(): Promise<void> {
    console.log('🔄 WhatsApp Service: Graceful shutdown initiated...');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    if (this.client) {
      try {
        await this.client.destroy();
      } catch (error) {
        console.error('Error during WhatsApp client shutdown:', error);
      }
    }
    
    console.log('✅ WhatsApp Service: Shutdown complete');
  }

  async initialize(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._safeInitialize();
    return this.connectionPromise;
  }

  private async _safeInitialize(): Promise<void> {
    if (this.state.isConnecting) {
      console.log('⏳ WhatsApp Service: Already connecting...');
      return;
    }

    this.state.isConnecting = true;
    this.state.retryCount = 0;

    try {
      console.log('🚀 WhatsApp Service: Starting bulletproof initialization...');
      
      // Import WhatsApp Web.js with error handling
      const wwebjs = require('whatsapp-web.js');
      const { Client, LocalAuth, MessageMedia } = wwebjs;

      if (!Client || !LocalAuth) {
        throw new Error('WhatsApp Web.js components not available');
      }

      // Create client with robust configuration
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: './whatsapp_session',
          clientId: 'pakety-bulletproof'
        }),
        puppeteer: {
          headless: true,
          executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-images',
            '--disable-javascript',
            '--disable-default-apps',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--disable-ipc-flooding-protection',
            '--single-process'
          ],
          timeout: 60000
        },
        webVersionCache: {
          type: 'remote',
          remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        }
      });

      // Set up comprehensive event handlers
      this.setupEventHandlers();

      // Initialize client
      console.log('🔌 WhatsApp Service: Starting client initialization...');
      await this.client.initialize();

      console.log('✅ WhatsApp Service: Bulletproof initialization complete');
      this.state.isConnecting = false;
      this.startHeartbeat();
      
    } catch (error) {
      console.error('❌ WhatsApp Service: Initialization failed:', error);
      this.state.isConnecting = false;
      this.state.lastError = error.message;
      this.scheduleReconnect();
      throw error;
    }
  }

  private setupEventHandlers(): void {
    this.client.on('qr', (qr: string) => {
      console.log('📱 WhatsApp Service: QR Code generated');
      this.state.qrCode = qr;
      this.state.isAuthenticated = false;
      
      // Display QR in terminal
      QRCode.generate(qr, { small: true });
      console.log('📲 Scan this QR code with your WhatsApp Business account');
    });

    this.client.on('authenticated', () => {
      console.log('🔐 WhatsApp Service: Authentication successful');
      this.state.isAuthenticated = true;
      this.state.qrCode = null;
      this.state.retryCount = 0;
      this.state.lastError = null;
    });

    this.client.on('auth_failure', (msg: string) => {
      console.error('❌ WhatsApp Service: Authentication failure:', msg);
      this.state.isAuthenticated = false;
      this.state.lastError = `Authentication failed: ${msg}`;
      this.scheduleReconnect();
    });

    this.client.on('ready', () => {
      console.log('🎉 WhatsApp Service: Client ready and operational');
      this.state.isReady = true;
      this.state.isConnecting = false;
      this.state.lastError = null;
      
      // Warm up connection
      this.warmUpConnection();
    });

    this.client.on('disconnected', (reason: string) => {
      console.log('⚠️ WhatsApp Service: Disconnected -', reason);
      this.state.isReady = false;
      this.state.isAuthenticated = false;
      this.state.lastError = `Disconnected: ${reason}`;
      this.scheduleReconnect();
    });

    this.client.on('message', async (msg: any) => {
      // Optional: Handle incoming messages for debugging
      console.log('📨 WhatsApp Service: Received message');
    });

    this.client.on('error', (error: any) => {
      console.error('❌ WhatsApp Service: Client error:', error);
      this.state.lastError = error.message;
    });
  }

  private async warmUpConnection(): Promise<void> {
    try {
      console.log('🔥 WhatsApp Service: Warming up connection...');
      
      // Get client info to ensure connection is active
      const info = await this.client.info;
      console.log('📋 WhatsApp Service: Client info retrieved successfully');
      
      // Test message formatting
      const testChatId = this.formatPhoneNumber(this.FIXED_ADMIN_WHATSAPP);
      console.log('🎯 WhatsApp Service: Connection warmed up successfully');
      
    } catch (error) {
      console.error('⚠️ WhatsApp Service: Warmup failed:', error);
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      try {
        if (this.client && this.state.isReady) {
          await this.client.getState();
          console.log('💓 WhatsApp Service: Heartbeat OK');
        }
      } catch (error) {
        console.error('💔 WhatsApp Service: Heartbeat failed:', error);
        this.state.isReady = false;
        this.scheduleReconnect();
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.state.retryCount >= this.MAX_RETRY_ATTEMPTS) {
      console.error('🚫 WhatsApp Service: Max retry attempts reached');
      return;
    }

    this.state.retryCount++;
    console.log(`🔄 WhatsApp Service: Scheduling reconnect (attempt ${this.state.retryCount}/${this.MAX_RETRY_ATTEMPTS})`);

    this.reconnectTimeout = setTimeout(() => {
      console.log('🔄 WhatsApp Service: Attempting reconnection...');
      this.connectionPromise = null;
      this.initialize().catch(console.error);
    }, this.RECONNECT_DELAY * this.state.retryCount);
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Iraqi phone numbers
    if (cleaned.startsWith('07') && cleaned.length === 11) {
      return `964${cleaned.substring(1)}@c.us`;
    }
    
    // Handle international format
    if (cleaned.startsWith('964') && cleaned.length === 12) {
      return `${cleaned}@c.us`;
    }
    
    // Default format
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
  }

  // PUBLIC METHODS

  async sendSignupOTP(phoneNumber: string, fullName: string): Promise<string> {
    console.log(`🎯 WhatsApp Service: Sending OTP to ${phoneNumber} for ${fullName}`);
    
    // Ensure service is ready
    if (!this.state.isReady) {
      console.log('⚠️ WhatsApp Service: Not ready, initializing...');
      await this.initialize();
      
      // Wait for ready state with timeout
      const startTime = Date.now();
      const timeout = 30000; // 30 seconds
      
      while (!this.state.isReady && (Date.now() - startTime) < timeout) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (!this.state.isReady) {
        throw new Error('WhatsApp service failed to initialize within timeout');
      }
    }

    const otp = this.generateOTP();
    const chatId = this.formatPhoneNumber(phoneNumber);
    
    // Store OTP for verification
    this.storeOTP(phoneNumber, otp);
    
    const message = `🛡️ *رمز التحقق PAKETY*

مرحباً ${fullName}!

رمز التحقق الخاص بك هو: *${otp}*

⏰ صالح لمدة ${this.OTP_EXPIRY_MINUTES} دقائق
🔒 لا تشارك هذا الرمز مع أحد

شكراً لاختيارك PAKETY! 🛒`;

    console.log(`📨 WhatsApp Service: Sending OTP ${otp} to ${chatId}`);

    try {
      // Multiple delivery methods for maximum reliability
      await this.deliverMessageWithRetry(chatId, message, otp, phoneNumber);
      
      console.log(`✅ WhatsApp Service: OTP sent successfully to ${phoneNumber}`);
      return otp;
      
    } catch (error) {
      console.error(`❌ WhatsApp Service: Failed to send OTP to ${phoneNumber}:`, error);
      
      // Log OTP for manual delivery as absolute fallback
      console.log(`🔑 FALLBACK OTP for ${phoneNumber}: ${otp} (expires in ${this.OTP_EXPIRY_MINUTES} minutes)`);
      
      throw new Error(`Failed to send OTP via WhatsApp: ${error.message}`);
    }
  }

  private async deliverMessageWithRetry(chatId: string, message: string, otp: string, phoneNumber: string): Promise<void> {
    const methods = [
      () => this.sendViaDirectMessage(chatId, message),
      () => this.sendViaContact(chatId, message),
      () => this.sendViaChat(chatId, message),
      () => this.sendViaFallback(chatId, message)
    ];

    let lastError: Error | null = null;

    for (let i = 0; i < methods.length; i++) {
      try {
        console.log(`📨 WhatsApp Service: Trying delivery method ${i + 1}/${methods.length}`);
        await methods[i]();
        console.log(`✅ WhatsApp Service: Delivery method ${i + 1} succeeded`);
        return;
      } catch (error) {
        console.log(`⚠️ WhatsApp Service: Delivery method ${i + 1} failed:`, error.message);
        lastError = error;
        
        // Short delay between attempts
        if (i < methods.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    throw lastError || new Error('All delivery methods failed');
  }

  private async sendViaDirectMessage(chatId: string, message: string): Promise<void> {
    await this.client.sendMessage(chatId, message, {
      linkPreview: false,
      sendMediaAsSticker: false,
      parseVCards: false
    });
  }

  private async sendViaContact(chatId: string, message: string): Promise<void> {
    const contact = await this.client.getContactById(chatId);
    if (!contact) {
      throw new Error('Contact not found');
    }
    await contact.sendMessage(message);
  }

  private async sendViaChat(chatId: string, message: string): Promise<void> {
    const chat = await this.client.getChatById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }
    await chat.sendMessage(message);
  }

  private async sendViaFallback(chatId: string, message: string): Promise<void> {
    // Final attempt with minimal options
    await this.client.sendMessage(chatId, message);
  }

  verifyOTP(phoneNumber: string, enteredOTP: string): boolean {
    const stored = this.otpStore.get(phoneNumber);
    
    if (!stored) {
      console.log(`❌ WhatsApp Service: No OTP found for ${phoneNumber}`);
      return false;
    }

    if (Date.now() > stored.expires) {
      console.log(`❌ WhatsApp Service: OTP expired for ${phoneNumber}`);
      this.otpStore.delete(phoneNumber);
      return false;
    }

    stored.attempts++;

    if (stored.otp === enteredOTP) {
      console.log(`✅ WhatsApp Service: OTP verified successfully for ${phoneNumber}`);
      this.otpStore.delete(phoneNumber);
      return true;
    }

    console.log(`❌ WhatsApp Service: Invalid OTP for ${phoneNumber} (attempt ${stored.attempts})`);
    
    // Remove after too many attempts
    if (stored.attempts >= 3) {
      console.log(`🚫 WhatsApp Service: Too many failed attempts for ${phoneNumber}`);
      this.otpStore.delete(phoneNumber);
    }

    return false;
  }

  // Store OTP for verification (used by fallback system)
  storeOTPForVerification(phoneNumber: string, otp: string): void {
    this.storeOTP(phoneNumber, otp);
  }

  // Get service status
  getStatus(): ConnectionState {
    return { ...this.state };
  }

  // Get current QR code
  getQRCode(): string | null {
    return this.state.qrCode;
  }

  // Health check
  isHealthy(): boolean {
    return this.state.isReady && this.state.isAuthenticated && !this.state.lastError;
  }

  // Clear expired OTPs (maintenance)
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
      console.log(`🧹 WhatsApp Service: Cleared ${cleared} expired OTPs`);
    }
  }
}

// Create singleton instance
const bulletproofWhatsAppService = new BulletproofWhatsAppService();

// Auto-initialize on startup
setTimeout(() => {
  bulletproofWhatsAppService.initialize().catch(error => {
    console.error('Failed to auto-initialize WhatsApp service:', error);
  });
}, 2000);

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  bulletproofWhatsAppService.clearExpiredOTPs();
}, 5 * 60 * 1000);

export default bulletproofWhatsAppService;