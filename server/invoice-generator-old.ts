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

    // Build complete HTML with modern professional design
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
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }
        
        .customer-section {
          width: 180px;
          border: 1px solid #333;
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
        
        .app-section {
          flex: 1;
          text-align: left;
          direction: ltr;
        }
        
        .app-name {
          font-size: 32px;
          font-weight: 900;
          color: #000;
          margin-bottom: 20px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        
        .qr-section {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .qr-code {
          width: 90px;
          height: 90px;
          border: 3px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          background: white;
          text-align: center;
          line-height: 1.2;
        }
        
        .order-details {
          font-size: 14px;
          line-height: 1.8;
          color: #000;
        }
        
        .order-details div {
          margin-bottom: 8px;
          font-weight: 600;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          border: 2px solid #000;
          direction: rtl;
        }
        
        .items-table th {
          background: #000;
          color: white;
          padding: 15px 10px;
          text-align: center;
          font-weight: 800;
          font-size: 16px;
          border: 1px solid #000;
        }
        
        .items-table td {
          padding: 12px 10px;
          text-align: center;
          border: 1px solid #000;
          background: white;
          color: #000;
          font-weight: 600;
          font-size: 14px;
        }
        
        .totals-section {
          background: white;
          border: 2px solid #000;
          padding: 25px;
          margin: 30px 0;
          text-align: right;
          direction: rtl;
        }
        
        .totals-title {
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 20px;
          color: #000;
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
        
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          font-size: 16px;
          font-weight: 600;
          border-bottom: 1px solid #ddd;
        }
        
        .totals-row:last-child {
          border-bottom: none;
          font-size: 18px;
          font-weight: 900;
          color: #000;
          border-top: 3px solid #000;
          padding-top: 15px;
          margin-top: 10px;
        }
        
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #000;
          font-size: 14px;
          font-weight: 600;
          color: #000;
        }
        
        @media print {
          .invoice {
            margin: 0;
            box-shadow: none;
            page-break-after: always;
          }
          
          .invoice:last-child {
            page-break-after: avoid;
          }
          
          body {
            background: white;
          }
        }
      </style>
    </head>
    <body>
      ${orders.map(order => generateOrderHTML(order)).join('')}
    </body>
    </html>
  `;
}

function generateOrderHTML(order: any): string {
  const orderDate = new Date(order.orderDate || Date.now()).toLocaleDateString('ar-EG');
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
  const address = typeof order.address === 'string' ? JSON.parse(order.address) : order.address || {};
  const subtotal = Number(order.totalAmount || 0);
  const deliveryFee = 1000;
  const total = subtotal + deliveryFee;
  
  // Clean address parsing - remove phone numbers completely
  let cleanAddress = 'غير محدد';
  if (address.notes && typeof address.notes === 'string') {
    cleanAddress = address.notes
      .replace(/07[0-9]{8,9}/g, '')  // Remove Iraqi phone numbers
      .replace(/\+964[0-9]{8,10}/g, '')  // Remove international format
      .replace(/\b\d{10,11}\b/g, '')  // Remove any 10-11 digit numbers
      .replace(/\d{10,}/g, '')  // Remove any string of 10+ digits
      .replace(/\s*-\s*$/, '')  // Remove trailing dash
      .replace(/^\s*-\s*/, '')  // Remove leading dash
      .trim();
  }
  
  if (address.neighborhood && address.neighborhood !== 'غير محدد' && address.neighborhood !== 'B') {
    cleanAddress = address.neighborhood;
  } else if (address.landmark && !address.landmark.includes('07')) {
    cleanAddress = address.landmark;
  }
  
  return `
    <div class="invoice">
      <div class="header">
        <div class="customer-section">
          <div class="customer-title">معلومات العميل</div>
          <div class="customer-info">
            <div>الاسم: ${order.customerName || 'غير محدد'}</div>
            <div>رقم الموبايل: ${order.customerPhone || 'غير محدد'}</div>
            <div>العنوان: ${address.governorate || 'غير محدد'} - ${address.district || 'غير محدد'} - ${cleanAddress}</div>
          </div>
        </div>
        
        <div class="app-section">
          <div class="app-name">PAKETY</div>
          <div class="qr-section">
            <div class="qr-code">
              QR<br/>CODE<br/>#${order.id}
            </div>
            <div class="order-details">
              <div>رقم الطلب: #${order.id}</div>
              <div>التاريخ: ${orderDate}</div>
            </div>
          </div>
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>المنتج</th>
            <th>السعر لكل كيلو</th>
            <th>الكمية</th>
            <th>السعر الكلي</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item: any) => `
            <tr>
              <td>${item.productName || 'غير محدد'}</td>
              <td>${Number(item.price || 0).toLocaleString('ar-IQ')} دينار</td>
              <td>${item.quantity || 1} ${item.unit || 'كغ'}</td>
              <td>${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString('ar-IQ')} دينار</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals-section">
        <div class="totals-title">ملخص الفاتورة</div>
        <div class="totals-row">
          <span>المجموع الفرعي:</span>
          <span>${subtotal.toLocaleString('ar-IQ')} دينار</span>
        </div>
        <div class="totals-row">
          <span>رسوم التوصيل:</span>
          <span>${deliveryFee.toLocaleString('ar-IQ')} دينار</span>
        </div>
        <div class="totals-row">
          <span>المجموع الكلي:</span>
          <span>${total.toLocaleString('ar-IQ')} دينار</span>
        </div>
      </div>
      
      <div class="footer">
        شكراً لك على ثقتك في PAKETY - نتطلع لخدمتك مرة أخرى
      </div>
    </div>
  `;
}