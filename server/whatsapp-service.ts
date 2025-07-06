import QRCode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';

class WhatsAppService {
  private client: any;
  private isReady: boolean = false;
  private otpStore: Map<string, { otp: string; expires: number }> = new Map();
  private Client: any;
  private LocalAuth: any;
  private MessageMedia: any;

  constructor() {
    this.initializeWhatsApp();
  }

  private async initializeWhatsApp() {
    try {
      const whatsappWeb = await import('whatsapp-web.js');
      this.Client = whatsappWeb.Client;
      this.LocalAuth = whatsappWeb.LocalAuth;
      this.MessageMedia = whatsappWeb.MessageMedia;
      
      this.client = new this.Client({
        authStrategy: new this.LocalAuth(),
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
    } catch (error) {
      console.error('Failed to initialize WhatsApp Web.js:', error);
    }
  }

  private setupEventHandlers() {
    this.client.on('qr', (qr) => {
      console.log('🔗 WhatsApp QR Code:');
      QRCode.generate(qr, { small: true });
      console.log('📱 Scan this QR code with your WhatsApp Business account');
    });

    this.client.on('ready', () => {
      console.log('✅ WhatsApp client is ready!');
      this.isReady = true;
    });

    this.client.on('authenticated', () => {
      console.log('🔐 WhatsApp authenticated successfully');
    });

    this.client.on('auth_failure', (msg) => {
      console.error('❌ WhatsApp authentication failed:', msg);
    });

    this.client.on('disconnected', (reason) => {
      console.log('🔌 WhatsApp disconnected:', reason);
      this.isReady = false;
    });
  }

  async initialize() {
    try {
      console.log('🚀 Initializing WhatsApp service...');
      await this.client.initialize();
    } catch (error) {
      console.error('❌ Failed to initialize WhatsApp:', error);
      throw error;
    }
  }

  // 1. Send Signup OTP to WhatsApp
  async sendSignupOTP(phoneNumber: string, fullName: string): Promise<string> {
    if (!this.isReady) {
      throw new Error('WhatsApp service is not ready');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    this.otpStore.set(phoneNumber, { otp, expires });

    // Format phone number for WhatsApp
    const chatId = this.formatPhoneNumber(phoneNumber);

    const message = `🔐 *PAKETY - رمز التحقق*

مرحباً ${fullName}! 

رمز التحقق الخاص بك: *${otp}*

⏰ صالح لمدة 10 دقائق
🛡️ لا تشارك هذا الرمز مع أحد

نشكرك لاختيارك PAKETY 🛒`;

    try {
      await this.client.sendMessage(chatId, message);
      console.log(`📨 OTP sent to ${phoneNumber}: ${otp}`);
      return otp;
    } catch (error) {
      console.error('❌ Failed to send OTP:', error);
      throw error;
    }
  }

  // Verify OTP
  verifyOTP(phoneNumber: string, enteredOTP: string): boolean {
    const stored = this.otpStore.get(phoneNumber);
    
    if (!stored) {
      return false;
    }

    if (Date.now() > stored.expires) {
      this.otpStore.delete(phoneNumber);
      return false;
    }

    if (stored.otp === enteredOTP) {
      this.otpStore.delete(phoneNumber);
      return true;
    }

    return false;
  }

  // 2. Send Invoice to Customer
  async sendCustomerInvoice(phoneNumber: string, customerName: string, orderData: any, pdfBuffer: Buffer): Promise<void> {
    if (!this.isReady) {
      throw new Error('WhatsApp service is not ready');
    }

    const chatId = this.formatPhoneNumber(phoneNumber);

    // Send text message first
    const textMessage = `📋 *فاتورة طلبك - PAKETY*

عزيزي ${customerName}،

تم تأكيد طلبك بنجاح! 🎉

📦 رقم الطلب: #${orderData.id}
💰 المبلغ الإجمالي: ${this.formatPrice(orderData.totalAmount)} IQD
🚚 أجور التوصيل: ${this.formatPrice(2000)} IQD
📍 العنوان: ${orderData.address.governorate} - ${orderData.address.district}
⏰ وقت التوصيل المتوقع: ${orderData.deliveryTime || 'خلال ساعة'}

سيتم إرسال الفاتورة التفصيلية في الرسالة التالية 📄

شكراً لاختيارك PAKETY! 🛒`;

    try {
      // Send text message
      await this.client.sendMessage(chatId, textMessage);

      // Send PDF invoice
      const media = new MessageMedia('application/pdf', pdfBuffer.toString('base64'), `PAKETY_Invoice_${orderData.id}.pdf`);
      await this.client.sendMessage(chatId, media, { caption: '📄 الفاتورة التفصيلية لطلبك' });

      console.log(`📨 Customer invoice sent to ${phoneNumber}`);
    } catch (error) {
      console.error('❌ Failed to send customer invoice:', error);
      throw error;
    }
  }

  // 3. Send Order to Driver
  async sendDriverNotification(driverPhone: string, orderData: any): Promise<void> {
    if (!this.isReady) {
      throw new Error('WhatsApp service is not ready');
    }

    const chatId = this.formatPhoneNumber(driverPhone);

    const message = `🚚 *طلب توصيل جديد - PAKETY*

📦 رقم الطلب: #${orderData.id}
👤 العميل: ${orderData.customerName}
📞 رقم العميل: ${orderData.customerPhone}

📍 *عنوان التوصيل:*
${orderData.address.governorate} - ${orderData.address.district}
${orderData.address.neighborhood}
${orderData.address.notes ? `\n📝 ملاحظات: ${orderData.address.notes}` : ''}

💰 المبلغ المطلوب تحصيله: *${this.formatPrice(orderData.totalAmount + 2000)} IQD*

📦 *المنتجات:*
${orderData.items.map((item: any) => `• ${item.productName} × ${item.quantity} (${this.formatPrice(item.price)} IQD)`).join('\n')}

⏰ وقت الطلب: ${new Date().toLocaleString('ar-IQ')}
🕐 وقت التوصيل المطلوب: ${orderData.deliveryTime || 'في أقرب وقت'}

*يرجى التواصل مع العميل قبل التوصيل* 📞`;

    try {
      await this.client.sendMessage(chatId, message);
      console.log(`📨 Driver notification sent to ${driverPhone}`);
    } catch (error) {
      console.error('❌ Failed to send driver notification:', error);
      throw error;
    }
  }

  // 4. Send Order to Store for Preparation
  async sendStorePreparationAlert(storePhone: string, orderData: any): Promise<void> {
    if (!this.isReady) {
      throw new Error('WhatsApp service is not ready');
    }

    const chatId = this.formatPhoneNumber(storePhone);

    const message = `🏪 *طلب جديد للتحضير - PAKETY*

📦 رقم الطلب: #${orderData.id}
👤 العميل: ${orderData.customerName}
📞 رقم العميل: ${orderData.customerPhone}

⏰ وقت الطلب: ${new Date().toLocaleString('ar-IQ')}
🕐 وقت التوصيل المطلوب: ${orderData.deliveryTime || 'في أقرب وقت'}

📦 *المنتجات المطلوبة:*
${orderData.items.map((item: any, index: number) => `${index + 1}. ${item.productName} × ${item.quantity} ${item.unit || 'قطعة'}`).join('\n')}

💰 قيمة الطلب: ${this.formatPrice(orderData.totalAmount)} IQD
🚚 + أجور التوصيل: ${this.formatPrice(2000)} IQD
💸 *المجموع: ${this.formatPrice(orderData.totalAmount + 2000)} IQD*

📍 منطقة التوصيل: ${orderData.address.governorate} - ${orderData.address.district}

${orderData.notes ? `📝 ملاحظات خاصة: ${orderData.notes}` : ''}

*يرجى البدء في تحضير الطلب فوراً* ⚡`;

    try {
      await this.client.sendMessage(chatId, message);
      console.log(`📨 Store preparation alert sent to ${storePhone}`);
    } catch (error) {
      console.error('❌ Failed to send store alert:', error);
      throw error;
    }
  }

  // Send order status updates
  async sendOrderStatusUpdate(phoneNumber: string, customerName: string, orderData: any, status: string): Promise<void> {
    if (!this.isReady) {
      throw new Error('WhatsApp service is not ready');
    }

    const chatId = this.formatPhoneNumber(phoneNumber);

    let message = '';
    let emoji = '';

    switch (status) {
      case 'confirmed':
        emoji = '✅';
        message = `${emoji} *تم تأكيد طلبك*\n\nعزيزي ${customerName}،\nتم تأكيد طلبك رقم #${orderData.id} وبدأنا في التحضير`;
        break;
      case 'preparing':
        emoji = '👨‍🍳';
        message = `${emoji} *جاري تحضير طلبك*\n\nطلبك رقم #${orderData.id} قيد التحضير الآن`;
        break;
      case 'out_for_delivery':
        emoji = '🚚';
        message = `${emoji} *في الطريق إليك*\n\nالسائق في طريقه لتوصيل طلبك رقم #${orderData.id}`;
        break;
      case 'delivered':
        emoji = '🎉';
        message = `${emoji} *تم التوصيل بنجاح*\n\nشكراً لاختيارك PAKETY! نتطلع لخدمتك مرة أخرى`;
        break;
      case 'cancelled':
        emoji = '❌';
        message = `${emoji} *تم إلغاء الطلب*\n\nتم إلغاء طلبك رقم #${orderData.id} كما طلبت`;
        break;
      default:
        return;
    }

    try {
      await this.client.sendMessage(chatId, message);
      console.log(`📨 Status update sent to ${phoneNumber}: ${status}`);
    } catch (error) {
      console.error('❌ Failed to send status update:', error);
      throw error;
    }
  }

  // Helper methods
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add Iraq country code if not present
    if (!cleaned.startsWith('964')) {
      if (cleaned.startsWith('0')) {
        cleaned = '964' + cleaned.substring(1);
      } else if (cleaned.startsWith('7')) {
        cleaned = '964' + cleaned;
      }
    }
    
    return cleaned + '@c.us';
  }

  private formatPrice(amount: number): string {
    return amount.toLocaleString('en-US');
  }

  // Check if WhatsApp is ready
  isConnected(): boolean {
    return this.isReady;
  }

  // Get connection status
  getStatus(): string {
    if (this.isReady) {
      return 'connected';
    }
    return 'disconnected';
  }

  // Destroy client
  async destroy(): Promise<void> {
    await this.client.destroy();
    this.isReady = false;
  }
}

// Create singleton instance
export const whatsappService = new WhatsAppService();
export default WhatsAppService;