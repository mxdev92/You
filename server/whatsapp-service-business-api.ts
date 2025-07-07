import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const axios = require('axios');

interface OTPData {
  otp: string;
  expires: number;
  attempts: number;
  phoneNumber: string;
  timestamp: number;
}

interface BusinessAPIConfig {
  phoneNumberId: string;
  accessToken: string;
  webhookToken: string;
  apiVersion: string;
}

interface ServiceState {
  isInitialized: boolean;
  isReady: boolean;
  lastError: string | null;
  mode: 'business-api' | 'web-js' | 'fallback';
  messagesSent: number;
  lastMessageTime: number;
}

export class WhatsAppBusinessAPIService {
  private otpStore = new Map<string, OTPData>();
  private readonly OTP_EXPIRY_MINUTES = 10;
  private fallbackService: any = null;
  
  private state: ServiceState = {
    isInitialized: false,
    isReady: false,
    lastError: null,
    mode: 'fallback',
    messagesSent: 0,
    lastMessageTime: 0
  };

  private config: BusinessAPIConfig = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    webhookToken: process.env.WHATSAPP_WEBHOOK_TOKEN || '',
    apiVersion: 'v18.0'
  };

  constructor() {
    console.log('🚀 WhatsApp Business API Service: Initializing...');
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Try Business API first (most reliable)
    if (this.config.phoneNumberId && this.config.accessToken) {
      try {
        await this.testBusinessAPI();
        this.state.mode = 'business-api';
        this.state.isReady = true;
        console.log('✅ WhatsApp Business API: Ready and operational');
      } catch (error: any) {
        console.log('⚠️ Business API not available:', error.message);
        this.initializeFallbackService();
      }
    } else {
      console.log('📱 Business API credentials not found, using Web.js fallback');
      this.initializeFallbackService();
    }

    this.state.isInitialized = true;
  }

  private async testBusinessAPI(): Promise<void> {
    const url = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.status !== 200) {
      throw new Error(`Business API test failed: ${response.status}`);
    }
  }

  private async initializeFallbackService(): Promise<void> {
    try {
      // Import the ultra-stable web.js service as fallback
      const { UltraStableWhatsAppService } = await import('./whatsapp-service-ultra-stable.js');
      this.fallbackService = new UltraStableWhatsAppService();
      this.state.mode = 'web-js';
      
      // Monitor fallback service status
      setInterval(() => {
        if (this.fallbackService) {
          const fallbackStatus = this.fallbackService.getStatus();
          this.state.isReady = fallbackStatus.isReady && fallbackStatus.isAuthenticated;
        }
      }, 5000);
      
      console.log('📱 WhatsApp Web.js fallback service initialized');
    } catch (error: any) {
      console.log('❌ Fallback service failed:', error.message);
      this.state.mode = 'fallback';
      this.state.isReady = false;
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.startsWith('07') && cleaned.length === 11) {
      return `964${cleaned.substring(1)}`;
    }
    
    if (cleaned.startsWith('964') && cleaned.length === 12) {
      return cleaned;
    }
    
    return `964${cleaned}`;
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private storeOTP(phoneNumber: string, otp: string): void {
    const expires = Date.now() + (this.OTP_EXPIRY_MINUTES * 60 * 1000);
    
    this.otpStore.set(phoneNumber, {
      otp,
      expires,
      attempts: 0,
      phoneNumber,
      timestamp: Date.now()
    });
  }

  private async sendViaBusinessAPI(phoneNumber: string, message: string): Promise<boolean> {
    if (this.state.mode !== 'business-api' || !this.config.accessToken) {
      return false;
    }

    try {
      const url = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(phoneNumber),
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      if (response.status === 200) {
        this.state.messagesSent++;
        this.state.lastMessageTime = Date.now();
        console.log(`✅ Business API: Message sent successfully to ${phoneNumber}`);
        return true;
      }

      return false;
    } catch (error: any) {
      console.log(`❌ Business API send failed:`, error.response?.data || error.message);
      return false;
    }
  }

  private async sendViaWebJS(phoneNumber: string, message: string): Promise<boolean> {
    if (this.state.mode !== 'web-js' || !this.fallbackService) {
      return false;
    }

    try {
      await this.fallbackService.sendMessage(phoneNumber, message);
      console.log(`✅ Web.js: Message sent successfully to ${phoneNumber}`);
      return true;
    } catch (error: any) {
      console.log(`❌ Web.js send failed:`, error.message);
      return false;
    }
  }

  async sendSignupOTP(phoneNumber: string, fullName: string): Promise<string> {
    console.log(`🎯 Business API Service: Processing OTP for ${phoneNumber} (${fullName})`);

    // Rate limiting
    const now = Date.now();
    if (this.state.lastMessageTime && (now - this.state.lastMessageTime) < 3000) {
      throw new Error('Rate limit: Please wait 3 seconds between OTP requests');
    }

    const otp = this.generateOTP();
    this.storeOTP(phoneNumber, otp);

    const message = `🛡️ رمز التحقق PAKETY: *${otp}*

مرحباً ${fullName}!

رمزك الآمن: *${otp}*
⏰ صالح لمدة ${this.OTP_EXPIRY_MINUTES} دقائق

🛒 PAKETY - التسوق الذكي

⚠️ لا تشارك هذا الرمز مع أي شخص`;

    // Try Business API first (most reliable)
    if (await this.sendViaBusinessAPI(phoneNumber, message)) {
      return otp;
    }

    // Fallback to Web.js
    if (await this.sendViaWebJS(phoneNumber, message)) {
      return otp;
    }

    // Remove stored OTP if all methods failed
    this.otpStore.delete(phoneNumber);
    throw new Error('All WhatsApp delivery methods failed. Please try again later.');
  }

  verifyOTP(phoneNumber: string, enteredOTP: string): boolean {
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

    stored.attempts++;

    if (stored.otp === enteredOTP) {
      console.log(`✅ OTP verified successfully for ${phoneNumber}`);
      this.otpStore.delete(phoneNumber);
      return true;
    }

    console.log(`❌ Invalid OTP for ${phoneNumber} (attempt ${stored.attempts}/3)`);
    
    if (stored.attempts >= 3) {
      console.log(`🚫 Maximum attempts exceeded for ${phoneNumber}`);
      this.otpStore.delete(phoneNumber);
    }

    return false;
  }

  getStatus(): ServiceState & { qrCode?: string } {
    const status = { ...this.state };
    
    if (this.state.mode === 'web-js' && this.fallbackService) {
      const fallbackStatus = this.fallbackService.getStatus();
      status.isReady = fallbackStatus.isReady && fallbackStatus.isAuthenticated;
      return { ...status, qrCode: fallbackStatus.qrCode };
    }
    
    return status;
  }

  getQRCode(): string | null {
    if (this.state.mode === 'web-js' && this.fallbackService) {
      return this.fallbackService.getQRCode();
    }
    return null;
  }

  isHealthy(): boolean {
    return this.state.isInitialized && (
      this.state.mode === 'business-api' || 
      (this.state.mode === 'web-js' && this.state.isReady)
    );
  }

  async initialize(): Promise<void> {
    if (!this.state.isInitialized) {
      await this.initialize();
    }
  }

  clearExpiredOTPs(): void {
    const now = Date.now();
    let cleared = 0;
    
    for (const [phoneNumber, otpData] of this.otpStore.entries()) {
      if (now > otpData.expires) {
        this.otpStore.delete(phoneNumber);
        cleared++;
      }
    }
    
    if (cleared > 0) {
      console.log(`🧹 Business API Service: Cleared ${cleared} expired OTPs`);
    }
  }

  async sendCustomerInvoice(phoneNumber: string, customerName: string, orderData: any, pdfBuffer: Buffer): Promise<void> {
    const message = `📋 فاتورة طلبك - PAKETY

عزيزي ${customerName}،

شكراً لك على طلبك رقم #${orderData.id}
💰 المبلغ الإجمالي: ${orderData.total} دينار عراقي

🛒 PAKETY - خدمة التوصيل الذكية`;

    // Try Business API first
    if (await this.sendViaBusinessAPI(phoneNumber, message)) {
      return;
    }

    // Fallback to Web.js (can handle PDF attachments)
    if (this.state.mode === 'web-js' && this.fallbackService) {
      await this.fallbackService.sendCustomerInvoice(phoneNumber, customerName, orderData, pdfBuffer);
    }
  }

  // Additional placeholder methods for compatibility
  async sendDriverNotification(driverPhone: string, orderData: any): Promise<void> {
    const message = `🚚 طلب جديد للتوصيل

رقم الطلب: #${orderData.id}
العنوان: ${orderData.address}
المبلغ: ${orderData.total} دينار عراقي

🛒 PAKETY`;

    await this.sendViaBusinessAPI(driverPhone, message) || 
    await this.sendViaWebJS(driverPhone, message);
  }

  async sendStorePreparationAlert(storePhone: string, orderData: any): Promise<void> {
    const message = `🏪 طلب جديد للتحضير

رقم الطلب: #${orderData.id}
العميل: ${orderData.customerName}
الأصناف: ${orderData.items.length} صنف

🛒 PAKETY`;

    await this.sendViaBusinessAPI(storePhone, message) || 
    await this.sendViaWebJS(storePhone, message);
  }

  async sendOrderStatusUpdate(customerPhone: string, customerName: string, orderData: any, status: string): Promise<void> {
    const message = `📱 تحديث حالة الطلب

عزيزي ${customerName}،

طلبك رقم #${orderData.id}
الحالة: ${status}

🛒 PAKETY`;

    await this.sendViaBusinessAPI(customerPhone, message) || 
    await this.sendViaWebJS(customerPhone, message);
  }
}

// Create singleton instance
const businessAPIService = new WhatsAppBusinessAPIService();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  businessAPIService.clearExpiredOTPs();
}, 5 * 60 * 1000);

export default businessAPIService;