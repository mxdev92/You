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
 * COMPREHENSIVE TEXT MESSAGE INVOICE DELIVERY SYSTEM
 * Sends detailed WhatsApp messages with all order information
 */
export async function deliverInvoiceToCustomer(order: Order): Promise<void> {
  console.log(`📱 TEXT Invoice Delivery Started for Order #${order.id}`);
  
  try {
    // Generate detailed order information message
    let itemDetails = '';
    let productsTotal = 0;
    let servicesTotal = 0;
    let deliveryFee = 3000;
    
    order.items.forEach((item: any, index: number) => {
      const itemTotal = parseFloat(item.price) * parseFloat(item.quantity);
      
      // Separate products from services
      if (item.productId === 'app_services' || item.productName === 'آب سيرفز') {
        servicesTotal += itemTotal;
      } else {
        productsTotal += itemTotal;
      }
      
      itemDetails += `${index + 1}. ${item.productName}
   🔸 الكمية: ${item.quantity} ${item.unit}
   🔸 السعر: ${parseFloat(item.price).toLocaleString()} د.ع / ${item.unit}
   🔸 المجموع: ${itemTotal.toLocaleString()} د.ع

`;
    });

    // Comprehensive customer message with all details
    const customerMessage = `🧾 *فاتورة الطلب رقم ${order.id}*

✅ *تم استلام طلبكم بنجاح*

━━━━━━━━━━━━━━━━━━━━
👤 *معلومات العميل:*
الاسم: ${order.customerName}
الهاتف: ${order.customerPhone}
العنوان: ${typeof order.address === 'object' ? 
  `${order.address.governorate} - ${order.address.district} - ${order.address.neighborhood}${order.address.notes ? ' - ' + order.address.notes : ''}` : 
  order.address}

━━━━━━━━━━━━━━━━━━━━
🛒 *تفاصيل الطلب:*

${itemDetails}━━━━━━━━━━━━━━━━━━━━
💰 *ملخص الأسعار:*
مجموع المنتجات: ${productsTotal.toLocaleString()} د.ع
رسوم التوصيل: ${deliveryFee.toLocaleString()} د.ع
${servicesTotal > 0 ? `آب سيرفز: ${servicesTotal.toLocaleString()} د.ع\n` : ''}━━━━━━━━━━━━━━━━━━━━
*المبلغ الإجمالي: ${(productsTotal + deliveryFee + servicesTotal).toLocaleString()} د.ع*

🚚 سيتم التواصل معك قريباً لتأكيد الطلب وترتيب التوصيل

شكراً لك على اختيار باكيتي 💚`;

    // Send comprehensive text message to customer
    console.log(`📱 Sending detailed text invoice to customer: ${order.customerPhone}`);
    const customerResult = await wasenderService.sendMessage(
      order.customerPhone,
      customerMessage
    );

    // Admin notification with same detailed information
    const adminMessage = `📋 *طلب جديد رقم ${order.id}*

👤 العميل: ${order.customerName}
📱 الهاتف: ${order.customerPhone}
💰 المبلغ الإجمالي: ${order.totalAmount.toLocaleString()} د.ع

🛒 *المنتجات المطلوبة:*
${itemDetails}
━━━━━━━━━━━━━━━━━━━━
📍 العنوان: ${typeof order.address === 'object' ? 
  `${order.address.governorate} - ${order.address.district} - ${order.address.neighborhood}${order.address.notes ? ' - ' + order.address.notes : ''}` : 
  order.address}

⏰ يجب التواصل مع العميل لتأكيد الطلب`;

    console.log(`⏱️ Waiting 3 seconds for WasenderAPI rate limiting...`);
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(`📱 Sending admin notification...`);
    const adminResult = await wasenderService.sendMessage(
      '07511856947',
      adminMessage
    );

    // Report results
    console.log(`✅ TEXT Invoice Delivery Completed for Order #${order.id}`);
    console.log(`   Customer delivery: ${customerResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   Admin notification: ${adminResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);

    // Log detailed results for debugging
    if (!customerResult.success) {
      console.error(`❌ Customer delivery failed:`, customerResult.message);
    }
    if (!adminResult.success) {
      console.error(`❌ Admin notification failed:`, adminResult.message);
    }

  } catch (error: any) {
    console.error(`❌ TEXT Invoice Delivery FAILED for Order #${order.id}:`, error.message);
    console.error(`   Full error details:`, error);
  }
}