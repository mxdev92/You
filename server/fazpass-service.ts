import fetch from 'node-fetch';

interface VerifyWayOTPResponse {
  success: boolean;
  message: string;
  data?: {
    otp_id: string;
    otp_code: string;
    phone: string;
    status: string;
  };
}

interface VerifyWayVerifyResponse {
  success: boolean;
  message: string;
  data?: {
    otp_id: string;
    status: string;
    verified: boolean;
  };
}

export class VerifyWayService {
  private apiKey: string;
  private baseUrl: string;
  private otpSessions: Map<string, { otp: string; expiresAt: number; fullName: string; id?: string }>;

  constructor() {
    // VerifyWay API key provided by user
    this.apiKey = '906$E2P3X5cqM5U7lOgYNjZYOzfdLXCMDgFljOW9';
    this.baseUrl = 'https://api.verifyway.com/api/v1';
    this.otpSessions = new Map();
    
    console.log('🚀 VerifyWay WhatsApp OTP Service initialized');
    console.log(`📋 API Key: ${this.apiKey ? 'configured' : 'missing'}`);
    console.log(`🌐 Base URL: ${this.baseUrl}`);
  }

  private generateOTP(): string {
    // Generate 4-digit OTP as per current system
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Handle Iraqi phone numbers
    // Convert 07XXXXXXXXX to +9647XXXXXXXXX format
    let formatted = phoneNumber.replace(/\s+/g, '');
    
    if (formatted.startsWith('07')) {
      formatted = '+964' + formatted.substring(1);
    } else if (formatted.startsWith('7')) {
      formatted = '+964' + formatted;
    } else if (!formatted.startsWith('+964')) {
      formatted = '+964' + formatted;
    }
    
    console.log(`📱 Phone number formatted: ${phoneNumber} → ${formatted}`);
    return formatted;
  }

  private storeOTPSession(phoneNumber: string, otp: string, fullName: string, id?: string): void {
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes
    this.otpSessions.set(phoneNumber, { otp, expiresAt, fullName, id });
    console.log(`📝 OTP session stored for ${phoneNumber}: ${otp} (expires at ${new Date(expiresAt).toLocaleString()})`);
  }

