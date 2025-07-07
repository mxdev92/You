import P from 'pino';
import { Boom } from '@hapi/boom';
import { randomInt } from 'crypto';
import fs from 'fs';
import path from 'path';

// Baileys WhatsApp OTP Service - Professional Ultra Stable Implementation
class BaileysOTPService {
  private sock: any = null;
  private isConnected = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 50; // Increased for better persistence
  private reconnectDelay = 5000; // Base delay for exponential backoff
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionWatchdog: NodeJS.Timeout | null = null;
  private lastActivity = Date.now();
  private otpStorage = new Map<string, { code: string; expires: Date; attempts: number }>();
  private sessionPath = './whatsapp_baileys_session';
  private saveCreds: any = null;

  constructor() {
    // Ensure session directory exists with proper permissions
    if (!fs.existsSync(this.sessionPath)) {
      fs.mkdirSync(this.sessionPath, { recursive: true, mode: 0o755 });
    }
    
    // Start connection watchdog
    this.startConnectionWatchdog();
  }

  // Professional connection watchdog to monitor and maintain connection
  private startConnectionWatchdog(): void {
    if (this.connectionWatchdog) {
      clearInterval(this.connectionWatchdog);
    }
    
    this.connectionWatchdog = setInterval(() => {
      const timeSinceLastActivity = Date.now() - this.lastActivity;
      
      // If no activity for 5 minutes and supposed to be connected, check status
      if (timeSinceLastActivity > 5 * 60 * 1000 && this.isConnected) {
        console.log('🔍 Connection watchdog: Checking WhatsApp status...');
        this.validateConnection();
      }
      
      // Auto-reconnect if disconnected and not trying to connect
      if (!this.isConnected && !this.isConnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log('🔄 Connection watchdog: Auto-reconnecting...');
        this.reconnect();
      }
    }, 30000); // Check every 30 seconds
  }

  // Enhanced connection validation
  private async validateConnection(): Promise<void> {
    try {
      if (this.sock && this.isConnected) {
        // Try to get connection state
        const state = this.sock.readyState;
        if (state !== 1) { // 1 = OPEN
          console.log('❌ Connection validation failed - reconnecting...');
          this.isConnected = false;
          this.reconnect();
        } else {
          this.lastActivity = Date.now();
          console.log('✅ Connection validation passed');
        }
      }
    } catch (error) {
      console.error('❌ Connection validation error:', error);
      this.isConnected = false;
      this.reconnect();
    }
  }

