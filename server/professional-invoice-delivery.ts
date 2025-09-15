import { generateInvoicePDF } from './invoice-generator.js';
import { WasenderAPIService } from './wasender-api-service.js';
import { randomBytes } from 'crypto';

interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  items: any[];
  address: any;
  orderDate: Date;
}

const wasenderService = new WasenderAPIService();

// Global tempPDFs storage - will be set by routes.ts
let tempPDFsStorage: Map<string, Buffer> | null = null;
export function setTempPDFsStorage(storage: Map<string, Buffer>) {
  console.log(`🔧 Setting tempPDFs storage - received Map with size:`, storage.size);
  tempPDFsStorage = storage;
  console.log(`✅ tempPDFs storage initialized successfully!`);
}

// Get current domain for PDF URLs
function getCurrentDomain(): string {
  return process.env.REPL_URL || 'http://localhost:5000';
}

/**
 * FULLY FIXED PROFESSIONAL INVOICE DELIVERY SYSTEM
 * Uses correct WasenderAPI URL-based media format
 */
export async function deliverInvoiceToCustomer(order: Order): Promise<void> {
  console.log(`🚀 FULLY FIXED Invoice Delivery Started for Order #${order.id}`);
  
  try {
    if (!tempPDFsStorage) {
      throw new Error('tempPDFs storage not initialized - contact developer');
    }

    // Step 1: Generate professional Arabic RTL PDF invoice
    console.log(`📄 Generating professional PDF invoice...`);
    const pdfBuffer = await generateInvoicePDF(order);
    console.log(`✅ PDF generated successfully - Size: ${pdfBuffer.length} bytes`);

    // Step 2: Store PDF temporarily with secure token
    const token = randomBytes(32).toString('hex');
    tempPDFsStorage.set(token, pdfBuffer);
    console.log(`🔐 PDF stored with secure token: ${token.substring(0, 8)}...`);

    // Step 3: Generate public PDF URL
    const currentDomain = getCurrentDomain();
    const pdfUrl = `${currentDomain}/temp-pdf/${token}`;
    console.log(`🔗 PDF URL generated: ${pdfUrl}`);

    // Step 4: Prepare comprehensive WhatsApp message
    const customerMessage = `🧾 **فاتورة الطلب رقم ${order.id}**

✅ **تم استلام طلبكم بنجاح**

👤 العميل: ${order.customerName}
📍 العنوان: ${order.address}
📱 الهاتف: ${order.customerPhone}
💰 المبلغ الإجمالي: ${order.totalAmount.toLocaleString()} د.ع
📦 عدد المنتجات: ${order.items.length}

📄 **الفاتورة التفصيلية مرفقة أعلاه**

شكراً لك على اختيار باكيتي للتوصيل السريع 💚
سيتم التواصل معك قريباً لتأكيد الطلب وترتيب التوصيل`;

    // Step 5: Send PDF to customer using CORRECT URL method
    console.log(`📱 Sending PDF invoice to customer: ${order.customerPhone}`);
    const customerResult = await wasenderService.sendPDFDocumentViaURL(
      order.customerPhone,
      pdfUrl,
      `invoice-${order.id}.pdf`,
      customerMessage
    );

    // Step 6: Send admin notification (with rate limiting delay)
    const adminMessage = `📋 **طلب جديد رقم ${order.id}**

👤 العميل: ${order.customerName}
📱 الهاتف: ${order.customerPhone}
💰 المبلغ الإجمالي: ${order.totalAmount.toLocaleString()} د.ع

عدد المنتجات: ${order.items.length}`;

    console.log(`⏱️ Waiting 10 seconds for WasenderAPI rate limiting...`);
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay for absolute safety

    console.log(`📱 Sending admin notification...`);
    const adminResult = await wasenderService.sendPDFDocumentViaURL(
      '07511856947',
      pdfUrl,
      `admin-invoice-${order.id}.pdf`,
      adminMessage
    );

    // Step 7: Report results
    console.log(`✅ FULLY FIXED Invoice Delivery Completed for Order #${order.id}`);
    console.log(`   Customer delivery: ${customerResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   Admin notification: ${adminResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);

    // Step 8: Log detailed results for debugging
    if (!customerResult.success) {
      console.error(`❌ Customer delivery failed:`, customerResult.message);
    }
    if (!adminResult.success) {
      console.error(`❌ Admin notification failed:`, adminResult.message);
    }

  } catch (error: any) {
    console.error(`❌ FULLY FIXED Invoice Delivery FAILED for Order #${order.id}:`, error.message);
    console.error(`   Full error details:`, error);
    
    // Don't throw error - don't want to break order creation
    // But ensure we have detailed logging for debugging
  }
}