  async sendOTP(phoneNumber: string, fullName: string): Promise<{ success: boolean; otp?: string; note?: string }> {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    
    console.log(`📱 Sending WhatsApp OTP to ${formattedPhone} via VerifyWay`);
    
    try {
      const otpCode = this.generateOTP();
      
      const requestBody = {
        recipient: formattedPhone,
        type: 'otp',
        code: otpCode,
        channel: 'whatsapp',
        lang: 'ar'
      };

      console.log(`🔧 Debug - Request body:`, { ...requestBody, code: '***masked***' });
      console.log(`🔧 Debug - Using lang: ar for Arabic messages (official VerifyWay parameter)`);
      console.log(`🔧 Debug - API URL: ${this.baseUrl}/`);

      const response = await fetch(`${this.baseUrl}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`🔧 Debug - Response status: ${response.status}`);
      
      const result = await response.json() as VerifyWayOTPResponse;
      console.log(`🔧 Debug - Full API response:`, result);
      
      if (response.ok) {
        // VerifyWay sends the OTP for us, we use the code we generated
        const otpId = result.data?.otp_id || Date.now().toString();
        
        this.storeOTPSession(phoneNumber, otpCode, fullName, otpId);
        
        console.log(`✅ VerifyWay WhatsApp OTP sent successfully to ${formattedPhone}`);
        console.log(`📋 OTP: ${otpCode}, ID: ${otpId}`);
        
        return {
          success: true,
          otp: otpCode,
          note: `WhatsApp OTP sent via VerifyWay to ${formattedPhone}`
        };
      } else {
        console.error('❌ VerifyWay API error:', result);
        
        // Fallback: Generate local OTP for development/testing
        const fallbackOtp = this.generateOTP();
        this.storeOTPSession(phoneNumber, fallbackOtp, fullName);
        
        console.log(`🔄 Fallback: Generated OTP ${fallbackOtp} for ${formattedPhone}`);
        console.log(`📱 USER: Please use this OTP code: ${fallbackOtp}`);
        return {
          success: true,
          otp: fallbackOtp,
          note: "رمز التحقق جاهز للتسجيل (وضع الاحتياطي)"
        };
      }
    } catch (error) {
      console.error('❌ VerifyWay service error:', error);
      
      // Fallback: Generate local OTP
      const fallbackOtp = this.generateOTP();
      this.storeOTPSession(phoneNumber, fallbackOtp, fullName);
      
      console.log(`🔄 Error fallback: Generated OTP ${fallbackOtp} for ${formattedPhone}`);
      console.log(`📱 USER: Please use this OTP code: ${fallbackOtp}`);
      return {
        success: true,
        otp: fallbackOtp,
        note: "رمز التحقق جاهز للتسجيل (وضع الطوارئ)"
      };
    }
  }

  async verifyOTP(phoneNumber: string, inputOtp: string): Promise<{ valid: boolean; message: string }> {
    const session = this.otpSessions.get(phoneNumber);
    
    if (!session) {
      return { valid: false, message: 'لم يتم العثور على جلسة OTP' };
    }
    
    if (Date.now() > session.expiresAt) {
      this.otpSessions.delete(phoneNumber);
      return { valid: false, message: 'انتهت صلاحية رمز OTP' };
    }
    
    // Check local OTP first (for fallback cases)
    if (session.otp === inputOtp) {
      this.otpSessions.delete(phoneNumber);
      console.log(`✅ OTP verified successfully for ${phoneNumber} (local verification)`);
      return { valid: true, message: 'تم التحقق من OTP بنجاح' };
    }
    
    // If we have a Fazpass ID, verify with Fazpass API
    if (session.id) {
      try {
        const response = await fetch(`${this.baseUrl}/v1/otp/verify`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.merchantKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            otp_id: session.id,
            otp: inputOtp
          })
        });

        const result = await response.json() as FazpassVerifyResponse;
        
        if (response.ok && result.status) {
          this.otpSessions.delete(phoneNumber);
          console.log(`✅ OTP verified successfully for ${phoneNumber} via Fazpass API`);
          return { valid: true, message: 'تم التحقق من OTP بنجاح' };
        } else {
          console.log(`❌ Fazpass verification failed: ${result.message}`);
          return { valid: false, message: 'رمز OTP غير صحيح' };
        }
      } catch (error) {
        console.error('❌ Fazpass verification error:', error);
        // Fall back to local verification if API fails
        return { valid: false, message: 'خطأ في التحقق من الرمز' };
      }
    }
    
    return { valid: false, message: 'رمز OTP غير صحيح' };
  }

  // Method to get current session info for debugging
  getSessionInfo(phoneNumber: string) {
    const session = this.otpSessions.get(phoneNumber);
    if (session) {
      return {
        hasSession: true,
        expiresAt: new Date(session.expiresAt).toLocaleString(),
        hasId: !!session.id
      };
    }
    return { hasSession: false };
  }

  // Clear expired sessions periodically
  cleanupExpiredSessions() {
    const now = Date.now();
    for (const [phoneNumber, session] of this.otpSessions.entries()) {
      if (now > session.expiresAt) {
        this.otpSessions.delete(phoneNumber);
        console.log(`🧹 Cleaned up expired OTP session for ${phoneNumber}`);
      }
    }
  }

  // Send admin notification via VerifyWay WhatsApp
  async sendAdminNotification(adminPhone: string, orderData: any): Promise<boolean> {
    const formattedPhone = this.formatPhoneNumber(adminPhone);
    
    try {
      console.log(`📱 Sending admin notification to ${formattedPhone} via VerifyWay`);
      
      // Create admin notification message
      const adminMessage = `🔔 طلب جديد في PAKETY!

📋 رقم الطلب: ${orderData.orderId}
👤 اسم العميل: ${orderData.customerName}
📱 رقم العميل: ${orderData.customerPhone}
📍 عنوان التوصيل: ${orderData.address}
💰 المبلغ الإجمالي: ${orderData.total.toLocaleString()} د.ع
🛒 عدد الأصناف: ${orderData.itemCount}

⚡ يرجى تحضير الطلب والتوصيل في أسرع وقت`;

      // VerifyWay only supports OTP type messages, so we need to send as OTP with a dummy code
      // and include our admin message in the text
      const dummyCode = '0000'; // Dummy code since this is not for verification
      
      const requestBody = {
        recipient: formattedPhone,
        type: 'otp',
        code: dummyCode,
        channel: 'whatsapp',
        lang: 'ar',
        body: adminMessage  // Custom message body
      };

      console.log(`🔧 Debug - Admin notification request:`, { ...requestBody, body: '***message***' });

      const response = await fetch(`${this.baseUrl}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`🔧 Debug - Response status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`🔧 Debug - Admin notification API response:`, result);
        console.log(`✅ VerifyWay admin notification sent successfully to ${formattedPhone}`);
        return true;
      } else {
        const errorResult = await response.json();
        console.error('❌ Failed to send admin notification:', errorResult);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending admin notification:', error);
      return false;
    }
  }
}

// Export singleton instance
export const verifyWayService = new VerifyWayService();

// Export with old name for compatibility
export const fazpassService = verifyWayService;

// Clean up expired sessions every 5 minutes
setInterval(() => {
  fazpassService.cleanupExpiredSessions();
}, 5 * 60 * 1000);