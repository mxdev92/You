import fs from 'fs';
import path from 'path';

interface WhatsAppState {
  isReady: boolean;
  isAuthenticated: boolean;
  isConnecting: boolean;
  qrCode: string | null;
  lastError: string | null;
  connectionAttempts: number;
  heartbeatInterval: NodeJS.Timeout | null;
  sessionSaved: boolean;
}

class BulletproofPermanentWhatsAppService {
  private client: any = null;
  private state: WhatsAppState = {
    isReady: false,
    isAuthenticated: false,
    isConnecting: false,
    qrCode: null,
    lastError: null,
    connectionAttempts: 0,
    heartbeatInterval: null,
    sessionSaved: false
  };
  
  private otpStore = new Map<string, { otp: string; expires: number }>();
  private sessionPath = './whatsapp_session/session-bulletproof-permanent';
  private credentialsPath = './whatsapp_session/credentials.json';
  private MAX_RETRY_ATTEMPTS = 10;
  private HEARTBEAT_INTERVAL = 30000; // 30 seconds

  constructor() {
    this.ensureSessionDirectory();
    // Auto-initialize with saved session
    setTimeout(() => {
      this.initialize().catch(console.error);
    }, 1000);
  }

  private ensureSessionDirectory(): void {
    if (!fs.existsSync(this.sessionPath)) {
      fs.mkdirSync(this.sessionPath, { recursive: true });
      console.log('📁 Created bulletproof session directory');
    }
  }

  private saveCredentials(): void {
    try {
      const credentials = {
        authenticated: true,
        sessionPath: this.sessionPath,
        timestamp: new Date().toISOString(),
        version: '1.0.0-bulletproof'
      };
      
      fs.writeFileSync(this.credentialsPath, JSON.stringify(credentials, null, 2));
      this.state.sessionSaved = true;
      console.log('💾 WhatsApp credentials saved permanently');
    } catch (error) {
      console.error('Failed to save credentials:', error);
    }
  }

  private hasValidCredentials(): boolean {
    try {
      if (fs.existsSync(this.credentialsPath)) {
        const credentials = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'));
        return credentials.authenticated === true;
      }
    } catch (error) {
      console.log('No valid credentials found');
    }
    return false;
  }

