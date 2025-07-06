import { createRequire } from 'module';
const require = createRequire(import.meta.url);

interface OTPData {
  otp: string;
  expires: number;
}

export class WhatsAppService {
  private client: any = null;
  private isReady = false;
  private qrCodeData = '';
  private otpStore = new Map<string, OTPData>();
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    console.log('🚀 Starting WhatsApp service initialization...');
  }

  async initialize(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._initialize();
    return this.connectionPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('📱 Initializing WhatsApp Web.js...');
      
      const wwebjs = require('whatsapp-web.js');
      const { Client, LocalAuth, MessageMedia } = wwebjs;

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
            '--disable-gpu',
            '--disable-extensions',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ]
        }
      });

      // Setup event handlers
      this.client.on('qr', (qr: string) => {
        console.log('📱 QR Code generated');
        this.qrCodeData = qr;
      });

      this.client.on('ready', () => {
        console.log('🎉 WhatsApp client is ready!');
        this.isReady = true;
      });

      this.client.on('authenticated', () => {
        console.log('🔐 WhatsApp authenticated successfully');
      });

      this.client.on('auth_failure', (msg: string) => {
        console.error('❌ WhatsApp authentication failed:', msg);
        this.isReady = false;
      });

      this.client.on('disconnected', (reason: string) => {
        console.log('📱 WhatsApp disconnected:', reason);
        this.isReady = false;
      });

      await this.client.initialize();
      console.log('✅ WhatsApp initialization completed');
      
    } catch (error: any) {
      console.error('❌ WhatsApp initialization failed:', error.message);
      throw error;
    }
  }

  getQRCode(): string {
    return this.qrCodeData;
  }

  isConnected(): boolean {
    return this.isReady;
  }

  getStatus(): string {
    if (this.isReady) return 'connected';
    if (this.qrCodeData) return 'connecting';
    return 'disconnected';
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If starts with 07, replace with +9647
    if (cleaned.startsWith('07')) {
      cleaned = '+9647' + cleaned.substring(2);
    }
    
    // If starts with 9647, add +
    if (cleaned.startsWith('9647')) {
      cleaned = '+' + cleaned;
    }
    
    // Remove + and add @c.us for WhatsApp format
    const whatsappNumber = cleaned.replace('+', '') + '@c.us';
    console.log(`📞 Formatted ${phoneNumber} → ${whatsappNumber}`);
    return whatsappNumber;
  }

  // Enhanced OTP sending with multiple delivery methods
  async sendSignupOTP(phoneNumber: string, fullName: string): Promise<string> {
    if (!this.isReady || !this.client) {
      throw new Error('WhatsApp service is not ready. Please connect first.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    this.otpStore.set(phoneNumber, { otp, expires });

    const chatId = this.formatPhoneNumber(phoneNumber);
    console.log(`🎯 Attempting to send OTP ${otp} to ${chatId}`);

    const message = `🔐 *PAKETY - رمز التحقق*

مرحباً ${fullName}! 

رمز التحقق الخاص بك: *${otp}*

⏰ صالح لمدة 10 دقائق
🛡️ لا تشارك هذا الرمز مع أحد

نشكرك لاختيارك PAKETY 🛒`;

    try {
      // Method 1: Direct sendMessage
      console.log('📨 Method 1: Direct sendMessage...');
      await this.client.sendMessage(chatId, message);
      console.log(`✅ OTP sent successfully to ${phoneNumber} via direct method`);
      return otp;
    } catch (directError) {
      console.log('⚠️ Direct method failed, trying method 2...');
      
      try {
        // Method 2: Get contact first, then send
        console.log('📨 Method 2: Contact-based sending...');
        const contact = await this.client.getContactById(chatId);
        if (contact) {
          await contact.sendMessage(message);
          console.log(`✅ OTP sent successfully to ${phoneNumber} via contact method`);
          return otp;
        }
      } catch (contactError) {
        console.log('⚠️ Contact method failed, trying method 3...');
        
        try {
          // Method 3: Check number validity first
          console.log('📨 Method 3: Number validation + send...');
          const numberId = await this.client.getNumberId(chatId);
          if (numberId && numberId.exists) {
            await this.client.sendMessage(numberId._serialized, message);
            console.log(`✅ OTP sent successfully to ${phoneNumber} via number validation`);
            return otp;
          } else {
            throw new Error('Phone number is not registered on WhatsApp');
          }
        } catch (validationError) {
          console.log('⚠️ Number validation failed, trying method 4...');
          
          try {
            // Method 4: Create chat and send
            console.log('📨 Method 4: Chat creation + send...');
            const chat = await this.client.createChat(chatId);
            if (chat) {
              await chat.sendMessage(message);
              console.log(`✅ OTP sent successfully to ${phoneNumber} via chat creation`);
              return otp;
            }
          } catch (chatError) {
            console.error('❌ All WhatsApp delivery methods failed');
            console.error('Direct error:', directError.message);
            console.error('Contact error:', contactError.message);
            console.error('Validation error:', validationError.message);
            console.error('Chat error:', chatError.message);
            
            throw new Error(`Failed to deliver OTP to ${phoneNumber}. All WhatsApp delivery methods failed.`);
          }
        }
      }
    }
    
    // This should never be reached
    throw new Error('Unexpected error in OTP delivery');
  }

  // Store OTP for verification (fallback method)
  storeOTPForVerification(phoneNumber: string, otp: string): void {
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    this.otpStore.set(phoneNumber, { otp, expires });
    console.log(`🔑 Stored fallback OTP ${otp} for ${phoneNumber}`);
  }

  // Verify OTP
  verifyOTP(phoneNumber: string, providedOTP: string): boolean {
    const stored = this.otpStore.get(phoneNumber);
    
    if (!stored) {
      console.log(`❌ No OTP found for ${phoneNumber}`);
      return false;
    }

    if (Date.now() > stored.expires) {
      console.log(`❌ OTP expired for ${phoneNumber}`);
      this.otpStore.delete(phoneNumber);
      return false;
    }

    if (stored.otp !== providedOTP) {
      console.log(`❌ Invalid OTP for ${phoneNumber}. Expected: ${stored.otp}, Got: ${providedOTP}`);
      return false;
    }

    console.log(`✅ OTP verified successfully for ${phoneNumber}`);
    this.otpStore.delete(phoneNumber);
    return true;
  }

  // Clean up expired OTPs
  private cleanupExpiredOTPs(): void {
    const now = Date.now();
    for (const [phoneNumber, data] of this.otpStore.entries()) {
      if (now > data.expires) {
        this.otpStore.delete(phoneNumber);
        console.log(`🧹 Cleaned up expired OTP for ${phoneNumber}`);
      }
    }
  }

  // Other messaging methods...
  async sendCustomerInvoice(phoneNumber: string, customerName: string, order: any, pdfBuffer: Buffer): Promise<void> {
    if (!this.isReady) {
      throw new Error('WhatsApp service is not ready');
    }
    
    try {
      console.log(`📄 Sending invoice to ${phoneNumber} for order ${order.id}`);
      
      const wwebjs = require('whatsapp-web.js');
      const { MessageMedia } = wwebjs;
      
      // Format phone number for WhatsApp
      const chatId = this.formatPhoneNumber(phoneNumber);
      
      // Create the success message
      const message = `🎉 *تم استلام طلبك بنجاح*

مرحباً ${customerName} 👋

✅ تم تأكيد طلبك رقم: #${order.id}
💰 المبلغ الإجمالي: ${order.totalAmount.toLocaleString()} د.ع
📦 عدد الأصناف: ${order.items.length} صنف
🚚 وقت التوصيل: ${order.deliveryTime || 'سيتم تحديده قريباً'}

📄 فاتورة الطلب مرفقة في الأسفل

شكراً لاختيارك PAKETY 💚
سنتواصل معك قريباً لتأكيد موعد التوصيل`;

      // Send text message first
      await this.client.sendMessage(chatId, message);
      
      // Send PDF invoice as attachment
      const media = new MessageMedia('application/pdf', pdfBuffer.toString('base64'), `Invoice_Order_${order.id}.pdf`);
      await this.client.sendMessage(chatId, media, {
        caption: `فاتورة الطلب رقم #${order.id} 📄`
      });
      
      console.log(`✅ Invoice sent successfully to ${phoneNumber}`);
    } catch (error) {
      console.error(`❌ Failed to send invoice to ${phoneNumber}:`, error);
      throw error;
    }
  }

  async sendDriverNotification(driverPhone: string, order: any): Promise<void> {
    if (!this.isReady) {
      throw new Error('WhatsApp service is not ready');
    }
    
    try {
      console.log(`🚗 Sending driver notification for order ${order.id}`);
      
      const chatId = this.formatPhoneNumber(driverPhone);
      
      const message = `🚚 *طلب جديد للتوصيل*

📦 رقم الطلب: #${order.id}
👤 اسم العميل: ${order.customerName}
📱 رقم العميل: ${order.customerPhone}
🏠 العنوان: ${order.address.governorate} - ${order.address.district}
📍 النقطة الدالة: ${order.address.neighborhood}

💰 المبلغ الإجمالي: ${order.totalAmount.toLocaleString()} د.ع
⏰ وقت التوصيل المطلوب: ${order.deliveryTime || 'حسب التوفر'}

📝 ملاحظات إضافية: ${order.notes || 'لا توجد ملاحظات'}

🔔 يرجى التجهز للتوصيل`;

      await this.client.sendMessage(chatId, message);
      console.log(`✅ Driver notification sent successfully`);
    } catch (error) {
      console.error(`❌ Failed to send driver notification:`, error);
      throw error;
    }
  }

  async sendStorePreparationAlert(storePhone: string, order: any): Promise<void> {
    if (!this.isReady) {
      throw new Error('WhatsApp service is not ready');
    }
    
    try {
      console.log(`🏪 Sending store preparation alert for order ${order.id}`);
      
      const chatId = this.formatPhoneNumber(storePhone);
      
      const itemsList = order.items.map((item: any) => 
        `• ${item.productName} - ${item.quantity} ${item.unit} - ${parseFloat(item.price).toLocaleString()} د.ع`
      ).join('\n');
      
      const message = `🏪 *طلب جديد للتحضير*

📦 رقم الطلب: #${order.id}
👤 العميل: ${order.customerName}
📱 الموبايل: ${order.customerPhone}

📋 *قائمة الأصناف:*
${itemsList}

💰 المجموع: ${order.totalAmount.toLocaleString()} د.ع
⏰ موعد التوصيل: ${order.deliveryTime || 'حسب التوفر'}

📝 ملاحظات: ${order.notes || 'لا توجد ملاحظات'}

🔔 يرجى تحضير الطلب`;

      await this.client.sendMessage(chatId, message);
      console.log(`✅ Store alert sent successfully`);
    } catch (error) {
      console.error(`❌ Failed to send store alert:`, error);
      throw error;
    }
  }

  async sendStatusUpdate(customerPhone: string, orderId: number, status: string): Promise<void> {
    if (!this.isReady) {
      throw new Error('WhatsApp service is not ready');
    }
    
    try {
      console.log(`📊 Sending status update for order ${orderId}: ${status}`);
      
      const chatId = this.formatPhoneNumber(customerPhone);
      
      const statusMessages = {
        'confirmed': '✅ تم تأكيد طلبك وجاري التحضير',
        'preparing': '👨‍🍳 جاري تحضير طلبك الآن',
        'out-for-delivery': '🚚 طلبك في الطريق إليك',
        'delivered': '🎉 تم توصيل طلبك بنجاح',
        'cancelled': '❌ تم إلغاء طلبك'
      };
      
      const statusText = statusMessages[status as keyof typeof statusMessages] || `حالة الطلب: ${status}`;
      
      const message = `📦 *تحديث حالة الطلب #${orderId}*

${statusText}

شكراً لاختيارك PAKETY 💚`;

      await this.client.sendMessage(chatId, message);
      console.log(`✅ Status update sent successfully`);
    } catch (error) {
      console.error(`❌ Failed to send status update:`, error);
      throw error;
    }
  }
}

// Create singleton instance
const whatsappService = new WhatsAppService();
export default whatsappService;