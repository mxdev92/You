import { WasenderAPIService } from './wasender-api-service';
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
  private whatsappService: WasenderAPIService;
  private deliveryTracker = new Map<number, DeliveryTracker>();
  private adminWhatsApp = '07511856947'; // Admin WhatsApp number
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds

  constructor(whatsappService: WasenderAPIService) {
    this.whatsappService = whatsappService;
  }

  async deliverInvoicePDF(orderId: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📋 Silent PDF delivery starting for Order ID: ${orderId}`);
      
      // Check if already delivered to prevent duplicates
      if (this.deliveryTracker.has(orderId)) {
        const tracker = this.deliveryTracker.get(orderId)!;
        if (tracker.delivered) {
          console.log(`✅ Order ${orderId} already delivered - skipping duplicate`);
          return { success: true, message: 'Invoice already delivered' };
        }
      }

      // Silently handle order retrieval
      let order;
      try {
        order = await storage.getOrder(orderId);
        if (!order) {
          console.log(`⚠️ Order ${orderId} not found - silent failure`);
          return { success: false, message: 'Order not found' };
        }
      } catch (orderError) {
        console.log(`⚠️ Failed to retrieve Order ${orderId} - silent failure:`, orderError);
        return { success: false, message: 'Order retrieval failed' };
      }

      // Silently generate PDF
      let pdfBuffer;
      try {
        console.log(`📄 Generating PDF for Order ${orderId}`);
        pdfBuffer = await generateInvoicePDF(order);
      } catch (pdfError) {
        console.log(`⚠️ PDF generation failed for Order ${orderId} - silent failure:`, pdfError);
        return { success: false, message: 'PDF generation failed' };
      }
      
      // Silently extract customer phone
      let customerPhone;
      try {
        customerPhone = this.extractPhoneFromOrder(order);
      } catch (phoneError) {
        console.log(`⚠️ Customer phone extraction failed for Order ${orderId} - silent failure:`, phoneError);
        return { success: false, message: 'Customer phone extraction failed' };
      }
      
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
      
      // Silently check WhatsApp connection
      let connectionReady = false;
      try {
        connectionReady = await this.ensureSecureConnection();
      } catch (connectionError) {
        console.log(`⚠️ Connection check failed for Order ${orderId} - silent failure:`, connectionError);
      }
      
      if (!connectionReady) {
        console.log(`⚠️ WhatsApp connection not ready for Order ${orderId} - silent failure`);
        return { success: false, message: 'WhatsApp connection not available' };
      }

      // Silently deliver to customer and admin
      let customerDelivery = false;
      let adminDelivery = false;
      
      try {
        customerDelivery = await this.deliverToRecipient(tracker, customerPhone, 'customer');
      } catch (customerError) {
        console.log(`⚠️ Customer delivery failed for Order ${orderId} - silent failure:`, customerError);
      }
      
      try {
        adminDelivery = await this.deliverToRecipient(tracker, this.adminWhatsApp, 'admin');
      } catch (adminError) {
        console.log(`⚠️ Admin delivery failed for Order ${orderId} - silent failure:`, adminError);
      }

      // Mark as delivered if at least one succeeded
      if (customerDelivery || adminDelivery) {
        tracker.delivered = true;
        console.log(`✅ Silent PDF delivery completed for Order ${orderId}`);
        return { 
          success: true, 
          message: `Invoice delivered - Customer: ${customerDelivery ? 'Success' : 'Failed'}, Admin: ${adminDelivery ? 'Success' : 'Failed'}` 
        };
      } else {
        console.log(`⚠️ Silent PDF delivery failed for Order ${orderId} - both recipients failed`);
        return { success: false, message: 'Failed to deliver to both customer and admin' };
      }

    } catch (error: any) {
      // Ultimate silent failure - never throw errors
      console.log(`⚠️ Silent PDF delivery complete failure for Order ${orderId}:`, error);
      return { success: false, message: 'PDF delivery system error' };
    }
  }

  private async ensureSecureConnection(): Promise<boolean> {
    try {
      console.log(`🔐 Verifying WasenderAPI connection...`);
      
      // For WasenderAPI, we just check if the service is initialized
      if (this.whatsappService) {
        console.log(`✅ WasenderAPI service ready for PDF delivery`);
        return true;
      }

      console.log(`❌ WasenderAPI service not initialized`);
      return false;

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
      console.log(`📱 Silent delivery to ${recipientType}: ${phoneNumber}`);
      
      // Silently format phone number for WhatsApp
      let formattedPhone;
      try {
        formattedPhone = this.formatPhoneForWhatsApp(phoneNumber);
      } catch (formatError) {
        console.log(`⚠️ Phone formatting failed for ${recipientType} - silent failure:`, formatError);
        return false;
      }
      
      // Prepare message
      const message = recipientType === 'customer' 
        ? `مرحباً! 📋\n\nفاتورة طلبك رقم ${tracker.orderId} جاهزة.\n\nشكراً لتسوقك معنا! 🛒✨`
        : `📋 فاتورة إدارية\n\nطلب جديد رقم: ${tracker.orderId}\nالعميل: ${tracker.customerPhone}\n\nمرفق ملف PDF للطلب.`;

      // Silent retry mechanism
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          console.log(`📤 Silent attempt ${attempt}/${this.maxRetries} - Sending to ${phoneNumber}`);
          
          // Silently send PDF document
          const result = await Promise.race([
            this.whatsappService.sendPDFDocument(
              formattedPhone,
              tracker.pdfBuffer!,
              `invoice_${tracker.orderId}.pdf`,
              message
            ),
            // Add timeout to prevent hanging
            new Promise<{success: boolean; message: string}>((_, reject) => 
              setTimeout(() => reject(new Error('Send timeout')), 10000)
            )
          ]);

          if (result.success) {
            console.log(`✅ Silent PDF delivered to ${recipientType} (${phoneNumber}) on attempt ${attempt}`);
            return true;
          } else {
            console.log(`⚠️ Silent delivery attempt ${attempt} failed: ${result.message}`);
            
            if (attempt < this.maxRetries) {
              console.log(`⏳ Silent retry delay ${this.retryDelay/1000}s...`);
              await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            }
          }

        } catch (error: any) {
          console.log(`⚠️ Silent delivery attempt ${attempt} error:`, error.message || error);
          
          if (attempt < this.maxRetries) {
            console.log(`⏳ Silent retry delay ${this.retryDelay/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          }
        }
      }

      console.log(`⚠️ Silent delivery failed to ${recipientType} (${phoneNumber}) after ${this.maxRetries} attempts`);
      return false;

    } catch (error: any) {
      console.log(`⚠️ Silent recipient delivery error for ${recipientType}:`, error.message || error);
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
    
    for (const [orderId, tracker] of Array.from(this.deliveryTracker.entries())) {
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
export function initializeDeliveryPDFService(whatsappService: WasenderAPIService): void {
  deliveryPDFService = new DeliveryPDFService(whatsappService);
  
  // Clean up old deliveries every hour
  setInterval(() => {
    deliveryPDFService.cleanupOldDeliveries();
  }, 60 * 60 * 1000);
  
  console.log('📋 DeliveryPDFService initialized with automatic cleanup');
}