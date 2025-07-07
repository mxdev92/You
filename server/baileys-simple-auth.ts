import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  ConnectionState,
  WASocket,
  AuthenticationState,
  SignalDataTypeMap,
  Browsers
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import QRCode from 'qrcode';
import pino from 'pino';

export class SimpleWhatsAppAuth {
  private socket: WASocket | null = null;
  private qrCode: string | null = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private readonly authPath = './whatsapp_session_simple';

  constructor() {
    // Ensure auth directory exists
    if (!fs.existsSync(this.authPath)) {
      fs.mkdirSync(this.authPath, { recursive: true });
    }
  }

  async initialize(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      console.log('🔄 Simple WhatsApp already initializing or connected');
      return;
    }

    try {
      console.log('🚀 Starting SIMPLE WhatsApp authentication...');
      this.isConnecting = true;

      // Clear any existing session for fresh start
      if (fs.existsSync(this.authPath)) {
        fs.rmSync(this.authPath, { recursive: true, force: true });
        fs.mkdirSync(this.authPath, { recursive: true });
      }

      // SIMPLE configuration for reliable QR authentication
      const { state, saveCreds } = await useMultiFileAuthState(this.authPath);
      
      this.socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: Browsers.chrome("Chrome"), // Standard Chrome browser
        connectTimeoutMs: 30000, // Standard 30-second timeout
        defaultQueryTimeoutMs: 30000, // Standard timeout
        keepAliveIntervalMs: 25000, // Standard keep-alive
        markOnlineOnConnect: true,
        syncFullHistory: false,
        fireInitQueries: true, // Essential for proper authentication
        generateHighQualityLinkPreview: false,
        retryRequestDelayMs: 2000, // Quick retries
        maxMsgRetryCount: 3,
        getMessage: async () => {
          return { conversation: 'Message' };
        }
      });

      this.socket.ev.on('connection.update', (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('📱 QR Code received for simple authentication');
          this.generateQRCode(qr);
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          console.log('Connection closed:', shouldReconnect ? 'reconnecting...' : 'logged out');
          
          this.isConnected = false;
          this.isConnecting = false;
          
          if (shouldReconnect) {
            setTimeout(() => this.initialize(), 3000);
          }
        } else if (connection === 'open') {
          console.log('✅ SIMPLE WhatsApp connected successfully!');
          this.isConnected = true;
          this.isConnecting = false;
          this.qrCode = null;
        }
      });

      this.socket.ev.on('creds.update', saveCreds);

    } catch (error) {
      console.error('❌ Simple WhatsApp initialization error:', error);
      this.isConnecting = false;
    }
  }

  private async generateQRCode(qr: string): Promise<void> {
    try {
      this.qrCode = await QRCode.toDataURL(qr, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      console.log('✅ Simple QR Code generated successfully');
    } catch (error) {
      console.error('❌ QR Code generation error:', error);
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      hasQR: !!this.qrCode,
      timestamp: new Date().toISOString()
    };
  }

  getQRCode(): string | null {
    return this.qrCode;
  }

  async reset(): Promise<boolean> {
    try {
      console.log('🔄 Resetting simple WhatsApp connection...');
      
      if (this.socket) {
        this.socket.end(new Error('Manual reset'));
        this.socket = null;
      }
      
      this.isConnected = false;
      this.isConnecting = false;
      this.qrCode = null;
      
      // Clear session
      if (fs.existsSync(this.authPath)) {
        fs.rmSync(this.authPath, { recursive: true, force: true });
      }
      
      // Restart after brief delay
      setTimeout(() => this.initialize(), 1000);
      
      return true;
    } catch (error) {
      console.error('❌ Simple reset error:', error);
      return false;
    }
  }
}