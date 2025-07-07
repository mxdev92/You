import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';

class StableWhatsAppService {
  private client: Client | null = null;
  private isInitialized = false;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private qrCodeData: string | null = null;
  private sessionPath = './whatsapp_session';

  constructor() {
    this.ensureSessionDirectory();
  }

  private ensureSessionDirectory() {
    if (!fs.existsSync(this.sessionPath)) {
      fs.mkdirSync(this.sessionPath, { recursive: true });
      console.log('📁 Created WhatsApp session directory');
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ WhatsApp service already initialized');
      return;
    }

    if (this.connectionPromise) {
      console.log('⏳ WhatsApp initialization already in progress...');
      return this.connectionPromise;
    }

    this.connectionPromise = this.doInitialize();
    return this.connectionPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      console.log('🚀 Initializing stable WhatsApp service...');

      // Use require for WhatsApp Web.js to handle ES module issues
      const { Client, LocalAuth } = require('whatsapp-web.js');

      // Use LocalAuth for persistent sessions
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'pakety-admin',
          dataPath: this.sessionPath
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
            '--single-process',
            '--disable-gpu'
          ]
        }
      });

      this.setupEventHandlers();

      console.log('📱 Starting WhatsApp client...');
      await this.client.initialize();

      this.isInitialized = true;
      console.log('✅ WhatsApp service initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize WhatsApp service:', error);
      this.cleanup();
      throw error;
    }
  }

  private setupEventHandlers() {
    if (!this.client) return;

    this.client.on('qr', (qr) => {
      console.log('📱 QR Code generated - scan with WhatsApp');
      this.qrCodeData = qr;
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      console.log('✅ WhatsApp client is ready!');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.qrCodeData = null; // Clear QR once connected
    });

    this.client.on('authenticated', () => {
      console.log('🔐 WhatsApp authenticated successfully');
    });

    this.client.on('auth_failure', (msg) => {
      console.error('❌ WhatsApp authentication failed:', msg);
      this.isConnected = false;
      this.handleReconnection();
    });

    this.client.on('disconnected', (reason) => {
      console.log('⚠️ WhatsApp disconnected:', reason);
      this.isConnected = false;
      this.handleReconnection();
    });

    this.client.on('message', (message) => {
      // Handle incoming messages if needed
      console.log('📨 Received message:', message.body);
    });
  }

  private async handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached. Manual intervention required.');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);

    // Wait before attempting reconnection
    setTimeout(async () => {
      try {
        if (this.client) {
          await this.client.destroy();
        }
        this.isInitialized = false;
        this.connectionPromise = null;
        await this.initialize();
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
      }
    }, 5000 * this.reconnectAttempts); // Exponential backoff
  }

  async sendSignupOTP(phoneNumber: string, fullName: string): Promise<string> {
    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const success = await this.sendOTP(phoneNumber, otp);
    if (success) {
      return otp;
    } else {
      throw new Error('Failed to send OTP via WhatsApp');
    }
  }

  async sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      if (!this.isConnected || !this.client) {
        console.log('⚠️ WhatsApp not connected, attempting to reconnect...');
        await this.initialize();
        
        if (!this.isConnected) {
          console.error('❌ Unable to establish WhatsApp connection for OTP');
          return false;
        }
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const message = `🔐 كود التحقق الخاص بك في PAKETY هو: ${otp}

⏰ ينتهي خلال 5 دقائق
🔒 لا تشارك هذا الكود مع أحد

مرحباً بك في PAKETY! 🛒`;

      await this.client.sendMessage(formattedPhone, message);
      console.log(`✅ OTP sent successfully to ${phoneNumber}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to send OTP:', error);
      return false;
    }
  }

  async sendInvoice(phoneNumber: string, customerName: string, orderDetails: any, pdfBuffer: Buffer): Promise<boolean> {
    try {
      if (!this.isConnected || !this.client) {
        console.log('⚠️ WhatsApp not connected for invoice sending');
        return false;
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Convert PDF buffer to base64 for MessageMedia
      const { MessageMedia } = require('whatsapp-web.js');
      const base64Data = pdfBuffer.toString('base64');
      const media = new MessageMedia('application/pdf', base64Data, `pakety-invoice-${orderDetails.orderId}.pdf`);

      const message = `🧾 فاتورة طلبك من PAKETY

👤 العميل: ${customerName}
🆔 رقم الطلب: #${orderDetails.orderId}
💰 المبلغ الإجمالي: ${orderDetails.totalAmount} د.ع

📋 تفاصيل الطلب مرفقة في الملف PDF
🚚 سيتم التوصيل خلال 30-45 دقيقة

شكراً لاختيارك PAKETY! 🛒`;

      await this.client.sendMessage(formattedPhone, media, { caption: message });
      console.log(`✅ Invoice sent successfully to ${phoneNumber}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to send invoice:', error);
      return false;
    }
  }

  async sendDriverNotification(driverPhone: string, orderDetails: any): Promise<boolean> {
    try {
      if (!this.isConnected || !this.client) {
        console.log('⚠️ WhatsApp not connected for driver notification');
        return false;
      }

      const formattedPhone = this.formatPhoneNumber(driverPhone);
      const message = `🚚 طلب جديد للتوصيل - PAKETY

🆔 رقم الطلب: #${orderDetails.orderId}
👤 العميل: ${orderDetails.customerName}
📱 الهاتف: ${orderDetails.customerPhone}
📍 العنوان: ${orderDetails.address}
💰 المبلغ: ${orderDetails.totalAmount} د.ع

⏰ موعد التوصيل: ${orderDetails.deliveryTime || 'في أقرب وقت'}
📝 ملاحظات: ${orderDetails.notes || 'لا توجد ملاحظات'}

🏃‍♂️ تحرك الآن للاستلام!`;

      await this.client.sendMessage(formattedPhone, message);
      console.log(`✅ Driver notification sent to ${driverPhone}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to send driver notification:', error);
      return false;
    }
  }

  async sendStatusUpdate(phoneNumber: string, orderStatus: string, orderId: string): Promise<boolean> {
    try {
      if (!this.isConnected || !this.client) {
        console.log('⚠️ WhatsApp not connected for status update');
        return false;
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const statusMessages = {
        'confirmed': '✅ تم تأكيد طلبك وهو قيد التحضير',
        'preparing': '👨‍🍳 جاري تحضير طلبك الآن',
        'out-for-delivery': '🚚 طلبك في الطريق إليك',
        'delivered': '✅ تم توصيل طلبك بنجاح!'
      };

      const statusText = statusMessages[orderStatus as keyof typeof statusMessages] || `تم تحديث حالة طلبك إلى: ${orderStatus}`;

      const message = `📦 تحديث طلب PAKETY

🆔 رقم الطلب: #${orderId}
📊 الحالة: ${statusText}

شكراً لثقتك في PAKETY! 🛒`;

      await this.client.sendMessage(formattedPhone, message);
      console.log(`✅ Status update sent to ${phoneNumber}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to send status update:', error);
      return false;
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Iraqi phone numbers
    if (cleaned.startsWith('07')) {
      cleaned = '964' + cleaned.substring(1);
    } else if (cleaned.startsWith('7')) {
      cleaned = '964' + cleaned;
    } else if (!cleaned.startsWith('964')) {
      cleaned = '964' + cleaned;
    }
    
    return cleaned + '@c.us';
  }

  getConnectionStatus(): { status: string; connected: boolean } {
    return {
      status: this.isConnected ? 'connected' : (this.isInitialized ? 'connecting' : 'disconnected'),
      connected: this.isConnected
    };
  }

  getQRCode(): string | null {
    return this.qrCodeData;
  }

  async cleanup() {
    try {
      if (this.client) {
        await this.client.destroy();
      }
      this.isInitialized = false;
      this.isConnected = false;
      this.connectionPromise = null;
      this.qrCodeData = null;
      console.log('🧹 WhatsApp service cleaned up');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  // Additional methods for compatibility with existing routes
  async sendCustomerInvoice(phoneNumber: string, customerName: string, orderDetails: any, pdfBuffer: Buffer): Promise<boolean> {
    return this.sendInvoice(phoneNumber, customerName, orderDetails, pdfBuffer);
  }

  async sendInvoiceToAdmin(orderDetails: any, pdfBuffer: Buffer): Promise<boolean> {
    const adminPhone = '07710155333'; // Fixed admin WhatsApp number
    return this.sendInvoice(adminPhone, 'PAKETY Admin', orderDetails, pdfBuffer);
  }

  async sendStorePreparationAlert(storePhone: string, orderDetails: any): Promise<boolean> {
    try {
      if (!this.isConnected || !this.client) {
        console.log('⚠️ WhatsApp not connected for store alert');
        return false;
      }

      const formattedPhone = this.formatPhoneNumber(storePhone);
      const message = `🍽️ طلب جديد للتحضير - PAKETY

🆔 رقم الطلب: #${orderDetails.id}
👤 العميل: ${orderDetails.customerName}
📱 الهاتف: ${orderDetails.customerPhone}
💰 المبلغ: ${orderDetails.totalAmount} د.ع

📋 المطلوب تحضيره:
${JSON.parse(orderDetails.items).map((item: any) => `• ${item.name} × ${item.quantity}`).join('\n')}

⏰ ابدأ التحضير الآن!`;

      await this.client.sendMessage(formattedPhone, message);
      console.log(`✅ Store preparation alert sent to ${storePhone}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to send store preparation alert:', error);
      return false;
    }
  }

  async sendOrderStatusUpdate(phoneNumber: string, orderStatus: string, orderId: string): Promise<boolean> {
    return this.sendStatusUpdate(phoneNumber, orderStatus, orderId);
  }

  // Reset session if needed
  async resetSession() {
    try {
      console.log('🔄 Resetting WhatsApp session...');
      await this.cleanup();
      
      // Remove session files
      if (fs.existsSync(this.sessionPath)) {
        fs.rmSync(this.sessionPath, { recursive: true, force: true });
        console.log('🗑️ Session files removed');
      }
      
      this.ensureSessionDirectory();
      await this.initialize();
      console.log('✅ Session reset complete');
    } catch (error) {
      console.error('❌ Failed to reset session:', error);
    }
  }
}

export default StableWhatsAppService;