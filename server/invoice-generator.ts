import { chromium } from 'playwright';

export async function generateInvoicePDF(orderIds: number[], orders: any[]) {
  try {
    console.log('🚀 Generating Professional Invoice PDF with Playwright...');

    // Filter valid orders
    const validOrders = orders.filter(order => 
      orderIds.includes(order.id) && order && order.items
    );

    if (validOrders.length === 0) {
      throw new Error('No valid orders found');
    }

    // Set environment variables to use system browser
    process.env.PLAYWRIGHT_BROWSERS_PATH = '/usr';
    process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1';

    // Launch Playwright browser
    let browser;
    try {
      // Try with system chromium first
      browser = await chromium.launch({
        executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium-browser',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--headless'
        ]
      });
    } catch (error) {
      console.log('System chromium failed, trying Playwright default...');
      // Fallback to default Playwright browser (if installed)
      browser = await chromium.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    
    const page = await browser.newPage();

    // Build complete HTML with professional black/gray design
    const htmlContent = generateInvoiceHTML(validOrders);
    
    // Set content and generate PDF
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle' 
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' }
    });

    await browser.close();

    console.log('✅ Professional Arabic RTL PDF generated successfully');
    return pdfBuffer;

  } catch (error) {
    console.error('❌ Error generating invoice PDF:', error);
    throw error;
  }
}

