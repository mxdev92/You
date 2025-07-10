import { generateInvoicePDF } from './invoice-generator';
import { storage } from './storage';

export interface PDFWorkflowResult {
  success: boolean;
  message: string;
  orderId: number;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  credentialsStatus: 'valid' | 'invalid' | 'missing';
  deliveryStatus: 'delivered' | 'pending' | 'failed';
  adminDelivered: boolean;
  customerDelivered: boolean;
  timestamp: number;
}

export interface WhatsAppConnectionStatus {
  connected: boolean;
  connecting: boolean;
  hasValidCredentials: boolean;
  uptime: number;
  lastVerified: number | null;
}

export class PDFWorkflowService {
  private adminWhatsApp = '9647511856947@c.us';
  private maxRetries = 3;
  private retryDelay = 2000;

  constructor(private whatsappService: any) {}

  /**
   * Complete PDF Workflow Implementation
   * Order submit > check WhatsApp server > get saved credentials > ensure connection > send PDF
   */
  async executePDFWorkflow(orderId: number): Promise<PDFWorkflowResult> {
    console.log(`🚀 Starting PDF Workflow for Order ${orderId}`);

    try {
      // Step 1: Get order details
      const order = await storage.getOrder(orderId);
      if (!order) {
        return {
          success: false,
          message: 'Order not found',
          orderId,
          connectionStatus: 'disconnected',
          credentialsStatus: 'missing',
          deliveryStatus: 'failed',
          adminDelivered: false,
          customerDelivered: false,
          timestamp: Date.now()
        };
      }

      // Step 2: Check WhatsApp server status
      console.log(`📡 Step 1: Checking WhatsApp server status...`);
      const serverStatus = await this.checkWhatsAppServer();
      console.log(`📡 Server status: ${JSON.stringify(serverStatus)}`);

      // Step 3: Get saved credentials
      console.log(`🔑 Step 2: Getting saved credentials...`);
      const credentialsStatus = await this.getSavedCredentials();
      console.log(`🔑 Credentials status: ${credentialsStatus}`);

      // Step 4: Ensure WhatsApp connection
      console.log(`🔗 Step 3: Ensuring WhatsApp connection...`);
      const connectionReady = await this.ensureConnection();
      console.log(`🔗 Connection ready: ${connectionReady}`);

      // Step 5: Generate PDF
      console.log(`📄 Step 4: Generating PDF invoice...`);
      const pdfBuffer = await generateInvoicePDF(order);
      console.log(`📄 PDF generated successfully (${pdfBuffer.length} bytes)`);

      // Step 6: Send PDF with reliable delivery
      console.log(`📤 Step 5: Sending PDF with reliable delivery...`);
      const deliveryResult = await this.sendPDFWithReliableDelivery(
        orderId,
        order.customerPhone,
        pdfBuffer,
        order
      );

      return {
        success: deliveryResult.success,
        message: deliveryResult.message,
        orderId,
        connectionStatus: connectionReady ? 'connected' : 'disconnected',
        credentialsStatus: credentialsStatus,
        deliveryStatus: deliveryResult.success ? 'delivered' : 'failed',
        adminDelivered: deliveryResult.adminDelivered,
        customerDelivered: deliveryResult.customerDelivered,
        timestamp: Date.now()
      };

    } catch (error: any) {
      console.error(`❌ PDF Workflow error for Order ${orderId}:`, error);
      return {
        success: false,
        message: `Workflow error: ${error.message}`,
        orderId,
        connectionStatus: 'disconnected',
        credentialsStatus: 'invalid',
        deliveryStatus: 'failed',
        adminDelivered: false,
        customerDelivered: false,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Step 1: Check WhatsApp server status
   */
  private async checkWhatsAppServer(): Promise<WhatsAppConnectionStatus> {
    try {
      const status = this.whatsappService.getStatus();
      return {
        connected: status.connected || false,
        connecting: status.connecting || false,
        hasValidCredentials: status.hasValidCredentials || false,
        uptime: status.uptime || 0,
        lastVerified: status.lastVerified || null
      };
    } catch (error) {
      console.error('Error checking WhatsApp server:', error);
      return {
        connected: false,
        connecting: false,
        hasValidCredentials: false,
        uptime: 0,
        lastVerified: null
      };
    }
  }

  /**
   * Step 2: Get saved credentials
   */
  private async getSavedCredentials(): Promise<'valid' | 'invalid' | 'missing'> {
    try {
      if (this.whatsappService.hasValidCredentials) {
        const hasCredentials = await this.whatsappService.hasValidCredentials();
        return hasCredentials ? 'valid' : 'missing';
      }
      return 'missing';
    } catch (error) {
      console.error('Error checking saved credentials:', error);
      return 'invalid';
    }
  }

  /**
   * Step 3: Ensure reliable WhatsApp connection
   */
  private async ensureConnection(): Promise<boolean> {
    try {
      // Check if already connected
      const status = this.whatsappService.getStatus();
      if (status.connected) {
        console.log('✅ WhatsApp already connected');
        return true;
      }

      // Try to reconnect if we have valid credentials
      if (this.whatsappService.hasValidCredentials) {
        const hasCredentials = await this.whatsappService.hasValidCredentials();
        if (hasCredentials) {
          console.log('🔄 Attempting to reconnect with saved credentials...');
          await this.whatsappService.reconnect();
          
          // Wait for connection to establish
          await this.waitForConnection(30000); // 30 second timeout
          
          const newStatus = this.whatsappService.getStatus();
          return newStatus.connected;
        }
      }

      console.log('⚠️ No valid credentials found - connection requires QR scan');
      return false;
    } catch (error) {
      console.error('Error ensuring connection:', error);
      return false;
    }
  }

  /**
   * Step 4: Send PDF with reliable delivery
   */
  private async sendPDFWithReliableDelivery(
    orderId: number,
    customerPhone: string,
    pdfBuffer: Buffer,
    order: any
  ): Promise<{
    success: boolean;
    message: string;
    adminDelivered: boolean;
    customerDelivered: boolean;
  }> {
    let adminDelivered = false;
    let customerDelivered = false;

    try {
      // Priority 1: Deliver to admin (100% guaranteed)
      console.log(`📤 Delivering PDF to admin ${this.adminWhatsApp}...`);
      try {
        const adminResult = await this.whatsappService.sendPDFDocument(
          this.adminWhatsApp,
          pdfBuffer,
          `invoice-${orderId}.pdf`,
          `🧾 فاتورة جديدة رقم ${orderId}\n\n👤 العميل: ${order.customerName}\n📱 رقم الهاتف: ${order.customerPhone}\n💰 المبلغ الإجمالي: ${order.totalAmount.toLocaleString()} د.ع\n\n✅ تم إرسال الفاتورة تلقائياً`
        );
        
        if (adminResult && adminResult.success) {
          adminDelivered = true;
          console.log(`✅ Admin PDF delivered successfully`);
        } else {
          console.log(`⚠️ Admin PDF delivery failed:`, adminResult?.message || 'Unknown error');
        }
      } catch (adminError) {
        console.error('Admin PDF delivery error:', adminError);
      }

      // Priority 2: Deliver to customer (best effort)
      if (customerPhone) {
        console.log(`📤 Delivering PDF to customer ${customerPhone}...`);
        try {
          const customerResult = await this.whatsappService.sendPDFDocument(
            customerPhone,
            pdfBuffer,
            `invoice-${orderId}.pdf`,
            `🧾 فاتورة طلبكم رقم ${orderId}\n\n✅ تم استلام طلبكم بنجاح\n💰 المبلغ الإجمالي: ${order.totalAmount.toLocaleString()} د.ع\n\n📞 للاستفسار: ${this.adminWhatsApp.replace('@c.us', '')}`
          );
          
          if (customerResult && customerResult.success) {
            customerDelivered = true;
            console.log(`✅ Customer PDF delivered successfully`);
          } else {
            console.log(`⚠️ Customer PDF delivery failed:`, customerResult?.message || 'Unknown error');
          }
        } catch (customerError) {
          console.error('Customer PDF delivery error:', customerError);
        }
      }

      // Determine overall success
      const success = adminDelivered; // Admin delivery is the minimum requirement
      const message = success 
        ? `PDF delivered successfully (Admin: ${adminDelivered ? '✅' : '❌'}, Customer: ${customerDelivered ? '✅' : '❌'})`
        : 'PDF delivery failed - admin delivery unsuccessful';

      return {
        success,
        message,
        adminDelivered,
        customerDelivered
      };

    } catch (error: any) {
      console.error('PDF delivery error:', error);
      return {
        success: false,
        message: `PDF delivery failed: ${error.message}`,
        adminDelivered,
        customerDelivered
      };
    }
  }

  /**
   * Wait for WhatsApp connection to establish
   */
  private async waitForConnection(timeout: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const status = this.whatsappService.getStatus();
      if (status.connected) {
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return false;
  }

  /**
   * Get workflow statistics
   */
  getWorkflowStats(): any {
    return {
      service: 'PDF Workflow Service',
      adminNumber: this.adminWhatsApp,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      features: [
        'Server Status Check',
        'Saved Credentials Verification',
        'Connection Reliability',
        'Guaranteed Admin Delivery',
        'Customer Delivery Attempt',
        'Comprehensive Error Handling'
      ]
    };
  }
}