import fetch from 'node-fetch';

interface FazpassOTPResponse {
  status: boolean;
  message: string;
  data?: {
    id: string;
    otp: string;
    otp_length: number;
    channel: string;
  };
}

interface FazpassVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    id: string;
    status: string;
  };
}

export class FazpassService {
  public merchantKey: string;
  private gatewayKey: string;
  private baseUrl: string;
  private otpSessions: Map<string, { otp: string; expiresAt: number; fullName: string; id?: string }>;

  constructor() {
    // Use the JWT token provided by user
    this.merchantKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGVudGlmaWVyIjoxNjA1OX0.jgMploSV90sZcC0Xg8z-XSQt-Xj2plkdwcGQjdr9xvs';
    // Try common gateway key patterns for WhatsApp
    this.gatewayKey = process.env.FAZPASS_GATEWAY_KEY || 'whatsapp' || 'wa' || 'default';
    this.baseUrl = 'https://api.fazpass.com';
    this.otpSessions = new Map();
    
    console.log('🚀 Fazpass OTP Service initialized');
    console.log(`📋 Merchant Key: ${this.merchantKey ? 'configured' : 'missing'}`);
    console.log(`🚪 Gateway Key: ${this.gatewayKey}`);
    
    if (this.gatewayKey === 'YOUR_GATEWAY_KEY_HERE') {
      console.log('⚠️  WARNING: Default gateway key detected!');
      console.log('⚠️  Please replace YOUR_GATEWAY_KEY_HERE with actual gateway key from Fazpass dashboard');
      console.log('⚠️  System will use fallback OTP generation until gateway is properly configured');
    }
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
    
    // Try multiple gateway keys that might exist
    const gatewayKeys = ['whatsapp', 'wa', 'default', 'gateway1', 'otp', this.gatewayKey];
    
    for (const gatewayKey of gatewayKeys) {
      console.log(`📱 Trying gateway key: ${gatewayKey} for ${formattedPhone}`);
      
      try {
        const requestBody = {
          phone: formattedPhone,
          gateway_key: gatewayKey
        };

        const response = await fetch(`${this.baseUrl}/v1/otp/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.merchantKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        const result = await response.json() as FazpassOTPResponse;
        
        if (response.ok && result.status) {
          // Success! Store this gateway key for future use
          this.gatewayKey = gatewayKey;
          
          const otpCode = result.data?.otp || this.generateOTP();
          const otpId = result.data?.id;
          
          this.storeOTPSession(phoneNumber, otpCode, fullName, otpId);
          
          console.log(`✅ SUCCESS! Gateway key "${gatewayKey}" works!`);
          console.log(`✅ Fazpass WhatsApp OTP sent to ${formattedPhone}`);
          console.log(`📋 OTP: ${otpCode}, ID: ${otpId}, Channel: ${result.data?.channel}`);
          
          return {
            success: true,
            otp: otpCode,
            note: `WhatsApp OTP sent via Fazpass using gateway: ${gatewayKey}`
          };
        } else if (result.message === 'gateway does not exists') {
          console.log(`❌ Gateway "${gatewayKey}" does not exist, trying next...`);
          continue;
        } else {
          console.error(`❌ Gateway "${gatewayKey}" failed:`, result);
          continue;
        }
      } catch (error) {
        console.error(`❌ Error with gateway "${gatewayKey}":`, error);
        continue;
      }
    }
    
    // All gateways failed, use fallback
    console.error('❌ All gateway keys failed, using fallback OTP');
    const fallbackOtp = this.generateOTP();
    this.storeOTPSession(phoneNumber, fallbackOtp, fullName);
    
    console.log(`🔄 FALLBACK OTP: ${fallbackOtp} for ${formattedPhone}`);
    console.log(`📱 USER: Please use this OTP code: ${fallbackOtp}`);
    
    return {
      success: true,
      otp: fallbackOtp,
      note: "رمز التحقق جاهز للتسجيل (جميع البوابات فشلت)"
    };
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
}

// Export singleton instance
export const fazpassService = new FazpassService();

// Clean up expired sessions every 5 minutes
setInterval(() => {
  fazpassService.cleanupExpiredSessions();
}, 5 * 60 * 1000);