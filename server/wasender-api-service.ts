import axios from 'axios';
import FormData from 'form-data';

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
      
      console.log(`📄 FIXED METHOD: Sending PDF directly to ${formattedPhone}: ${fileName}`);
      
      // Convert PDF buffer to base64
      const base64Data = pdfBuffer.toString('base64');
      console.log(`✅ PDF converted to base64 - Size: ${base64Data.length} chars`);
      
      // Send document directly with base64 data
      const payload = {
        to: formattedPhone,
        type: 'document',
        document: {
          data: base64Data,
          filename: fileName,
          mimetype: 'application/pdf'
        },
        text: message
      };

      console.log(`📡 Sending PDF via WasenderAPI direct method...`);
      const response = await axios.post(`${this.baseUrl}/api/send-message`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 60000 // 60 second timeout for PDF uploads
      });

      console.log(`📊 WasenderAPI Response Status:`, response.status);
      console.log(`📊 WasenderAPI Response Data:`, JSON.stringify(response.data, null, 2));

      // Check if response indicates success (status 200 and no error message)
      if (response.status === 200 && response.data && !response.data.error) {
        console.log(`✅ FIXED METHOD: PDF sent successfully to ${formattedPhone}`);
        return {
          success: true,
          message: 'PDF sent successfully via direct base64 method'
        };
      } else {
        console.log(`❌ FIXED METHOD: PDF failed to send to ${formattedPhone} - Status: ${response.status}`);
        return {
          success: false,
          message: JSON.stringify(response.data)
        };
      }
    } catch (error: any) {
      console.error('❌ WasenderAPI: Failed to send PDF:', error.response?.data || error.message);
      console.error('📊 Full error details:', error);
      return {
        success: false,
        message: JSON.stringify(error.response?.data || error.message)
      };
    }
  }

  /**
   * Send PDF document via URL-based media (CORRECT WasenderAPI format)
   */
  async sendPDFDocumentViaURL(phone: string, pdfUrl: string, fileName: string, message: string): Promise<{success: boolean, message: string}> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      console.log(`📄 CORRECT METHOD: Sending PDF via URL to ${formattedPhone}: ${fileName}`);
      console.log(`📄 PDF URL: ${pdfUrl}`);
      
      // Use the CORRECT WasenderAPI format for document with URL
      const payload = {
        to: formattedPhone,
        type: 'document',
        media_url: pdfUrl,
        filename: fileName,
        text: message  // WasenderAPI requires 'text' field, not 'caption'
      };

      console.log(`📡 Sending PDF via WasenderAPI CORRECT method...`);
      const response = await axios.post(`https://wasenderapi.com/api/send-message`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 30000
      });

      console.log(`📊 WasenderAPI Response Status:`, response.status);
      console.log(`📊 WasenderAPI Response Data:`, JSON.stringify(response.data, null, 2));

      // STRICT success validation
      if (response.status === 200 && response.data?.success === true && response.data?.messageId) {
        console.log(`✅ CORRECT METHOD: PDF sent successfully to ${formattedPhone}`);
        return {
          success: true,
          message: 'PDF sent successfully via URL method'
        };
      } else {
        console.log(`❌ CORRECT METHOD: PDF failed - No success flag or messageId`);
        return {
          success: false,
          message: `API returned: ${JSON.stringify(response.data)}`
        };
      }
    } catch (error: any) {
      console.error('❌ WasenderAPI URL method failed:', error.response?.data || error.message);
      return {
        success: false,
        message: JSON.stringify(error.response?.data || error.message)
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
   * Format Iraqi phone numbers for WasenderAPI (requires 964 format without + sign)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters (including + sign)
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Iraqi format: 07XXXXXXXX -> 9647XXXXXXXX
    if (cleaned.startsWith('07') && cleaned.length === 11) {
      const formatted = `964${cleaned.substring(1)}`;
      console.log(`📱 Phone format: ${phone} -> ${formatted}`);
      return formatted;
    }
    
    // Handle international format: 9647XXXXXXXX -> 9647XXXXXXXX (already correct)
    if (cleaned.startsWith('964') && cleaned.length === 13) {
      console.log(`📱 Phone format: ${phone} -> ${cleaned}`);
      return cleaned;
    }
    
    // Handle without country code: 7XXXXXXXX -> 9647XXXXXXXX
    if (cleaned.startsWith('7') && cleaned.length === 10) {
      const formatted = `964${cleaned}`;
      console.log(`📱 Phone format: ${phone} -> ${formatted}`);
      return formatted;
    }
    
    // Handle already formatted with + (remove the +)
    if (phone.startsWith('+964')) {
      const formatted = phone.substring(1);
      console.log(`📱 Phone format: ${phone} -> ${formatted}`);
      return formatted;
    }
    
    // Return cleaned number (digits only)
    console.log(`📱 Phone format: ${phone} -> ${cleaned}`);
    return cleaned;
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