  // Professional heartbeat system
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(async () => {
      if (this.isConnected && this.sock) {
        try {
          // Send heartbeat by checking online status
          await this.sock.onWhatsApp('1234567890@s.whatsapp.net');
          this.lastActivity = Date.now();
          console.log('💓 Heartbeat successful');
        } catch (error) {
          console.log('❌ Heartbeat failed - connection may be lost');
          this.isConnected = false;
          this.reconnect();
        }
      }
    }, 60000); // Heartbeat every minute
  }

  // Enhanced exponential backoff reconnection
  private async reconnect(): Promise<void> {
    if (this.isConnecting) {
      console.log('⚠️ Already attempting to reconnect...');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(`❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }

    this.isConnecting = true;
    this.reconnectAttempts++;
    
    // Exponential backoff with jitter
    const backoffDelay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) + Math.random() * 1000,
      60000 // Max 1 minute delay
    );
    
    console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${Math.round(backoffDelay/1000)}s...`);
    
    setTimeout(async () => {
      try {
        await this.initialize();
      } catch (error) {
        console.error(`❌ Reconnection attempt ${this.reconnectAttempts} failed:`, error);
        this.isConnecting = false;
        
        // Try again after delay
        setTimeout(() => this.reconnect(), 5000);
      }
    }, backoffDelay);
  }

  // Generate a secure 6-digit OTP code
  private generateOTP(): string {
    return randomInt(100000, 999999).toString();
  }

  // Format Iraqi phone number for WhatsApp
  private formatWhatsAppNumber(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Handle different input formats
    let formatted = '';
    if (cleaned.startsWith('964')) {
      formatted = cleaned;
    } else if (cleaned.startsWith('07')) {
      formatted = `964${cleaned.substring(1)}`;
    } else if (cleaned.length === 10 && cleaned.startsWith('7')) {
      formatted = `964${cleaned}`;
    } else {
      formatted = `964${cleaned}`;
    }
    
    return `${formatted}@s.whatsapp.net`;
  }

  // Professional WhatsApp initialization with enhanced stability
  async initialize(): Promise<void> {
    if (this.isConnecting) {
      console.log('⚠️ WhatsApp already connecting...');
      return;
    }
    
    if (this.isConnected) {
      console.log('✅ WhatsApp already connected');
      return;
    }

    this.isConnecting = true;
    console.log(`🚀 Initializing Baileys WhatsApp OTP Service (Attempt ${this.reconnectAttempts + 1})...`);

    try {
      // Clean up existing connection
      if (this.sock) {
        try {
          await this.sock.logout();
        } catch (e) {
          // Ignore logout errors
        }
        this.sock = null;
      }

      // Dynamic import of Baileys
      const baileysModule = await import('@whiskeysockets/baileys');
      const makeWASocket = baileysModule.default;
      const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = baileysModule;

      // Get latest Baileys version with retry
      let version;
      try {
        const versionData = await fetchLatestBaileysVersion();
        version = versionData.version;
        console.log(`📱 Using Baileys version: ${version}`);
      } catch (error) {
        console.log('⚠️ Failed to fetch latest version, using default');
        version = [2, 3000, 1023223821]; // Fallback version
      }

      // Setup enhanced multi-file auth state with error handling
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);
      this.saveCreds = saveCreds;

      // Create professional socket connection with enhanced options
      this.sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false, // Disable QR terminal printing
        browser: Browsers.ubuntu('PAKETY'),
        logger: P({ level: 'silent' }),
        connectTimeoutMs: 60000, // 1 minute timeout
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000, // Keep alive every 30 seconds
        markOnlineOnConnect: true,
        syncFullHistory: false, // Don't sync full history for performance
        generateHighQualityLinkPreview: false,
        getMessage: async (key) => {
          return { conversation: 'PAKETY OTP Service' };
        },
        shouldIgnoreJid: (jid) => {
          // Ignore status updates and broadcasts
          return jid.endsWith('@broadcast') || jid.includes('status@broadcast');
        }
      });

      // Enhanced connection event handling with professional reconnection logic
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr, isNewLogin, isOnline } = update;
        this.lastActivity = Date.now();

        if (qr) {
          console.log('📱 WhatsApp session not authenticated - using fallback OTP mode');
          // Don't show QR, just use fallback mode
        }

        if (connection === 'connecting') {
          console.log('🔄 Connecting to WhatsApp...');
        }

        if (connection === 'close') {
          this.isConnected = false;
          this.isConnecting = false;
          
          const { DisconnectReason } = await import('@whiskeysockets/baileys');
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          
          let shouldReconnect = true;
          let reason = 'Unknown';
          
          switch (statusCode) {
            case DisconnectReason.badSession:
              reason = 'Bad session - clearing and reconnecting';
              // Clear session and reconnect
              try {
                if (fs.existsSync(this.sessionPath)) {
                  fs.rmSync(this.sessionPath, { recursive: true, force: true });
                  fs.mkdirSync(this.sessionPath, { recursive: true });
                }
              } catch (e) {
                console.error('Error clearing session:', e);
              }
              break;
              
            case DisconnectReason.connectionClosed:
              reason = 'Connection closed - reconnecting';
              break;
              
            case DisconnectReason.connectionLost:
              reason = 'Connection lost - reconnecting';
              break;
              
            case DisconnectReason.connectionReplaced:
              reason = 'Connection replaced - reconnecting';
              break;
              
            case DisconnectReason.loggedOut:
              reason = 'Logged out - QR scan required';
              shouldReconnect = false;
              this.reconnectAttempts = 0; // Reset counter for fresh start
              break;
              
            case DisconnectReason.restartRequired:
              reason = 'Restart required - reconnecting';
              break;
              
            case DisconnectReason.timedOut:
              reason = 'Connection timed out - reconnecting';
              break;
              
            default:
              reason = `Unknown disconnect (${statusCode}) - reconnecting`;
          }
          
          console.log(`❌ WhatsApp disconnected: ${reason}`);
          
          if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(`🔄 Will attempt reconnection in ${this.reconnectDelay/1000}s...`);
            setTimeout(() => this.reconnect(), this.reconnectDelay);
          } else if (!shouldReconnect) {
            console.log('🔐 Manual QR scan required to reconnect');
            // Start fresh initialization after delay
            setTimeout(() => {
              this.reconnectAttempts = 0;
              this.initialize();
            }, 10000);
          } else {
            console.log('❌ Max reconnection attempts reached - stopping');
          }
        } else if (connection === 'open') {
          console.log('✅ Baileys WhatsApp connected successfully!');
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0; // Reset counter on successful connection
          this.lastActivity = Date.now();
          
          // Start professional connection monitoring
          this.startHeartbeat();
          
          if (isNewLogin) {
            console.log('🆕 New login detected - connection established');
          }
          
          console.log('🛡️ Professional session management active');
        }
      });

      // Enhanced credential management with automatic saving
      this.sock.ev.on('creds.update', () => {
        try {
          this.saveCreds();
          this.lastActivity = Date.now();
          console.log('💾 Credentials updated and saved');
        } catch (error) {
          console.error('❌ Failed to save credentials:', error);
        }
      });

      // Professional message handling for connection monitoring
      this.sock.ev.on('messages.upsert', (m) => {
        this.lastActivity = Date.now();
        if (m.messages.length > 0) {
          console.log(`📨 Received ${m.messages.length} message(s) - connection active`);
        }
      });

      // Enhanced event monitoring for better debugging
      this.sock.ev.on('presence.update', () => {
        this.lastActivity = Date.now();
      });

      this.sock.ev.on('chats.upsert', () => {
        this.lastActivity = Date.now();
      });

    } catch (error) {
      console.error('❌ Failed to initialize Baileys WhatsApp:', error);
      this.isConnecting = false;
      this.isConnected = false;
      
      // Enhanced error handling with backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(10000 * Math.pow(1.5, this.reconnectAttempts), 60000);
        console.log(`🔄 Retrying initialization in ${delay/1000}s...`);
        setTimeout(() => this.reconnect(), delay);
      } else {
        console.log('❌ Max initialization attempts reached');
      }
    }
  }

  // Send OTP directly to customer (no QR required)
  async sendOTP(phoneNumber: string, fullName?: string): Promise<{ success: boolean; code: string; method: string; message: string }> {
    const otp = this.generateOTP();
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    // Store OTP for verification
    this.otpStorage.set(phoneNumber, {
      code: otp,
      expires: expiryTime,
      attempts: 0
    });

    console.log(`📱 Generated direct OTP ${otp} for ${phoneNumber} (${fullName || 'Unknown'})`);

    // Check if WhatsApp is connected for real message sending
    if (!this.isConnected || !this.sock) {
      console.log('❌ WhatsApp not connected - cannot send OTP to customer');
      return {
        success: false,
        code: otp,
        method: 'no_whatsapp',
        message: 'WhatsApp غير متصل. لا يمكن إرسال رمز التحقق',
        error: 'WhatsApp service must be connected to send OTP messages to customers'
      };
    }

    try {
      const whatsappNumber = this.formatWhatsAppNumber(phoneNumber);
      
      // Create Arabic OTP message for customer
      const message = fullName 
        ? `مرحباً ${fullName}!\n\nرمز التحقق الخاص بك في PAKETY هو:\n\n*${otp}*\n\nالرمز صالح لمدة 5 دقائق فقط.\n🔐 لا تشارك هذا الرمز مع أي شخص.\n\n— فريق PAKETY`
        : `رمز التحقق الخاص بك في PAKETY هو:\n\n*${otp}*\n\nالرمز صالح لمدة 5 دقائق فقط.\n🔐 لا تشارك هذا الرمز مع أي شخص.`;

      // Send actual WhatsApp message to customer
      await this.sock.sendMessage(whatsappNumber, { text: message });
      
      console.log(`✅ OTP sent successfully to ${phoneNumber} via WhatsApp`);
      
      return {
        success: true,
        code: otp,
        method: 'whatsapp_message',
        message: 'تم إرسال رمز التحقق عبر WhatsApp بنجاح',
        phoneNumber: phoneNumber,
        deliveryMethod: 'whatsapp'
      };

    } catch (error) {
      console.error('❌ Failed to send WhatsApp OTP:', error);
      
      return {
        success: false,
        code: otp,
        method: 'send_failed',
        message: 'فشل إرسال رمز التحقق عبر WhatsApp',
        error: error instanceof Error ? error.message : 'Unknown WhatsApp sending error'
      };
    }
  }

  // Verify OTP code
  async verifyOTP(phoneNumber: string, code: string): Promise<{ success: boolean; message: string }> {
    const stored = this.otpStorage.get(phoneNumber);
    
    if (!stored) {
      return { success: false, message: 'رمز التحقق غير صالح أو منتهي الصلاحية' };
    }

    // Check if expired
    if (new Date() > stored.expires) {
      this.otpStorage.delete(phoneNumber);
      return { success: false, message: 'رمز التحقق منتهي الصلاحية' };
    }

    // Check attempts limit
    if (stored.attempts >= 3) {
      this.otpStorage.delete(phoneNumber);
      return { success: false, message: 'تم تجاوز عدد المحاولات المسموح' };
    }

    // Check if code matches
    if (stored.code !== code) {
      stored.attempts++;
      return { success: false, message: 'رمز التحقق غير صحيح' };
    }

    // Success - remove OTP
    this.otpStorage.delete(phoneNumber);
    return { success: true, message: 'تم التحقق بنجاح' };
  }

  // Enhanced service status with professional monitoring data
  getStatus(): any {
    const uptime = Date.now() - this.lastActivity;
    const connectionQuality = this.isConnected ? 
      (uptime < 60000 ? 'excellent' : uptime < 300000 ? 'good' : 'fair') : 'disconnected';
    
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      method: 'baileys_whatsapp_professional',
      activeOTPs: this.otpStorage.size,
      sessionPath: this.sessionPath,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      lastActivity: new Date(this.lastActivity).toISOString(),
      timeSinceLastActivity: uptime,
      connectionQuality,
      heartbeatActive: !!this.heartbeatInterval,
      watchdogActive: !!this.connectionWatchdog,
      sessionExists: fs.existsSync(this.sessionPath),
      timestamp: new Date().toISOString(),
      professional: true
    };
  }

  // Check if WhatsApp number exists
  async checkWhatsAppNumber(phoneNumber: string): Promise<boolean> {
    if (!this.isConnected || !this.sock) {
      return false;
    }

    try {
      const whatsappNumber = this.formatWhatsAppNumber(phoneNumber);
      const exists = await this.sock.onWhatsApp(whatsappNumber);
      return exists.length > 0 && exists[0].exists;
    } catch (error) {
      console.error('Error checking WhatsApp number:', error);
      return false;
    }
  }

  // Cleanup expired OTPs
  clearExpiredOTPs(): void {
    const now = new Date();
    for (const [phone, data] of this.otpStorage.entries()) {
      if (now > data.expires) {
        this.otpStorage.delete(phone);
      }
    }
  }

  // Professional cleanup and disconnection
  async disconnect(): Promise<void> {
    console.log('🔌 Disconnecting WhatsApp service...');
    
    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.connectionWatchdog) {
      clearInterval(this.connectionWatchdog);
      this.connectionWatchdog = null;
    }
    
    // Disconnect socket
    if (this.sock) {
      try {
        await this.sock.logout();
      } catch (error) {
        console.log('⚠️ Error during logout:', error);
      }
      this.sock = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    console.log('✅ WhatsApp service disconnected cleanly');
  }

  // Enhanced manual reconnection
  async forceReconnect(): Promise<void> {
    console.log('🔄 Force reconnecting WhatsApp service...');
    
    // Reset connection state
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // Clean disconnect first
    await this.disconnect();
    
    // Wait before reconnecting
    setTimeout(() => {
      console.log('🚀 Starting fresh connection...');
      this.initialize();
    }, 3000);
  }
}

// Export singleton instance
export const baileysOTPService = new BaileysOTPService();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  baileysOTPService.clearExpiredOTPs();
}, 5 * 60 * 1000);

export default baileysOTPService;