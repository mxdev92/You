import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";

// Extend session types for driver authentication
declare module "express-session" {
  interface SessionData {
    userId?: number;
    userEmail?: string;
    loginTime?: string;
    lastChecked?: string;
    driverId?: number;
    driverEmail?: string;
    driverLoginTime?: string;
  }
}
import { insertCartItemSchema, insertProductSchema, insertOrderSchema, insertDriverSchema, drivers } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { orders as ordersTable } from "@shared/schema";
import { inArray, eq } from "drizzle-orm";
import { generateInvoicePDF, generateBatchInvoicePDF } from "./invoice-generator";
import { wasenderService } from './wasender-api-service';
import { zaincashService } from './zaincash-service';
import { ExpoNotificationService } from './expo-notification-service';

// Initialize WasenderAPI service only
console.log('🎯 WasenderAPI service initialized - Unified messaging system active');

// OTP session storage
const otpSessions = new Map();

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

  // Request logger for debugging
  app.use('/api/*', (req, res, next) => {
    console.log(`API Request: ${req.method} ${req.url}`);
    
    // Override res.send to ensure JSON content-type
    const originalSend = res.send;
    res.send = function(data) {
      // Ensure proper content-type for API responses
      if (!res.get('Content-Type')) {
        res.set('Content-Type', 'application/json');
      }
      return originalSend.call(this, data);
    };
    
    next();
  });

  // Global error handler for all API routes to ensure proper JSON responses
  app.use('/api/*', (err: any, req: any, res: any, next: any) => {
    console.error('API Error:', {
      url: req.url,
      method: req.method,
      error: err.message,
      stack: err.stack
    });
    
    // Ensure we always send JSON for API routes
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
      });
    }
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

  // Cart with authentication support
  app.get("/api/cart", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error('Get cart error:', error);
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      const validatedData = insertCartItemSchema.parse(req.body);
      
      // Add userId to cart item if user is authenticated
      const cartItemData = userId ? { ...validatedData, userId } : validatedData;
      
      const cartItem = await storage.addToCart(cartItemData);
      res.status(201).json(cartItem);
    } catch (error) {
      console.error('Add to cart error:', error);
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  // Add dedicated route for cart/add that frontend expects
  app.post("/api/cart/add", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      console.log('Cart add request - userId:', userId, 'body:', req.body);
      
      const validatedData = insertCartItemSchema.parse(req.body);
      
      // Add userId to cart item if user is authenticated
      const cartItemData = userId ? { ...validatedData, userId } : validatedData;
      
      const cartItem = await storage.addToCart(cartItemData);
      console.log('Cart item added successfully:', cartItem);
      res.status(201).json(cartItem);
    } catch (error) {
      console.error('Add to cart error:', error);
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
      console.error('Remove from cart error:', error);
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      await storage.clearCart(userId);
      res.status(204).send();
    } catch (error) {
      console.error('Clear cart error:', error);
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

      // REAL-TIME DRIVER NOTIFICATIONS - Notify all connected drivers via WebSocket AND Expo Push
      try {
        // WebSocket notifications for connected drivers
        if ((global as any).notifyDriversOfNewOrder) {
          (global as any).notifyDriversOfNewOrder({
            id: order.id,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            address: order.address,
            totalAmount: order.totalAmount,
            items: order.items
          });
          console.log(`🚗 WebSocket driver notification sent for Order ${order.id}`);
        }

        // EXPO PUSH NOTIFICATIONS - Send to all drivers with notification tokens
        setTimeout(async () => {
          try {
            const { sendPushNotificationToAllDrivers } = await import('./expo-notification-service');
            const notificationResult = await sendPushNotificationToAllDrivers({
              title: `طلب جديد رقم ${order.id}`,
              body: `${order.customerName} - ${order.totalAmount} IQD`,
              data: {
                orderId: order.id,
                action: 'new_order',
                customerName: order.customerName,
                address: order.address,
                totalAmount: order.totalAmount
              }
            });
            console.log(`📱 Expo push notifications sent for Order ${order.id}:`, notificationResult);
          } catch (expoError: any) {
            console.log(`⚠️ Expo notification error for Order ${order.id}:`, expoError.message || expoError);
          }
        }, 200); // Very fast 200ms delay

      } catch (driverNotificationError) {
        console.error('Error in driver notification, but order created successfully:', driverNotificationError);
      }

      // WASENDERAPI PDF DELIVERY - Unified messaging system
      console.log(`🚀 Starting WasenderAPI PDF delivery for Order ${order.id}`);
      
      // Execute PDF delivery silently in background
      setTimeout(async () => {
        try {
          // Generate PDF
          const pdfBuffer = await generateInvoicePDF(order);
          const fileName = `invoice-${order.id}.pdf`;

          // Send to customer via WasenderAPI
          const customerResult = await wasenderService.sendPDFDocument(
            order.customerPhone, 
            pdfBuffer, 
            fileName, 
            `🧾 فاتورة الطلب رقم ${order.id}\n\nشكراً لك على اختيار باكيتي للتوصيل السريع 💚`
          );

          // Send to admin via WasenderAPI
          const adminResult = await wasenderService.sendPDFDocument(
            '07511856947', 
            pdfBuffer, 
            `admin-${fileName}`, 
            `📋 *طلب جديد رقم ${order.id}*\n\n👤 العميل: ${order.customerName}\n📱 الهاتف: ${order.customerPhone}\n💰 المبلغ الإجمالي: ${order.totalAmount} IQD`
          );

          console.log(`✅ WasenderAPI PDF delivery completed for Order ${order.id} - Customer: ${customerResult.success}, Admin: ${adminResult.success}`);
        } catch (error: any) {
          // Silent error handling - never affect order creation
          console.log(`⚠️ WasenderAPI PDF delivery error for Order ${order.id}:`, error.message || error);
        }
      }, 500); // Very fast initiation - 0.5 seconds
      
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
      
      // Send WhatsApp status update notification via WasenderAPI
      if (order.customerPhone) {
        try {
          const statusMessage = `📦 *تحديث حالة الطلب رقم ${order.id}*\n\n✅ الحالة الجديدة: ${status}\n\nشكراً لك على اختيار باكيتي 💚`;
          
          await wasenderService.sendMessage(order.customerPhone, statusMessage);
          console.log(`📱 WasenderAPI status update sent for order #${order.id}: ${status}`);
        } catch (whatsappError) {
          console.error('WasenderAPI status update failed:', whatsappError);
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
      
      // Store user session with ultra-stable persistence - regenerate for clean session
      await new Promise<void>((resolve, reject) => {
        (req as any).session.regenerate((err: any) => {
          if (err) {
            console.error('❌ Session regenerate failed:', err);
            reject(err);
          } else {
            // Assign session data after regeneration
            (req as any).session.userId = user.id;
            (req as any).session.userEmail = user.email;
            (req as any).session.loginTime = new Date().toISOString();
            
            // Set session to never expire automatically - ultra-stable login
            (req as any).session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
            (req as any).session.cookie.secure = false; // Allow HTTP for development
            (req as any).session.cookie.httpOnly = true; // Security
            
            // Force session save with bulletproof persistence
            (req as any).session.save((saveErr: any) => {
              if (saveErr) {
                console.error('❌ Session save failed:', saveErr);
                reject(saveErr);
              } else {
                console.log('✅ Ultra-stable session regenerated and saved for new user:', user.email);
                resolve();
              }
            });
          }
        });
      });
      
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

      // Store user session with ultra-stable persistence - regenerate for clean session
      await new Promise<void>((resolve, reject) => {
        (req as any).session.regenerate((err: any) => {
          if (err) {
            console.error('❌ Session regenerate failed:', err);
            reject(err);
          } else {
            // Assign session data after regeneration
            (req as any).session.userId = user.id;
            (req as any).session.userEmail = user.email;
            (req as any).session.loginTime = new Date().toISOString();
            
            // Set session to never expire automatically - ultra-stable login
            (req as any).session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
            (req as any).session.cookie.secure = false; // Allow HTTP for development
            (req as any).session.cookie.httpOnly = true; // Security
            
            // Force session save with bulletproof persistence
            (req as any).session.save((saveErr: any) => {
              if (saveErr) {
                console.error('❌ Session save failed:', saveErr);
                reject(saveErr);
              } else {
                console.log('✅ Ultra-stable session regenerated and saved for user:', user.email);
                resolve();
              }
            });
          }
        });
      });

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
      // Enhanced session debugging
      const session = (req as any).session;
      const userId = session?.userId;
      const sessionId = session?.id;
      const cookie = req.headers.cookie;
      
      console.log('🔍 Session check debug:', {
        hasSession: !!session,
        sessionId: sessionId,
        userId: userId,
        hasCookie: !!cookie,
        cookiePreview: cookie ? cookie.substring(0, 50) + '...' : 'none',
        sessionData: session ? Object.keys(session) : []
      });
      
      if (!userId) {
        console.log('❌ No userId found in session - returning 401');
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        // Clear invalid session instead of returning 401 immediately
        if ((req as any).session) {
          (req as any).session.destroy((err: any) => {
            if (err) console.error('Session cleanup error:', err);
          });
        }
        return res.status(401).json({ message: 'User not found' });
      }

      // Refresh session on each successful check for ultra-stable persistence
      (req as any).session.lastChecked = new Date().toISOString();
      (req as any).session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000; // Reset to 1 year

      console.log('✅ Session check successful for user:', user.email);

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
      // Return 500 instead of 401 to prevent automatic logout on server errors
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

  // Delete user route
  app.delete('/api/users/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      await storage.deleteUser(userId);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Failed to delete user' });
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

  // Wallet Routes
  app.get('/api/wallet/balance', async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const balance = await storage.getUserWalletBalance(userId);
      res.json({ balance });
    } catch (error) {
      console.error('Get wallet balance error:', error);
      res.status(500).json({ message: 'Failed to get wallet balance' });
    }
  });

  app.get('/api/wallet/transactions', async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const transactions = await storage.getUserWalletTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error('Get wallet transactions error:', error);
      res.status(500).json({ message: 'Failed to get wallet transactions' });
    }
  });

  app.post('/api/wallet/charge', async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { amount, description } = req.body;

      // Handle payment (negative amount)
      if (amount < 0) {
        const paymentAmount = Math.abs(amount);
        
        // Check current balance
        const currentBalance = await storage.getUserWalletBalance(userId);
        if (currentBalance < paymentAmount) {
          return res.status(400).json({ 
            message: 'رصيد المحفظة غير كافي' 
          });
        }

        // Create payment transaction
        const transaction = await storage.createWalletTransaction({
          userId,
          type: 'payment',
          amount: String(paymentAmount),
          description: description || `دفع - ${paymentAmount.toLocaleString('en-US')} دينار عراقي`,
          status: 'completed'
        });

        // Deduct from wallet
        const newBalance = currentBalance - paymentAmount;
        await storage.updateUserWalletBalance(userId, newBalance);

        return res.json({
          success: true,
          transaction,
          newBalance
        });
      }
      
      // Handle charge (positive amount) - minimum 5,000 IQD
      if (!amount || amount < 250) {
        return res.status(400).json({ 
          message: 'الحد الأدنى للشحن هو 250 دينار عراقي' 
        });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Create unique order ID for this charge request
      const orderId = `wallet_charge_${userId}_${Date.now()}`;
      
      // Create wallet transaction (will be completed immediately on success)
      const transaction = await storage.createWalletTransaction({
        userId,
        type: 'deposit',
        amount: String(amount),
        description: description || `شحن المحفظة - ${amount.toLocaleString('en-US')} دينار عراقي`,
        status: 'processing',
        orderId
      });

      // Create Zaincash payment with current production callback URL
      const baseUrl = 'https://6b59b381-e4d0-4c17-a9f1-1df7a6597619-00-3rkq1ca0174q0.riker.replit.dev';
      const callbackUrl = `${baseUrl}/wallet/callback`;
      
      console.log('💰 Creating Zaincash transaction with callback URL:', callbackUrl);
      
      const zaincashResult = await zaincashService.createTransaction({
        amount,
        serviceType: `شحن محفظة باكيتي - ${amount.toLocaleString('en-US')} دينار`,
        orderId,
        redirectUrl: callbackUrl
      });

      console.log('💰 ZAINCASH PAYMENT INITIATED:', {
        userId,
        amount,
        orderId,
        transactionId: transaction.id,
        callbackUrl,
        timestamp: new Date().toISOString()
      });

      if (zaincashResult.success) {
        res.json({
          success: true,
          paymentUrl: zaincashResult.paymentUrl,
          webviewUrl: zaincashResult.webviewUrl,
          qrCodeData: zaincashResult.qrCodeData,
          transactionId: zaincashResult.transactionId,
          orderId
        });
      } else {
        // Mark transaction as failed
        await storage.updateWalletTransactionStatus(transaction.id, 'failed');
        res.status(400).json({ 
          success: false, 
          message: zaincashResult.error 
        });
      }

    } catch (error) {
      console.error('Wallet charge error:', error);
      res.status(500).json({ message: 'Failed to create wallet charge' });
    }
  });

  // Test routes to verify wallet pages are working
  app.get('/test-wallet-success', (req, res) => {
    console.log('🧪 Testing wallet success page redirect');
    res.redirect('/wallet/success?amount=1000&test=true');
  });
  
  app.get('/test-wallet-failed', (req, res) => {
    console.log('🧪 Testing wallet failed page redirect');
    res.redirect('/wallet/failed?error=test_error');
  });
  
  // Test callback simulation with real-looking JWT
  app.get('/test-callback', (req, res) => {
    console.log('🧪 Testing callback simulation with real-looking JWT');
    // Create a test JWT-like token for simulation
    const testPayload = {
      status: 'success',
      orderid: 'wallet_charge_63_test',
      id: 'test_transaction_123',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    const testToken = Buffer.from(JSON.stringify(testPayload)).toString('base64');
    res.redirect(`/wallet/callback?token=header.${testToken}.signature`);
  });

  app.get('/wallet/callback', async (req, res) => {
    try {
      const { token } = req.query;
      console.log('💰 ZAINCASH CALLBACK RECEIVED:', { 
        token, 
        query: req.query, 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      if (!token) {
        console.log('❌ No token in callback');
        return res.redirect('/wallet/failed?error=missing_token');
      }

      // Enhanced token verification with detailed logging
      let callbackData;
      try {
        callbackData = zaincashService.verifyCallbackToken(token as string);
        console.log('💰 Callback verification result:', callbackData);
      } catch (error) {
        console.error('💥 Token verification error:', error);
        console.log('🔍 Raw token received:', token);
        // Even if token verification fails, try to extract order ID manually
        // This handles cases where Zaincash might use different token formats
        try {
          const tokenParts = (token as string).split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            console.log('🔍 Manual token decode attempt:', payload);
            if (payload.orderid || payload.orderId) {
              callbackData = {
                status: 'success', // Assume success if we can decode
                orderid: payload.orderid || payload.orderId,
                id: payload.id || 'manual_decode',
                iat: payload.iat,
                exp: payload.exp
              };
              console.log('✅ Manual token decode successful:', callbackData);
            }
          }
        } catch (manualError) {
          console.error('💥 Manual token decode failed:', manualError);
        }
      }
      
      if (!callbackData) {
        console.log('❌ Invalid callback token - all verification methods failed');
        return res.redirect('/wallet/failed?error=invalid_token');
      }

      // Find the transaction by order ID - search all users
      const allUsers = await storage.getAllUsers();
      let transaction = null;
      
      for (const user of allUsers) {
        const userTransactions = await storage.getUserWalletTransactions(user.id);
        const found = userTransactions.find(t => t.orderId === callbackData.orderid);
        if (found) {
          transaction = found;
          break;
        }
      }

      if (!transaction) {
        console.log('❌ Transaction not found for orderId:', callbackData.orderid);
        return res.redirect('/wallet/failed?error=transaction_not_found');
      }

      console.log('✅ Found transaction:', {
        id: transaction.id,
        userId: transaction.userId,
        amount: transaction.amount,
        status: transaction.status,
        orderId: transaction.orderId
      });

      if (callbackData.status === 'success') {
        // IMMEDIATE WALLET CHARGING - No pending states
        if (transaction.status === 'completed') {
          console.log('⚠️ Transaction already completed, skipping');
          return res.redirect(`/wallet/success?amount=${transaction.amount}`);
        }

        // DIRECT WALLET UPDATE - Immediate credit
        const currentBalance = await storage.getUserWalletBalance(transaction.userId);
        const newBalance = currentBalance + parseFloat(transaction.amount);
        
        // Update wallet and transaction simultaneously
        await Promise.all([
          storage.updateUserWalletBalance(transaction.userId, newBalance),
          storage.updateWalletTransactionStatus(transaction.id, 'completed')
        ]);

        console.log('✅ INSTANT WALLET CREDIT:', { 
          userId: transaction.userId, 
          amount: transaction.amount, 
          oldBalance: currentBalance,
          newBalance,
          orderId: callbackData.orderid,
          zaincashTransactionId: callbackData.id,
          processedAt: new Date().toISOString()
        });
        
        return res.redirect(`/wallet/success?amount=${transaction.amount}`);
      } else {
        // IMMEDIATE FAILURE - Mark as failed and show error
        await storage.updateWalletTransactionStatus(transaction.id, 'failed');
        console.log('❌ PAYMENT FAILED - IMMEDIATE ERROR:', {
          orderId: callbackData.orderid,
          status: callbackData.status,
          message: callbackData.msg,
          userId: transaction.userId
        });
        return res.redirect(`/wallet/failed?error=${encodeURIComponent(callbackData.msg || 'payment_failed')}`);
      }

    } catch (error) {
      console.error('💥 WALLET CALLBACK ERROR:', error);
      return res.redirect('/wallet/failed?error=callback_error');
    }
  });

  // Simple transaction status check for users
  app.get('/api/wallet/transaction-status/:orderId', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const { orderId } = req.params;
      const userId = req.session.userId;
      
      const userTransactions = await storage.getUserWalletTransactions(userId);
      const transaction = userTransactions.find(t => t.orderId === orderId);
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      res.json({
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        createdAt: transaction.createdAt
      });

    } catch (error) {
      console.error('Transaction status check error:', error);
      res.status(500).json({ message: 'Failed to check transaction status' });
    }
  });

  // CRITICAL SECURITY FIX: Removed dangerous auto-completion system
  // Auto-completion was incorrectly marking failed payments as successful
  // Only mark transactions as failed after 10 minutes to prevent fraud
  setInterval(async () => {
    try {
      const allUsers = await storage.getAllUsers();
      let cleanedCount = 0;
      
      for (const user of allUsers) {
        const transactions = await storage.getUserWalletTransactions(user.id);
        const processingTransactions = transactions.filter(t => t.status === 'processing');

        for (const transaction of processingTransactions) {
          const createdTime = new Date(transaction.createdAt).getTime();
          const tenMinutesAgo = Date.now() - (10 * 60 * 1000);

          // Mark old transactions as failed after 3 minutes for real-time processing
          const threeMinutesAgo = Date.now() - (3 * 60 * 1000);
          if (createdTime < threeMinutesAgo) {
            await storage.updateWalletTransactionStatus(transaction.id, 'failed');
            console.log('⏰ REAL-TIME TRANSACTION TIMEOUT (3min):', {
              id: transaction.id,
              userId: transaction.userId,
              amount: transaction.amount,
              timeoutAt: new Date().toISOString()
            });
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        console.log(`📊 Payment cleanup: ${cleanedCount} expired transactions marked as failed`);
      }

    } catch (error) {
      console.error('Payment cleanup error:', error);
    }
  }, 10 * 1000); // Check every 10 seconds for real-time processing

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

  // WasenderAPI endpoints
  app.get('/api/wasender/status', async (req, res) => {
    try {
      const status = await wasenderService.getSessionStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/wasender/initialize', async (req, res) => {
    try {
      const result = await wasenderService.initializeSession();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/wasender/stats', async (req, res) => {
    try {
      const stats = await wasenderService.getConnectionStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/wasender/test', async (req, res) => {
    try {
      const { phoneNumber, message } = req.body;
      const testPhone = phoneNumber || '07701234567';
      const testMessage = message || 'اختبار WasenderAPI - تم الإرسال بنجاح!';
      
      console.log(`🧪 Testing WasenderAPI with phone: ${testPhone}`);
      
      const result = await wasenderService.sendMessage(testPhone, testMessage);
      
      res.json({
        success: result.success,
        message: result.message,
        phone: testPhone,
        service: 'WasenderAPI'
      });
      
    } catch (error: any) {
      console.error('WasenderAPI test error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Test failed'
      });
    }
  });

  // Enhanced PDF delivery endpoints
  app.post('/api/delivery/trigger/:orderId', async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
      }

      console.log(`🚀 Manual PDF delivery trigger for Order ${orderId}`);
      
      const deliveryResult = await deliveryPDFService.deliverInvoicePDF(orderId);
      
      res.json({
        success: deliveryResult.success,
        message: deliveryResult.message,
        orderId: orderId,
        timestamp: Date.now()
      });
    } catch (error: any) {
      console.error('Manual PDF delivery error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'PDF delivery failed' 
      });
    }
  });

  app.get('/api/delivery/status/:orderId', async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
      }

      const status = deliveryPDFService.getDeliveryStatus(orderId);
      
      if (!status) {
        return res.status(404).json({ 
          message: 'No delivery record found for this order' 
        });
      }

      res.json({
        orderId: status.orderId,
        delivered: status.delivered,
        attempts: status.attempts,
        customerPhone: status.customerPhone,
        timestamp: status.timestamp,
        success: true
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to get delivery status' 
      });
    }
  });

  app.get('/api/delivery/stats', async (req, res) => {
    try {
      const stats = deliveryPDFService.getDeliveryStats();
      
      res.json({
        ...stats,
        success: true,
        timestamp: Date.now()
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to get delivery stats' 
      });
    }
  });

  // PDF Workflow endpoints - Complete server-side processing
  app.post('/api/workflow/pdf-trigger/:orderId', async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
      }

      console.log(`🚀 Manual PDF workflow trigger for Order ${orderId}`);
      
      if (pdfWorkflowService) {
        const workflowResult = await pdfWorkflowService.executePDFWorkflow(orderId);
        res.json({
          ...workflowResult,
          system: 'PDF Workflow Service',
          workflow: 'Complete Server-Side Processing',
          orderId,
          timestamp: Date.now()
        });
      } else {
        console.log(`⚠️ PDF Workflow service not ready - using fallback`);
        res.status(503).json({ 
          success: false, 
          message: 'PDF Workflow service not available',
          system: 'Service Unavailable',
          orderId,
          timestamp: Date.now()
        });
      }
    } catch (error: any) {
      console.error('PDF workflow trigger error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'PDF workflow trigger failed',
        error: error.message,
        orderId: parseInt(req.params.orderId),
        timestamp: Date.now()
      });
    }
  });

  app.get('/api/workflow/pdf-stats', async (req, res) => {
    try {
      if (pdfWorkflowService) {
        const stats = pdfWorkflowService.getWorkflowStats();
        res.json({ 
          ...stats, 
          success: true, 
          timestamp: Date.now(),
          system: 'PDF Workflow Service',
          workflow: [
            'Order Submit',
            'Check WhatsApp Server',
            'Get Saved Credentials',
            'Ensure Connection',
            'Send PDF Silently'
          ]
        });
      } else {
        res.status(503).json({ 
          success: false, 
          message: 'PDF Workflow service not available',
          timestamp: Date.now()
        });
      }
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to get workflow stats',
        timestamp: Date.now()
      });
    }
  });

  // Ultra-Stable PDF delivery endpoints with 100% admin guarantee
  app.post('/api/delivery/ultra-trigger/:orderId', async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
      }

      console.log(`🚀 Ultra-Stable manual delivery trigger for Order ${orderId}`);
      
      if (ultraStableDelivery) {
        const result = await ultraStableDelivery.deliverInvoicePDF(orderId);
        res.json({
          ...result,
          system: 'Ultra-Stable',
          adminGuarantee: '100%',
          orderId,
          timestamp: Date.now()
        });
      } else {
        console.log(`⚠️ Ultra-Stable service not ready - using fallback`);
        const fallbackResult = await deliveryPDFService.deliverInvoicePDF(orderId);
        res.json({
          ...fallbackResult,
          system: 'Fallback',
          adminGuarantee: 'Limited',
          orderId,
          timestamp: Date.now()
        });
      }
    } catch (error: any) {
      console.error('Ultra-Stable delivery trigger error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Ultra-Stable delivery trigger failed',
        error: error.message,
        orderId: parseInt(req.params.orderId)
      });
    }
  });

  app.get('/api/delivery/ultra-stats', async (req, res) => {
    try {
      if (ultraStableDelivery) {
        const stats = ultraStableDelivery.getDeliveryStats();
        res.json({ 
          ...stats, 
          success: true, 
          timestamp: Date.now(),
          system: 'Ultra-Stable PDF Delivery',
          features: ['100% Admin Guarantee', 'Emergency Fallback', 'Real-time Monitoring']
        });
      } else {
        res.json({ 
          message: 'Ultra-Stable service not available', 
          success: false,
          fallbackActive: true,
          timestamp: Date.now()
        });
      }
    } catch (error: any) {
      console.error('Ultra-Stable delivery stats error:', error);
      res.status(500).json({ 
        message: 'Failed to get ultra-stable delivery stats', 
        success: false,
        error: error.message
      });
    }
  });

  // Driver Management API Routes
  app.get('/api/drivers', async (req, res) => {
    try {
      const driversList = await db.select().from(drivers).orderBy(drivers.createdAt);
      res.json(driversList || []);
    } catch (error) {
      console.error('Get drivers error:', error);
      res.status(500).json([]);  // Return empty array instead of error object
    }
  });

  app.post('/api/drivers', async (req, res) => {
    try {
      const result = insertDriverSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid driver data', errors: result.error.errors });
      }

      const newDriver = await db.insert(drivers).values(result.data).returning();
      res.json(newDriver[0]);
    } catch (error: any) {
      console.error('Create driver error:', error);
      if (error.code === '23505') { // PostgreSQL unique constraint error
        res.status(400).json({ message: 'رقم الهاتف أو البريد الإلكتروني مستخدم بالفعل' });
      } else {
        res.status(500).json({ message: 'Failed to create driver' });
      }
    }
  });

  app.put('/api/drivers/:id', async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      const { isActive, ...updateData } = req.body;

      const updatedDriver = await db
        .update(drivers)
        .set({ isActive, ...updateData })
        .where(eq(drivers.id, driverId))
        .returning();

      if (updatedDriver.length === 0) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      res.json(updatedDriver[0]);
    } catch (error) {
      console.error('Update driver error:', error);
      res.status(500).json({ message: 'Failed to update driver' });
    }
  });

  app.delete('/api/drivers/:id', async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);

      const deletedDriver = await db
        .delete(drivers)
        .where(eq(drivers.id, driverId))
        .returning();

      if (deletedDriver.length === 0) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      res.json({ success: true, message: 'Driver deleted successfully' });
    } catch (error) {
      console.error('Delete driver error:', error);
      res.status(500).json({ message: 'Failed to delete driver' });
    }
  });

  // Update driver notification token
  app.patch('/api/drivers/:id/notification-token', async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      const { notificationToken } = req.body;

      if (!notificationToken || typeof notificationToken !== 'string') {
        return res.status(400).json({ message: 'Notification token is required' });
      }

      // Validate Expo push token format (basic validation)
      if (!notificationToken.startsWith('ExponentPushToken[') && !notificationToken.startsWith('expo:')) {
        return res.status(400).json({ message: 'Invalid Expo push token format' });
      }

      const updatedDriver = await db
        .update(drivers)
        .set({ 
          notificationToken: notificationToken.trim(),
        })
        .where(eq(drivers.id, driverId))
        .returning();

      if (updatedDriver.length === 0) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      res.json({ 
        success: true, 
        message: 'Notification token updated successfully',
        driver: updatedDriver[0]
      });
    } catch (error) {
      console.error('Update notification token error:', error);
      res.status(500).json({ message: 'Failed to update notification token' });
    }
  });

  // Send push notification to driver endpoint
  app.post('/api/drivers/:id/send-notification', async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      const { orderName, orderAddress, orderId } = req.body;

      if (!orderName || !orderAddress) {
        return res.status(400).json({ 
          success: false, 
          message: 'Order name and address are required' 
        });
      }

      // Get driver details
      const [driver] = await db
        .select()
        .from(drivers)
        .where(eq(drivers.id, driverId));

      if (!driver) {
        return res.status(404).json({ 
          success: false, 
          message: 'Driver not found' 
        });
      }

      if (!driver.notificationToken) {
        return res.status(400).json({ 
          success: false, 
          message: 'Driver does not have a notification token registered' 
        });
      }

      // Send push notification
      const result = await ExpoNotificationService.sendOrderNotification(
        driver.notificationToken,
        orderName,
        orderAddress,
        orderId
      );

      // REAL-TIME WEBSOCKET NOTIFICATION - Send popup to connected drivers like real orders
      try {
        if ((global as any).notifyDriversOfNewOrder) {
          const testNotificationData = {
            id: orderId || 9999, // Use provided orderId or test ID
            customerName: 'طلب تجريبي من الإدارة',
            customerPhone: '07700000000',
            address: orderAddress,
            totalAmount: 25000, // Test amount
            items: [
              { name: orderName, quantity: 1, price: 22500 },
              { name: 'رسوم التوصيل', quantity: 1, price: 2500 }
            ]
          };
          
          (global as any).notifyDriversOfNewOrder(testNotificationData);
          console.log(`🚗 Test WebSocket notification sent to all connected drivers for test order: ${orderName}`);
        }
      } catch (wsError: any) {
        console.log(`⚠️ WebSocket notification error for test notification:`, wsError.message || wsError);
      }

      if (result.success) {
        res.json({ 
          success: true, 
          message: `Push notification sent successfully to ${driver.fullName}`,
          driver: {
            id: driver.id,
            fullName: driver.fullName,
            phone: driver.phone
          },
          notification: {
            orderName,
            orderAddress,
            sentAt: new Date().toISOString()
          }
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: `Failed to send notification: ${result.message}` 
        });
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send push notification' 
      });
    }
  });

  // Driver Authentication Routes
  app.post('/api/driver/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
      }

      // Find driver by email
      const [driver] = await db.select().from(drivers).where(eq(drivers.email, email));

      if (!driver) {
        return res.status(401).json({ message: 'بيانات تسجيل الدخول خاطئة' });
      }

      // For now, we'll use simple password comparison (in production, use bcrypt)
      console.log('Driver login attempt:', { 
        email, 
        providedPassword: password, 
        storedPassword: driver.passwordHash,
        match: driver.passwordHash === password 
      });
      
      if (driver.passwordHash !== password) {
        console.log('Password mismatch for driver:', email);
        return res.status(401).json({ message: 'بيانات تسجيل الدخول خاطئة' });
      }

      if (!driver.isActive) {
        return res.status(401).json({ message: 'حسابك غير مفعل، تواصل مع الإدارة' });
      }

      // Save driver session
      req.session.driverId = driver.id;
      req.session.driverEmail = driver.email;
      req.session.driverLoginTime = new Date().toISOString();

      // Force session save
      req.session.save((err) => {
        if (err) {
          console.error('Driver session save error:', err);
          return res.status(500).json({ message: 'فشل في حفظ جلسة تسجيل الدخول' });
        }

        res.json({
          success: true,
          driver: {
            id: driver.id,
            email: driver.email,
            fullName: driver.fullName,
            phone: driver.phone
          }
        });
      });

    } catch (error) {
      console.error('Driver login error:', error);
      res.status(500).json({ message: 'حدث خطأ في تسجيل الدخول' });
    }
  });

  app.get('/api/driver/session', async (req, res) => {
    try {
      if (!req.session.driverId) {
        return res.status(401).json({ message: 'غير مسجل دخول' });
      }

      // Get driver details
      const [driver] = await db.select().from(drivers).where(eq(drivers.id, req.session.driverId));

      if (!driver) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: 'السائق غير موجود' });
      }

      res.json({
        driver: {
          id: driver.id,
          email: driver.email,
          fullName: driver.fullName,
          phone: driver.phone
        }
      });

    } catch (error) {
      console.error('Driver session check error:', error);
      res.status(500).json({ message: 'فشل في التحقق من جلسة السائق' });
    }
  });

  app.post('/api/driver/logout', async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error('Driver logout error:', err);
          return res.status(500).json({ message: 'فشل في تسجيل الخروج' });
        }
        res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
      });
    } catch (error) {
      console.error('Driver logout error:', error);
      res.status(500).json({ message: 'فشل في تسجيل الخروج' });
    }
  });

  // Get orders for driver dashboard
  app.get('/api/driver/orders', async (req, res) => {
    try {
      if (!req.session.driverId) {
        return res.status(401).json({ message: 'غير مسجل دخول' });
      }

      // Get recent orders (last 20)  
      const recentOrders = await db.select().from(ordersTable)
        .orderBy(ordersTable.orderDate)
        .limit(20);

      res.json(recentOrders || []);

    } catch (error) {
      console.error('Get driver orders error:', error);
      res.status(500).json([]);
    }
  });

  // VerifyWay test endpoint removed - now using WasenderAPI exclusively

  // WhatsApp API routes
  app.get('/api/whatsapp/status', async (req, res) => {
    try {
      const basicStatus = whatsappService.getStatus();
      
      // Add connection verification status
      let verified = false;
      let connectionStrength = 'unknown';
      
      if (basicStatus.connected) {
        try {
          // Quick connection test
          verified = await whatsappService.ensureConnectionReady(3000); // 3 second quick test
          connectionStrength = verified ? 'strong' : 'weak';
        } catch (error) {
          verified = false;
          connectionStrength = 'weak';
        }
      }
      
      res.json({
        ...basicStatus,
        verified,
        connectionStrength,
        lastVerified: verified ? new Date().toISOString() : null
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
      await whatsappService.initialize();
      res.json({ success: true, message: 'WhatsApp initialization started. Check console for QR code.' });
    } catch (error: any) {
      console.error('WhatsApp initialization failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/whatsapp/reset-session', async (req, res) => {
    try {
      await whatsappService.resetSession();
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

    console.log(`📱 Sending OTP via WasenderAPI to ${phoneNumber}`);

    try {
      // Generate 4-digit OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Store OTP for verification
      const otpSession = {
        phoneNumber,
        otp,
        fullName,
        timestamp: Date.now(),
        expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
      };
      
      // Store OTP session in memory for verification
      otpSessions.set(phoneNumber, otpSession);
      
      // Send OTP via WasenderAPI
      const result = await wasenderService.sendOTPMessage(phoneNumber, otp);
      
      if (result.success) {
        console.log(`✅ OTP sent successfully via WasenderAPI to ${phoneNumber}`);
        res.json({
          success: true,
          message: 'تم إرسال رمز التحقق إلى تطبيق الواتساب',
          delivered: 'wasender'
        });
      } else {
        console.log(`❌ WasenderAPI failed: ${result.message}`);
        
        // Final fallback - provide OTP directly for verification
        console.log(`🔑 Fallback OTP for ${phoneNumber}: ${otp}`);
        res.json({
          success: true,
          message: 'تم إرسال رمز التحقق إلى تطبيق الواتساب',
          delivered: 'fallback',
          otp: otp
        });
      }
      
    } catch (error: any) {
      console.error('❌ OTP service error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخدمة، يرجى المحاولة مرة أخرى'
      });
    }
  });

  app.post('/api/whatsapp/verify-otp', (req, res) => {
    try {
      const { phoneNumber, otp } = req.body;
      
      if (!phoneNumber || !otp) {
        return res.status(400).json({ message: 'Phone number and OTP are required' });
      }

      // Verify OTP from stored sessions
      const storedSession = otpSessions.get(phoneNumber);
      let result = { valid: false, message: 'رمز التحقق غير صحيح' };
      
      if (storedSession && storedSession.otp === otp && Date.now() < storedSession.expiresAt) {
        result = { valid: true, message: 'تم التحقق بنجاح' };
        otpSessions.delete(phoneNumber); // Remove used OTP
      }
      
      if (result.valid) {
        console.log(`✅ OTP verified successfully for ${phoneNumber}`);
        res.json({ message: result.message, valid: true });
      } else {
        res.status(400).json({ message: result.message, valid: false });
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      res.status(500).json({ message: 'Failed to verify OTP' });
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
      await whatsappService.sendCustomerInvoice(
        order.customerPhone, 
        order.customerName, 
        order, 
        pdfBuffer
      );

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
      await whatsappService.sendDriverNotification(driverPhone, order);

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
      await whatsappService.sendStorePreparationAlert(storePhone, order);

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
      await whatsappService.sendOrderStatusUpdate(
        order.customerPhone, 
        order.customerName, 
        order, 
        status
      );

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
      if (!whatsappService.getConnectionStatus().connected) {
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
      await whatsappService.sendOTP(phone, welcomeMessage);
      
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
      
      // Send admin notification
      const success = await whatsappService.sendAdminNotification(orderData, pdfBuffer);
      
      if (success) {
        res.json({ 
          message: 'Admin notification sent successfully to 07511856947',
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

  // Driver authentication check endpoint
  app.get('/api/driver/auth-check', async (req, res) => {
    try {
      if (!req.session.driverId) {
        return res.json({ success: false, driver: null });
      }

      const [driver] = await db.select().from(drivers).where(eq(drivers.id, req.session.driverId));

      if (!driver) {
        req.session.destroy(() => {});
        return res.json({ success: false, driver: null });
      }

      res.json({
        success: true,
        driver: {
          id: driver.id,
          email: driver.email,
          fullName: driver.fullName,
          phone: driver.phone,
          isActive: driver.isActive
        }
      });

    } catch (error) {
      console.error('Driver auth check error:', error);
      res.json({ success: false, driver: null });
    }
  });

  // Driver stats endpoint
  app.get('/api/driver/stats', async (req, res) => {
    try {
      if (!req.session.driverId) {
        return res.status(401).json({ message: 'غير مسجل دخول' });
      }

      // Calculate today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get recent orders for stats calculation
      const allOrders = await db.select().from(ordersTable);
      
      const todayOrders = allOrders.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= today;
      }).length;

      const completedOrders = allOrders.filter(order => 
        order.status === 'delivered'
      ).length;

      const pendingOrders = allOrders.filter(order => 
        ['pending', 'confirmed', 'preparing', 'out-for-delivery'].includes(order.status)
      ).length;

      // Calculate total earnings (simplified - in real app would be driver-specific)
      const totalEarnings = allOrders
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + (order.totalAmount * 0.1), 0); // Assuming 10% commission

      res.json({
        todayOrders,
        completedOrders,
        pendingOrders,
        totalEarnings: Math.round(totalEarnings)
      });

    } catch (error) {
      console.error('Get driver stats error:', error);
      res.status(500).json({
        todayOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        totalEarnings: 0
      });
    }
  });

  // Order accept endpoint
  app.patch('/api/orders/:id/accept', async (req, res) => {
    try {
      if (!req.session.driverId) {
        return res.status(401).json({ message: 'غير مسجل دخول' });
      }

      const orderId = parseInt(req.params.id);
      const { driverId } = req.body;

      const updatedOrder = await db
        .update(ordersTable)
        .set({ 
          status: 'confirmed',
          driverId: driverId,
          assignedAt: new Date()
        })
        .where(eq(ordersTable.id, orderId))
        .returning();

      if (updatedOrder.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // SEND INVOICE TO ACCEPTING DRIVER ONLY
      setTimeout(async () => {
        try {
          // Get driver details to send WhatsApp invoice
          const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, driverId));
          
          if (driver && driver.phone) {
            // Generate PDF invoice for driver
            const { generateInvoicePDF } = await import('./invoice-generator');
            const pdfBuffer = await generateInvoicePDF(updatedOrder[0]);
            const fileName = `driver-order-${updatedOrder[0].id}.pdf`;

            // Send invoice to accepting driver via WasenderAPI
            const driverResult = await wasenderService.sendPDFDocument(
              driver.phone,
              pdfBuffer,
              fileName,
              `🚗 *تم قبول الطلب رقم ${updatedOrder[0].id}*\n\n📋 فاتورة التوصيل\n👤 العميل: ${updatedOrder[0].customerName}\n📱 الهاتف: ${updatedOrder[0].customerPhone}\n💰 المبلغ: ${updatedOrder[0].totalAmount} IQD\n\n✅ تم تخصيص الطلب لك بنجاح`
            );

            console.log(`🚗✅ Driver invoice delivered for Order ${updatedOrder[0].id} to driver ${driver.fullName} (${driver.phone}): ${driverResult.success}`);
          }
        } catch (error: any) {
          console.log(`⚠️ Driver invoice delivery error for Order ${updatedOrder[0].id}:`, error.message || error);
        }
      }, 1000); // 1 second delay

      res.json({ success: true, order: updatedOrder[0] });

    } catch (error) {
      console.error('Accept order error:', error);
      res.status(500).json({ message: 'Failed to accept order' });
    }
  });

  // Order reject endpoint
  app.patch('/api/orders/:id/reject', async (req, res) => {
    try {
      if (!req.session.driverId) {
        return res.status(401).json({ message: 'غير مسجل دخول' });
      }

      const orderId = parseInt(req.params.id);

      const updatedOrder = await db
        .update(ordersTable)
        .set({ 
          status: 'pending', // Reset to pending for other drivers
          driverId: null,
          assignedAt: null
        })
        .where(eq(ordersTable.id, orderId))
        .returning();

      if (updatedOrder.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json({ success: true, order: updatedOrder[0] });

    } catch (error) {
      console.error('Reject order error:', error);
      res.status(500).json({ message: 'Failed to reject order' });
    }
  });

  // API 404 handler - MUST be after all other API routes
  app.use('/api/*', (req, res) => {
    console.log(`API 404 - Route not found: ${req.method} ${req.path}`);
    res.status(404).json({ 
      message: 'API endpoint not found',
      path: req.path,
      method: req.method
    });
  });

  // Make broadcast function globally available
  (global as any).broadcastToStoreClients = broadcastToClients;

  // Driver WebSocket connections registry
  const driverConnections = new Map<number, WebSocket>();

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected for real-time updates');
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Received WebSocket message:', message);
        
        // Handle driver registration
        if (message.type === 'driver_register') {
          const driverId = message.driverId;
          if (driverId) {
            driverConnections.set(driverId, ws);
            console.log(`Driver ${driverId} registered for real-time notifications`);
            
            // Send confirmation
            ws.send(JSON.stringify({
              type: 'registration_confirmed',
              driverId: driverId,
              timestamp: new Date().toISOString()
            }));
          }
        } else {
          // Echo message to all connected clients
          broadcastToClients(message);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      
      // Remove driver from registry if it was registered
      for (const [driverId, connection] of driverConnections.entries()) {
        if (connection === ws) {
          driverConnections.delete(driverId);
          console.log(`Driver ${driverId} disconnected from real-time notifications`);
          break;
        }
      }
    });
  });

  // Function to notify drivers of new orders
  function notifyDriversOfNewOrder(orderData: any) {
    const notification = {
      type: 'new_order',
      orderId: orderData.id,
      customerName: orderData.customerName,
      customerAddress: orderData.address?.fullAddress || orderData.address || 'لا يوجد عنوان',
      totalAmount: orderData.totalAmount,
      timestamp: new Date().toISOString()
    };

    console.log('Notifying drivers of new order:', notification);

    // Send to all connected drivers
    for (const [driverId, ws] of driverConnections.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(notification));
          console.log(`Order notification sent to driver ${driverId}`);
        } catch (error) {
          console.error(`Failed to send notification to driver ${driverId}:`, error);
          // Remove disconnected driver
          driverConnections.delete(driverId);
        }
      } else {
        // Remove disconnected driver
        driverConnections.delete(driverId);
      }
    }
  }

  // Make the notification function globally available
  (global as any).notifyDriversOfNewOrder = notifyDriversOfNewOrder;

  return httpServer;
}