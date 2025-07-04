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
  const height = 800; // Dynamic height, will be adjusted
  
  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  // Set default font and color
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'right'; // RTL for Arabic
  
  let y = 15;
  const margin = 8;
  const lineHeight = 12;
  
  // Header - PAKETY (smaller)
  ctx.font = 'bold 14px "DejaVu Sans", Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PAKETY', width / 2, y);
  y += 18;
  
  // Order ID (smaller)
  ctx.font = '9px "DejaVu Sans", Arial';
  ctx.fillText(`Order ID: ${orderData.id}`, width / 2, y);
  y += 15;
  
  // Customer Info Section (compact)
  ctx.font = 'bold 10px "DejaVu Sans", Arial';
  ctx.textAlign = 'right';
  ctx.fillText('معلومات العميل', width - margin, y);
  y += 12;
  
  ctx.font = '8px "DejaVu Sans", Arial';
  ctx.fillText(`الاسم: ${orderData.customerName}`, width - margin, y);
  y += 10;
  
  ctx.fillText(`رقم الموبايل: ${orderData.customerPhone}`, width - margin, y);
  y += 10;
  
  const addressText = address ? `${address.governorate || ''} - ${address.district || ''} - ${address.landmark || ''}` : 'عنوان غير محدد';
  ctx.fillText(`العنوان: ${addressText}`, width - margin, y);
  y += 15;
  
  // Single compact table for all items
  if (items && Array.isArray(items)) {
    // Table Header (very compact)
    ctx.font = 'bold 8px "DejaVu Sans", Arial';
    ctx.fillText('المنتج', width - margin, y);
    ctx.fillText('السعر', width - 60, y);
    ctx.fillText('ك', width - 90, y); // Short for كمية
    ctx.fillText('المجموع', width - 120, y);
    y += 10;
    
    // Draw line under header
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(margin, y - 2);
    ctx.lineTo(width - margin, y - 2);
    ctx.stroke();
    y += 2;
    
    // Table Items (ultra compact)
    ctx.font = '7px "DejaVu Sans", Arial';
    items.forEach((item: any) => {
      const itemTotal = parseFloat(item.price) * item.quantity;
      
      // Very short product name (8 characters max)
      const productName = (item.productName || 'منتج').substring(0, 8);
      
      ctx.fillText(productName, width - margin, y);
      ctx.fillText((item.price || '0'), width - 60, y);
      ctx.fillText((item.quantity?.toString() || '0'), width - 90, y);
      ctx.fillText(itemTotal.toFixed(0), width - 120, y);
      y += 9; // Very tight spacing
    });
    
    // Draw line after table
    y += 3;
    ctx.beginPath();
    ctx.moveTo(margin, y - 2);
    ctx.lineTo(width - margin, y - 2);
    ctx.stroke();
    y += 8;
  }

  // Total Amount (compact)
  ctx.font = 'bold 10px "DejaVu Sans", Arial';
  ctx.fillText(`المبلغ الإجمالي: ${orderData.totalAmount.toFixed(0)} د.ع`, width - margin, y);
  y += 12;
  
  // Delivery Time (compact)
  ctx.font = '8px "DejaVu Sans", Arial';
  if (orderData.deliveryTime) {
    ctx.fillText(`وقت التوصيل: ${orderData.deliveryTime}`, width - margin, y);
    y += 10;
  }
  
  // Notes (compact)
  if (orderData.notes && orderData.notes !== '$') {
    ctx.fillText(`ملاحظات: ${orderData.notes}`, width - margin, y);
    y += 10;
  }
  
  // Date (compact)
  y += 5;
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