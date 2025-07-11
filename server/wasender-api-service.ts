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
    this.apiKey = 'e09cac2b770c84cd50a0a7df8d6179a64bcfe26e78655c64b9881298a9b429a5';
    this.baseUrl = 'https://api.wasenderapi.com';
    this.sessionId = 'pakety_main'; // Unique session for this app
  }

  /**
   * Initialize WhatsApp session with QR code
   */
  async initializeSession(): Promise<WasenderAPIResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/create_session`, {
        session_id: this.sessionId,
        api_key: this.apiKey
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('🚀 WasenderAPI: Session initialization requested');
      return {
        success: true,
        message: 'Session initialization started',
        data: response.data
      };
    } catch (error: any) {
      console.error('❌ WasenderAPI: Session initialization failed:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get session status and QR code
   */
  async getSessionStatus(): Promise<WasenderAPIResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/session_status`, {
        params: {
          session_id: this.sessionId,
          api_key: this.apiKey
        }
      });

      const status = response.data.status;
      console.log(`📱 WasenderAPI: Session status - ${status}`);
      
      return {
        success: true,
        message: `Session status: ${status}`,
        data: response.data
      };
    } catch (error: any) {
      console.error('❌ WasenderAPI: Failed to get session status:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Send text message via WhatsApp
   */
  async sendMessage(phone: string, message: string): Promise<WasenderAPIResponse> {
    try {
      // Format phone number for Iraqi numbers
      const formattedPhone = this.formatPhoneNumber(phone);
      
      const payload = {
        session_id: this.sessionId,
        api_key: this.apiKey,
        to: formattedPhone,
        message: message
      };

      const response = await axios.post(`${this.baseUrl}/api/send_message`, payload, {
        headers: {
          'Content-Type': 'application/json'
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
   * Send PDF document via WhatsApp
   */
  async sendPDFDocument(phone: string, pdfBuffer: Buffer, fileName: string, message: string): Promise<{success: boolean, message: string}> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      // Convert buffer to base64
      const base64PDF = pdfBuffer.toString('base64');
      
      const payload = {
        session_id: this.sessionId,
        api_key: this.apiKey,
        to: formattedPhone,
        message: message,
        file_base64: base64PDF,
        filename: fileName,
        type: 'document'
      };

      const response = await axios.post(`${this.baseUrl}/api/send_file`, payload, {
        headers: {
          'Content-Type': 'application/json'
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
    const message = `رمز التحقق الخاص بك في تطبيق باكيتي هو: ${otp}\n\nلا تشارك هذا الرمز مع أي شخص آخر.`;
    return this.sendMessage(phone, message);
  }

  /**
   * Send order invoice to customer and admin
   */
  async sendOrderInvoice(customerPhone: string, adminPhone: string, orderId: number, customerName: string): Promise<WasenderAPIResponse> {
    const customerMessage = `مرحباً ${customerName}،\n\nتم استلام طلبكم بنجاح!\n\nرقم الطلب: ${orderId}\n\nسيتم التواصل معكم قريباً لترتيب عملية التسليم.\n\nشكراً لكم لاختيار باكيتي 🛒`;
    
    const adminMessage = `🔔 طلب جديد!\n\nرقم الطلب: ${orderId}\nاسم العميل: ${customerName}\nرقم العميل: ${customerPhone}\n\nيرجى مراجعة تفاصيل الطلب في لوحة الإدارة.`;

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
   * Format Iraqi phone numbers for WhatsApp
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Iraqi format: 07XXXXXXXX -> 9647XXXXXXXX
    if (cleaned.startsWith('07') && cleaned.length === 11) {
      return `964${cleaned.substring(1)}`;
    }
    
    // Handle international format: 9647XXXXXXXX
    if (cleaned.startsWith('964') && cleaned.length === 13) {
      return cleaned;
    }
    
    // Handle without country code: 7XXXXXXXX -> 9647XXXXXXXX
    if (cleaned.startsWith('7') && cleaned.length === 10) {
      return `964${cleaned}`;
    }
    
    // Return as-is if format not recognized
    return cleaned;
  }

  /**
   * Check if WhatsApp session is ready
   */
  async isSessionReady(): Promise<boolean> {
    try {
      const status = await this.getSessionStatus();
      return status.success && status.data?.status === 'authenticated';
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