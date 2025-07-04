import { createCanvas, loadImage, registerFont } from 'canvas';
import { promises as fs } from 'fs';
import path from 'path';

// Register fonts for better Arabic support
try {
  // Try to load system fonts for Arabic support
  registerFont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', { family: 'DejaVu Sans' });
} catch (error) {
  console.warn('Could not load DejaVu Sans font, falling back to default');
}

interface OrderItem {
  productName: string;
  unit: string;
  price: string;
  quantity: number;
}

interface OrderData {
  id: number;
  customerName: string;
  customerPhone: string;
  address: any;
  items: any;
  totalAmount: number;
  deliveryTime: string | null;
  notes: string | null;
  orderDate: Date;
}

export async function generateThermalImage(orderData: OrderData): Promise<Buffer> {
  // Parse JSON fields
  const address = typeof orderData.address === 'string' ? JSON.parse(orderData.address) : orderData.address;
  const items = typeof orderData.items === 'string' ? JSON.parse(orderData.items) : orderData.items;
  
  // HPRT N41BT thermal printer specs: 76mm width = 288px at 96 DPI
  const width = 288; // 76mm at 96 DPI
  const height = 600; // Dynamic height, will be adjusted
  
  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  // Set default font and color
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'right'; // RTL for Arabic
  
  let y = 8;
  const margin = 5;
  
  // Customer Info Section (right top corner, no titles)
  ctx.font = '7px "DejaVu Sans", Arial';
  ctx.fillText(`الاسم: ${orderData.customerName}`, width - margin, y);
  y += 8;
  
  ctx.fillText(`رقم الموبايل: ${orderData.customerPhone}`, width - margin, y);
  y += 8;
  
  const addressText = address ? `العنوان: ${address.governorate || ''} - ${address.district || ''} - ${address.landmark || ''}` : 'العنوان: غير محدد';
  ctx.fillText(addressText, width - margin, y);
  y += 12;
  
  // Dual thin tables - each supports 15 items
  if (items && Array.isArray(items)) {
    const itemsPerTable = 15;
    
    // Function to draw a thin table
    const drawThinTable = (tableItems: any[], startY: number) => {
      let currentY = startY;
      
      // Table Header (very thin)
      ctx.font = 'bold 6px "DejaVu Sans", Arial';
      ctx.fillText('المنتج', width - margin, currentY);
      ctx.fillText('السعر', width - 50, currentY);
      ctx.fillText('ك', width - 75, currentY);
      ctx.fillText('المجموع', width - 100, currentY);
      currentY += 8;
      
      // Thin line under header
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(margin, currentY - 1);
      ctx.lineTo(width - margin, currentY - 1);
      ctx.stroke();
      currentY += 1;
      
      // Table Items (ultra thin)
      ctx.font = '5px "DejaVu Sans", Arial';
      tableItems.forEach((item: any) => {
        const itemTotal = parseFloat(item.price) * item.quantity;
        
        // Very short product name (6 characters max)
        const productName = (item.productName || 'منتج').substring(0, 6);
        
        ctx.fillText(productName, width - margin, currentY);
        ctx.fillText((item.price || '0'), width - 50, currentY);
        ctx.fillText((item.quantity?.toString() || '0'), width - 75, currentY);
        ctx.fillText(itemTotal.toFixed(0), width - 100, currentY);
        currentY += 7; // Ultra tight spacing
      });
      
      // Thin line after table
      currentY += 2;
      ctx.beginPath();
      ctx.moveTo(margin, currentY - 1);
      ctx.lineTo(width - margin, currentY - 1);
      ctx.stroke();
      
      return currentY + 3;
    };
    
    // Draw tables
    for (let i = 0; i < items.length; i += itemsPerTable) {
      const tableItems = items.slice(i, i + itemsPerTable);
      y = drawThinTable(tableItems, y);
      
      // Small gap between tables
      if (i + itemsPerTable < items.length) {
        y += 3;
      }
    }
  }

  // RTL Totals section (minimal)
  ctx.font = '6px "DejaVu Sans", Arial';
  
  // Calculate subtotal from items
  const subtotal = items ? items.reduce((sum: number, item: any) => sum + (parseFloat(item.price) * item.quantity), 0) : 0;
  const deliveryFee = 2000; // Standard delivery fee
  
  ctx.fillText(`مجموع الطلبات: ${subtotal.toFixed(0)} د.ع`, width - margin, y);
  y += 8;
  
  ctx.fillText(`اجور التوصيل: ${deliveryFee.toFixed(0)} د.ع`, width - margin, y);
  y += 8;
  
  ctx.font = 'bold 7px "DejaVu Sans", Arial';
  ctx.fillText(`المبلغ الكلي: ${orderData.totalAmount.toFixed(0)} د.ع`, width - margin, y);
  
  // Adjust canvas height to content
  const finalHeight = y + 20;
  const finalCanvas = createCanvas(width, finalHeight);
  const finalCtx = finalCanvas.getContext('2d');
  
  // White background for final canvas
  finalCtx.fillStyle = '#ffffff';
  finalCtx.fillRect(0, 0, width, finalHeight);
  
  // Copy content to final canvas
  finalCtx.drawImage(canvas, 0, 0);
  
  // Return as PNG buffer
  return finalCanvas.toBuffer('image/png');
}

export async function generateThermalImageForMultipleOrders(orders: OrderData[]): Promise<Buffer> {
  const width = 288; // 76mm at 96 DPI
  const estimatedHeightPerOrder = 300;
  const totalHeight = orders.length * estimatedHeightPerOrder + 100;
  
  const canvas = createCanvas(width, totalHeight);
  const ctx = canvas.getContext('2d');
  
  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, totalHeight);
  
  let currentY = 0;
  
  for (let i = 0; i < orders.length; i++) {
    const orderImage = await generateThermalImage(orders[i]);
    const orderCanvas = createCanvas(width, 600);
    const orderCtx = orderCanvas.getContext('2d');
    
    // Load the order image
    const img = await loadImage(orderImage);
    orderCtx.drawImage(img, 0, 0);
    
    // Draw the order image on the main canvas
    ctx.drawImage(orderCanvas, 0, currentY);
    currentY += img.height + 20; // Add spacing between orders
    
    // Add separator line between orders (except for last order)
    if (i < orders.length - 1) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(10, currentY - 10);
      ctx.lineTo(width - 10, currentY - 10);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  
  // Create final canvas with actual used height
  const finalCanvas = createCanvas(width, currentY);
  const finalCtx = finalCanvas.getContext('2d');
  
  // White background
  finalCtx.fillStyle = '#ffffff';
  finalCtx.fillRect(0, 0, width, currentY);
  
  // Copy content
  finalCtx.drawImage(canvas, 0, 0, width, currentY, 0, 0, width, currentY);
  
  return finalCanvas.toBuffer('image/png');
}