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
            
            .header-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 15px;
              border-bottom: 2px solid #10b981;
              padding-bottom: 10px;
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
            
            .company-name {
              font-size: 24px;
              font-weight: 700;
              color: #10b981;
              margin-bottom: 5px;
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
              margin-top: 5px;
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
              text-align: left;
              direction: ltr;
              font-size: 11px;
              margin-bottom: 10px;
            }
            
            .totals-table {
              margin-left: auto;
              min-width: 200px;
            }
            
            .totals-row {
              display: flex;
              justify-content: space-between;
              padding: 3px 0;
              border-bottom: 1px solid #e5e7eb;
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
          <div class="header-section">
            <div class="customer-info">
              <div><strong>الاسم:</strong> ${orderData.customerName}</div>
              <div><strong>الرقم:</strong> ${orderData.customerPhone}</div>
              <div><strong>العنوان:</strong> ${orderData.address.governorate} ${orderData.address.district}</div>
              <div><strong>التاريخ:</strong> ${new Date(orderData.orderDate).toLocaleDateString('ar-EG')}</div>
            </div>
            
            <div class="left-section">
              <div class="company-name">ORDERY</div>
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

  const httpServer = createServer(app);
  return httpServer;
}
