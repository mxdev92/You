// Note: Using global fetch available in Node.js 18+

interface VerifyWayResponse {
  success: boolean;
  message: string;
  data?: {
    otp: string;
    reference: string;
  };
}

interface OTPSession {
  phoneNumber: string;
  otp: string;
  reference: string;
  timestamp: number;
  expiresAt: number;
}

export class VerifyWayService {
  private apiKey: string;
  private baseUrl = 'https://api.verifyway.com/api/v1';
  public otpSessions = new Map<string, OTPSession>();

  constructor() {
    this.apiKey = process.env.VERIFYWAY_API_KEY || '';
    if (!this.apiKey) {
      console.error('❌ SECURITY ERROR: VERIFYWAY_API_KEY environment variable is required');
      throw new Error('VERIFYWAY_API_KEY environment variable is required for security');
    }
    console.log('🔑 VerifyWay service initialized securely with environment variables');
  }

  async sendOTP(phoneNumber: string, fullName: string): Promise<{ success: boolean; otp?: string; reference?: string; message?: string }> {
    try {
      console.log(`📱 Sending OTP via VerifyWay to ${phoneNumber}`);
      
      // Format phone number for VerifyWay (remove leading 0, add country code)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Generate a 4-digit OTP code
      const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
      
      console.log(`📤 Sending to VerifyWay API: ${this.baseUrl}`);
      console.log(`📞 Phone: ${formattedPhone}, Original: ${phoneNumber}, OTP: ${otpCode}`);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          recipient: formattedPhone,
          type: 'otp',
          code: otpCode,
          channel: 'whatsapp'
        }),
      });

      console.log(`📊 VerifyWay response status: ${response.status}`);
      const responseText = await response.text();
      console.log(`📋 VerifyWay response body: ${responseText}`);
      
      let data: VerifyWayResponse;
      try {
        data = JSON.parse(responseText) as VerifyWayResponse;
      } catch (parseError) {
        console.error(`❌ Failed to parse VerifyWay response: ${responseText}`);
        throw new Error(`Invalid response from VerifyWay API: ${responseText}`);
      }
      
      if (response.status === 200 || response.status === 201) {
        // Store OTP session for verification
        const session: OTPSession = {
          phoneNumber,
          otp: otpCode,
          reference: `vw_${Date.now()}`,
          timestamp: Date.now(),
          expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
        };
        
        this.otpSessions.set(phoneNumber, session);
        
        console.log(`✅ VerifyWay OTP sent successfully to ${phoneNumber}: ${otpCode}`);
        
        // SECURITY: Never return OTP in API response - OTP must remain server-side only
        console.log(`🔑 SECURITY: OTP generated for ${phoneNumber}: ${otpCode} (VerifyWay service)`);
        
        return {
          success: true,
          reference: session.reference,
          message: 'OTP sent via WhatsApp'
        };
      } else {
        console.error(`❌ VerifyWay API error:`, data.message);
        return {
          success: false,
          message: data.message || 'Failed to send OTP'
        };
      }
      
    } catch (error: any) {
      console.error('❌ VerifyWay service error:', error);
      return {
        success: false,
        message: 'Service temporarily unavailable'
      };
    }
  }

  verifyOTP(phoneNumber: string, otp: string): { valid: boolean; message: string } {
    const session = this.otpSessions.get(phoneNumber);
    
    if (!session) {
      return { valid: false, message: 'لم يتم العثور على رمز التحقق' };
    }
    
    if (Date.now() > session.expiresAt) {
      this.otpSessions.delete(phoneNumber);
      return { valid: false, message: 'انتهت صلاحية رمز التحقق' };
    }
    
    if (session.otp === otp) {
      this.otpSessions.delete(phoneNumber);
      console.log(`✅ OTP verified successfully for ${phoneNumber}`);
      return { valid: true, message: 'تم التحقق بنجاح' };
    }
    
    return { valid: false, message: 'رمز التحقق غير صحيح' };
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Convert Iraqi phone format 07xxxxxxxxx to international format +9647xxxxxxxxx
    // Remove leading 0 and add country code 964 with + prefix
    if (phoneNumber.startsWith('07')) {
      return `+964${phoneNumber.substring(1)}`;
    }
    if (phoneNumber.startsWith('7')) {
      return `+964${phoneNumber}`;
    }
    if (!phoneNumber.startsWith('+')) {
      return `+${phoneNumber}`;
    }
    return phoneNumber;
  }

  // Get stored OTP for fallback (debugging purposes)
  getStoredOTP(phoneNumber: string): string | null {
    const session = this.otpSessions.get(phoneNumber);
    return session ? session.otp : null;
  }

  // Cleanup expired sessions
  cleanupExpiredSessions(): void {
    const now = Date.now();
    const entries = Array.from(this.otpSessions.entries());
    for (const [phoneNumber, session] of entries) {
      if (now > session.expiresAt) {
        this.otpSessions.delete(phoneNumber);
      }
    }
  }
}

export const verifyWayService = new VerifyWayService();

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  verifyWayService.cleanupExpiredSessions();
}, 5 * 60 * 1000);