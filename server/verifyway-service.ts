import fetch from 'node-fetch';

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
  private baseUrl = 'https://api.verifyway.com/v1';
  private otpSessions = new Map<string, OTPSession>();

  constructor() {
    this.apiKey = process.env.VERIFYWAY_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ VERIFYWAY_API_KEY not found in environment variables');
    }
  }

  async sendOTP(phoneNumber: string, fullName: string): Promise<{ success: boolean; otp?: string; reference?: string; message?: string }> {
    try {
      console.log(`📱 Sending OTP via VerifyWay to ${phoneNumber}`);
      
      // Format phone number for VerifyWay (remove leading 0, add country code)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      const response = await fetch(`${this.baseUrl}/whatsapp/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          phone: formattedPhone,
          message: `مرحباً ${fullName}!\nرمز التحقق الخاص بك لتطبيق باكيتي هو: {otp}\nالرمز صالح لمدة 10 دقائق فقط.`,
          template_name: 'pakety_otp',
          language: 'ar'
        }),
      });

      const data = await response.json() as VerifyWayResponse;
      
      if (data.success && data.data) {
        // Store OTP session for verification
        const session: OTPSession = {
          phoneNumber,
          otp: data.data.otp,
          reference: data.data.reference,
          timestamp: Date.now(),
          expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
        };
        
        this.otpSessions.set(phoneNumber, session);
        
        console.log(`✅ VerifyWay OTP sent successfully to ${phoneNumber}`);
        
        return {
          success: true,
          otp: data.data.otp,
          reference: data.data.reference,
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
    // Convert Iraqi phone format 07xxxxxxxxx to international format
    // Remove leading 0 and add country code 964
    if (phoneNumber.startsWith('07')) {
      return `964${phoneNumber.substring(1)}`;
    }
    if (phoneNumber.startsWith('7')) {
      return `964${phoneNumber}`;
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
    for (const [phoneNumber, session] of this.otpSessions.entries()) {
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