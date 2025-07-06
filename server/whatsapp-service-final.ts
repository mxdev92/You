import QRCode from 'qrcode-terminal';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

class WhatsAppService {
  private isReady: boolean = false;
  private otpStore: Map<string, { otp: string; expires: number }> = new Map();
  private client: any = null;
  private currentQR: string = '';

  constructor() {
    // Auto-initialize on startup (non-blocking)
    setTimeout(() => {
      this.initialize().catch(console.error);
    }, 1000);
  }

  async initialize() {
    try {
      console.log('📱 Starting WhatsApp service initialization...');
      
      // Direct require for better compatibility
      const wwebjs = require('whatsapp-web.js');
      
      console.log('📋 Available exports:', Object.keys(wwebjs));
      
      const { Client, LocalAuth } = wwebjs;
      
      if (!Client || !LocalAuth) {
        throw new Error('WhatsApp Client or LocalAuth not found in module');
      }
      
      console.log('✅ WhatsApp classes loaded successfully');

      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: './whatsapp_session'
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
            '--disable-renderer-backgrounding'
          ]
        }
      });

      console.log('🔧 WhatsApp client created, setting up event handlers...');
      
      // QR Code event
      this.client.on('qr', (qr: string) => {
        this.currentQR = qr;
        console.log('\n🔗 WhatsApp QR Code Generated!');
        console.log('━'.repeat(60));
        QRCode.generate(qr, { small: true });
        console.log('━'.repeat(60));
        console.log('📱 SCAN THIS QR CODE WITH YOUR WHATSAPP BUSINESS APP');
        console.log('🎯 Once scanned, all WhatsApp features will be active!');
        console.log('');
      });

      // Ready event
      this.client.on('ready', async () => {
        console.log('🎉 WhatsApp client is ready and connected!');
        console.log('✅ All messaging features are now operational');
        this.isReady = true;
        
        // Give WhatsApp time to fully load chats
        setTimeout(async () => {
          try {
            const chats = await this.client.getChats();
            console.log(`📋 Loaded ${chats.length} chats - WhatsApp fully initialized`);
          } catch (error) {
            console.error('⚠️ Warning: Could not load chats:', error);
          }
        }, 5000);
      });

      // Authentication events
      this.client.on('authenticated', () => {
        console.log('🔐 WhatsApp authenticated successfully');
      });

      this.client.on('auth_failure', (msg: any) => {
        console.error('❌ WhatsApp authentication failed:', msg);
        this.isReady = false;
      });

      this.client.on('disconnected', (reason: any) => {
        console.log('🔌 WhatsApp disconnected:', reason);
        this.isReady = false;
      });

      // Loading event
      this.client.on('loading_screen', (percent: number, message: string) => {
        console.log('⏳ Loading WhatsApp:', percent + '%', message);
      });

      console.log('🚀 Initializing WhatsApp client...');
      await this.client.initialize();
      
      console.log('✅ WhatsApp initialization completed successfully');
      
    } catch (error: any) {
      console.error('❌ WhatsApp initialization failed:', error.message);
      console.error('🔧 Full error:', error);
      throw error;
    }
  }

  // Send OTP for signup
  async sendSignupOTP(phoneNumber: string, fullName: string): Promise<string> {
    if (!this.isReady || !this.client) {
      throw new Error('WhatsApp service is not ready. Please connect first.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    this.otpStore.set(phoneNumber, { otp, expires });

    const chatId = this.formatPhoneNumber(phoneNumber);

    const message = `🔐 *PAKETY - رمز التحقق*

مرحباً ${fullName}! 

رمز التحقق الخاص بك: *${otp}*

⏰ صالح لمدة 10 دقائق
🛡️ لا تشارك هذا الرمز مع أحد

نشكرك لاختيارك PAKETY 🛒`;

    try {
      console.log(`📤 Attempting to send OTP to ${chatId}`);
      
      // Wait a bit to ensure WhatsApp is fully loaded
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Skip state check as it's returning null in some WhatsApp Web.js versions
      console.log(`📊 WhatsApp ready flag: ${this.isReady}`);

      // Test basic WhatsApp functionality first
      console.log('🔍 Testing basic WhatsApp functionality...');
      try {
        const info = await this.client.getWWebVersion();
        console.log(`📋 WhatsApp Web version: ${info}`);
      } catch (infoError) {
        console.error('⚠️ Warning: Cannot get WhatsApp Web info:', infoError);
      }
      
      // Send the message with simplified approach
      console.log(`📨 Sending OTP message to ${chatId}...`);
      const result = await this.client.sendMessage(chatId, message);
      console.log(`✅ OTP sent successfully to ${phoneNumber}`, result);
      return otp;
    } catch (error) {
      console.error('❌ Failed to send OTP:', error);
      throw new Error(`Failed to send OTP to ${phoneNumber}. This might be due to WhatsApp Web not being fully loaded or the number not being reachable. Try waiting a few minutes and try again.`);
    }
  }

  // Store OTP for verification (fallback method)
  storeOTPForVerification(phoneNumber: string, otp: string): void {
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    this.otpStore.set(phoneNumber, { otp, expires });
    console.log(`🔑 OTP ${otp} stored for ${phoneNumber} (expires in 10 minutes)`);
  }

  // Verify OTP
  verifyOTP(phoneNumber: string, enteredOTP: string): boolean {
    const stored = this.otpStore.get(phoneNumber);
    
    if (!stored) return false;
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

  // Send customer invoice
  async sendCustomerInvoice(phoneNumber: string, customerName: string, orderData: any, pdfBuffer: Buffer): Promise<void> {
    if (!this.isReady || !this.client) {
      throw new Error('WhatsApp service is not ready. Please connect first.');
    }

    const chatId = this.formatPhoneNumber(phoneNumber);

    const textMessage = `📋 *فاتورة طلبك - PAKETY*

عزيزي ${customerName}،

تم تأكيد طلبك بنجاح! 🎉

📦 رقم الطلب: #${orderData.id}
💰 المبلغ الإجمالي: ${this.formatPrice(orderData.totalAmount)} IQD
🚚 أجور التوصيل: ${this.formatPrice(2000)} IQD
📍 العنوان: ${orderData.address.governorate} - ${orderData.address.district}
⏰ وقت التوصيل المتوقع: ${orderData.deliveryTime || 'خلال ساعة'}

شكراً لاختيارك PAKETY! 🛒`;

    try {
      await this.client.sendMessage(chatId, textMessage);
      console.log(`📨 Customer invoice sent to ${phoneNumber}`);

      // Try to send PDF
      try {
        const { MessageMedia } = require('whatsapp-web.js');
        if (MessageMedia) {
          const media = new MessageMedia('application/pdf', pdfBuffer.toString('base64'), `PAKETY_Invoice_${orderData.id}.pdf`);
          await this.client.sendMessage(chatId, media, { caption: '📄 الفاتورة التفصيلية لطلبك' });
          console.log('📄 PDF invoice sent successfully');
        }
      } catch (pdfError) {
        console.log('📄 PDF sending failed, text message sent successfully');
      }

    } catch (error) {
      console.error('❌ Failed to send customer invoice:', error);
      throw error;
    }
  }

  // Send driver notification
  async sendDriverNotification(driverPhone: string, orderData: any): Promise<void> {
    if (!this.isReady || !this.client) {
      throw new Error('WhatsApp service is not ready. Please connect first.');
    }

    const chatId = this.formatPhoneNumber(driverPhone);

    const message = `🚚 *طلب توصيل جديد - PAKETY*

📦 رقم الطلب: #${orderData.id}
👤 العميل: ${orderData.customerName}
📞 رقم العميل: ${orderData.customerPhone}

📍 *عنوان التوصيل:*
${orderData.address.governorate} - ${orderData.address.district}
${orderData.address.neighborhood || orderData.address.notes || ''}

💰 المبلغ المطلوب تحصيله: *${this.formatPrice(orderData.totalAmount + 2000)} IQD*

📦 *المنتجات:*
${orderData.items.map((item: any) => `• ${item.productName} × ${item.quantity} (${this.formatPrice(item.price)} IQD)`).join('\n')}

⏰ وقت الطلب: ${new Date().toLocaleString('ar-IQ')}

*يرجى التواصل مع العميل قبل التوصيل* 📞`;

    try {
      await this.client.sendMessage(chatId, message);
      console.log(`📨 Driver notification sent to ${driverPhone}`);
    } catch (error) {
      console.error('❌ Failed to send driver notification:', error);
      throw error;
    }
  }

  // Send store preparation alert
  async sendStorePreparationAlert(storePhone: string, orderData: any): Promise<void> {
    if (!this.isReady || !this.client) {
      throw new Error('WhatsApp service is not ready. Please connect first.');
    }

    const chatId = this.formatPhoneNumber(storePhone);

    const message = `🏪 *طلب جديد للتحضير - PAKETY*

📦 رقم الطلب: #${orderData.id}
👤 العميل: ${orderData.customerName}
📞 رقم العميل: ${orderData.customerPhone}

⏰ وقت الطلب: ${new Date().toLocaleString('ar-IQ')}

📦 *المنتجات المطلوبة:*
${orderData.items.map((item: any, index: number) => `${index + 1}. ${item.productName} × ${item.quantity}`).join('\n')}

💰 قيمة الطلب: ${this.formatPrice(orderData.totalAmount)} IQD
🚚 + أجور التوصيل: ${this.formatPrice(2000)} IQD
💸 *المجموع: ${this.formatPrice(orderData.totalAmount + 2000)} IQD*

📍 منطقة التوصيل: ${orderData.address.governorate} - ${orderData.address.district}

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
    if (!this.isReady || !this.client) {
      throw new Error('WhatsApp service is not ready. Please connect first.');
    }

    const chatId = this.formatPhoneNumber(phoneNumber);
    let message = '';

    switch (status) {
      case 'confirmed':
        message = `✅ *تم تأكيد طلبك*\n\nعزيزي ${customerName}،\nتم تأكيد طلبك رقم #${orderData.id} وبدأنا في التحضير`;
        break;
      case 'preparing':
        message = `👨‍🍳 *جاري تحضير طلبك*\n\nطلبك رقم #${orderData.id} قيد التحضير الآن`;
        break;
      case 'out_for_delivery':
        message = `🚚 *في الطريق إليك*\n\nالسائق في طريقه لتوصيل طلبك رقم #${orderData.id}`;
        break;
      case 'delivered':
        message = `🎉 *تم التوصيل بنجاح*\n\nشكراً لاختيارك PAKETY! نتطلع لخدمتك مرة أخرى`;
        break;
      case 'cancelled':
        message = `❌ *تم إلغاء الطلب*\n\nتم إلغاء طلبك رقم #${orderData.id} كما طلبت`;
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
    let cleaned = phoneNumber.replace(/\D/g, '');
    
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

  isConnected(): boolean {
    return this.client && this.isReady;
  }

  getStatus(): string {
    if (this.client && this.isReady) {
      return 'connected';
    } else if (this.client) {
      return 'connecting';
    }
    return 'disconnected';
  }

  getQRCode(): string {
    return this.currentQR;
  }

  async destroy(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
    }
    this.isReady = false;
  }
}

export const whatsappService = new WhatsAppService();
export default WhatsAppService;