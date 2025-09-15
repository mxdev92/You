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

  constructor() {
    // SECURITY: Load API key from environment variables only
    this.apiKey = process.env.Wasender_api || '';
    if (!this.apiKey) {
      console.error('❌ SECURITY ERROR: Wasender_api environment variable is required');
      throw new Error('Wasender_api environment variable is required for security');
    }
    
    this.baseUrl = 'https://www.wasenderapi.com'; // Correct base URL from documentation
    this.sessionId = 'pakety_main'; // Unique session for this app
    
    console.log('🔑 WasenderAPI service initialized securely with environment variables');
  }

  /**
   * Initialize WasenderAPI session - Connect WhatsApp session
   */
  async initializeSession(): Promise<WasenderAPIResponse> {
    try {
      // For paid accounts, the session should already exist
      // We just need to check the status and get QR code if needed
      const statusResult = await this.getSessionStatus();
      
      if (statusResult.success) {
        if (statusResult.data.status === 'need_scan') {
          console.log('🔑 WasenderAPI: Session ready for QR code scanning');
          return {
            success: true,
            message: 'WasenderAPI session ready - QR code scanning required',
            data: statusResult.data
          };
        } else if (statusResult.data.status === 'authenticated') {
          console.log('✅ WasenderAPI: Session already authenticated');
          return {
            success: true,
            message: 'WasenderAPI session authenticated and ready',
            data: statusResult.data
          };
        }
      }
      
      console.log('🚀 WasenderAPI: Session initialization completed');
      return {
        success: true,
        message: 'WasenderAPI session initialized',
        data: statusResult.data
      };
    } catch (error: any) {
      console.error('❌ WasenderAPI: Session initialization failed:', error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      };
    }
  }

  /**
   * Get session status - Check if WhatsApp session is connected
   */
  async getSessionStatus(): Promise<WasenderAPIResponse> {
    try {
      // Check session status using the proper endpoint
      const response = await axios.get(`https://wasenderapi.com/api/status`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      console.log(`📱 WasenderAPI: Session status check successful - Status: ${response.data.status}`);
      
      return {
        success: true,
        message: `WasenderAPI session status: ${response.data.status}`,
        data: response.data
      };
    } catch (error: any) {
      console.error('❌ WasenderAPI: Session status check failed:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
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
      
      // Step 1: Upload PDF to get temporary URL using FormData for file upload
      console.log(`📤 Uploading PDF to WasenderAPI: ${fileName}`);
      
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', pdfBuffer, {
        filename: fileName,
        contentType: 'application/pdf'
      });
      
      const uploadResponse = await axios.post(`${this.baseUrl}/api/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 30000 // 30 second timeout for PDF uploads
      });

      console.log(`📊 WasenderAPI Upload Response:`, JSON.stringify(uploadResponse.data, null, 2));
      console.log(`📊 Response Status:`, uploadResponse.status);

      if (!uploadResponse.data.success || !uploadResponse.data.url) {
        console.error('❌ Upload failed - Response structure:', uploadResponse.data);
        throw new Error(`Failed to upload PDF to WasenderAPI: ${JSON.stringify(uploadResponse.data)}`);
      }

      const documentUrl = uploadResponse.data.url;
      console.log(`✅ PDF uploaded successfully: ${documentUrl}`);

      // Step 2: Send document message with the uploaded URL
      const payload = {
        to: formattedPhone,
        documentUrl: documentUrl,
        text: message,
        filename: fileName
      };

      const response = await axios.post(`${this.baseUrl}/api/send-message`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 10000 // 10 second timeout for sending
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
   * Check if WhatsApp session is ready
   */
  async isSessionReady(): Promise<boolean> {
    try {
      const status = await this.getSessionStatus();
      return status.success && (status.data?.status === 'connected' || status.data?.status === 'authenticated');
    } catch {
      return false;
    }
  }

  /**
   * Get connection uptime and statistics
   */
  async getConnectionStats(): Promise<any> {
    try {
      const response = await axios.get(`https://wasenderapi.com/api/status`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
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