import { EventEmitter } from 'events';

interface WhatsAppState {
  isReady: boolean;
  isAuthenticated: boolean;
  isConnecting: boolean;
  qrCode: string | null;
  lastError: string | null;
  connectionAttempts: number;
  heartbeatInterval: NodeJS.Timeout | null;
}

class PermanentWhatsAppService extends EventEmitter {
  private client: any = null;
  private state: WhatsAppState = {
    isReady: false,
    isAuthenticated: false,
    isConnecting: false,
    qrCode: null,
    lastError: null,
    connectionAttempts: 0,
    heartbeatInterval: null
  };

  private maxRetries = 5;
  private reconnectDelay = 5000;
  private heartbeatIntervalMs = 30000; // 30 seconds

  constructor() {
    super();
    console.log('🛡️ Permanent WhatsApp Service: Initializing...');
  }

  async initialize(): Promise<void> {
    try {
      if (this.client) {
        console.log('🔄 Permanent WhatsApp: Client already exists, destroying...');
        await this.destroy();
      }

      const wwebjs = require('whatsapp-web.js');
      const { Client, LocalAuth } = wwebjs;

      // Use permanent session folder
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: './whatsapp_session',
          clientId: 'pakety-permanent-final'
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        }
      });

      this.setupEventHandlers();
      
      console.log('🚀 Permanent WhatsApp: Starting client...');
      await this.client.initialize();
      
    } catch (error) {
      console.error('❌ Permanent WhatsApp initialization error:', error);
      this.state.lastError = `Initialization failed: ${error.message}`;
      
      // Retry initialization
      if (this.state.connectionAttempts < this.maxRetries) {
        this.state.connectionAttempts++;
        console.log(`🔄 Retrying initialization... Attempt ${this.state.connectionAttempts}/${this.maxRetries}`);
        setTimeout(() => this.initialize(), this.reconnectDelay);
      }
    }
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('qr', (qr: string) => {
      console.log('📱 Permanent WhatsApp: QR Code generated - SCAN ONCE FOR PERMANENT CONNECTION');
      this.state.qrCode = qr;
      this.state.isConnecting = true;
      
      // Display QR in terminal
      try {
        const QRCode = require('qrcode-terminal');
        QRCode.generate(qr, { small: true });
        console.log('📲 SCAN QR CODE TO ESTABLISH PERMANENT WHATSAPP CONNECTION');
      } catch (err) {
        console.log('QR Code:', qr);
      }
    });

    this.client.on('authenticated', () => {
      console.log('🔐 Permanent WhatsApp: AUTHENTICATION SUCCESSFUL - SAVED PERMANENTLY');
      this.state.isAuthenticated = true;
      this.state.qrCode = null;
      this.state.lastError = null;
      this.state.connectionAttempts = 0;
    });

    this.client.on('ready', () => {
      console.log('🎉 Permanent WhatsApp: CLIENT READY - PERMANENT CONNECTION ACTIVE');
      this.state.isReady = true;
      this.state.isConnecting = false;
      this.state.isAuthenticated = true;
      this.state.lastError = null;
      this.state.connectionAttempts = 0;
      
      this.startHeartbeat();
      console.log('✅ WhatsApp OTP service is now PERMANENTLY OPERATIONAL');
    });

    this.client.on('disconnected', (reason: string) => {
      console.log('⚠️ Permanent WhatsApp: Disconnected -', reason);
      this.state.isReady = false;
      this.state.lastError = `Disconnected: ${reason}`;
      
      this.stopHeartbeat();
      
      // Immediate reconnection attempt
      console.log('🔄 Auto-reconnecting immediately...');
      setTimeout(() => {
        if (!this.state.isReady) {
          this.initialize();
        }
      }, 2000);
    });

    this.client.on('auth_failure', (msg: string) => {
      console.log('❌ Permanent WhatsApp: Auth failure -', msg);
      this.state.isAuthenticated = false;
      this.state.isReady = false;
      this.state.qrCode = null;
      this.state.lastError = `Auth failure: ${msg}`;
      
      // Clear session and restart
      setTimeout(() => {
        this.initialize();
      }, 3000);
    });

    this.client.on('message', (message: any) => {
      // Optional: Handle incoming messages
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.state.heartbeatInterval = setInterval(async () => {
      try {
        if (this.client && this.state.isReady) {
          const info = await this.client.getState();
          if (info === 'CONNECTED') {
            console.log('💓 Permanent WhatsApp: Heartbeat OK');
          } else {
            console.log('⚠️ Permanent WhatsApp: Connection issue detected, reconnecting...');
            this.initialize();
          }
        }
      } catch (error) {
        console.log('⚠️ Permanent WhatsApp: Heartbeat failed, reconnecting...');
        this.initialize();
      }
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.state.heartbeatInterval) {
      clearInterval(this.state.heartbeatInterval);
      this.state.heartbeatInterval = null;
    }
  }

  async sendSignupOTP(phoneNumber: string, fullName: string): Promise<{ success: boolean; otp?: string; message: string; phoneNumber: string }> {
    console.log(`🎯 Permanent WhatsApp: Processing OTP for ${phoneNumber} (${fullName})`);
    
    if (!this.state.isReady || !this.client) {
      console.log('❌ WhatsApp service not ready');
      return {
        success: false,
        message: "فشل في إرسال رمز التحقق عبر WhatsApp. تأكد من اتصال WhatsApp وحاول مرة أخرى.",
        phoneNumber
      };
    }

    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Format phone number for WhatsApp
      let formattedNumber = phoneNumber.replace(/\D/g, '');
      if (formattedNumber.startsWith('07')) {
        formattedNumber = '964' + formattedNumber.substring(1);
      }
      if (!formattedNumber.startsWith('964')) {
        formattedNumber = '964' + formattedNumber;
      }
      const whatsappId = formattedNumber + '@c.us';
      
      // Arabic OTP message
      const message = `🛡️ *كود التحقق - PAKETY*\n\nمرحباً ${fullName} 👋\n\nكود التحقق الخاص بك هو:\n*${otp}*\n\nأدخل هذا الكود لإكمال التسجيل.\n\n⚠️ لا تشارك هذا الكود مع أي شخص آخر\n\n🛒 PAKETY - متجرك الإلكتروني`;
      
      console.log(`📱 Sending OTP ${otp} to ${whatsappId}`);
      
      // Send message with multiple fallback methods
      let sent = false;
      const methods = [
        () => this.client.sendMessage(whatsappId, message),
        () => this.client.sendMessage(formattedNumber + '@c.us', message),
        () => this.client.sendMessage(phoneNumber.replace(/\D/g, '') + '@c.us', message)
      ];
      
      for (const method of methods) {
        try {
          await method();
          sent = true;
          console.log(`✅ OTP sent successfully to ${phoneNumber}`);
          break;
        } catch (methodError) {
          console.log(`⚠️ Method failed, trying next...`);
        }
      }
      
      if (!sent) {
        throw new Error('All sending methods failed');
      }
      
      return {
        success: true,
        otp,
        message: `تم إرسال رمز التحقق إلى WhatsApp الخاص بك: ${phoneNumber}`,
        phoneNumber
      };
      
    } catch (error) {
      console.error('❌ WhatsApp OTP error:', error);
      return {
        success: false,
        message: "فشل في إرسال رمز التحقق عبر WhatsApp. تأكد من رقم الهاتف وحاول مرة أخرى.",
        phoneNumber
      };
    }
  }

  async sendOrderInvoice(phoneNumber: string, customerName: string, pdfBuffer: Buffer): Promise<boolean> {
    if (!this.state.isReady || !this.client) {
      console.log('❌ WhatsApp not ready for invoice sending');
      return false;
    }

    try {
      // Format phone number
      let formattedNumber = phoneNumber.replace(/\D/g, '');
      if (formattedNumber.startsWith('07')) {
        formattedNumber = '964' + formattedNumber.substring(1);
      }
      const whatsappId = formattedNumber + '@c.us';

      const wwebjs = require('whatsapp-web.js');
      const { MessageMedia } = wwebjs;
      
      const media = new MessageMedia('application/pdf', pdfBuffer.toString('base64'), 'invoice.pdf');
      const message = `🧾 *فاتورة طلبك - PAKETY*\n\nمرحباً ${customerName} 👋\n\nتم استلام طلبك بنجاح!\nستجد الفاتورة مرفقة.\n\n📦 سيتم التواصل معك لتأكيد التوصيل\n\n🛒 شكراً لاختيارك PAKETY`;
      
      await this.client.sendMessage(whatsappId, media, { caption: message });
      console.log(`✅ Invoice sent to customer: ${phoneNumber}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to send invoice:', error);
      return false;
    }
  }

  getStatus() {
    return {
      connected: this.state.isReady,
      status: this.state.isConnecting ? 'connecting' : (this.state.isReady ? 'ready' : 'disconnected'),
      mode: 'production',
      healthy: true,
      isReady: this.state.isReady,
      isAuthenticated: this.state.isAuthenticated,
      qrCode: this.state.qrCode,
      lastError: this.state.lastError,
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
      heartbeatInterval: null
    };
  }
}

// Export singleton instance
const permanentWhatsAppService = new PermanentWhatsAppService();
export default permanentWhatsAppService;