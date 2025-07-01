import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartItemSchema, insertProductSchema } from "@shared/schema";
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

      // Launch browser with system Chromium
      const browser = await chromium.launch({
        executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();

      // Create HTML content for the invoice with RTL support
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
              text-align: right;
              background: white;
              color: #333;
              line-height: 1.6;
              padding: 40px;
            }
            
            .invoice-header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #10b981;
              padding-bottom: 20px;
            }
            
            .company-name {
              font-size: 32px;
              font-weight: 700;
              color: #10b981;
              margin-bottom: 10px;
            }
            
            .invoice-title {
              font-size: 24px;
              font-weight: 600;
              color: #333;
              margin-bottom: 10px;
            }
            
            .order-info {
              font-size: 14px;
              color: #666;
            }
            
            .customer-section {
              margin-bottom: 30px;
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
            }
            
            .section-title {
              font-size: 18px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 15px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 5px;
            }
            
            .customer-details {
              display: grid;
              gap: 8px;
            }
            
            .detail-item {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
            }
            
            .detail-label {
              font-weight: 600;
              color: #4b5563;
              min-width: 100px;
            }
            
            .detail-value {
              color: #111827;
            }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              background: white;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .items-table th {
              background: #10b981;
              color: white;
              padding: 15px 10px;
              font-weight: 600;
              border: 1px solid #059669;
            }
            
            .items-table td {
              padding: 12px 10px;
              border: 1px solid #e5e7eb;
              vertical-align: middle;
            }
            
            .items-table tr:nth-child(even) {
              background: #f9fafb;
            }
            
            .items-table tr:hover {
              background: #f3f4f6;
            }
            
            .totals-section {
              margin-top: 30px;
              text-align: left;
              direction: ltr;
            }
            
            .totals-table {
              margin-left: auto;
              min-width: 300px;
            }
            
            .totals-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .totals-row.final {
              font-size: 18px;
              font-weight: 700;
              color: #10b981;
              border-bottom: 3px solid #10b981;
              margin-top: 10px;
            }
            
            .footer {
              margin-top: 40px;
              text-align: center;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              color: #6b7280;
            }
            
            .footer-message {
              font-size: 16px;
              margin-bottom: 10px;
            }
            
            .company-footer {
              font-weight: 600;
              color: #10b981;
            }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <div class="company-name">يلا جيتك</div>
            <div class="invoice-title">فاتورة</div>
            <div class="order-info">
              رقم الطلب: ${orderData.id} | التاريخ: ${new Date(orderData.orderDate).toLocaleDateString('ar-EG')}
            </div>
          </div>

          <div class="customer-section">
            <div class="section-title">معلومات العميل</div>
            <div class="customer-details">
              <div class="detail-item">
                <span class="detail-label">الاسم:</span>
                <span class="detail-value">${orderData.customerName}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">الهاتف:</span>
                <span class="detail-value">${orderData.customerPhone}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">العنوان:</span>
                <span class="detail-value">${orderData.address.governorate}، ${orderData.address.district}، ${orderData.address.neighborhood}، ${orderData.address.street}، منزل رقم ${orderData.address.houseNumber}</span>
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>اسم المنتج</th>
                <th>السعر للوحدة</th>
                <th>الكمية</th>
                <th>المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${orderData.items.map((item: any) => {
                const total = (parseFloat(item.price) * item.quantity).toFixed(2);
                const unitText = item.unit === 'kg' ? 'كيلو' : item.unit === 'bunch' ? 'حزمة' : item.unit;
                return `
                  <tr>
                    <td>${item.productName}</td>
                    <td>${item.price} دينار</td>
                    <td>${item.quantity} ${unitText}</td>
                    <td>${total} دينار</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="totals-section">
            <div class="totals-table">
              <div class="totals-row">
                <span>المجموع الفرعي:</span>
                <span>${orderData.totalAmount.toFixed(2)} دينار</span>
              </div>
              <div class="totals-row">
                <span>رسوم التوصيل:</span>
                <span>5.00 دينار</span>
              </div>
              <div class="totals-row final">
                <span>المجموع الكلي:</span>
                <span>${(orderData.totalAmount + 5).toFixed(2)} دينار</span>
              </div>
            </div>
          </div>

          ${orderData.notes ? `
            <div class="customer-section">
              <div class="section-title">ملاحظات</div>
              <div style="padding: 10px 0;">${orderData.notes}</div>
            </div>
          ` : ''}

          <div class="footer">
            <div class="footer-message">شكراً لك على اختيارك يلا جيتك</div>
            <div class="company-footer">Yalla Jeetek</div>
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

  const httpServer = createServer(app);
  return httpServer;
}
