import { 
  makeWASocket, 
  DisconnectReason, 
  fetchLatestBaileysVersion, 
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  WASocket,
  proto,
  generateWAMessageFromContent,
  prepareWAMessageMedia
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';

export interface UltraStableConnectionStatus {
  connected: boolean;
  connectionStrength: 'strong' | 'weak' | 'disconnected';
  lastConnected: number | null;
  connectionDuration: number;
  reconnectionAttempts: number;
  lastError: string | null;
  isReconnecting: boolean;
  hasValidCredentials: boolean;
  uptime: number;
  connectionHealth: 'excellent' | 'good' | 'poor' | 'critical';
}

export class UltraStableWhatsAppService {
  private sock: WASocket | null = null;
  private reconnectionAttempts = 0;
  private maxReconnectionAttempts = 25;
  private baseReconnectDelay = 2000;
  private maxReconnectDelay = 60000;
  private isReconnecting = false;
  private sessionPath = './whatsapp_session_ultra_stable';
  private connectionStartTime: number | null = null;
  private lastActivity: number = Date.now();
  private serviceStartTime: number = Date.now();
  private connectionHealthCheckInterval: NodeJS.Timeout | null = null;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private lastError: string | null = null;
  private connectionVerificationTimeout: NodeJS.Timeout | null = null;
  
  // Ultra-stable configuration
  private config: any = {
    connectTimeoutMs: 120000,        // 2 minutes timeout
    defaultQueryTimeoutMs: 90000,    // 90 seconds for queries
    keepAliveIntervalMs: 15000,      // 15 second keepalive (more frequent)
    markOnlineOnConnect: false,      // Don't interfere with phone
    printQRInTerminal: false,        // We'll handle QR separately
    syncFullHistory: false,          // Faster connection
    generateHighQualityLinkPreview: false,
    browser: ['PAKETY', 'Chrome', '110.0.5481.178'],
    shouldSyncHistoryMessage: () => false,
    shouldIgnoreJid: () => false,
    retryRequestDelayMs: 5000,
    maxMsgRetryCount: 3,
    msgRetryCounterCache: new Map(),
    transactionOpts: {
      maxCommitRetries: 10,
      delayBetweenTriesMs: 3000
    }
  };

  constructor() {
    this.initializeUltraStableService();
  }

  private async initializeUltraStableService() {
    console.log('🛡️ Initializing Ultra-Stable WhatsApp Service...');
    
    // Ensure session directory exists
    if (!fs.existsSync(this.sessionPath)) {
      fs.mkdirSync(this.sessionPath, { recursive: true });
    }
    
    // Start connection health monitoring
    this.startConnectionHealthMonitoring();
    
    // Auto-connect if credentials exist
    if (await this.hasValidCredentials()) {
      console.log('🔒 Found valid credentials, auto-connecting...');
      await this.connect();
    } else {
      console.log('⚠️ No valid credentials found, manual connection required');
    }
  }

  async connect(): Promise<boolean> {
    if (this.isReconnecting) {
      console.log('🔄 Connection already in progress, skipping...');
      return false;
    }

    this.isReconnecting = true;
    this.lastError = null;

    try {
      console.log('🚀 Starting ultra-stable connection...');
      
      // Load auth state
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);
      this.config.auth = state;

      // Create socket with ultra-stable configuration
      this.sock = makeWASocket(this.config);
      
      // Set up event handlers
      this.setupEventHandlers(saveCreds);
      
      // Start connection verification
      this.startConnectionVerification();
      
      return true;
    } catch (error: any) {
      console.error('❌ Ultra-stable connection failed:', error);
      this.lastError = error.message || 'Unknown connection error';
      this.isReconnecting = false;
      
      // Schedule reconnection
      this.scheduleReconnection();
      return false;
    }
  }

  private setupEventHandlers(saveCreds: () => void) {
    if (!this.sock) return;

    // Credentials update
    this.sock.ev.on('creds.update', saveCreds);

    // Connection state changes
    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log('📱 QR Code available for scanning');
        // QR code will be handled by parent service
      }
      
      if (connection === 'close') {
        this.handleConnectionClose(lastDisconnect);
      } else if (connection === 'open') {
        this.handleConnectionOpen();
      } else if (connection === 'connecting') {
        console.log('🔄 Ultra-stable connection in progress...');
      }
    });

    // Message events for activity tracking
    this.sock.ev.on('messages.upsert', () => {
      this.lastActivity = Date.now();
    });

    // Error handling
    this.sock.ev.on('connection.error', (error) => {
      console.error('🚨 Ultra-stable connection error:', error);
      this.lastError = error.message || 'Connection error';
    });
  }

  private handleConnectionOpen() {
    console.log('🎉 Ultra-stable WhatsApp connected successfully!');
    this.isReconnecting = false;
    this.reconnectionAttempts = 0;
    this.connectionStartTime = Date.now();
    this.lastActivity = Date.now();
    this.startKeepAlive();
  }

  private handleConnectionClose(lastDisconnect: any) {
    console.log('📤 Ultra-stable connection closed');
    this.connectionStartTime = null;
    this.stopKeepAlive();
    
    if (lastDisconnect?.error) {
      const statusCode = (lastDisconnect.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      console.log(`📤 Disconnect reason: ${statusCode}, Should reconnect: ${shouldReconnect}`);
      
      if (shouldReconnect) {
        this.scheduleReconnection();
      } else {
        console.log('🔐 Logged out, manual authentication required');
        this.isReconnecting = false;
      }
    } else {
      this.scheduleReconnection();
    }
  }

  private scheduleReconnection() {
    if (this.reconnectionAttempts >= this.maxReconnectionAttempts) {
      console.log('❌ Max reconnection attempts reached');
      this.isReconnecting = false;
      return;
    }

    this.reconnectionAttempts++;
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectionAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(`🔄 Scheduling reconnection attempt ${this.reconnectionAttempts}/${this.maxReconnectionAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startKeepAlive() {
    this.keepAliveInterval = setInterval(async () => {
      try {
        if (this.sock && this.isConnected()) {
          await this.sock.sendPresenceUpdate('available');
          console.log('💓 Keep-alive sent');
        }
      } catch (error) {
        console.log('⚠️ Keep-alive failed:', error);
      }
    }, 30000); // Every 30 seconds
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  private startConnectionHealthMonitoring() {
    this.connectionHealthCheckInterval = setInterval(() => {
      const status = this.getConnectionStatus();
      
      if (status.connectionHealth === 'critical' && !this.isReconnecting) {
        console.log('🚨 Connection health critical, forcing reconnection');
        this.forceReconnection();
      }
    }, 10000); // Check every 10 seconds
  }

  private startConnectionVerification() {
    // Clear any existing verification
    if (this.connectionVerificationTimeout) {
      clearTimeout(this.connectionVerificationTimeout);
    }

    // Set verification timeout
    this.connectionVerificationTimeout = setTimeout(() => {
      if (!this.isConnected()) {
        console.log('⏰ Connection verification timeout, forcing reconnection');
        this.forceReconnection();
      }
    }, 60000); // 1 minute verification timeout
  }

  private forceReconnection() {
    console.log('🔄 Forcing reconnection...');
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 5000);
  }

  /**
   * Verify connection readiness before critical operations
   */
  async ensureConnectionReady(timeoutMs: number = 30000): Promise<boolean> {
    console.log('🔍 Verifying connection readiness...');
    
    const startTime = Date.now();
    const checkInterval = 1000; // Check every second
    
    return new Promise((resolve, reject) => {
      const checkConnection = () => {
        const elapsed = Date.now() - startTime;
        
        if (elapsed > timeoutMs) {
          console.log('❌ Connection verification timeout');
          resolve(false);
          return;
        }
        
        if (this.isConnected() && this.getConnectionStrength() === 'strong') {
          console.log('✅ Connection verified and ready');
          resolve(true);
          return;
        }
        
        // Connection not ready, check again
        setTimeout(checkConnection, checkInterval);
      };
      
      checkConnection();
    });
  }

  isConnected(): boolean {
    if (!this.sock) return false;
    
    try {
      return this.sock.ws?.readyState === 1 && // WebSocket OPEN
             this.sock.user?.id !== undefined && // User authenticated
             this.connectionStartTime !== null; // Connection established
    } catch (error) {
      return false;
    }
  }

  getConnectionStrength(): 'strong' | 'weak' | 'disconnected' {
    if (!this.isConnected()) return 'disconnected';
    
    const timeSinceLastActivity = Date.now() - this.lastActivity;
    const connectionDuration = this.connectionStartTime ? Date.now() - this.connectionStartTime : 0;
    
    if (timeSinceLastActivity < 60000 && connectionDuration > 30000) {
      return 'strong';
    } else if (timeSinceLastActivity < 120000) {
      return 'weak';
    } else {
      return 'disconnected';
    }
  }

  async hasValidCredentials(): Promise<boolean> {
    try {
      const credsPath = path.join(this.sessionPath, 'creds.json');
      return fs.existsSync(credsPath);
    } catch (error) {
      return false;
    }
  }

  getConnectionStatus(): UltraStableConnectionStatus {
    const connected = this.isConnected();
    const connectionStrength = this.getConnectionStrength();
    const connectionDuration = this.connectionStartTime ? Date.now() - this.connectionStartTime : 0;
    const uptime = Date.now() - this.serviceStartTime;
    
    // Calculate connection health
    let connectionHealth: 'excellent' | 'good' | 'poor' | 'critical' = 'critical';
    
    if (connected && connectionStrength === 'strong' && connectionDuration > 60000) {
      connectionHealth = 'excellent';
    } else if (connected && connectionStrength === 'strong') {
      connectionHealth = 'good';
    } else if (connected && connectionStrength === 'weak') {
      connectionHealth = 'poor';
    }
    
    return {
      connected,
      connectionStrength,
      lastConnected: this.connectionStartTime,
      connectionDuration,
      reconnectionAttempts: this.reconnectionAttempts,
      lastError: this.lastError,
      isReconnecting: this.isReconnecting,
      hasValidCredentials: fs.existsSync(path.join(this.sessionPath, 'creds.json')),
      uptime,
      connectionHealth
    };
  }

  /**
   * Send PDF document with connection verification
   */
  async sendPDFDocument(phoneNumber: string, pdfBuffer: Buffer, fileName: string, message: string): Promise<{ success: boolean; message: string }> {
    console.log(`📄 Attempting to send PDF to ${phoneNumber}`);
    
    // Verify connection before sending
    const connectionReady = await this.ensureConnectionReady(15000);
    if (!connectionReady) {
      return { success: false, message: 'Connection not ready for PDF delivery' };
    }
    
    try {
      if (!this.sock) {
        throw new Error('WhatsApp socket not initialized');
      }
      
      const result = await this.sock.sendMessage(phoneNumber, {
        document: pdfBuffer,
        fileName: fileName,
        mimetype: 'application/pdf',
        caption: message
      });
      
      console.log(`✅ PDF sent successfully to ${phoneNumber}`);
      this.lastActivity = Date.now();
      
      return { success: true, message: 'PDF sent successfully' };
    } catch (error: any) {
      console.error(`❌ Failed to send PDF to ${phoneNumber}:`, error);
      return { success: false, message: error.message || 'Failed to send PDF' };
    }
  }

  disconnect() {
    console.log('🔌 Disconnecting ultra-stable WhatsApp service...');
    
    if (this.sock) {
      try {
        this.sock.ws?.close();
        this.sock.end();
      } catch (error) {
        console.log('⚠️ Error during disconnect:', error);
      }
      this.sock = null;
    }
    
    this.stopKeepAlive();
    this.connectionStartTime = null;
    this.isReconnecting = false;
    
    if (this.connectionVerificationTimeout) {
      clearTimeout(this.connectionVerificationTimeout);
      this.connectionVerificationTimeout = null;
    }
  }

  async resetSession() {
    console.log('🔄 Resetting ultra-stable session...');
    
    this.disconnect();
    
    // Clear session files
    try {
      if (fs.existsSync(this.sessionPath)) {
        fs.rmSync(this.sessionPath, { recursive: true, force: true });
      }
    } catch (error) {
      console.log('⚠️ Error clearing session:', error);
    }
    
    // Recreate session directory
    fs.mkdirSync(this.sessionPath, { recursive: true });
    
    // Reset counters
    this.reconnectionAttempts = 0;
    this.lastError = null;
    
    console.log('✅ Ultra-stable session reset complete');
  }

  // Legacy compatibility methods
  getStatus() {
    const status = this.getConnectionStatus();
    return {
      connected: status.connected,
      connectionStrength: status.connectionStrength,
      uptime: status.uptime
    };
  }

  getQRCode() {
    // QR code handling would be implemented here
    return null;
  }

  async initialize() {
    return this.connect();
  }
}