function generateInvoiceHTML(orders: any[]): string {
  const order = orders[0]; // Get first order
  const items = order.items || [];
  
  // Calculate totals explicitly
  const subtotal = Math.round(order.totalAmount);
  const deliveryFee = 1000;
  const finalTotal = subtotal + deliveryFee;
  
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>فاتورة</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Cairo', Arial, sans-serif;
          background: white;
          color: #333;
          line-height: 1.3;
          direction: rtl;
          font-size: 10px;
        }
        
        .invoice {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 10mm;
          background: white;
          position: relative;
          direction: rtl;
        }
        
        .logo-header {
          text-align: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
        }
        
        .logo-header img {
          width: 80px;
          height: 80px;
          object-fit: contain;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }
        
        .customer-section {
          width: 180px;
          padding: 8px;
          background: #f8f9fa;
          font-size: 9px;
        }
        
        .customer-title {
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 6px;
          color: white;
          text-align: center;
          background: #333;
          padding: 3px;
          margin: -8px -8px 6px -8px;
        }
        
        .customer-info {
          font-size: 9px;
          line-height: 1.2;
          text-align: right;
          direction: rtl;
        }
        
        .customer-info div {
          margin-bottom: 2px;
          font-weight: 400;
          color: #333;
        }
        

        
        .qr-info {
          width: 120px;
          text-align: left;
          font-size: 9px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        
        .qr-box {
          width: 50px;
          height: 50px;
          border: 2px solid #333;
          background: #f8f9fa;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          margin-bottom: 8px;
        }
        
        .order-details {
          font-size: 9px;
          line-height: 1.4;
        }
        
        .order-details div {
          margin-bottom: 4px;
        }
        
        .order-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 9px;
        }
        
        .order-table th {
          background: #333;
          color: white;
          padding: 6px 4px;
          text-align: center;
          font-weight: 600;
          border: 1px solid #333;
          font-size: 9px;
        }
        
        .order-table td {
          padding: 4px;
          text-align: center;
          border: 1px solid #ddd;
          background: white;
          font-size: 8px;
        }
        
        .order-table tr:nth-child(even) {
          background: #f8f9fa;
        }
        
        .totals-section {
          margin-top: 15px;
          display: flex;
          justify-content: flex-end;
        }
        
        .totals-table {
          width: 250px;
          border-collapse: collapse;
          font-size: 10px;
        }
        
        .totals-table td {
          padding: 5px 10px;
          border: 1px solid #ddd;
        }
        
        .totals-table .label {
          background: #f8f9fa;
          font-weight: 600;
          text-align: right;
          color: #333;
        }
        
        .totals-table .value {
          text-align: left;
          background: white;
        }
        
        .total-row td {
          background: #333 !important;
          color: white !important;
          font-weight: 700 !important;
        }
        
        .total-row .value {
          text-align: left !important;
          background: #333 !important;
          color: white !important;
        }
        
        .notes-section {
          margin-top: 15px;
          display: flex;
          gap: 20px;
        }
        
        .notes-box, .delivery-time-box {
          flex: 1;
          border: 1px solid #ddd;
          padding: 8px;
          background: #f8f9fa;
          font-size: 9px;
        }
        
        .notes-box h4, .delivery-time-box h4 {
          font-size: 10px;
          font-weight: 600;
          margin-bottom: 5px;
          color: #333;
        }
      </style>
    </head>
    <body>
      <div class="invoice">
        <!-- Logo Header -->
        <div class="logo-header">
          <svg width="80" height="80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Main cube top -->
            <path d="M50 50 L100 30 L150 50 L100 70 Z" stroke="#333" stroke-width="3" fill="none"/>
            <!-- Main cube front -->
            <path d="M50 50 L50 100 L100 120 L100 70 Z" stroke="#333" stroke-width="3" fill="none"/>
            <!-- Main cube right -->
            <path d="M100 70 L100 120 L150 100 L150 50 Z" stroke="#333" stroke-width="3" fill="none"/>
            <!-- Bottom cube top -->
            <path d="M50 100 L100 80 L150 100 L100 120 Z" stroke="#333" stroke-width="3" fill="none"/>
            <!-- Bottom cube front -->
            <path d="M50 100 L50 150 L100 170 L100 120 Z" stroke="#333" stroke-width="3" fill="none"/>
            <!-- Bottom cube right -->
            <path d="M100 120 L100 170 L150 150 L150 100 Z" stroke="#333" stroke-width="3" fill="none"/>
          </svg>
        </div>
        
        <!-- Header with Customer Info and QR -->
        <div class="header">
          <div class="customer-section">
            <div class="customer-title">معلومات العميل</div>
            <div class="customer-info">
              <div><strong>الاسم:</strong> ${order.customerName || 'غير محدد'}</div>
              <div><strong>رقم الموبايل:</strong> ${order.customerPhone || 'غير محدد'}</div>
              <div><strong>العنوان:</strong> ${order.address?.governorate || ''} - ${order.address?.district || ''} - ${order.address?.neighborhood || ''}</div>
            </div>
          </div>
          
          <div style="flex: 1;"></div>
          
          <div class="qr-info">
            <div class="qr-box">QR</div>
            <div class="order-details">
              <div><strong>Order ID:</strong> ${order.id || 'N/A'}</div>
              <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-US')}</div>
            </div>
          </div>
        </div>
        
        <!-- Order Items Table -->
        <table class="order-table">
          <thead>
            <tr>
              <th>المنتج</th>
              <th>السعر لكل كيلو</th>
              <th>الكمية</th>
              <th>السعر الكلي</th>
            </tr>
          </thead>
          <tbody>
            ${items.slice(0, 25).map(item => `
              <tr>
                <td>${item.productName}</td>
                <td>${item.price} دينار</td>
                <td>${item.quantity} ${item.unit}</td>
                <td>${(parseFloat(item.price) * item.quantity).toFixed(0)} دينار</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <!-- Totals -->
        <div class="totals-section">
          <table class="totals-table">
            <tr>
              <td class="label">مجموع الطلبات الكلي:</td>
              <td class="value">${subtotal.toLocaleString()} دينار</td>
            </tr>
            <tr>
              <td class="label">اجور خدمة التوصيل:</td>
              <td class="value">${deliveryFee.toLocaleString()} دينار</td>
            </tr>
            <tr class="total-row">
              <td class="label">المبلغ الاجمالي:</td>
              <td class="value">${finalTotal.toLocaleString()} دينار</td>
            </tr>
          </table>
        </div>
        
        <!-- Notes and Delivery Time -->
        <div class="notes-section">
          <div class="notes-box">
            <h4>ملاحظات</h4>
            <div>${order.notes || 'لا توجد ملاحظات'}</div>
          </div>
          <div class="delivery-time-box">
            <h4>وقت التوصيل</h4>
            <div>خلال 24-48 ساعة</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}