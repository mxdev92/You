import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertCartItemSchema, insertProductSchema, insertOrderSchema } from "@shared/schema";
import { chromium } from 'playwright';

export async function registerRoutes(app: Express): Promise<Server> {
  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.patch("/api/categories/:id/select", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.updateCategorySelection(id, true);
      res.json(category);
    } catch (error) {
      res.status(404).json({ message: "Category not found" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId } = req.query;
      let products;
      
      if (categoryId) {
        products = await storage.getProductsByCategory(parseInt(categoryId as string));
      } else {
        products = await storage.getProducts();
      }
      
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body; // Allow partial updates
      const updatedProduct = await storage.updateProduct(id, updateData);
      res.json(updatedProduct);
    } catch (error) {
      res.status(404).json({ message: "Product not found" });
    }
  });

  app.patch("/api/products/:id/display-order", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { displayOrder } = req.body;
      
      if (typeof displayOrder !== 'number') {
        return res.status(400).json({ message: "Invalid display order" });
      }
      
      const updatedProduct = await storage.updateProductDisplayOrder(id, displayOrder);
      res.json(updatedProduct);
    } catch (error) {
      res.status(404).json({ message: "Product not found" });
    }
  });

  // Cart
  app.get("/api/cart", async (req, res) => {
    try {
      const cartItems = await storage.getCartItems();
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const validatedData = insertCartItemSchema.parse(req.body);
      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      res.status(400).json({ message: "Invalid cart item data" });
    }
  });

  app.patch("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;
      
      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      
      const cartItem = await storage.updateCartItemQuantity(id, quantity);
      res.json(cartItem);
    } catch (error) {
      res.status(404).json({ message: "Cart item not found" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeFromCart(id);
      res.status(204).send();
    } catch (error) {
      res.status(404).json({ message: "Cart item not found" });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    try {
      await storage.clearCart();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // PDF Generation with Playwright
  app.post("/api/generate-invoice-pdf", async (req, res) => {
    try {
      const { orderData } = req.body;
      
      if (!orderData) {
        return res.status(400).json({ message: "Order data is required" });
      }

      // Set environment variables for Playwright to use system browser
      process.env.PLAYWRIGHT_BROWSERS_PATH = '/usr';
      process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1';

      // Launch browser with production-safe settings using system Chromium
      const browser = await chromium.launch({
        executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium-browser',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox', 
          '--disable-dev-shm-usage', 
          '--disable-gpu',
          '--disable-web-security',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--headless'
        ]
      });
      const page = await browser.newPage();

      // Create HTML content for the invoice with compact RTL design
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>فاتورة</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Cairo', Arial, sans-serif;
              direction: rtl;
              background: white;
              color: #333;
              line-height: 1.3;
              padding: 15px;
              font-size: 12px;
            }
            
            .company-header {
              text-align: center;
              margin-bottom: 15px;
              border-bottom: 2px solid #10b981;
              padding-bottom: 10px;
            }
            
            .company-name {
              font-size: 28px;
              font-weight: 700;
              color: #10b981;
              margin-bottom: 10px;
            }
            
            .header-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 15px;
            }
            
            .customer-info {
              text-align: right;
              font-size: 11px;
              line-height: 1.4;
            }
            
            .customer-info div {
              margin-bottom: 3px;
            }
            
            .left-section {
              text-align: left;
              direction: ltr;
            }
            
            .qr-placeholder {
              width: 60px;
              height: 60px;
              border: 2px solid #10b981;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              text-align: center;
            }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 10px;
            }
            
            .items-table th {
              background: #10b981;
              color: white;
              padding: 6px 4px;
              font-weight: 600;
              border: 1px solid #059669;
              font-size: 10px;
            }
            
            .items-table td {
              padding: 4px;
              border: 1px solid #e5e7eb;
              vertical-align: middle;
              text-align: center;
              font-size: 9px;
            }
            
            .items-table tr:nth-child(even) {
              background: #f9fafb;
            }
            
            .separator-line {
              width: 100%;
              height: 1px;
              background: #10b981;
              margin: 10px 0;
            }
            
            .totals-section {
              text-align: right;
              direction: rtl;
              font-size: 11px;
              margin-bottom: 10px;
            }
            
            .totals-table {
              margin-right: auto;
              min-width: 200px;
            }
            
            .totals-row {
              display: flex;
              justify-content: space-between;
              padding: 3px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .totals-row .label {
              text-align: right;
            }
            
            .totals-row .amount {
              text-align: left;
            }
            
            .totals-row.final {
              font-size: 13px;
              font-weight: 700;
              color: #10b981;
              border-bottom: 2px solid #10b981;
              margin-top: 5px;
            }
            
            .notes-section {
              margin-top: 10px;
              font-size: 10px;
              border-top: 1px solid #e5e7eb;
              padding-top: 8px;
            }
            
            .footer {
              margin-top: 15px;
              text-align: center;
              font-size: 10px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
              padding-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="company-header">
            <div class="company-name">ORDERY</div>
          </div>
          
          <div class="header-section">
            <div class="customer-info">
              <div><strong>الاسم:</strong> ${orderData.customerName}</div>
              <div><strong>الرقم:</strong> ${orderData.customerPhone}</div>
              <div><strong>العنوان:</strong> ${orderData.address.governorate} ${orderData.address.district}</div>
              <div><strong>التاريخ:</strong> ${new Date(orderData.orderDate).toLocaleDateString('ar-EG')}</div>
            </div>
            
            <div class="left-section">
              <div class="qr-placeholder">
                QR<br/>${orderData.id}
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 45%">اسم المنتج</th>
                <th style="width: 20%">السعر</th>
                <th style="width: 15%">الكمية</th>
                <th style="width: 20%">المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${orderData.items.map((item: any) => {
                const total = (parseFloat(item.price) * item.quantity).toFixed(2);
                const unitText = item.unit === 'kg' ? 'كيلو' : item.unit === 'bunch' ? 'حزمة' : item.unit;
                return `
                  <tr>
                    <td style="text-align: right">${item.productName}</td>
                    <td>${item.price}</td>
                    <td>${item.quantity} ${unitText}</td>
                    <td>${total}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="separator-line"></div>

          <div class="totals-section">
            <div class="totals-table">
              <div class="totals-row">
                <span class="label">المجموع الفرعي:</span>
                <span class="amount">${orderData.totalAmount.toFixed(2)} دينار</span>
              </div>
              <div class="totals-row">
                <span class="label">رسوم التوصيل:</span>
                <span class="amount">5.00 دينار</span>
              </div>
              <div class="totals-row final">
                <span class="label">المجموع الكلي:</span>
                <span class="amount">${(orderData.totalAmount + 5).toFixed(2)} دينار</span>
              </div>
            </div>
          </div>

          ${orderData.notes ? `
            <div class="notes-section">
              <strong>ملاحظات:</strong> ${orderData.notes}
            </div>
          ` : ''}

          <div class="footer">
            <div>شكراً لك على اختيارك Ordery</div>
          </div>
        </body>
        </html>
      `;

      // Set page content and wait for fonts to load
      await page.setContent(htmlContent, { waitUntil: 'networkidle' });
      
      // Wait for fonts to be loaded
      await page.waitForFunction(() => document.fonts.ready);

      // Generate PDF
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true,
        preferCSSPageSize: true
      });

      await browser.close();

      // Set proper headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${orderData.id}.pdf"`);
      res.send(pdf);

    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Generate batch invoices PDF endpoint (multiple orders in one PDF)
  app.post('/api/generate-batch-invoices-pdf', async (req, res) => {
    try {
      const { orderIds } = req.body;
      
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: 'Order IDs array is required' });
      }

      console.log('Generating batch PDF with Playwright server-side rendering...');

      // Fetch all orders
      const allOrders = await storage.getOrders();
      const validOrders = orderIds
        .map((id: number) => allOrders.find(order => order.id === id))
        .filter(order => order !== undefined);

      if (validOrders.length === 0) {
        return res.status(404).json({ error: 'No valid orders found' });
      }

      const browser = await chromium.launch();
      const page = await browser.newPage();

      // Generate combined HTML for all invoices
      let combinedHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Batch Invoices</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Cairo', sans-serif;
              direction: rtl;
              background: white;
              color: #1a1a1a;
              line-height: 1.4;
            }
            
            .invoice {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              padding: 15mm;
              background: white;
              page-break-after: always;
              position: relative;
            }
            
            .invoice:last-child {
              page-break-after: avoid;
            }
            
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 15px;
            }
            
            .company-name {
              font-size: 28px;
              font-weight: 800;
              color: #2563eb;
              margin-bottom: 8px;
              letter-spacing: 1px;
            }
            
            .invoice-title {
              font-size: 20px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 5px;
            }
            
            .order-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              background: #f8fafc;
              padding: 12px 15px;
              border-radius: 8px;
              border-right: 4px solid #2563eb;
            }
            
            .customer-info {
              margin-bottom: 20px;
              background: #fefefe;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            
            .customer-info h3 {
              font-size: 16px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 8px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 5px;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              font-size: 14px;
            }
            
            .info-item {
              display: flex;
              justify-content: space-between;
            }
            
            .label {
              font-weight: 600;
              color: #6b7280;
            }
            
            .value {
              font-weight: 400;
              color: #1f2937;
            }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 13px;
            }
            
            .items-table th {
              background: #2563eb;
              color: white;
              padding: 12px 8px;
              text-align: center;
              font-weight: 600;
              border: 1px solid #1d4ed8;
            }
            
            .items-table td {
              padding: 10px 8px;
              text-align: center;
              border: 1px solid #d1d5db;
              background: #fefefe;
            }
            
            .items-table tr:nth-child(even) td {
              background: #f9fafb;
            }
            
            .total-section {
              margin-top: 20px;
              display: flex;
              justify-content: flex-end;
            }
            
            .total-box {
              background: #1e40af;
              color: white;
              padding: 15px 25px;
              border-radius: 8px;
              min-width: 200px;
              text-align: center;
            }
            
            .total-label {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 5px;
            }
            
            .total-amount {
              font-size: 22px;
              font-weight: 800;
              letter-spacing: 1px;
            }
            
            .footer {
              position: absolute;
              bottom: 15mm;
              left: 15mm;
              right: 15mm;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
              padding-top: 10px;
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
            }
          </style>
        </head>
        <body>
      `;

      // Add each order as a separate page
      validOrders.forEach((order) => {
        const orderDate = new Date(order.orderDate || Date.now()).toLocaleDateString('ar-EG');
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
        const address = typeof order.address === 'string' ? JSON.parse(order.address) : order.address || {};
        
        combinedHtml += `
          <div class="invoice">
            <div class="header">
              <div class="company-name">ORDERY</div>
              <div class="invoice-title">فاتورة مبيعات</div>
            </div>
            
            <div class="order-info">
              <div>
                <span class="label">رقم الطلب:</span>
                <span class="value">#${order.id}</span>
              </div>
              <div>
                <span class="label">التاريخ:</span>
                <span class="value">${orderDate}</span>
              </div>
            </div>
            
            <div class="customer-info">
              <h3>معلومات العميل</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">الاسم:</span>
                  <span class="value">${order.customerName || 'غير محدد'}</span>
                </div>
                <div class="info-item">
                  <span class="label">البريد الإلكتروني:</span>
                  <span class="value">${order.customerEmail || 'غير محدد'}</span>
                </div>
                <div class="info-item">
                  <span class="label">الهاتف:</span>
                  <span class="value">${order.customerPhone || 'غير محدد'}</span>
                </div>
                <div class="info-item">
                  <span class="label">المحافظة:</span>
                  <span class="value">${address.governorate || 'غير محدد'}</span>
                </div>
                <div class="info-item">
                  <span class="label">المدينة:</span>
                  <span class="value">${address.city || 'غير محدد'}</span>
                </div>
                <div class="info-item">
                  <span class="label">العنوان:</span>
                  <span class="value">${address.street || 'غير محدد'}</span>
                </div>
              </div>
            </div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>الكمية</th>
                  <th>السعر</th>
                  <th>المجموع</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item: any) => `
                  <tr>
                    <td>${item.name || 'منتج غير محدد'}</td>
                    <td>${item.quantity || 1}</td>
                    <td>${Number(item.price || 0).toLocaleString('ar-EG')} د.ع</td>
                    <td>${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString('ar-EG')} د.ع</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total-section">
              <div class="total-box">
                <div class="total-label">المجموع الكلي</div>
                <div class="total-amount">${Number(order.totalAmount || 0).toLocaleString('ar-EG')} د.ع</div>
              </div>
            </div>
            
            <div class="footer">
              <div>شكراً لتسوقكم معنا | ORDERY - يلا جيتك</div>
            </div>
          </div>
        `;
      });

      combinedHtml += `
        </body>
        </html>
      `;

      await page.setContent(combinedHtml, { waitUntil: 'networkidle' });
      
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

      await browser.close();

      console.log('Professional Arabic RTL batch PDF with selectable text generated successfully');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="batch-invoices-${Date.now()}.pdf"`);
      res.send(pdf);

    } catch (error) {
      console.error('Error generating batch PDF:', error);
      res.status(500).json({ error: 'Failed to generate batch PDF' });
    }
  });

  // Orders API
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedOrder = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedOrder);
      
      // Broadcast new order to connected store clients for real-time printing
      if ((global as any).broadcastToStoreClients) {
        (global as any).broadcastToStoreClients({
          type: 'NEW_ORDER',
          order: {
            id: order.id,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
            items: JSON.parse(order.items as string),
            totalAmount: order.totalAmount,
            orderDate: order.orderDate,
            status: order.status,
            shippingAddress: order.address ? JSON.parse(order.address as string) : null,
            formattedDate: new Date(order.orderDate).toLocaleString('ar-IQ'),
            formattedTotal: order.totalAmount.toLocaleString() + ' د.ع'
          },
          timestamp: new Date().toISOString(),
          printReady: true
        });
      }
      
      res.status(201).json(order);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const order = await storage.updateOrderStatus(id, status);
      res.json(order);
    } catch (error) {
      res.status(404).json({ message: "Order not found" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteOrder(id);
      res.status(204).send();
    } catch (error) {
      res.status(404).json({ message: "Order not found" });
    }
  });

  // Store API - Latest Orders for Expo React Native App
  app.get("/api/store/orders/latest", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const orders = await storage.getOrders();
      
      // Sort by order date descending and limit results
      const latestOrders = orders
        .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
        .slice(0, limit)
        .map(order => {
          // Safely parse items
          let items;
          try {
            items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
          } catch (e) {
            items = [];
          }

          // Safely parse address
          let shippingAddress = null;
          if (order.address) {
            try {
              shippingAddress = typeof order.address === 'string' ? JSON.parse(order.address) : order.address;
            } catch (e) {
              shippingAddress = null;
            }
          }

          return {
            id: order.id,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
            items: items,
            totalAmount: order.totalAmount,
            orderDate: order.orderDate,
            status: order.status,
            shippingAddress: shippingAddress,
            deliveryTime: order.deliveryTime,
            notes: order.notes,
            formattedDate: new Date(order.orderDate).toLocaleString('ar-IQ'),
            formattedTotal: order.totalAmount.toLocaleString() + ' د.ع',
            itemsCount: items.length,
            estimatedPreparationTime: Math.max(items.length * 5, 15) // 5 mins per item, min 15 mins
          };
        });
      
      res.json({
        success: true,
        data: latestOrders,
        count: latestOrders.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching latest orders:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch latest orders",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Store API - Order Details for Printing
  app.get("/api/store/orders/:id/print", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const orders = await storage.getOrders();
      const order = orders.find(o => o.id === id);
      
      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: "Order not found" 
        });
      }

      // Format order for printing
      const printData = {
        id: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        items: JSON.parse(order.items as string),
        totalAmount: order.totalAmount,
        orderDate: order.orderDate,
        status: order.status,
        shippingAddress: order.address ? JSON.parse(order.address as string) : null,
        formattedDate: new Date(order.orderDate).toLocaleString('ar-IQ'),
        formattedTotal: order.totalAmount.toLocaleString() + ' د.ع'
      };

      res.json({
        success: true,
        data: printData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching order for printing:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch order details",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Store API - Update Order Status (for store workflow)
  app.patch("/api/store/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, storeNotes } = req.body;
      
      // Valid store statuses
      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid status",
          validStatuses 
        });
      }

      const order = await storage.updateOrderStatus(id, status);
      
      // Broadcast status update to connected WebSocket clients
      broadcastToClients({
        type: 'ORDER_STATUS_UPDATE',
        orderId: id,
        status: status,
        storeNotes: storeNotes || null,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        data: order,
        message: `Order status updated to ${status}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to update order status",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Store API - Today's Orders Summary
  app.get("/api/store/orders/today", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.orderDate);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });

      const summary = {
        totalOrders: todayOrders.length,
        totalRevenue: todayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        ordersByStatus: {
          pending: todayOrders.filter(o => o.status === 'pending').length,
          confirmed: todayOrders.filter(o => o.status === 'confirmed').length,
          preparing: todayOrders.filter(o => o.status === 'preparing').length,
          ready: todayOrders.filter(o => o.status === 'ready').length,
          'out-for-delivery': todayOrders.filter(o => o.status === 'out-for-delivery').length,
          delivered: todayOrders.filter(o => o.status === 'delivered').length,
          cancelled: todayOrders.filter(o => o.status === 'cancelled').length
        },
        averageOrderValue: todayOrders.length > 0 ? todayOrders.reduce((sum, order) => sum + order.totalAmount, 0) / todayOrders.length : 0
      };

      // Format orders with parsed address data
      const formattedOrders = todayOrders
        .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
        .map(order => {
          // Safely parse items
          let items;
          try {
            items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
          } catch (e) {
            items = [];
          }

          // Safely parse address
          let shippingAddress = null;
          if (order.address) {
            try {
              shippingAddress = typeof order.address === 'string' ? JSON.parse(order.address) : order.address;
            } catch (e) {
              shippingAddress = null;
            }
          }

          return {
            id: order.id,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
            items: items,
            totalAmount: order.totalAmount,
            orderDate: order.orderDate,
            status: order.status,
            shippingAddress: shippingAddress,
            deliveryTime: order.deliveryTime,
            notes: order.notes,
            formattedDate: new Date(order.orderDate).toLocaleString('ar-IQ'),
            formattedTotal: order.totalAmount.toLocaleString() + ' د.ع',
            itemsCount: items.length,
            estimatedPreparationTime: Math.max(items.length * 5, 15)
          };
        });

      res.json({
        success: true,
        data: summary,
        orders: formattedOrders,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching today orders:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch today's orders",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Store API - Orders by Status
  app.get("/api/store/orders/status/:status", async (req, res) => {
    try {
      const { status } = req.params;
      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid status",
          validStatuses 
        });
      }

      const orders = await storage.getOrders();
      const filteredOrders = orders
        .filter(order => order.status === status)
        .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
        .map(order => {
          // Safely parse items
          let items;
          try {
            items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
          } catch (e) {
            items = [];
          }

          // Safely parse address
          let shippingAddress = null;
          if (order.address) {
            try {
              shippingAddress = typeof order.address === 'string' ? JSON.parse(order.address) : order.address;
            } catch (e) {
              shippingAddress = null;
            }
          }

          return {
            id: order.id,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
            items: items,
            totalAmount: order.totalAmount,
            orderDate: order.orderDate,
            status: order.status,
            shippingAddress: shippingAddress,
            deliveryTime: order.deliveryTime,
            notes: order.notes,
            formattedDate: new Date(order.orderDate).toLocaleString('ar-IQ'),
            formattedTotal: order.totalAmount.toLocaleString() + ' د.ع',
            itemsCount: items.length,
            estimatedPreparationTime: Math.max(items.length * 5, 15)
          };
        });

      res.json({
        success: true,
        data: filteredOrders,
        count: filteredOrders.length,
        status: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch orders by status",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Store API - Order Details with Full Information
  app.get("/api/store/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const orders = await storage.getOrders();
      const order = orders.find(o => o.id === id);
      
      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: "Order not found" 
        });
      }

      const detailedOrder = {
        id: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        items: JSON.parse(order.items as string),
        totalAmount: order.totalAmount,
        orderDate: order.orderDate,
        status: order.status,
        shippingAddress: order.address ? JSON.parse(order.address as string) : null,
        deliveryTime: order.deliveryTime,
        notes: order.notes,
        formattedDate: new Date(order.orderDate).toLocaleString('ar-IQ'),
        formattedTotal: order.totalAmount.toLocaleString() + ' د.ع',
        itemsCount: JSON.parse(order.items as string).length,
        estimatedPreparationTime: Math.max(JSON.parse(order.items as string).length * 5, 15) // 5 mins per item, min 15 mins
      };

      res.json({
        success: true,
        data: detailedOrder,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching order details:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch order details",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Store API - Mark Order as Printed
  app.patch("/api/store/orders/:id/printed", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { printerName, printedAt } = req.body;
      
      // For now, we'll just log this and broadcast the event
      // In a real implementation, you might want to store print history
      console.log(`Order ${id} printed on ${printerName} at ${printedAt}`);
      
      // Broadcast print confirmation to connected clients
      if ((global as any).broadcastToStoreClients) {
        (global as any).broadcastToStoreClients({
          type: 'ORDER_PRINTED',
          orderId: id,
          printerName: printerName || 'Unknown Printer',
          printedAt: printedAt || new Date().toISOString(),
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: "Order marked as printed",
        orderId: id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking order as printed:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to mark order as printed",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Store API - Bulk Status Update
  app.patch("/api/store/orders/bulk/status", async (req, res) => {
    try {
      const { orderIds, status, notes } = req.body;
      
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "orderIds must be a non-empty array" 
        });
      }

      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid status",
          validStatuses 
        });
      }

      const updatedOrders = [];
      const errors = [];

      for (const orderId of orderIds) {
        try {
          const order = await storage.updateOrderStatus(parseInt(orderId), status);
          updatedOrders.push(order);
        } catch (error) {
          errors.push({ orderId, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      // Broadcast bulk update to connected clients
      if ((global as any).broadcastToStoreClients) {
        (global as any).broadcastToStoreClients({
          type: 'BULK_STATUS_UPDATE',
          orderIds: orderIds,
          status: status,
          notes: notes || null,
          successCount: updatedOrders.length,
          errorCount: errors.length,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: `Bulk update completed`,
        updatedOrders: updatedOrders.length,
        errors: errors,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in bulk status update:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to perform bulk status update",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Store API - Statistics Dashboard
  app.get("/api/store/stats", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const now = new Date();
      
      // Today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.orderDate);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });

      // This week's stats
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekOrders = orders.filter(order => new Date(order.orderDate) >= weekStart);

      // This month's stats
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthOrders = orders.filter(order => new Date(order.orderDate) >= monthStart);

      const stats = {
        today: {
          orders: todayOrders.length,
          revenue: todayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
          averageOrderValue: todayOrders.length > 0 ? todayOrders.reduce((sum, order) => sum + order.totalAmount, 0) / todayOrders.length : 0
        },
        week: {
          orders: weekOrders.length,
          revenue: weekOrders.reduce((sum, order) => sum + order.totalAmount, 0),
          averageOrderValue: weekOrders.length > 0 ? weekOrders.reduce((sum, order) => sum + order.totalAmount, 0) / weekOrders.length : 0
        },
        month: {
          orders: monthOrders.length,
          revenue: monthOrders.reduce((sum, order) => sum + order.totalAmount, 0),
          averageOrderValue: monthOrders.length > 0 ? monthOrders.reduce((sum, order) => sum + order.totalAmount, 0) / monthOrders.length : 0
        },
        total: {
          orders: orders.length,
          revenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
          averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0
        },
        statusBreakdown: {
          pending: orders.filter(o => o.status === 'pending').length,
          confirmed: orders.filter(o => o.status === 'confirmed').length,
          preparing: orders.filter(o => o.status === 'preparing').length,
          ready: orders.filter(o => o.status === 'ready').length,
          'out-for-delivery': orders.filter(o => o.status === 'out-for-delivery').length,
          delivered: orders.filter(o => o.status === 'delivered').length,
          cancelled: orders.filter(o => o.status === 'cancelled').length
        }
      };

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching store stats:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch store statistics",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Store API - Health Check
  app.get("/api/store/health", (req, res) => {
    res.json({
      success: true,
      message: "Store API is running",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      endpoints: {
        latestOrders: "GET /api/store/orders/latest",
        todayOrders: "GET /api/store/orders/today",
        ordersByStatus: "GET /api/store/orders/status/:status",
        orderDetails: "GET /api/store/orders/:id",
        orderPrint: "GET /api/store/orders/:id/print",
        updateStatus: "PATCH /api/store/orders/:id/status",
        markPrinted: "PATCH /api/store/orders/:id/printed",
        bulkStatusUpdate: "PATCH /api/store/orders/bulk/status",
        statistics: "GET /api/store/stats",
        websocket: "WS /ws"
      },
      features: [
        "Real-time order notifications",
        "Printer integration support",
        "Order status management",
        "Sales statistics",
        "Bulk operations",
        "Today's orders summary"
      ]
    });
  });

  const httpServer = createServer(app);
  
  // WebSocket Server for Real-time Updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const connectedClients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    console.log('Store app connected to WebSocket');
    connectedClients.add(ws);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'CONNECTED',
      message: 'Connected to store WebSocket',
      timestamp: new Date().toISOString()
    }));

    ws.on('close', () => {
      console.log('Store app disconnected from WebSocket');
      connectedClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      connectedClients.delete(ws);
    });
  });

  // Function to broadcast messages to all connected clients
  function broadcastToClients(message: any) {
    const messageStr = JSON.stringify(message);
    connectedClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  // Make broadcast function available globally for order notifications
  (global as any).broadcastToStoreClients = broadcastToClients;

  return httpServer;
}
