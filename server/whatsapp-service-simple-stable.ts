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
  mode: 'whatsapp' | 'console';
  connectionAttempts: number;
}

export class SimpleStableWhatsAppService {
  private client: any = null;
  private state: ServiceState = {
    isInitialized: false,
    isConnecting: false,
    isAuthenticated: false,
    isReady: false,
    qrCode: null,
    lastError: null,
    mode: 'console',
    connectionAttempts: 0
  };
  
  private otpStore = new Map<string, OTPData>();
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_CONNECTION_ATTEMPTS = 3;

  constructor() {
    console.log('🚀 Simple Stable WhatsApp Service: Starting...');
    this.state.isInitialized = true;
    this.attemptWhatsAppConnection();
  }

  private async attemptWhatsAppConnection(): Promise<void> {
    if (this.state.connectionAttempts >= this.MAX_CONNECTION_ATTEMPTS) {
      console.log('📱 WhatsApp Service: Max connection attempts reached, using console mode');
      this.state.mode = 'console';
      return;
    }

    this.state.connectionAttempts++;
    console.log(`📱 WhatsApp Service: Connection attempt ${this.state.connectionAttempts}/${this.MAX_CONNECTION_ATTEMPTS}`);

    try {
      this.state.isConnecting = true;
      
      const wwebjs = require('whatsapp-web.js');
      const { Client, LocalAuth } = wwebjs;

      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: './whatsapp_session',
          clientId: 'pakety-simple'
        }),
        puppeteer: {
          headless: true,
          executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process'
          ],
          timeout: 30000
        }
      });

      this.setupEventHandlers();
      
      // Set timeout for connection attempt
      const connectionTimeout = setTimeout(() => {
        console.log('⏰ WhatsApp Service: Connection timeout, switching to console mode');
        this.state.mode = 'console';
        this.state.isConnecting = false;
        if (this.client) {
          this.client.destroy().catch(() => {});
        }
      }, 30000);

      await this.client.initialize();
      clearTimeout(connectionTimeout);

      console.log('✅ WhatsApp Service: Initialization complete');
      
    } catch (error: any) {
      console.log(`⚠️ WhatsApp Service: Connection attempt ${this.state.connectionAttempts} failed:`, error.message);
      this.state.isConnecting = false;
      this.state.lastError = error.message;
      this.state.mode = 'console';
      
      // Try again after delay if attempts remaining
      if (this.state.connectionAttempts < this.MAX_CONNECTION_ATTEMPTS) {
        setTimeout(() => this.attemptWhatsAppConnection(), 10000);
      }
    }
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('qr', (qr: string) => {
      console.log('📱 WhatsApp Service: QR Code generated for authentication');
      this.state.qrCode = qr;
      this.state.mode = 'whatsapp';
      
      // Display QR in terminal
      const QRCode = require('qrcode-terminal');
      QRCode.generate(qr, { small: true });
      console.log('📲 Scan this QR code with your WhatsApp Business account');
    });

    this.client.on('authenticated', () => {
      console.log('🔐 WhatsApp Service: Successfully authenticated');
      this.state.isAuthenticated = true;
      this.state.mode = 'whatsapp';
      this.state.qrCode = null;
      this.state.lastError = null;
    });

    this.client.on('ready', () => {
      console.log('🎉 WhatsApp Service: Client ready - WhatsApp mode active');
      this.state.isReady = true;
      this.state.isConnecting = false;
      this.state.isAuthenticated = true;
      this.state.mode = 'whatsapp';
      this.state.lastError = null;
    });

    this.client.on('disconnected', (reason: string) => {
      console.log('⚠️ WhatsApp Service: Disconnected, switching to console mode -', reason);
      this.state.isReady = false;
      this.state.isAuthenticated = false;
      this.state.mode = 'console';
      this.state.lastError = `Disconnected: ${reason}`;
    });

    this.client.on('auth_failure', (msg: string) => {
      console.log('❌ WhatsApp Service: Authentication failed, using console mode:', msg);
      this.state.isAuthenticated = false;
      this.state.mode = 'console';
      this.state.lastError = `Auth failure: ${msg}`;
    });

    this.client.on('error', (error: any) => {
      console.log('⚠️ WhatsApp Service: Error occurred, using console mode:', error.message);
      this.state.mode = 'console';
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
    console.log(`🎯 WhatsApp Service: Generating OTP for ${phoneNumber} (${fullName})`);
    
    const otp = this.generateOTP();
    this.storeOTP(phoneNumber, otp);
    
    if (this.state.mode === 'whatsapp' && this.state.isReady && this.client) {
      try {
        const chatId = this.formatPhoneNumber(phoneNumber);
        const message = `🛡️ رمز التحقق PAKETY: *${otp}*

مرحباً ${fullName}!

رمزك الآمن: *${otp}*
⏰ صالح لمدة ${this.OTP_EXPIRY_MINUTES} دقائق

🛒 PAKETY`;

        console.log(`📨 WhatsApp Service: Sending OTP via WhatsApp to ${chatId}`);
        
        await this.client.sendMessage(chatId, message);
        
        console.log(`✅ WhatsApp Service: OTP sent successfully via WhatsApp`);
        return otp;
        
      } catch (error: any) {
        console.log(`❌ WhatsApp Service: WhatsApp delivery failed:`, error.message);
        throw new Error(`WhatsApp delivery failed: ${error.message}`);
      }
    }

    // If WhatsApp not connected, throw error - no fallback display
    throw new Error('WhatsApp service not connected. Please connect WhatsApp to send OTP.');
  }

  verifyOTP(phoneNumber: string, enteredOTP: string): boolean {
    const stored = this.otpStore.get(phoneNumber);
    
    if (!stored) {
      console.log(`❌ OTP Verification: No OTP found for ${phoneNumber}`);
      return false;
    }

    if (Date.now() > stored.expires) {
      console.log(`❌ OTP Verification: OTP expired for ${phoneNumber}`);
      this.otpStore.delete(phoneNumber);
      return false;
    }

    stored.attempts++;

    if (stored.otp === enteredOTP) {
      console.log(`✅ OTP Verification: Successfully verified for ${phoneNumber}`);
      this.otpStore.delete(phoneNumber);
      return true;
    }

    console.log(`❌ OTP Verification: Invalid OTP for ${phoneNumber} (attempt ${stored.attempts}/3)`);
    
    if (stored.attempts >= 3) {
      console.log(`🚫 OTP Verification: Maximum attempts exceeded for ${phoneNumber}`);
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
    return this.state.isInitialized;
  }

  async initialize(): Promise<void> {
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

  // Placeholder methods for compatibility
  async sendCustomerInvoice(phoneNumber: string, customerName: string, orderData: any, pdfBuffer: Buffer): Promise<void> {
    console.log(`📋 Invoice delivery to ${phoneNumber} (${customerName}) - Order #${orderData.id}`);
  }

  async sendDriverNotification(driverPhone: string, orderData: any): Promise<void> {
    console.log(`🚚 Driver notification to ${driverPhone} - Order #${orderData.id}`);
  }

  async sendStorePreparationAlert(storePhone: string, orderData: any): Promise<void> {
    console.log(`🏪 Store alert to ${storePhone} - Order #${orderData.id}`);
  }

  async sendOrderStatusUpdate(customerPhone: string, customerName: string, orderData: any, status: string): Promise<void> {
    console.log(`📱 Status update to ${customerPhone}: ${status}`);
  }
}

// Create singleton instance
const simpleStableWhatsAppService = new SimpleStableWhatsAppService();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  simpleStableWhatsAppService.clearExpiredOTPs();
}, 5 * 60 * 1000);

export default simpleStableWhatsAppService;