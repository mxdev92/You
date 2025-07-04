import { chromium } from 'playwright';
import QRCode from 'qrcode';

export async function generateBrotherInvoicePDF(orderIds: number[]): Promise<Buffer> {
  console.log('🖨️ Generating Brother Printer Compatible PDF with Playwright...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Fetch all orders
    const orders = await Promise.all(
      orderIds.map(async (orderId) => {
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch order ${orderId}: ${response.statusText}`);
        }
        return response.json();
      })
    );

    // Generate QR codes for all orders
    const qrCodes = await Promise.all(
      orders.map(async (order) => {
        const qrData = `Order ID: ${order.id}`;
        return await QRCode.toDataURL(qrData, { 
          width: 60,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' }
        });
      })
    );

    // Create HTML for Brother printer (145mm × 108mm thermal labels)
    const html = `
      <!DOCTYPE html>
      <html lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Brother Printer - Batch Invoices</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Cairo', Arial, sans-serif;
          background: white;
          color: #000;
          line-height: 1.2;
          direction: rtl;
          font-size: 8px;
        }
        
        @page {
          size: 145mm 108mm;
          margin: 1mm;
        }
        
        .invoice-page {
          width: 145mm;
          height: 108mm;
          padding: 2mm;
          page-break-after: always;
          display: flex;
          flex-direction: column;
          border: 1px solid #000;
          background: white;
        }
        
        .invoice-page:last-child {
          page-break-after: avoid;
        }
        
        .header {
          text-align: center;
          margin-bottom: 2mm;
          border-bottom: 1px solid #000;
          padding-bottom: 2mm;
        }
        
        .company-name {
          font-size: 12px;
          font-weight: bold;
          color: #000;
        }
        
        .invoice-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2mm;
          font-size: 7px;
        }
        
        .qr-section {
          text-align: center;
        }
        
        .qr-code {
          width: 30px;
          height: 30px;
        }
        
        .customer-info {
          margin-bottom: 2mm;
          font-size: 7px;
          border: 1px solid #000;
          padding: 2mm;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1mm;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 6px;
          margin-bottom: 2mm;
        }
        
        .items-table th,
        .items-table td {
          border: 1px solid #000;
          padding: 1mm;
          text-align: center;
        }
        
        .items-table th {
          background: #f0f0f0;
          font-weight: bold;
        }
        
        .totals {
          margin-top: auto;
          font-size: 7px;
          border-top: 1px solid #000;
          padding-top: 2mm;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1mm;
        }
        
        .final-total {
          font-weight: bold;
          font-size: 8px;
          border-top: 1px solid #000;
          padding-top: 1mm;
        }
        
        .notes {
          font-size: 6px;
          margin-top: 2mm;
          border: 1px solid #000;
          padding: 2mm;
        }
        </style>
      </head>
      <body>
        ${orders.map((order, index) => `
          <div class="invoice-page">
            <!-- Header -->
            <div class="header">
              <div class="company-name">PAKETY</div>
            </div>
            
            <!-- Invoice Info and QR -->
            <div class="invoice-info">
              <div>
                <div>رقم الطلب: ${order.id}</div>
                <div>التاريخ: ${new Date(order.createdAt).toLocaleDateString('ar-EG')}</div>
              </div>
              <div class="qr-section">
                <img src="${qrCodes[index]}" alt="QR Code" class="qr-code">
              </div>
            </div>
            
            <!-- Customer Info -->
            <div class="customer-info">
              <div class="info-row">
                <span>الاسم:</span>
                <span>${order.customerName}</span>
              </div>
              <div class="info-row">
                <span>الموبايل:</span>
                <span>${order.customerPhone}</span>
              </div>
              <div class="info-row">
                <span>العنوان:</span>
                <span>${typeof order.address === 'string' ? order.address : 
                  `${order.address?.governorate || ''} - ${order.address?.district || ''} - ${order.address?.landmark || ''}`}</span>
              </div>
            </div>
            
            <!-- Items Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th>الكمية</th>
                  <th>السعر</th>
                  <th>المجموع</th>
                  <th>الصنف</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map((item: any) => `
                  <tr>
                    <td>${item.quantity}</td>
                    <td>${(item.price / 100).toFixed(0)}</td>
                    <td>${((item.price * item.quantity) / 100).toFixed(0)}</td>
                    <td>${item.productName}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <!-- Totals -->
            <div class="totals">
              <div class="total-row">
                <span>مجموع الطلبات:</span>
                <span>${((order.totalAmount - 1000) / 100).toFixed(0)} د.ع</span>
              </div>
              <div class="total-row">
                <span>أجور التوصيل:</span>
                <span>10 د.ع</span>
              </div>
              <div class="total-row final-total">
                <span>المبلغ الإجمالي:</span>
                <span>${(order.totalAmount / 100).toFixed(0)} د.ع</span>
              </div>
            </div>
            
            <!-- Notes -->
            <div class="notes">
              <div><strong>ملاحظات:</strong> ${order.notes || 'لا توجد ملاحظات'}</div>
              <div><strong>وقت التوصيل:</strong> خلال 24 ساعة</div>
            </div>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    // Set page content
    await page.setContent(html, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Generate PDF optimized for Brother thermal printer
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    });

    console.log('✅ Brother Printer Compatible PDF generated successfully');
    return pdf;

  } catch (error) {
    console.error('❌ Error generating Brother printer PDF:', error);
    throw error;
  } finally {
    await browser.close();
  }
}