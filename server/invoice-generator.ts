import { chromium } from 'playwright';
import QRCode from 'qrcode';

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

    // Build complete HTML with professional black/gray design and real QR code
    const htmlContent = await generateInvoiceHTML(validOrders);
    
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

async function generateQRCode(orderId: number): Promise<string> {
  try {
    // Generate QR code as base64 data URL
    const qrCodeDataURL = await QRCode.toDataURL(`Order ID: ${orderId}`, {
      width: 80,
      margin: 1,
      color: {
        dark: '#333333',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
}

async function generateInvoiceHTML(orders: any[]): Promise<string> {
  const order = orders[0]; // Get first order
  const items = order.items || [];
  
  // Calculate totals explicitly
  const subtotal = Math.round(order.totalAmount);
  const deliveryFee = 1000;
  const finalTotal = subtotal + deliveryFee;
  
  // Generate QR code for order ID
  const qrCodeDataURL = await generateQRCode(order.id);
  
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
        
        @page {
          size: A4;
          margin: 8mm;
        }
        
        @media print {
          .invoice {
            page-break-inside: avoid;
            page-break-after: avoid;
          }
        }
        
        .invoice {
          width: 210mm;
          max-height: 280mm;
          margin: 0 auto;
          padding: 8mm;
          background: white;
          position: relative;
          direction: rtl;
          page-break-after: avoid;
        }
        
        .logo-header {
          text-align: center;
          margin-bottom: 10px;
          padding-bottom: 5px;
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
          margin-bottom: 10px;
        }
        
        .customer-section {
          width: 240px;
          padding: 8px;
          background: #f8f9fa;
          font-size: 9px;
        }
        
        .customer-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
          color: white;
          text-align: center;
          background: #333;
          padding: 4px;
          margin: -8px -8px 8px -8px;
        }
        
        .customer-info {
          font-size: 12px;
          line-height: 1.4;
          text-align: right;
          direction: rtl;
        }
        
        .customer-info div {
          margin-bottom: 4px;
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
          margin-top: 8px;
          display: flex;
          gap: 15px;
          page-break-inside: avoid;
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
        <!-- Company Name Header -->
        <div class="logo-header">
          <h1 style="font-size: 24px; font-weight: bold; color: #333; margin: 0; text-align: center;">PAKETY</h1>
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
            ${qrCodeDataURL ? `<img src="${qrCodeDataURL}" alt="QR Code" style="width: 80px; height: 80px; border: 2px solid #333; margin-bottom: 8px;">` : '<div class="qr-box">QR</div>'}
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

// Generate thermal printer compatible PDF for multiple invoices
export async function generateThermalInvoicePDF(orderIds: number[], orders: any[]): Promise<Buffer> {
  console.log('🚀 Generating Thermal Invoice PDF with Playwright...');
  
  const browser = await chromium.launch({
    executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Generate HTML for all invoices
    const html = await generateThermalInvoiceHTML(orders);
    
    await page.setContent(html);
    
    // Wait for fonts to load before generating PDF
    await page.waitForTimeout(2000);
    await page.evaluate(() => document.fonts.ready);
    
    // Generate PDF with HPRT N41BT thermal printer specifications
    const pdfBuffer = await page.pdf({
      width: '76mm',  // HPRT N41BT actual width (76mmX100mm)
      height: '100mm',  // Standard length per page as shown in printer preview
      margin: {
        top: '2mm',
        right: '2mm',
        bottom: '2mm',
        left: '2mm'
      },
      printBackground: true,
      preferCSSPageSize: true
    });

    await browser.close();
    console.log('✅ Thermal Invoice PDF generated successfully');
    return pdfBuffer;
  } catch (error) {
    await browser.close();
    throw error;
  }
}

// Generate HTML for thermal printer invoices
async function generateThermalInvoiceHTML(orders: any[]): Promise<string> {
  const invoicesHTML = await Promise.all(orders.map(order => generateSingleThermalInvoiceHTML(order)));
  const combinedHTML = invoicesHTML.join('');
  
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thermal Invoices</title>
      <style>
        @font-face {
          font-family: 'Cairo';
          font-style: normal;
          font-weight: 400;
          src: url(https://fonts.gstatic.com/s/cairo/v17/SLXGc1nY6HkvalIhTp2mxdt0UX8gWrpkqEcY.woff2) format('woff2');
          unicode-range: U+0600-06FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE80-FEFC;
        }
        @font-face {
          font-family: 'Cairo';
          font-style: normal;
          font-weight: 700;
          src: url(https://fonts.gstatic.com/s/cairo/v17/SLXGc1nY6HkvalIhTp2mxdt0UX8gWrpkqEcY.woff2) format('woff2');
          unicode-range: U+0600-06FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE80-FEFC;
        }
      </style>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Cairo', 'DejaVu Sans', 'Liberation Sans', 'Segoe UI', 'Tahoma', 'Arial Unicode MS', sans-serif;
          background: white;
          color: #000;
          line-height: 1.3;
          direction: rtl;
          font-size: 8px;
          -webkit-font-feature-settings: "liga" off;
          font-feature-settings: "liga" off;
        }
        
        @page {
          size: 76mm auto;
          margin: 2mm;
        }
        
        .thermal-invoice {
          width: 100%;
          max-width: 72mm;
          margin: 0 auto;
          padding: 1.5mm;
          background: white;
          page-break-after: always;
          page-break-inside: avoid;
        }
        
        .thermal-invoice:last-child {
          page-break-after: avoid;
        }
        
        .thermal-header {
          text-align: center;
          margin-bottom: 3mm;
          padding-bottom: 2mm;
          border-bottom: 1px solid #000;
        }
        
        .thermal-logo {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 1mm;
        }
        
        .thermal-section {
          margin-bottom: 2mm;
        }
        
        .thermal-section-title {
          font-weight: bold;
          font-size: 9px;
          margin-bottom: 1mm;
          text-align: center;
        }
        
        .thermal-customer-info {
          font-size: 7px;
          line-height: 1.3;
        }
        
        .thermal-table {
          width: 100%;
          border-collapse: collapse;
          margin: 2mm 0;
        }
        
        .thermal-table th,
        .thermal-table td {
          font-size: 7px;
          padding: 0.5mm;
          text-align: right;
          border-bottom: 1px solid #ccc;
        }
        
        .thermal-table th {
          font-weight: bold;
          background: #f0f0f0;
        }
        
        .thermal-totals {
          margin-top: 2mm;
          padding-top: 2mm;
          border-top: 1px solid #000;
        }
        
        .thermal-total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1mm;
          font-size: 8px;
        }
        
        .thermal-total-row.final {
          font-weight: bold;
          font-size: 9px;
          padding-top: 1mm;
          border-top: 1px solid #000;
        }
        

        
        .thermal-notes {
          margin-top: 2mm;
          padding: 1mm;
          background: #f8f8f8;
          font-size: 7px;
        }
      </style>
    </head>
    <body>
      ${combinedHTML}
    </body>
    </html>
  `;
}

// Generate single thermal invoice HTML
async function generateSingleThermalInvoiceHTML(order: any): Promise<string> {
  console.log('Processing order for thermal PDF:', JSON.stringify(order, null, 2));
  
  // Parse items correctly
  let items;
  if (typeof order.items === 'string') {
    try {
      items = JSON.parse(order.items);
    } catch (e) {
      console.error('Failed to parse order.items:', e);
      items = [];
    }
  } else if (Array.isArray(order.items)) {
    items = order.items;
  } else {
    items = [];
  }

  // Generate table rows with correct column order: المنتج، السعر لكل كيلو، الكمية، السعر الكلي
  const itemsHTML = items.map((item: any) => `
    <tr>
      <td style="text-align: right;">${item.productName || 'منتج غير محدد'}</td>
      <td style="text-align: center;">${item.price} د.ع</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: left;">${(parseFloat(item.price || 0) * (item.quantity || 0)).toFixed(0)} د.ع</td>
    </tr>
  `).join('');

  // Calculate totals
  const subtotal = items.reduce((sum: number, item: any) => sum + (parseFloat(item.price || 0) * (item.quantity || 0)), 0);
  const deliveryFee = 2000;
  const total = subtotal + deliveryFee;
  
  return `
    <div class="thermal-invoice">
      <div class="thermal-header">
        <div class="thermal-logo">PAKETY</div>
        <div style="font-size: 7px; margin-top: 2mm;">رقم الطلب: ${order.id}</div>
        <div style="font-size: 7px;">${new Date(order.createdAt || order.orderDate).toLocaleDateString('ar-IQ')}</div>
      </div>
      
      <div class="thermal-section">
        <div class="thermal-section-title">معلومات العميل</div>
        <div class="thermal-customer-info">
          <div>الاسم: ${order.customerName || 'غير محدد'}</div>
          <div>الموبايل: ${order.customerPhone || 'غير محدد'}</div>
          <div>العنوان: ${order.address?.governorate || ''} - ${order.address?.district || ''} - ${order.address?.neighborhood || ''}</div>
        </div>
      </div>
      
      <div class="thermal-section">
        <div class="thermal-section-title">تفاصيل الطلب</div>
        <table class="thermal-table">
          <thead>
            <tr>
              <th>المنتج</th>
              <th>السعر لكل كيلو</th>
              <th>الكمية</th>
              <th>السعر الكلي</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
      </div>
      
      <div class="thermal-totals">
        <div class="thermal-total-row">
          <span>مجموع الطلبات:</span>
          <span>${subtotal.toFixed(0)} د.ع</span>
        </div>
        <div class="thermal-total-row">
          <span>اجور التوصيل:</span>
          <span>${deliveryFee} د.ع</span>
        </div>
        <div class="thermal-total-row final">
          <span>المبلغ الاجمالي:</span>
          <span>${total.toFixed(0)} د.ع</span>
        </div>
      </div>
      
      <div class="thermal-notes">
        <div style="font-weight: bold; margin-bottom: 2mm; text-align: center;">ملاحظات:</div>
        <div style="min-height: 10mm; border: 1px solid #000; padding: 2mm; background: #f9f9f9;">
          ${order.notes || 'لا توجد ملاحظات'}
        </div>
        
        <div style="font-weight: bold; margin: 3mm 0 2mm 0; text-align: center;">وقت التوصيل:</div>
        <div style="min-height: 8mm; border: 1px solid #000; padding: 2mm; background: #f9f9f9; text-align: center;">
          ${order.deliveryTime || 'سيتم التحديد لاحقاً'}
        </div>
      </div>
    </div>
  `;
}