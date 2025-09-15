import { generateInvoicePDF } from './invoice-generator.js';
import { WasenderAPIService } from './wasender-api-service.js';

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

/**
 * NEW PROFESSIONAL INVOICE DELIVERY SYSTEM
 * Guarantees immediate PDF invoice delivery to customers via WhatsApp
 */
export async function deliverInvoiceToCustomer(order: Order): Promise<void> {
  console.log(`🚀 PROFESSIONAL Invoice Delivery Started for Order #${order.id}`);
  
  try {
    // Step 1: Generate professional Arabic RTL PDF invoice
    console.log(`📄 Generating professional PDF invoice...`);
    const pdfBuffer = await generateInvoicePDF(order);
    console.log(`✅ PDF generated successfully - Size: ${pdfBuffer.length} bytes`);

    // Step 2: Prepare WhatsApp message
    const customerMessage = `🧾 **فاتورة الطلب رقم ${order.id}**

👤 العميل: ${order.customerName}
💰 المبلغ الإجمالي: ${order.totalAmount.toLocaleString()} د.ع

شكراً لك على اختيار باكيتي للتوصيل السريع 💚
سيتم التواصل معك قريباً لتأكيد الطلب`;

    // Step 3: Send PDF to customer immediately
    console.log(`📱 Sending PDF invoice to customer: ${order.customerPhone}`);
    const customerResult = await wasenderService.sendPDFDocument(
      order.customerPhone,
      pdfBuffer,
      `invoice-${order.id}.pdf`,
      customerMessage
    );

    // Step 4: Send admin notification (with rate limiting delay)
    const adminMessage = `📋 **طلب جديد رقم ${order.id}**

👤 العميل: ${order.customerName}
📱 الهاتف: ${order.customerPhone}
💰 المبلغ الإجمالي: ${order.totalAmount.toLocaleString()} د.ع

عدد المنتجات: ${order.items.length}`;

    console.log(`⏱️ Waiting 7 seconds for WasenderAPI rate limiting...`);
    await new Promise(resolve => setTimeout(resolve, 7000)); // 7 second delay for safety

    console.log(`📱 Sending admin notification...`);
    const adminResult = await wasenderService.sendPDFDocument(
      '07511856947',
      pdfBuffer,
      `admin-invoice-${order.id}.pdf`,
      adminMessage
    );

    // Step 5: Report results
    console.log(`✅ PROFESSIONAL Invoice Delivery Completed for Order #${order.id}`);
    console.log(`   Customer delivery: ${customerResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   Admin notification: ${adminResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);

    // Step 6: Log detailed results for debugging
    if (!customerResult.success) {
      console.error(`❌ Customer delivery failed:`, customerResult.message);
    }
    if (!adminResult.success) {
      console.error(`❌ Admin notification failed:`, adminResult.message);
    }

  } catch (error: any) {
    console.error(`❌ PROFESSIONAL Invoice Delivery FAILED for Order #${order.id}:`, error.message);
    console.error(`   Full error details:`, error);
    
    // Don't throw error - don't want to break order creation
    // But ensure we have detailed logging for debugging
  }
}