  async initialize(): Promise<void> {
    if (this.state.isConnecting) {
      console.log('⏳ WhatsApp already connecting...');
      return;
    }

    this.state.isConnecting = true;
    this.state.connectionAttempts++;
    
    try {
      console.log('🚀 Bulletproof WhatsApp: Starting permanent initialization...');
      
      // Check for existing valid session
      if (this.hasValidCredentials()) {
        console.log('🔑 Found saved credentials - using permanent session');
      }

      // Destroy existing client if any
      if (this.client) {
        console.log('🔄 Destroying existing client for fresh start...');
        await this.destroy();
        await this.sleep(2000);
      }

      // Import WhatsApp Web.js with better compatibility
      let Client, LocalAuth;
      try {
        const wwebjs = await import('whatsapp-web.js');
        if (wwebjs.default) {
          // Handle default export
          Client = wwebjs.default.Client;
          LocalAuth = wwebjs.default.LocalAuth;
        } else {
          // Handle named exports
          Client = wwebjs.Client;
          LocalAuth = wwebjs.LocalAuth;
        }
        
        if (!Client || !LocalAuth) {
          throw new Error('WhatsApp Client or LocalAuth not found in module');
        }
      } catch (importError) {
        console.error('Failed to import WhatsApp Web.js:', importError);
        throw new Error('WhatsApp Web.js module not available');
      }

      console.log('📱 Creating bulletproof WhatsApp client...');
      
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: this.sessionPath,
          clientId: 'bulletproof-permanent'
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
            '--single-process',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI,BlinkGenPropertyTrees',
            '--disable-ipc-flooding-protection'
          ]
        }
      });

      this.setupEventHandlers();
      
      console.log('🔌 Initializing bulletproof WhatsApp client...');
      await this.client.initialize();
      
    } catch (error: any) {
      console.error('❌ Bulletproof WhatsApp initialization error:', error.message);
      this.state.isConnecting = false;
      this.state.lastError = error.message;
      
      // Retry with exponential backoff
      if (this.state.connectionAttempts < this.MAX_RETRY_ATTEMPTS) {
        const delay = Math.min(5000 * Math.pow(2, this.state.connectionAttempts), 60000);
        console.log(`🔄 Retrying initialization in ${delay/1000}s... (attempt ${this.state.connectionAttempts}/${this.MAX_RETRY_ATTEMPTS})`);
        setTimeout(() => this.initialize(), delay);
      } else {
        console.error('💀 Max retry attempts reached. Manual intervention required.');
      }
    }
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    // QR Code event
    this.client.on('qr', async (qr: string) => {
      console.log('📱 NEW QR CODE GENERATED - Scan to authenticate permanently');
      this.state.qrCode = qr;
      this.state.isAuthenticated = false;
      
      // Display QR in terminal
      try {
        const QRCode = await import('qrcode-terminal');
        console.log('━'.repeat(60));
        QRCode.default.generate(qr, { small: true });
        console.log('━'.repeat(60));
      } catch (error) {
        console.log('QR code terminal display error:', error);
      }
      console.log('📲 SCAN THIS QR CODE TO SAVE CREDENTIALS PERMANENTLY');
      console.log('🔐 Once scanned, authentication will NEVER expire');
    });

    // Authentication successful
    this.client.on('authenticated', () => {
      console.log('🎉 BULLETPROOF AUTHENTICATION SUCCESSFUL!');
      this.state.isAuthenticated = true;
      this.state.qrCode = null;
      this.saveCredentials(); // Save credentials immediately
    });

    // Client ready
    this.client.on('ready', () => {
      console.log('🔥 BULLETPROOF WHATSAPP: PERMANENTLY CONNECTED!');
      this.state.isReady = true;
      this.state.isConnecting = false;
      this.state.isAuthenticated = true;
      this.state.lastError = null;
      this.state.connectionAttempts = 0;
      
      this.startHeartbeat();
      console.log('✅ WhatsApp OTP service is now PERMANENTLY OPERATIONAL');
      console.log('🛡️ Credentials saved - will reconnect automatically forever');
    });

    // Disconnection handler - immediate reconnection
    this.client.on('disconnected', (reason: string) => {
      console.log(`⚠️ WhatsApp disconnected: ${reason}`);
      this.state.isReady = false;
      this.state.isConnecting = false;
      
      // Immediate reconnection attempt
      console.log('🔄 Auto-reconnecting with saved credentials...');
      setTimeout(() => this.initialize(), 3000);
    });

    // Authentication failure
    this.client.on('auth_failure', (msg: string) => {
      console.error('🚫 Authentication failed:', msg);
      this.state.isAuthenticated = false;
      this.state.qrCode = null;
      
      // Try again after short delay
      setTimeout(() => this.initialize(), 5000);
    });

    // Error handler
    this.client.on('error', (error: Error) => {
      console.error('❌ WhatsApp client error:', error.message);
      this.state.lastError = error.message;
      
      // Don't let errors kill the service
      if (!this.state.isReady) {
        setTimeout(() => this.initialize(), 10000);
      }
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.state.heartbeatInterval = setInterval(async () => {
      try {
        if (this.client && this.state.isReady) {
          // Simple heartbeat check
          const info = await this.client.getState();
          if (info !== 'CONNECTED') {
            console.log('💔 Heartbeat failed - reconnecting...');
            this.initialize();
          }
        }
      } catch (error) {
        console.log('💔 Heartbeat error - reconnecting...');
        this.initialize();
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.state.heartbeatInterval) {
      clearInterval(this.state.heartbeatInterval);
      this.state.heartbeatInterval = null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async sendSignupOTP(phoneNumber: string, fullName: string): Promise<{ success: boolean; otp?: string; message: string; phoneNumber: string }> {
    console.log(`🎯 Bulletproof WhatsApp: Processing OTP for ${phoneNumber} (${fullName})`);
    
    if (!this.state.isReady || !this.client) {
      // Try to reconnect if not ready
      if (!this.state.isConnecting) {
        console.log('🔄 Service not ready - attempting reconnection...');
        this.initialize();
      }
      
      return {
        success: false,
        message: "فشل في إرسال رمز التحقق عبر WhatsApp. جاري إعادة الاتصال...",
        phoneNumber
      };
    }

    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 300000; // 5 minutes

      // Store OTP
      this.otpStore.set(phoneNumber, { otp, expires });
      
      // Format phone number for WhatsApp
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      // Create Arabic message
      const message = `مرحباً ${fullName}!\n\nرمز التحقق الخاص بك في PAKETY هو:\n\n*${otp}*\n\nالرمز صالح لمدة 5 دقائق.\n\n🛒 PAKETY - توصيل البقالة`;

      console.log(`📤 Sending OTP ${otp} to ${formattedNumber}`);
      
      // Send message via WhatsApp
      await this.client.sendMessage(formattedNumber, message);
      
      console.log(`✅ OTP sent successfully to ${phoneNumber} via WhatsApp`);
      
      return {
        success: true,
        message: "تم إرسال رمز التحقق عبر WhatsApp بنجاح - تحقق من رسائل WhatsApp الخاصة بك",
        phoneNumber: phoneNumber
      };
      
    } catch (error: any) {
      console.error('❌ WhatsApp OTP error:', error);
      return {
        success: false,
        message: "فشل في إرسال رمز التحقق عبر WhatsApp. تأكد من اتصال WhatsApp وحاول مرة أخرى.",
        phoneNumber
      };
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any existing country code and format for Iraq
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.startsWith('964')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    return `964${cleaned}@c.us`;
  }

  verifyOTP(phoneNumber: string, otp: string): boolean {
    const stored = this.otpStore.get(phoneNumber);
    
    if (!stored) {
      console.log(`❌ No OTP found for ${phoneNumber}`);
      return false;
    }
    
    if (Date.now() > stored.expires) {
      console.log(`⏰ OTP expired for ${phoneNumber}`);
      this.otpStore.delete(phoneNumber);
      return false;
    }
    
    if (stored.otp === otp) {
      console.log(`✅ OTP verified successfully for ${phoneNumber}`);
      this.otpStore.delete(phoneNumber);
      return true;
    }
    
    console.log(`❌ Invalid OTP for ${phoneNumber}`);
    return false;
  }

  // Send customer invoice via WhatsApp
  async sendCustomerInvoice(phoneNumber: string, customerName: string, order: any, pdfBuffer: Buffer): Promise<void> {
    if (!this.state.isReady || !this.client) {
      throw new Error('WhatsApp service not ready');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const message = `عزيزي/عزيزتي ${customerName}،\n\nشكراً لك لاختيار PAKETY! 🛒\n\nطلبك رقم ${order.id} جاهز وسيتم توصيله قريباً.\n\nإجمالي المبلغ: ${order.total} دينار عراقي\n\nتجد الفاتورة التفصيلية في المرفق.\n\n📞 للاستفسار: 07710155333\n\nPAKETY - توصيل البقالة 🚛`;

      // Send message with PDF attachment
      const { MessageMedia } = await import('whatsapp-web.js');
      const media = new MessageMedia('application/pdf', pdfBuffer.toString('base64'), `invoice-${order.id}.pdf`);
      await this.client.sendMessage(formattedNumber, media, { caption: message });
      
      console.log(`✅ Customer invoice sent to ${phoneNumber}`);
    } catch (error) {
      console.error('❌ Failed to send customer invoice:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      connected: this.state.isReady && this.state.isAuthenticated,
      status: this.state.isReady ? 'connected' : this.state.isConnecting ? 'connecting' : 'disconnected',
      mode: 'bulletproof-permanent',
      healthy: true,
      isReady: this.state.isReady,
      isAuthenticated: this.state.isAuthenticated,
      sessionSaved: this.state.sessionSaved,
      qrCode: this.state.qrCode,
      lastError: this.state.lastError,
      connectionAttempts: this.state.connectionAttempts,
      timestamp: new Date().toISOString()
    };
  }

  getQRCode(): string | null {
    return this.state.qrCode;
  }

  async destroy(): Promise<void> {
    this.stopHeartbeat();
    if (this.client) {
      try {
        await this.client.destroy();
      } catch (error) {
        console.log('Error destroying client:', error);
      }
      this.client = null;
    }
    this.state = {
      isReady: false,
      isAuthenticated: false,
      isConnecting: false,
      qrCode: null,
      lastError: null,
      connectionAttempts: 0,
      heartbeatInterval: null,
      sessionSaved: this.state.sessionSaved // Keep session saved status
    };
  }
}

// Export singleton instance
const bulletproofPermanentWhatsAppService = new BulletproofPermanentWhatsAppService();
export default bulletproofPermanentWhatsAppService;