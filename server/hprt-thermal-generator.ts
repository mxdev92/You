import { createCanvas } from 'canvas';

interface ThermalOrderData {
  id: number;
  userId: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: unknown;
  items: unknown;
  totalAmount: number;
  status: string;
  orderDate: Date;
  deliveryTime: string | null;
  notes: string | null;
}

// HPRT N41BT Professional Thermal Generator
// Based on printer specs: 203 DPI, 145mm×108mm paper size
export async function generateHPRTThermalImage(orderData: ThermalOrderData): Promise<Buffer> {
  // Parse JSON fields safely
  const address = typeof orderData.address === 'string' ? JSON.parse(orderData.address) : orderData.address;
  const items = Array.isArray(orderData.items) ? orderData.items : 
                (typeof orderData.items === 'string' ? JSON.parse(orderData.items) : []);
  
  // HPRT N41BT specifications from config image
  // Print Resolution: 203 DPI
  // Paper size: 145mm × 108mm (864 dots width × 656 dots height)
  const width = 864;  // 145mm at 203 DPI
  const height = 656; // 108mm at 203 DPI
  
  // Create canvas with exact HPRT specifications
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // White background for thermal printing
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  // Black text for thermal printing
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'right'; // RTL for Arabic
  
  let y = 20;
  const rightMargin = 20;
  
  // Customer Info Section (Right Top Corner - No Titles)
  ctx.font = '18px "DejaVu Sans", Arial'; // Larger font for 203 DPI
  ctx.fillText(`الاسم: ${orderData.customerName}`, width - rightMargin, y);
  y += 25;
  
  ctx.fillText(`رقم الموبايل: ${orderData.customerPhone}`, width - rightMargin, y);
  y += 25;
  
  const addressText = address ? 
    `العنوان: ${address.governorate || ''} - ${address.district || ''} - ${address.landmark || ''}` : 
    'العنوان: غير محدد';
  ctx.fillText(addressText, width - rightMargin, y);
  y += 40;
  
  // Dual Ultra-Thin Tables System
  if (items && Array.isArray(items)) {
    const itemsPerTable = 15;
    
    // Function to draw ultra-thin table
    const drawUltraThinTable = (tableItems: any[], startY: number) => {
      let currentY = startY;
      
      // Ultra-thin table headers (no borders)
      ctx.font = 'bold 16px "DejaVu Sans", Arial';
      ctx.fillText('المنتج', width - rightMargin, currentY);
      ctx.fillText('السعر', width - 200, currentY);
      ctx.fillText('ك', width - 300, currentY);
      ctx.fillText('المجموع', width - 400, currentY);
      currentY += 22;
      
      // Ultra-thin line under headers
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rightMargin, currentY - 3);
      ctx.lineTo(width - rightMargin, currentY - 3);
      ctx.stroke();
      currentY += 8;
      
      // Table items with ultra-compact spacing
      ctx.font = '14px "DejaVu Sans", Arial';
      tableItems.forEach((item: any) => {
        const itemTotal = parseFloat(item.price) * item.quantity;
        
        // Ultra-short product name for space efficiency
        const productName = (item.productName || 'منتج').substring(0, 8);
        
        ctx.fillText(productName, width - rightMargin, currentY);
        ctx.fillText((item.price || '0'), width - 200, currentY);
        ctx.fillText((item.quantity?.toString() || '0'), width - 300, currentY);
        ctx.fillText(itemTotal.toFixed(0), width - 400, currentY);
        currentY += 18; // Ultra-tight spacing
      });
      
      // Ultra-thin line after table
      currentY += 8;
      ctx.beginPath();
      ctx.moveTo(rightMargin, currentY - 3);
      ctx.lineTo(width - rightMargin, currentY - 3);
      ctx.stroke();
      
      return currentY + 15;
    };
    
    // Generate tables (max 2 tables of 15 items each)
    for (let i = 0; i < items.length; i += itemsPerTable) {
      const tableItems = items.slice(i, i + itemsPerTable);
      y = drawUltraThinTable(tableItems, y);
      
      // Small gap between tables
      if (i + itemsPerTable < items.length) {
        y += 10;
      }
    }
  }
  
  // RTL Footer Section (Minimal - Only Totals)
  y += 20;
  ctx.font = '16px "DejaVu Sans", Arial';
  
  // Calculate accurate subtotal from items
  const subtotal = items ? items.reduce((sum: number, item: any) => sum + (parseFloat(item.price) * item.quantity), 0) : 0;
  const deliveryFee = 2000; // Standard delivery fee
  
  ctx.fillText(`مجموع الطلبات: ${subtotal.toFixed(0)} د.ع`, width - rightMargin, y);
  y += 25;
  
  ctx.fillText(`اجور التوصيل: ${deliveryFee.toFixed(0)} د.ع`, width - rightMargin, y);
  y += 25;
  
  ctx.font = 'bold 18px "DejaVu Sans", Arial';
  ctx.fillText(`المبلغ الكلي: ${orderData.totalAmount.toFixed(0)} د.ع`, width - rightMargin, y);
  
  // Convert canvas to PNG buffer for HereLabel app compatibility
  return canvas.toBuffer('image/png');
}

// Bulk thermal image generator for multiple orders
export async function generateBulkHPRTThermalImages(orders: ThermalOrderData[]): Promise<Buffer> {
  if (!orders || orders.length === 0) {
    throw new Error('No orders provided for bulk thermal generation');
  }
  
  // Calculate total height needed for all invoices
  const singleInvoiceHeight = 656; // 108mm at 203 DPI
  const spaceBetweenInvoices = 50; // Space between invoices
  const totalHeight = (singleInvoiceHeight + spaceBetweenInvoices) * orders.length;
  
  // Create large canvas for all invoices
  const width = 864; // 145mm at 203 DPI
  const canvas = createCanvas(width, totalHeight);
  const ctx = canvas.getContext('2d');
  
  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, totalHeight);
  
  // Generate each invoice
  let currentY = 0;
  for (const order of orders) {
    // Generate individual invoice
    const invoiceBuffer = await generateHPRTThermalImage(order);
    
    // Create temporary canvas to load the invoice image
    const tempCanvas = createCanvas(width, singleInvoiceHeight);
    const tempCtx = tempCanvas.getContext('2d');
    
    // Load and draw the invoice image
    const img = new (require('canvas').Image)();
    img.src = invoiceBuffer;
    
    // Draw invoice on main canvas
    ctx.drawImage(img, 0, currentY);
    
    // Move to next position
    currentY += singleInvoiceHeight + spaceBetweenInvoices;
  }
  
  return canvas.toBuffer('image/png');
}