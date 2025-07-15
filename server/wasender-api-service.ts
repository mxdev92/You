import axios from 'axios';

interface WasenderAPIResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface SendMessagePayload {
  phone: string;
  message: string;
  type?: 'text' | 'media' | 'document';
  media_url?: string;
  filename?: string;
}

export class WasenderAPIService {
  private apiKey: string;
  private baseUrl: string;
  private sessionId: string;
  private whatsappSessionId: number;

  constructor() {
    this.apiKey = 'e09cac2b770c84cd50a0a7df8d6179a64bcfe26e78655c64b9881298a9b429a5';
    this.baseUrl = 'https://www.wasenderapi.com'; // Correct base URL from documentation
    this.sessionId = 'pakety_main'; // Unique session for this app
    this.whatsappSessionId = 1; // Default session ID, will be updated dynamically
    
    console.log('🔑 WasenderAPI service initialized with correct endpoints');
  }

  /**
   * Initialize WasenderAPI - no session setup required, just test connectivity
   */
  async initializeSession(): Promise<WasenderAPIResponse> {
    try {
      // WasenderAPI doesn't require session initialization like Baileys
      // Just test that our API key works
      const testResult = await this.getSessionStatus();
      
      console.log('🚀 WasenderAPI: Service initialized and tested');
      return {
        success: testResult.success,
        message: testResult.success ? 'WasenderAPI ready for use' : 'WasenderAPI initialization failed',
        data: testResult.data
      };
    } catch (error: any) {
      console.error('❌ WasenderAPI: Initialization failed:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get session status - Check if WhatsApp session is connected
   */
  async getSessionStatus(): Promise<WasenderAPIResponse> {
    try {
      // Check session status instead of sending test message
      const response = await axios.get(`${this.baseUrl}/api/status`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      console.log(`📱 WasenderAPI: Session status check successful`);
      
      return {
        success: true,
        message: 'WasenderAPI session checked',
        data: response.data
      };
    } catch (error: any) {
      console.error('❌ WasenderAPI: Session status check failed:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get QR code for WhatsApp session connection
   */
  async getQRCode(): Promise<WasenderAPIResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/whatsapp-sessions/${this.whatsappSessionId}/qrcode`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      console.log(`📱 WasenderAPI: QR code retrieved successfully`);
      
      return {
        success: true,
        message: 'QR code retrieved',
        data: response.data
      };
    } catch (error: any) {
      console.error('❌ WasenderAPI: QR code retrieval failed:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Connect WhatsApp session
   */
  async connectSession(): Promise<WasenderAPIResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/whatsapp-sessions/${this.whatsappSessionId}/connect`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      console.log(`📱 WasenderAPI: Session connection initiated`);
      
      return {
        success: true,
        message: 'Session connection initiated',
        data: response.data
      };
    } catch (error: any) {
      console.error('❌ WasenderAPI: Session connection failed:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Send text message via WhatsApp using correct WasenderAPI format
   */
  async sendMessage(phone: string, message: string): Promise<WasenderAPIResponse> {
    try {
      // Format phone number for Iraqi numbers
      const formattedPhone = this.formatPhoneNumber(phone);
      
      const payload = {
        to: formattedPhone,
        text: message
      };

      const response = await axios.post(`https://wasenderapi.com/api/send-message`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}` // Correct authentication method
        }
      });

      console.log(`✅ WasenderAPI: Message sent to ${formattedPhone}`);
      return {
        success: true,
        message: 'Message sent successfully',
        data: response.data
      };
    } catch (error: any) {
      console.error('❌ WasenderAPI: Failed to send message:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Send PDF document via WhatsApp using WasenderAPI
   */
  async sendPDFDocument(phone: string, pdfBuffer: Buffer, fileName: string, message: string): Promise<{success: boolean, message: string}> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      // Convert buffer to base64
      const base64PDF = pdfBuffer.toString('base64');
      
      const payload = {
        to: formattedPhone,
        text: message,
        file_base64: base64PDF,
        filename: fileName,
        type: 'document'
      };

      const response = await axios.post(`https://wasenderapi.com/api/send-document`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 30000 // 30 second timeout for PDF uploads
      });

      console.log(`📄 WasenderAPI: PDF sent to ${formattedPhone} - ${fileName}`);
      return {
        success: true,
        message: 'PDF sent successfully'
      };
    } catch (error: any) {
      console.error('❌ WasenderAPI: Failed to send PDF:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Send OTP message for user verification
   */
  async sendOTPMessage(phone: string, otp: string): Promise<WasenderAPIResponse> {
    const message = `🔐 *رمز التحقق - باكيتي*

مرحباً بك في تطبيق باكيتي للتوصيل السريع 🛒

*رمز التحقق الخاص بك:* ${otp}

⚠️ *تنبيه مهم:*
• هذا الرمز صالح لمدة 5 دقائق فقط
• لا تشارك هذا الرمز مع أي شخص آخر
• فريق باكيتي لن يطلب منك هذا الرمز مطلقاً

شكراً لاختيارك باكيتي 💚`;
    return this.sendMessage(phone, message);
  }

  /**
   * Send order invoice to customer and admin
   */
  async sendOrderInvoice(customerPhone: string, adminPhone: string, orderId: number, customerName: string): Promise<WasenderAPIResponse> {
    const customerMessage = `✅ *تأكيد الطلب - باكيتي*

مرحباً *${customerName}* 👋

🎉 تم استلام طلبكم بنجاح وهو قيد التحضير الآن

*تفاصيل الطلب:*
📦 رقم الطلب: #${orderId}
📅 تاريخ الطلب: ${new Date().toLocaleDateString('ar-SA')}
⏰ وقت الطلب: ${new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}

*خطوات التسليم:*
1️⃣ تحضير الطلب (10-15 دقيقة)
2️⃣ تواصل من فريق التوصيل
3️⃣ توصيل الطلب لعنوانكم

سيتم التواصل معكم خلال دقائق لتأكيد عنوان التسليم والوقت المناسب 📞

شكراً لثقتكم بباكيتي 💚
*أسرع توصيل للمواد الغذائية في العراق* 🇮🇶`;
    
    const adminMessage = `🚨 *طلب جديد - يتطلب المعالجة*

*تفاصيل الطلب:*
📦 رقم الطلب: #${orderId}
👤 اسم العميل: ${customerName}
📱 رقم الهاتف: ${customerPhone}
⏰ وقت الطلب: ${new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}

*الإجراءات المطلوبة:*
1️⃣ مراجعة تفاصيل الطلب في لوحة الإدارة
2️⃣ تحضير المواد المطلوبة
3️⃣ التواصل مع العميل لتأكيد التسليم
4️⃣ تحديث حالة الطلب

🔗 *لوحة الإدارة:* /admin

⚡ *عاجل - يرجى المعالجة فوراً*`;

    // Send to customer
    const customerResult = await this.sendMessage(customerPhone, customerMessage);
    
    // Send to admin
    const adminResult = await this.sendMessage(adminPhone, adminMessage);

    return {
      success: customerResult.success && adminResult.success,
      message: 'Order notifications sent',
      data: { customerResult, adminResult }
    };
  }

  /**
   * Format Iraqi phone numbers for WasenderAPI (requires +964 format)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Iraqi format: 07XXXXXXXX -> +9647XXXXXXXX
    if (cleaned.startsWith('07') && cleaned.length === 11) {
      return `+964${cleaned.substring(1)}`;
    }
    
    // Handle international format: 9647XXXXXXXX -> +9647XXXXXXXX
    if (cleaned.startsWith('964') && cleaned.length === 13) {
      return `+${cleaned}`;
    }
    
    // Handle without country code: 7XXXXXXXX -> +9647XXXXXXXX
    if (cleaned.startsWith('7') && cleaned.length === 10) {
      return `+964${cleaned}`;
    }
    
    // Handle already formatted with +
    if (phone.startsWith('+964')) {
      return phone;
    }
    
    // Return with + prefix if not already there
    return phone.startsWith('+') ? phone : `+${cleaned}`;
  }

  /**
   * Check if WhatsApp session is ready and connected
   */
  async isSessionReady(): Promise<boolean> {
    try {
      const status = await this.getSessionStatus();
      return status.success && (status.data?.status === 'authenticated' || status.data?.connected === true);
    } catch {
      return false;
    }
  }

  /**
   * Get connection uptime and statistics
   */
  async getConnectionStats(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/session_status`, {
        params: {
          session_id: this.sessionId,
          api_key: this.apiKey
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  }
}

// Initialize service
export const wasenderService = new WasenderAPIService();

// Auto-initialize session on startup
console.log('🔑 WasenderAPI service initialized');
wasenderService.initializeSession().then(result => {
  if (result.success) {
    console.log('✅ WasenderAPI: Session initialization completed');
  } else {
    console.log('⚠️ WasenderAPI: Session initialization failed, manual setup required');
  }
}).catch(error => {
  console.error('❌ WasenderAPI: Startup error:', error.message);
});