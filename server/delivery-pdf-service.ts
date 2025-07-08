import BaileysWhatsAppService from './baileys-whatsapp-service';
import { generateInvoicePDF } from './invoice-generator';
import { storage } from './storage';

interface DeliveryTracker {
  orderId: number;
  customerPhone: string;
  adminPhone: string;
  attempts: number;
  delivered: boolean;
  timestamp: number;
  pdfBuffer?: Buffer;
}

export class DeliveryPDFService {
  private whatsappService: BaileysWhatsAppService;
  private deliveryTracker = new Map<number, DeliveryTracker>();
  private adminWhatsApp = '07710155333'; // Admin WhatsApp number
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds

  constructor(whatsappService: BaileysWhatsAppService) {
    this.whatsappService = whatsappService;
  }

  async deliverInvoicePDF(orderId: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📋 Starting PDF delivery for Order ID: ${orderId}`);
      
      // Check if already delivered to prevent duplicates
      if (this.deliveryTracker.has(orderId)) {
        const tracker = this.deliveryTracker.get(orderId)!;
        if (tracker.delivered) {
          console.log(`✅ Order ${orderId} already delivered - skipping duplicate`);
          return { success: true, message: 'Invoice already delivered' };
        }
      }

      // Get order details
      const order = await storage.getOrder(orderId);
      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Generate PDF
      console.log(`📄 Generating PDF for Order ${orderId}`);
      const pdfBuffer = await generateInvoicePDF(order);
      
      // Extract customer phone
      const customerPhone = this.extractPhoneFromOrder(order);
      
      // Initialize delivery tracker
      const tracker: DeliveryTracker = {
        orderId,
        customerPhone,
        adminPhone: this.adminWhatsApp,
        attempts: 0,
        delivered: false,
        timestamp: Date.now(),
        pdfBuffer
      };
      
      this.deliveryTracker.set(orderId, tracker);
      
      // Ensure WhatsApp connection before delivery
      const connectionReady = await this.ensureSecureConnection();
      
      if (!connectionReady) {
        console.log(`❌ WhatsApp connection not ready for Order ${orderId}`);
        return { success: false, message: 'WhatsApp connection not available' };
      }

      // Deliver to customer and admin
      const customerDelivery = await this.deliverToRecipient(tracker, customerPhone, 'customer');
      const adminDelivery = await this.deliverToRecipient(tracker, this.adminWhatsApp, 'admin');

      // Mark as delivered if at least one succeeded
      if (customerDelivery || adminDelivery) {
        tracker.delivered = true;
        console.log(`✅ PDF delivery completed for Order ${orderId}`);
        return { 
          success: true, 
          message: `Invoice delivered - Customer: ${customerDelivery ? 'Success' : 'Failed'}, Admin: ${adminDelivery ? 'Success' : 'Failed'}` 
        };
      } else {
        console.log(`❌ PDF delivery failed for Order ${orderId}`);
        return { success: false, message: 'Failed to deliver to both customer and admin' };
      }

    } catch (error: any) {
      console.error(`❌ PDF delivery error for Order ${orderId}:`, error);
      return { success: false, message: error.message || 'PDF delivery failed' };
    }
  }

  private async ensureSecureConnection(): Promise<boolean> {
    try {
      console.log(`🔐 Verifying secure WhatsApp connection...`);
      
      // Check if WhatsApp service is initialized and connected
      const status = this.whatsappService.getStatus();
      
      if (status.status === 'connected' && status.isConnected) {
        console.log(`✅ WhatsApp connection verified - ready for PDF delivery`);
        return true;
      }

      console.log(`🔄 WhatsApp not connected - attempting to establish connection...`);
      
      // Try to establish connection with timeout
      const connectionPromise = this.whatsappService.ensureConnectionReady(30000); // 30 second timeout
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 35000); // 35 second timeout
      });

      const connected = await Promise.race([connectionPromise, timeoutPromise]);
      
      if (connected) {
        console.log(`✅ WhatsApp connection established successfully`);
        return true;
      } else {
        console.log(`❌ Failed to establish WhatsApp connection within timeout`);
        return false;
      }

    } catch (error: any) {
      console.error(`❌ Connection verification error:`, error);
      return false;
    }
  }

  private async deliverToRecipient(
    tracker: DeliveryTracker, 
    phoneNumber: string, 
    recipientType: 'customer' | 'admin'
  ): Promise<boolean> {
    try {
      console.log(`📱 Delivering PDF to ${recipientType}: ${phoneNumber}`);
      
      // Format phone number for WhatsApp
      const formattedPhone = this.formatPhoneForWhatsApp(phoneNumber);
      
      // Prepare message
      const message = recipientType === 'customer' 
        ? `مرحباً! 📋\n\nفاتورة طلبك رقم ${tracker.orderId} جاهزة.\n\nشكراً لتسوقك معنا! 🛒✨`
        : `📋 فاتورة إدارية\n\nطلب جديد رقم: ${tracker.orderId}\nالعميل: ${tracker.customerPhone}\n\nمرفق ملف PDF للطلب.`;

      // Send PDF with retry mechanism
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          console.log(`📤 Attempt ${attempt}/${this.maxRetries} - Sending to ${phoneNumber}`);
          
          const result = await this.whatsappService.sendPDFDocument(
            formattedPhone,
            tracker.pdfBuffer!,
            `invoice_${tracker.orderId}.pdf`,
            message
          );

          if (result.success) {
            console.log(`✅ PDF delivered successfully to ${recipientType} (${phoneNumber}) on attempt ${attempt}`);
            return true;
          } else {
            console.log(`⚠️ Delivery attempt ${attempt} failed: ${result.message}`);
            
            if (attempt < this.maxRetries) {
              console.log(`⏳ Waiting ${this.retryDelay/1000}s before retry...`);
              await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            }
          }

        } catch (error: any) {
          console.error(`❌ Delivery attempt ${attempt} error:`, error);
          
          if (attempt < this.maxRetries) {
            console.log(`⏳ Waiting ${this.retryDelay/1000}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          }
        }
      }

      console.log(`❌ Failed to deliver PDF to ${recipientType} (${phoneNumber}) after ${this.maxRetries} attempts`);
      return false;

    } catch (error: any) {
      console.error(`❌ Recipient delivery error for ${recipientType}:`, error);
      return false;
    }
  }

  private extractPhoneFromOrder(order: any): string {
    // Extract phone number from order object
    if (order.user?.phone) return order.user.phone;
    if (order.customerPhone) return order.customerPhone;
    if (order.phone) return order.phone;
    
    // Fallback - try to extract from customer info
    if (order.customerInfo) {
      const phoneMatch = order.customerInfo.match(/(?:07|7)\d{9}/);
      if (phoneMatch) return phoneMatch[0];
    }
    
    throw new Error('Customer phone number not found in order');
  }

  private formatPhoneForWhatsApp(phoneNumber: string): string {
    // Convert Iraqi phone format to WhatsApp format
    let cleanPhone = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    
    if (cleanPhone.startsWith('07')) {
      return `964${cleanPhone.substring(1)}@s.whatsapp.net`;
    } else if (cleanPhone.startsWith('7') && cleanPhone.length === 10) {
      return `964${cleanPhone}@s.whatsapp.net`;
    } else if (cleanPhone.startsWith('964')) {
      return `${cleanPhone}@s.whatsapp.net`;
    }
    
    // Default format
    return `964${cleanPhone}@s.whatsapp.net`;
  }

  // Check delivery status
  getDeliveryStatus(orderId: number): DeliveryTracker | null {
    return this.deliveryTracker.get(orderId) || null;
  }

  // Get all delivery statistics
  getDeliveryStats(): { total: number; delivered: number; pending: number; failed: number } {
    const trackers = Array.from(this.deliveryTracker.values());
    
    return {
      total: trackers.length,
      delivered: trackers.filter(t => t.delivered).length,
      pending: trackers.filter(t => !t.delivered && t.attempts < this.maxRetries).length,
      failed: trackers.filter(t => !t.delivered && t.attempts >= this.maxRetries).length
    };
  }

  // Clean up old delivery records (older than 24 hours)
  cleanupOldDeliveries(): void {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const [orderId, tracker] of this.deliveryTracker.entries()) {
      if (tracker.timestamp < oneDayAgo) {
        this.deliveryTracker.delete(orderId);
      }
    }
    
    console.log(`🧹 Cleaned up old delivery records`);
  }
}

// Export singleton instance
export let deliveryPDFService: DeliveryPDFService;

// Initialize service
export function initializeDeliveryPDFService(whatsappService: BaileysWhatsAppService): void {
  deliveryPDFService = new DeliveryPDFService(whatsappService);
  
  // Clean up old deliveries every hour
  setInterval(() => {
    deliveryPDFService.cleanupOldDeliveries();
  }, 60 * 60 * 1000);
  
  console.log('📋 DeliveryPDFService initialized with automatic cleanup');
}