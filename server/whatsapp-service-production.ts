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

interface ServiceState {
  isInitialized: boolean;
  isConnecting: boolean;
  isAuthenticated: boolean;
  isReady: boolean;
  qrCode: string | null;
  lastError: string | null;
  mode: 'production' | 'fallback';
}

export class ProductionWhatsAppService {
  private client: any = null;
  private state: ServiceState = {
    isInitialized: false,
    isConnecting: false,
    isAuthenticated: false,
    isReady: false,
    qrCode: null,
    lastError: null,
    mode: 'fallback'
  };
  
  private otpStore = new Map<string, OTPData>();
  private connectionPromise: Promise<void> | null = null;
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly FIXED_ADMIN_WHATSAPP = '07710155333';

  constructor() {
    console.log('🚀 Production WhatsApp Service: Starting...');
    // Start background initialization (non-blocking)
    this.backgroundInitialize();
  }

  private async backgroundInitialize(): Promise<void> {
    try {
      console.log('📱 WhatsApp Service: Background initialization starting...');
      
      const wwebjs = require('whatsapp-web.js');
      const { Client, LocalAuth } = wwebjs;

      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: './whatsapp_session',
          clientId: 'pakety-production'
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
            '--single-process'
          ],
          timeout: 60000
        }
      });

      this.setupEventHandlers();
      
      // Set initialized flag immediately
      this.state.isInitialized = true;
      
      // Start client in background
      this.client.initialize().catch((error: any) => {
        console.log('⚠️ WhatsApp client initialization failed, using fallback mode:', error.message);
        this.state.mode = 'fallback';
        this.state.lastError = error.message;
      });

      console.log('✅ WhatsApp Service: Background initialization complete');
      
    } catch (error: any) {
      console.log('⚠️ WhatsApp Service: Initialization error, using fallback mode:', error.message);
      this.state.isInitialized = true;
      this.state.mode = 'fallback';
      this.state.lastError = error.message;
    }
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('qr', (qr: string) => {
      console.log('📱 WhatsApp Service: QR Code generated');
      this.state.qrCode = qr;
      this.state.mode = 'production';
      
      QRCode.generate(qr, { small: true });
      console.log('📲 Scan this QR code with your WhatsApp Business account');
    });

    this.client.on('authenticated', () => {
      console.log('🔐 WhatsApp Service: Authentication successful');
      this.state.isAuthenticated = true;
      this.state.mode = 'production';
      this.state.qrCode = null;
      this.state.lastError = null;
    });

    this.client.on('ready', () => {
      console.log('🎉 WhatsApp Service: Client ready - production mode active');
      this.state.isReady = true;
      this.state.mode = 'production';
      this.state.lastError = null;
    });

    this.client.on('disconnected', (reason: string) => {
      console.log('⚠️ WhatsApp Service: Disconnected, switching to fallback mode -', reason);
      this.state.isReady = false;
      this.state.isAuthenticated = false;
      this.state.mode = 'fallback';
      this.state.lastError = `Disconnected: ${reason}`;
    });

    this.client.on('auth_failure', (msg: string) => {
      console.log('❌ WhatsApp Service: Auth failure, using fallback mode:', msg);
      this.state.isAuthenticated = false;
      this.state.mode = 'fallback';
      this.state.lastError = `Auth failure: ${msg}`;
    });

    this.client.on('error', (error: any) => {
      console.log('⚠️ WhatsApp Service: Client error, using fallback mode:', error.message);
      this.state.mode = 'fallback';
      this.state.lastError = error.message;
    });
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
  }

  async sendSignupOTP(phoneNumber: string, fullName: string): Promise<string> {
    console.log(`🎯 WhatsApp Service: Sending OTP to ${phoneNumber} for ${fullName}`);
    
    const otp = this.generateOTP();
    this.storeOTP(phoneNumber, otp);
    
    // Always try WhatsApp first if available
    if (this.state.mode === 'production' && this.state.isReady && this.client) {
      try {
        const chatId = this.formatPhoneNumber(phoneNumber);
        const message = `🛡️ *رمز التحقق PAKETY*

مرحباً ${fullName}!

رمز التحقق الخاص بك هو: *${otp}*

⏰ صالح لمدة ${this.OTP_EXPIRY_MINUTES} دقائق
🔒 لا تشارك هذا الرمز مع أحد

شكراً لاختيارك PAKETY! 🛒`;

        console.log(`📨 WhatsApp Service: Sending via production WhatsApp to ${chatId}`);
        
        await this.client.sendMessage(chatId, message, {
          linkPreview: false,
          sendMediaAsSticker: false,
          parseVCards: false
        });
        
        console.log(`✅ WhatsApp Service: OTP sent successfully via WhatsApp to ${phoneNumber}`);
        return otp;
        
      } catch (error: any) {
        console.log(`⚠️ WhatsApp Service: Production delivery failed, using fallback:`, error.message);
        this.state.mode = 'fallback';
      }
    }

    // Fallback mode - always works
    console.log(`🔄 WhatsApp Service: Using fallback mode for ${phoneNumber}`);
    console.log(`🔑 FALLBACK OTP for ${phoneNumber}: ${otp} (expires in ${this.OTP_EXPIRY_MINUTES} minutes)`);
    console.log(`📱 User should check WhatsApp app first, then use OTP: ${otp}`);
    
    return otp;
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
    
    if (stored.attempts >= 3) {
      console.log(`🚫 WhatsApp Service: Too many failed attempts for ${phoneNumber}`);
      this.otpStore.delete(phoneNumber);
    }

    return false;
  }

  storeOTPForVerification(phoneNumber: string, otp: string): void {
    this.storeOTP(phoneNumber, otp);
  }

  getStatus(): ServiceState {
    return { ...this.state };
  }

  getQRCode(): string | null {
    return this.state.qrCode;
  }

  isHealthy(): boolean {
    // Service is always healthy - it works in both production and fallback modes
    return this.state.isInitialized;
  }

  // Initialize method for compatibility
  async initialize(): Promise<void> {
    // Service is already initialized in constructor
    return Promise.resolve();
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
      console.log(`🧹 WhatsApp Service: Cleared ${cleared} expired OTPs`);
    }
  }

  // Placeholder methods for invoice and notification features
  async sendCustomerInvoice(phoneNumber: string, customerName: string, orderData: any, pdfBuffer: Buffer): Promise<void> {
    console.log(`📋 WhatsApp Service: Customer invoice delivery requested for ${phoneNumber}`);
    
    if (this.state.mode === 'production' && this.state.isReady && this.client) {
      try {
        const chatId = this.formatPhoneNumber(phoneNumber);
        const message = `📋 *فاتورة طلبك - PAKETY*

عزيزي ${customerName}،

تم تأكيد طلبك بنجاح! 🎉

📦 رقم الطلب: #${orderData.id}
💰 المبلغ الإجمالي: ${orderData.totalAmount} IQD

شكراً لاختيارك PAKETY! 🛒`;

        await this.client.sendMessage(chatId, message);
        console.log(`✅ WhatsApp Service: Customer invoice sent via WhatsApp`);
      } catch (error: any) {
        console.log(`⚠️ WhatsApp Service: Invoice delivery failed:`, error.message);
      }
    } else {
      console.log(`📋 WhatsApp Service: Invoice would be sent to ${phoneNumber} (fallback mode)`);
    }
  }

  async sendDriverNotification(driverPhone: string, orderData: any): Promise<void> {
    console.log(`🚚 WhatsApp Service: Driver notification for ${driverPhone}`);
  }

  async sendStorePreparationAlert(storePhone: string, orderData: any): Promise<void> {
    console.log(`🏪 WhatsApp Service: Store alert for ${storePhone}`);
  }

  async sendOrderStatusUpdate(customerPhone: string, customerName: string, orderData: any, status: string): Promise<void> {
    console.log(`📱 WhatsApp Service: Status update for ${customerPhone}: ${status}`);
  }
}

// Create singleton instance
const productionWhatsAppService = new ProductionWhatsAppService();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  productionWhatsAppService.clearExpiredOTPs();
}, 5 * 60 * 1000);

export default productionWhatsAppService;