import * as fs from 'fs';
import * as path from 'path';

export class WhatsAppResetHelper {
  private static readonly SESSION_PATH = './whatsapp_session';

  /**
   * Completely reset WhatsApp session to allow fresh QR authentication
   * This removes all stored credentials and forces a new device pairing
   */
  static resetSession(): boolean {
    try {
      console.log('🔄 Starting WhatsApp session reset...');
      
      // Remove entire session directory
      if (fs.existsSync(this.SESSION_PATH)) {
        fs.rmSync(this.SESSION_PATH, { recursive: true, force: true });
        console.log('✅ Old session directory removed');
      }
      
      // Recreate clean session directory
      fs.mkdirSync(this.SESSION_PATH, { recursive: true });
      console.log('✅ Clean session directory created');
      
      // Clear any cached credentials in memory
      process.env.WHATSAPP_CREDENTIALS = '';
      
      console.log('✅ WhatsApp session reset complete - ready for new QR authentication');
      return true;
      
    } catch (error) {
      console.error('❌ Error resetting WhatsApp session:', error);
      return false;
    }
  }

  /**
   * Check if session exists and is valid
   */
  static hasValidSession(): boolean {
    try {
      const sessionExists = fs.existsSync(this.SESSION_PATH) && 
                           fs.readdirSync(this.SESSION_PATH).length > 0;
      return sessionExists;
    } catch {
      return false;
    }
  }

  /**
   * Get session info for debugging
   */
  static getSessionInfo(): { exists: boolean, files: string[], size: number } {
    try {
      if (!fs.existsSync(this.SESSION_PATH)) {
        return { exists: false, files: [], size: 0 };
      }
      
      const files = fs.readdirSync(this.SESSION_PATH);
      let totalSize = 0;
      
      files.forEach(file => {
        const filePath = path.join(this.SESSION_PATH, file);
        try {
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
        } catch {}
      });
      
      return { exists: true, files, size: totalSize };
    } catch {
      return { exists: false, files: [], size: 0 };
    }
  }
}