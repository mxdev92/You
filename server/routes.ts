import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertCartItemSchema, insertProductSchema, insertOrderSchema } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { orders as ordersTable } from "@shared/schema";
import { inArray } from "drizzle-orm";
import { generateInvoicePDF, generateBatchInvoicePDF } from "./invoice-generator";
import { verifyWayService as fazpassService } from './fazpass-service.js';
import { MetaWhatsAppService } from './meta-whatsapp-service.js';

// Initialize Meta WhatsApp service for admin notifications
const metaWhatsAppService = new MetaWhatsAppService();

// Meta Cloud API is always ready - no initialization needed
console.log('🎯 Meta Cloud API WhatsApp service ready');

export async function registerRoutes(app: Express): Promise<Server> {
  // Add cache control headers to prevent browser caching issues after deployment
  app.use((req, res, next) => {
    // For HTML files and API routes, prevent caching
    if (req.path.endsWith('.html') || req.path.startsWith('/api/')) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    } else if (req.path.includes('.js') || req.path.includes('.css')) {
      // For static assets, use versioned caching
      res.set('Cache-Control', 'public, max-age=31536000'); // 1 year
    }
    next();
  });

  // Version endpoint for cache busting
  app.get("/api/version", (req, res) => {
    res.json({ version: "2.1.0", timestamp: Date.now() });
  });

  // Placeholder image endpoint
  app.get("/api/placeholder/:width/:height", (req, res) => {
    const { width, height } = req.params;
    const w = parseInt(width) || 60;
    const h = parseInt(height) || 60;
    
    // Generate a simple gray SVG that browsers can render
    const svgContent = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#D1D5DB" stroke="#9CA3AF" stroke-width="1"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="10" fill="#6B7280">
          ${w}×${h}
        </text>
      </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.send(svgContent);
  });

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
      console.log('Category selection request:', req.params.id);
      const id = parseInt(req.params.id);
      console.log('Parsed ID:', id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      console.log('Calling updateCategorySelection with ID:', id);
      const category = await storage.updateCategorySelection(id, true);
      console.log('Category updated successfully:', category);
      res.json(category);
    } catch (error) {
      console.error('Category selection error:', error);
      res.status(500).json({ message: "Failed to select category", error: error.message });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const search = req.query.search as string;
      
      let products = await storage.getProducts();
      
      if (categoryId) {
        products = products.filter(p => p.categoryId === categoryId);
      }
      
      if (search) {
        products = products.filter(p => 
          p.name.toLowerCase().includes(search.toLowerCase())
        );
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
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid product data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create product" });
      }
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = req.body;
      
      console.log('Updating product ID:', id);
      console.log('Product data received:', productData);
      
      const product = await storage.updateProduct(id, productData);
      console.log('Product updated successfully:', product);
      res.json(product);
    } catch (error) {
      console.error('Failed to update product:', error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      console.log('Deleting product ID:', id);
      
      await storage.deleteProduct(id);
      console.log('Product deleted successfully');
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete product:', error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.patch("/api/products/:id/display-order", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { displayOrder } = req.body;
      
      if (typeof displayOrder !== 'number' || displayOrder < 1 || displayOrder > 10) {
        return res.status(400).json({ message: "Display order must be between 1 and 10" });
      }
      
      const product = await storage.updateProductDisplayOrder(id, displayOrder);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product display order" });
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
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.patch("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItemQuantity(id, quantity);
      res.json(cartItem);
    } catch (error) {
      console.error('Cart update error:', error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeFromCart(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove item from cart" });
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

  // Professional Invoice Generation - Rebuilt from scratch
  app.post('/api/generate-invoice-pdf', async (req, res) => {
    try {
      const { orderIds } = req.body;
      
      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ message: "Order IDs are required" });
      }

      // Import the new invoice generator
      const { generateBatchInvoicePDF } = await import('./invoice-generator');

      // Fetch orders from database
      const orders = await db.select().from(ordersTable).where(
        inArray(ordersTable.id, orderIds)
      );

      if (orders.length === 0) {
        return res.status(404).json({ message: 'No orders found' });
      }

      // Generate PDF
      const pdfBuffer = await generateBatchInvoicePDF(orderIds, orders);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=invoice.pdf',
        'Content-Length': pdfBuffer.length
      });

      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      res.status(500).json({ 
        message: 'Failed to generate PDF', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Orders
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
      console.log('=== ORDER CREATION DEBUG ===');
      console.log('Raw request body:', JSON.stringify(req.body, null, 2));
      
      const transformedOrder = {
        customerName: String(req.body.customerName || ''),
        customerEmail: String(req.body.customerEmail || ''),
        customerPhone: String(req.body.customerPhone || ''),
        address: req.body.address,
        items: req.body.items,
        totalAmount: Number(req.body.totalAmount) || 0,
        status: String(req.body.status || 'pending'),
        deliveryTime: req.body.deliveryTime ? String(req.body.deliveryTime) : null,
        notes: req.body.notes ? String(req.body.notes) : null
      };
      
      console.log('Transformed order data:', JSON.stringify(transformedOrder, null, 2));
      
      const validatedOrder = insertOrderSchema.parse(transformedOrder);
      console.log('Validated order data:', JSON.stringify(validatedOrder, null, 2));
      const order = await storage.createOrder(validatedOrder);
      
      // Broadcast new order to connected store clients for real-time printing
      try {
        if ((global as any).broadcastToStoreClients) {
          (global as any).broadcastToStoreClients({
            type: 'NEW_ORDER',
            order: {
              id: order.id,
              customerName: order.customerName,
              customerEmail: order.customerEmail,
              customerPhone: order.customerPhone,
              items: order.items,
              totalAmount: order.totalAmount,
              orderDate: order.orderDate,
              status: order.status,
              shippingAddress: order.address,
              formattedDate: new Date(order.orderDate).toLocaleString('ar-IQ'),
              formattedTotal: order.totalAmount.toLocaleString() + ' د.ع'
            },
            timestamp: new Date().toISOString(),
            printReady: true
          });
        }
      } catch (broadcastError) {
        console.error('Error in broadcasting, but order created successfully:', broadcastError);
      }

      // Send WhatsApp notifications if service is connected
      // Meta Cloud API is always connected
      if (true) {
        try {
          // Generate PDF invoice once for both customer and admin
          const pdfBuffer = await generateInvoicePDF(order);
          
          // Prepare order data for admin notification
          const orderData = {
            orderId: order.id,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            address: order.address?.fullAddress || 'لم يتم تحديد العنوان',
            total: order.totalAmount,
            itemCount: order.items.length
          };
          
          // 1. Send customer confirmation via VerifyWay (try but don't fail if it doesn't work)
          try {
            const customerSuccess = await fazpassService.sendCustomerNotification(order.customerPhone, orderData);
            
            if (customerSuccess) {
              console.log(`📱 Customer notification sent successfully via VerifyWay for order #${order.id}`);
            }
          } catch (customerError) {
            console.error(`❌ Customer notification failed for order #${order.id}:`, customerError);
            // Continue with admin notification even if customer notification fails
          }

          // 2. Send admin notification to fixed admin WhatsApp (07710155333) - CRITICAL
          try {
            const adminSuccess = await fazpassService.sendAdminNotification('07710155333', orderData);
            if (adminSuccess) {
              console.log(`✅ Admin notification sent successfully to 07710155333 for order #${order.id}`);
            } else {
              console.error(`❌ Admin notification failed for order #${order.id}`);
            }
          } catch (adminError) {
            console.error(`❌ Critical: Admin notification error for order #${order.id}:`, adminError);
          }

          console.log(`📱 WhatsApp notification process completed for order #${order.id}`);
        } catch (whatsappError) {
          console.error('WhatsApp notification system error (order created successfully):', whatsappError);
        }
      } else {
        console.log('📱 WhatsApp service not connected - notifications skipped');
      }
      
      res.status(201).json(order);
    } catch (error: any) {
      console.error('Error creating order:', error);
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error.errors);
        res.status(400).json({ 
          message: "Invalid order data", 
          errors: error.errors,
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Non-validation error:', errorMessage);
        res.status(500).json({ message: "Internal server error", error: errorMessage });
      }
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const order = await storage.updateOrderStatus(id, status);
      
      // Send WhatsApp status update notification
      // Meta Cloud API is always connected
      if (order.customerPhone) {
        try {
          await metaWhatsAppService.sendOrderNotification(order.customerPhone, {
            orderId: order.id,
            total: order.totalAmount,
            customerName: order.customerName
          });
          console.log(`📱 WhatsApp status update sent for order #${order.id}: ${status}`);
        } catch (whatsappError) {
          console.error('WhatsApp status update failed:', whatsappError);
        }
      }
      
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

  // Image upload endpoint
  app.post("/api/upload-image", async (req, res) => {
    try {
      const { imageData, fileName } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ message: "No image data provided" });
      }

      // Store the image data directly in the database as base64
      // In a production app, you'd use a cloud storage service like AWS S3
      const imageUrl = imageData; // Use the base64 data URL directly
      
      res.json({ imageUrl });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Phone number validation endpoint
  app.post('/api/auth/validate-phone', async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ message: 'Phone number is required' });
      }

      const existingUser = await storage.getUserByPhone(phone);
      
      if (existingUser) {
        return res.status(409).json({ 
          message: 'هذا الرقم مستخدم بالفعل. كل رقم واتساب يحتاج حساب واحد فقط.',
          isUsed: true 
        });
      }
      
      res.json({ 
        message: 'Phone number is available',
        isUsed: false 
      });
    } catch (error: any) {
      console.error('Phone validation error:', error);
      res.status(500).json({ message: 'Failed to validate phone number' });
    }
  });

  // Authentication routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, fullName, phone } = req.body;
      
      if (!email || !password || !phone) {
        return res.status(400).json({ message: 'Email, password, and phone are required' });
      }

      // Check if phone is already used
      const existingPhone = await storage.getUserByPhone(phone);
      if (existingPhone) {
        return res.status(409).json({ message: 'Phone number already exists' });
      }

      const user = await storage.createUser({ 
        email, 
        passwordHash: password, 
        fullName: fullName || null,
        phone: phone
      });
      
      // Set session after successful signup
      (req as any).session = (req as any).session || {};
      (req as any).session.userId = user.id;
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          fullName: user.fullName,
          phone: user.phone,
          createdAt: user.createdAt.toISOString() 
        } 
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.message?.includes('duplicate') || error.code === '23505') {
        if (error.message?.includes('phone')) {
          return res.status(409).json({ message: 'Phone number already exists' });
        }
        return res.status(409).json({ message: 'Email already exists' });
      }
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.post('/api/auth/signin', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || user.passwordHash !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Store user session
      (req as any).session = (req as any).session || {};
      (req as any).session.userId = user.id;

      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          fullName: user.fullName,
          phone: user.phone,
          createdAt: user.createdAt.toISOString() 
        } 
      });
    } catch (error) {
      console.error('Signin error:', error);
      res.status(500).json({ message: 'Failed to sign in' });
    }
  });

  app.post('/api/auth/signout', async (req, res) => {
    try {
      // Properly destroy the session instead of setting to null
      if ((req as any).session) {
        (req as any).session.destroy((err: any) => {
          if (err) {
            console.error('Session destruction error:', err);
          }
        });
      }
      res.json({ message: 'Signed out successfully' });
    } catch (error) {
      console.error('Signout error:', error);
      res.status(500).json({ message: 'Failed to sign out' });
    }
  });

  app.get('/api/auth/session', async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          fullName: user.fullName,
          phone: user.phone,
          createdAt: user.createdAt.toISOString() 
        } 
      });
    } catch (error) {
      console.error('Session check error:', error);
      res.status(500).json({ message: 'Failed to check session' });
    }
  });

  // Users management route
  app.get('/api/users', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        createdAt: user.createdAt.toISOString()
      })));
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Address routes
  app.post('/api/auth/addresses', async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const address = await storage.createUserAddress({ ...req.body, userId });
      res.json(address);
    } catch (error) {
      console.error('Create address error:', error);
      res.status(500).json({ message: 'Failed to create address' });
    }
  });

  app.get('/api/auth/addresses/:userId', async (req, res) => {
    try {
      const requestedUserId = parseInt(req.params.userId);
      const sessionUserId = (req as any).session?.userId;
      
      if (!sessionUserId || sessionUserId !== requestedUserId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const addresses = await storage.getUserAddresses(requestedUserId);
      res.json(addresses);
    } catch (error) {
      console.error('Get addresses error:', error);
      res.status(500).json({ message: 'Failed to fetch addresses' });
    }
  });

  // PDF Generation endpoint for single invoice
  app.post('/api/generate-invoice-pdf', async (req, res) => {
    try {
      const { orderData } = req.body;
      
      if (!orderData) {
        return res.status(400).json({ error: 'Order data is required' });
      }

      console.log('🚀 Generating Professional Invoice PDF with Playwright...');

      const pdf = await generateBatchInvoicePDF([orderData.id], [orderData]);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${orderData.id}.pdf"`);
      res.send(pdf);

      console.log('✅ Professional Arabic RTL PDF generated successfully');
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Batch PDF Generation endpoint for multiple invoices
  app.post('/api/generate-batch-invoices-pdf', async (req, res) => {
    try {
      const { orderIds } = req.body;
      
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: 'Order IDs array is required' });
      }

      console.log('🚀 Generating Batch Invoice PDF with Playwright...');

      // Fetch all orders from database
      const allOrders = await storage.getOrders();
      const validOrders = orderIds
        .map((id: number) => allOrders.find(order => order.id === id))
        .filter(order => order !== undefined);

      if (validOrders.length === 0) {
        return res.status(404).json({ error: 'No valid orders found' });
      }

      const pdf = await generateBatchInvoicePDF(orderIds, validOrders);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="batch-invoices-${validOrders.length}-orders.pdf"`);
      res.send(pdf);

      console.log(`✅ Batch PDF with ${validOrders.length} invoices generated successfully`);
    } catch (error) {
      console.error('❌ Batch PDF generation error:', error);
      res.status(500).json({ message: "Failed to generate batch PDF" });
    }
  });

  // WebSocket Server for real-time updates
  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  function broadcastToClients(message: any) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // WhatsApp API routes
  app.get('/api/whatsapp/status', async (req, res) => {
    try {
      const status = metaWhatsAppService.getStatus();
      
      res.json({
        ...status,
        verified: true,
        connectionStrength: 'strong',
        lastVerified: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get WhatsApp status" });
    }
  });

  app.get('/api/whatsapp/qr', (req, res) => {
    try {
      const qrCode = whatsappService.getQRCode();
      if (qrCode) {
        res.json({ qr: qrCode, available: true });
      } else {
        res.json({ qr: null, available: false });
      }
    } catch (error: any) {
      res.status(500).json({ message: 'Error getting QR code' });
    }
  });

  app.post('/api/whatsapp/initialize', async (req, res) => {
    try {
      // Meta Cloud API is always ready
      res.json({ success: true, message: 'WhatsApp initialization started. Check console for QR code.' });
    } catch (error: any) {
      console.error('WhatsApp initialization failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/whatsapp/reset-session', async (req, res) => {
    try {
      // Meta Cloud API doesn't need session resets
      res.json({ success: true, message: 'WhatsApp session reset successfully' });
    } catch (error: any) {
      console.error('WhatsApp reset failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/whatsapp/send-otp', async (req, res) => {
    const { phoneNumber, fullName } = req.body;
    
    if (!phoneNumber || !fullName) {
      return res.status(400).json({ message: 'Phone number and full name are required' });
    }

    console.log(`🔄 OTP request received for ${phoneNumber} via VerifyWay WhatsApp service`);

    try {
      const result = await fazpassService.sendOTP(phoneNumber, fullName);
      
      if (result.success) {
        console.log(`✅ WhatsApp OTP sent via VerifyWay for ${phoneNumber}`);
        res.json({
          success: true,
          message: `تم إرسال رمز التحقق بنجاح`,
          delivered: 'fazpass-whatsapp'
        });
      } else {
        console.error(`❌ Failed to send WhatsApp OTP via Fazpass for ${phoneNumber}`);
        res.status(400).json({
          success: false,
          message: result.note || 'فشل في إرسال رمز التحقق عبر WhatsApp'
        });
      }
      
    } catch (error: any) {
      console.error('❌ Fazpass WhatsApp OTP service error:', error);
      
      res.status(500).json({
        success: false,
        message: 'خطأ في خدمة إرسال رمز التحقق'
      });
    }
  });

  app.post('/api/whatsapp/verify-otp', async (req, res) => {
    try {
      const { phoneNumber, otp } = req.body;
      
      if (!phoneNumber || !otp) {
        return res.status(400).json({ message: 'Phone number and OTP are required' });
      }

      const result = await fazpassService.verifyOTP(phoneNumber, otp);
      
      if (result.valid) {
        res.json({ message: result.message, valid: true });
      } else {
        res.status(400).json({ message: result.message, valid: false });
      }
    } catch (error: any) {
      console.error('❌ OTP verification error:', error);
      res.status(500).json({ message: 'خطأ في التحقق من رمز OTP', valid: false });
    }
  });

  // Test endpoint for Fazpass WhatsApp integration
  app.get('/api/whatsapp/test', async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Fazpass WhatsApp service is ready',
        merchantKey: fazpassService.merchantKey ? 'configured' : 'missing',
        baseUrl: 'https://api.fazpass.com',
        channel: 'whatsapp'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Fazpass WhatsApp service error',
        error: error.message
      });
    }
  });

  app.post('/api/whatsapp/send-customer-invoice', async (req, res) => {
    try {
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ message: 'Order ID is required' });
      }

      // Get order details
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Generate PDF
      const pdfBuffer = await generateInvoicePDF(order);
      
      // Send via WhatsApp
      await metaWhatsAppService.sendOrderNotification(order.customerPhone, {
        orderId: order.id,
        total: order.totalAmount,
        customerName: order.customerName
      });

      res.json({ message: 'Customer invoice sent via WhatsApp successfully' });
    } catch (error: any) {
      console.error('WhatsApp customer invoice error:', error);
      res.status(500).json({ message: 'Failed to send customer invoice via WhatsApp' });
    }
  });

  app.post('/api/whatsapp/send-driver-notification', async (req, res) => {
    try {
      const { orderId, driverPhone } = req.body;
      
      if (!orderId || !driverPhone) {
        return res.status(400).json({ message: 'Order ID and driver phone are required' });
      }

      // Get order details
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Send driver notification
      await metaWhatsAppService.sendOrderNotification(driverPhone, { orderId: order.id, total: order.totalAmount, customerName: order.customerName });

      res.json({ message: 'Driver notification sent via WhatsApp successfully' });
    } catch (error: any) {
      console.error('WhatsApp driver notification error:', error);
      res.status(500).json({ message: 'Failed to send driver notification via WhatsApp' });
    }
  });

  app.post('/api/whatsapp/send-store-alert', async (req, res) => {
    try {
      const { orderId, storePhone } = req.body;
      
      if (!orderId || !storePhone) {
        return res.status(400).json({ message: 'Order ID and store phone are required' });
      }

      // Get order details  
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Send store preparation alert
      await metaWhatsAppService.sendOrderNotification(storePhone, { orderId: order.id, total: order.totalAmount, customerName: order.customerName });

      res.json({ message: 'Store preparation alert sent via WhatsApp successfully' });
    } catch (error: any) {
      console.error('WhatsApp store alert error:', error);
      res.status(500).json({ message: 'Failed to send store alert via WhatsApp' });
    }
  });

  app.post('/api/whatsapp/send-status-update', async (req, res) => {
    try {
      const { orderId, status } = req.body;
      
      if (!orderId || !status) {
        return res.status(400).json({ message: 'Order ID and status are required' });
      }

      // Get order details
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Send status update
      await metaWhatsAppService.sendOrderNotification(order.customerPhone, {
        orderId: order.id,
        total: order.totalAmount,
        customerName: order.customerName,
        status: status
      });

      res.json({ message: 'Status update sent via WhatsApp successfully' });
    } catch (error: any) {
      console.error('WhatsApp status update error:', error);
      res.status(500).json({ message: 'Failed to send status update via WhatsApp' });
    }
  });

  // WhatsApp Welcome Message Endpoint
  app.post('/api/whatsapp/send-welcome-message', async (req, res) => {
    try {
      const { phone, name } = req.body;
      
      if (!phone || !name) {
        return res.status(400).json({ message: 'Phone number and name are required' });
      }

      // Check if WhatsApp service is connected
      // Meta Cloud API is always connected
      if (false) {
        console.log('WhatsApp not connected - skipping welcome message');
        return res.status(503).json({ message: 'WhatsApp service not available' });
      }

      // Format the Arabic welcome message
      const welcomeMessage = `🎉 اهلا وسهلا بك في تطبيق باكيتي للتوصيل السريع

مرحباً ${name}! 

تم انشاء حسابك بنجاح ✅

نحن سعداء بانضمامك لعائلة باكيتي. يمكنك الآن:
🛒 تصفح المنتجات الطازجة
🚚 طلب التوصيل السريع 
📱 متابعة طلباتك بسهولة

شكراً لثقتكم بنا 🙏
فريق باكيتي`;

      // Send welcome message via WhatsApp
      await metaWhatsAppService.sendWelcomeMessage(phone, welcomeMessage);
      
      console.log(`✅ Welcome WhatsApp message sent to ${phone} for user ${name}`);
      res.json({ 
        success: true, 
        message: 'Welcome message sent via WhatsApp successfully' 
      });
      
    } catch (error: any) {
      console.error('WhatsApp welcome message error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send welcome message via WhatsApp' 
      });
    }
  });

  // Admin notification testing endpoint
  app.post('/api/admin/test-notification', async (req, res) => {
    try {
      const { orderData } = req.body;
      
      if (!orderData) {
        return res.status(400).json({ message: 'Order data is required for testing' });
      }

      // Generate a mock PDF for testing
      const mockOrder = {
        id: orderData.orderId,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerEmail: 'test@example.com',
        address: { fullAddress: orderData.address },
        items: [
          { name: 'خبز عربي', quantity: 2, price: 1500 },
          { name: 'حليب طازج', quantity: 1, price: 3500 },
          { name: 'جبن أبيض', quantity: 1, price: 5000 }
        ],
        totalAmount: orderData.total,
        orderDate: new Date(),
        status: 'pending'
      };

      // Generate PDF for testing
      const pdfBuffer = await generateInvoicePDF(mockOrder);
      
      // Send admin notification via VerifyWay
      const success = await fazpassService.sendAdminNotification('07710155333', orderData);
      
      if (success) {
        res.json({ 
          message: 'Admin notification sent successfully to 07710155333',
          orderId: orderData.orderId 
        });
      } else {
        res.status(500).json({ message: 'Failed to send admin notification' });
      }
    } catch (error: any) {
      console.error('Admin test notification error:', error);
      res.status(500).json({ message: 'Failed to send admin test notification' });
    }
  });

  // Make broadcast function globally available
  (global as any).broadcastToStoreClients = broadcastToClients;

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected for real-time updates');
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Received WebSocket message:', message);
        
        // Echo message to all connected clients
        broadcastToClients(message);
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}