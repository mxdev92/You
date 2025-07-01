import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartItemSchema, insertProductSchema } from "@shared/schema";
import puppeteer from 'puppeteer';

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

  // PDF Generation Route
  app.post("/api/generate-invoice-pdf", async (req, res) => {
    try {
      const { order } = req.body;
      
      if (!order) {
        return res.status(400).json({ message: "Order data is required" });
      }

      const html = `
        <html lang="ar" dir="rtl">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
              
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: 'Cairo', Arial, sans-serif;
                direction: rtl;
                text-align: right;
                background: white;
                color: #333;
                line-height: 1.6;
                padding: 40px;
              }
              
              .invoice-header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
              }
              
              .invoice-title {
                font-size: 28px;
                font-weight: 700;
                color: #333;
                margin-bottom: 10px;
              }
              
              .order-id {
                font-size: 14px;
                color: #666;
                margin-bottom: 10px;
              }
              
              .customer-section {
                margin-bottom: 30px;
              }
              
              .section-title {
                font-size: 18px;
                font-weight: 600;
                color: #333;
                margin-bottom: 15px;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
              }
              
              .customer-info {
                background: #f9f9f9;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
              }
              
              .info-row {
                margin-bottom: 8px;
                font-size: 14px;
              }
              
              .info-label {
                font-weight: 600;
                color: #555;
              }
              
              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                font-size: 12px;
              }
              
              .items-table th,
              .items-table td {
                border: 1px solid #ddd;
                padding: 12px 8px;
                text-align: center;
              }
              
              .items-table th {
                background: #f0f0f0;
                font-weight: 600;
                color: #333;
              }
              
              .items-table tbody tr:nth-child(even) {
                background: #f9f9f9;
              }
              
              .totals-section {
                margin-top: 30px;
                padding: 20px;
                background: #f9f9f9;
                border-radius: 8px;
                border: 1px solid #eee;
              }
              
              .total-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 14px;
              }
              
              .grand-total {
                font-size: 16px;
                font-weight: 700;
                color: #2c5530;
                border-top: 2px solid #333;
                padding-top: 10px;
                margin-top: 10px;
              }
              
              .notes-section {
                margin-top: 20px;
                padding: 15px;
                background: #fff3cd;
                border-radius: 5px;
                border: 1px solid #ffeaa7;
              }
              
              .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #eee;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="invoice-header">
              <div class="invoice-title">فاتورة الطلب</div>
              <div class="order-id">رقم الطلب: ${order.id}</div>
              <div class="order-id">تاريخ الطلب: ${new Date(order.orderDate).toLocaleDateString('ar-EG')}</div>
            </div>

            <div class="customer-section">
              <div class="section-title">معلومات العميل</div>
              <div class="customer-info">
                <div class="info-row">
                  <span class="info-label">الاسم:</span> ${order.customerName}
                </div>
                <div class="info-row">
                  <span class="info-label">الهاتف:</span> ${order.customerPhone}
                </div>
                <div class="info-row">
                  <span class="info-label">العنوان:</span> 
                  ${order.address.governorate} - ${order.address.district} - 
                  ${order.address.neighborhood} - ${order.address.street} - 
                  منزل رقم ${order.address.houseNumber}
                  ${order.address.floorNumber ? ` - الطابق ${order.address.floorNumber}` : ''}
                </div>
                ${order.address.notes ? `
                <div class="info-row">
                  <span class="info-label">ملاحظات العنوان:</span> ${order.address.notes}
                </div>
                ` : ''}
              </div>
            </div>

            <div class="items-section">
              <div class="section-title">قائمة الطلبات</div>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>اسم المنتج</th>
                    <th>السعر للكيلو</th>
                    <th>الكمية</th>
                    <th>السعر الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map((item: any) => {
                    const unit = item.unit === 'kg' ? 'كيلو' : item.unit === 'bunch' ? 'حزمة' : item.unit;
                    const total = (parseFloat(item.price) * item.quantity).toFixed(2);
                    return `
                      <tr>
                        <td>${item.productName}</td>
                        <td>${item.price} د.ع</td>
                        <td>${item.quantity} ${unit}</td>
                        <td>${total} د.ع</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <div class="totals-section">
              <div class="total-row">
                <span>المجموع الفرعي:</span>
                <span>${order.totalAmount.toFixed(2)} د.ع</span>
              </div>
              <div class="total-row">
                <span>رسوم التوصيل:</span>
                <span>5.00 د.ع</span>
              </div>
              <div class="total-row grand-total">
                <span>المجموع الكلي:</span>
                <span>${(order.totalAmount + 5).toFixed(2)} د.ع</span>
              </div>
            </div>

            ${order.notes ? `
            <div class="notes-section">
              <div class="section-title">ملاحظات الطلب</div>
              <p>${order.notes}</p>
            </div>
            ` : ''}

            <div class="footer">
              <p>شكراً لتسوقكم معنا - يلا جيتك</p>
              <p>تم إنشاء هذه الفاتورة بتاريخ ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
          </body>
        </html>
      `;

      // Launch Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Set content and wait for fonts to load
      await page.setContent(html, { 
        waitUntil: ['networkidle0', 'domcontentloaded']
      });
      
      // Generate PDF
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });
      
      await browser.close();

      // Set headers for PDF download
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.customerName}-${order.id}.pdf"`,
        'Content-Length': pdf.length.toString()
      });

      res.send(pdf);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to generate PDF", error: errorMessage });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
