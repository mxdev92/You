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
  
  let y = 20;
  const margin = 10;
  const lineHeight = 18;
  
  // Header - PAKETY
  ctx.font = 'bold 20px "DejaVu Sans", Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PAKETY', width / 2, y);
  y += 30;
  
  // Order ID
  ctx.font = '12px "DejaVu Sans", Arial';
  ctx.fillText(`Order ID: ${orderData.id}`, width / 2, y);
  y += 25;
  
  // Customer Info Section
  ctx.font = 'bold 14px "DejaVu Sans", Arial';
  ctx.textAlign = 'right';
  ctx.fillText('معلومات العميل', width - margin, y);
  y += 20;
  
  ctx.font = '12px "DejaVu Sans", Arial';
  ctx.fillText(`الاسم: ${orderData.customerName}`, width - margin, y);
  y += lineHeight;
  
  ctx.fillText(`رقم الموبايل: ${orderData.customerPhone}`, width - margin, y);
  y += lineHeight;
  
  const addressText = address ? `${address.governorate || ''} - ${address.district || ''} - ${address.landmark || ''}` : 'عنوان غير محدد';
  ctx.fillText(`العنوان: ${addressText}`, width - margin, y);
  y += 25;
  
  // Function to draw a table
  const drawTable = (tableItems: any[], startY: number) => {
    let currentY = startY;
    
    // Table Header
    ctx.font = 'bold 10px "DejaVu Sans", Arial';
    ctx.fillText('المنتج', width - margin, currentY);
    ctx.fillText('السعر', width - 70, currentY);
    ctx.fillText('الكمية', width - 110, currentY);
    ctx.fillText('الإجمالي', width - 150, currentY);
    currentY += 15;
    
    // Draw line under header
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(margin, currentY - 3);
    ctx.lineTo(width - margin, currentY - 3);
    ctx.stroke();
    
    // Table Items
    ctx.font = '9px "DejaVu Sans", Arial';
    tableItems.forEach((item: any) => {
      const itemTotal = parseFloat(item.price) * item.quantity;
      
      // Truncate product name if too long
      const productName = (item.productName || 'منتج غير محدد').substring(0, 12);
      
      ctx.fillText(productName, width - margin, currentY);
      ctx.fillText(item.price || '0', width - 70, currentY);
      ctx.fillText(item.quantity?.toString() || '0', width - 110, currentY);
      ctx.fillText(itemTotal.toFixed(0), width - 150, currentY);
      currentY += 12;
    });
    
    // Draw line after table
    ctx.beginPath();
    ctx.moveTo(margin, currentY);
    ctx.lineTo(width - margin, currentY);
    ctx.stroke();
    
    return currentY + 10;
  };

  // Split items into tables of 15 each
  if (items && Array.isArray(items)) {
    const itemsPerTable = 15;
    let currentY = y;
    
    for (let i = 0; i < items.length; i += itemsPerTable) {
      const tableItems = items.slice(i, i + itemsPerTable);
      
      // Add table title if multiple tables
      if (items.length > itemsPerTable) {
        ctx.font = 'bold 11px "DejaVu Sans", Arial';
        const tableNumber = Math.floor(i / itemsPerTable) + 1;
        ctx.fillText(`جدول ${tableNumber}`, width - margin, currentY);
        currentY += 15;
      }
      
      currentY = drawTable(tableItems, currentY);
      
      // Add spacing between tables
      if (i + itemsPerTable < items.length) {
        currentY += 5;
      }
    }
    
    y = currentY;
  }

  
  // Total Amount
  ctx.font = 'bold 14px "DejaVu Sans", Arial';
  ctx.fillText(`المبلغ الإجمالي: ${orderData.totalAmount.toFixed(0)} د.ع`, width - margin, y);
  y += 25;
  
  // Delivery Time
  ctx.font = '12px "DejaVu Sans", Arial';
  if (orderData.deliveryTime) {
    ctx.fillText(`وقت التوصيل: ${orderData.deliveryTime}`, width - margin, y);
    y += lineHeight;
  }
  
  // Notes
  if (orderData.notes && orderData.notes !== '$') {
    ctx.fillText(`ملاحظات: ${orderData.notes}`, width - margin, y);
    y += lineHeight;
  }
  
  // Date
  y += 10;
  const orderDate = new Date(orderData.orderDate).toLocaleDateString('ar-EG');
  ctx.fillText(`التاريخ: ${orderDate}`, width - margin, y);
  
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