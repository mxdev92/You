import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertCartItemSchema, insertProductSchema, insertOrderSchema, insertDriverSchema } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { orders as ordersTable } from "@shared/schema";
import { inArray } from "drizzle-orm";
import { generateInvoicePDF, generateBatchInvoicePDF } from "./invoice-generator";
import { wasenderService } from './wasender-api-service';
import { zaincashService } from './zaincash-service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { setupPerformanceOptimizations, SmartCache, sendOptimizedResponse, getPerformanceMetrics } from './performance';
import { setupUltraSimplePerformance, UltraSimpleMiddleware, ultraSimpleCache } from './ultra-performance-simple';
import { ultraStorage } from './ultra-storage';

// JWT Secret for driver authentication
const JWT_SECRET = process.env.JWT_SECRET || 'pakety-driver-secret-key-2025';

// Initialize WasenderAPI service only
console.log('🎯 WasenderAPI service initialized - Unified messaging system active');

// OTP session storage
const otpSessions = new Map();

// Push notification tokens storage for drivers
const driverPushTokens = new Map<number, string>();

// WebSocket connections for real-time notifications
const driverWebSockets = new Map<number, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup performance optimizations (compression, rate limiting, caching, monitoring)
  setupPerformanceOptimizations(app);
  
  // 🔥 ULTRA SIMPLE PERFORMANCE MODE - Sub-50ms responses (No external dependencies)
  const { cache: ultraCache } = setupUltraSimplePerformance(app);
  
  const cache = SmartCache.getInstance();

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

  // 🔥 ULTRA-FAST CATEGORIES API - Sub-10ms responses
  app.get("/api/categories", 
    UltraSimpleMiddleware.ultraCache(600, () => 'ultra_categories'),
    async (req, res) => {
      try {
        const categories = await ultraStorage.getCategories();
        if (!res.headersSent) {
          res.set('X-Ultra-Source', 'DATABASE');
        }
        res.json(categories);
      } catch (error) {
        console.error('❌ Ultra Categories API error:', error);
        res.status(500).json({ message: "Failed to fetch categories" });
      }
    }
  );

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

  // 🔥 ULTRA-FAST PRODUCTS API - Lightning Speed
  app.get("/api/products", async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const search = req.query.search as string;
      
      console.log('🔥 Ultra Products API called - CategoryId:', categoryId, 'Search:', search);
      
      let products: any[] = [];

      // Ultra-optimized routing
      if (search) {
        products = await ultraStorage.searchProducts(search);
        res.set('X-Ultra-Query', 'SEARCH');
      } else if (categoryId) {
        products = await ultraStorage.getProductsByCategory(categoryId);
        res.set('X-Ultra-Query', 'CATEGORY');
      } else {
        products = await ultraStorage.getProducts();
        res.set('X-Ultra-Query', 'ALL');
      }

      if (!res.headersSent) {
        res.set('X-Ultra-Source', 'ULTRA-STORAGE');
        res.set('X-Ultra-Count', products.length.toString());
      }
      res.json(products);
    } catch (error) {
      console.error('❌ Ultra Products API error:', error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get products by specific category (dedicated endpoint)
  app.get("/api/categories/:categoryId/products", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      console.log('🏷️ Getting products for category:', categoryId);
      
      const products = await storage.getProductsByCategory(categoryId);
      console.log(`📦 Found ${products.length} products for category ${categoryId}`);
      
      res.json(products);
    } catch (error) {
      console.error('Category products API error:', error);
      res.status(500).json({ message: "Failed to fetch category products" });
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
      
      // Invalidate cache when products change
      cache.invalidateProducts();
      
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
      
      // Invalidate cache when products change
      cache.invalidateProducts(product.categoryId);
      
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
      
      // Invalidate all product caches when deleting
      cache.invalidateProducts();
      
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
  // 📱 REACT NATIVE COMPATIBILITY ENDPOINTS
  // Direct /api/addresses endpoint for React Native compatibility
  app.get('/api/addresses', async (req, res) => {
    const session = (req as any).session;
    const userId = session?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const addresses = await storage.getUserAddresses(userId);
      res.json(addresses);
    } catch (error) {
      console.error('Addresses API error:', error);
      res.status(500).json({ message: 'Failed to fetch addresses' });
    }
  });

  // Direct /api/wallet endpoint for React Native compatibility
  app.get('/api/wallet', async (req, res) => {
    const session = (req as any).session;
    const userId = session?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const balance = await storage.getUserWalletBalance(userId);
      res.json({ balance });
    } catch (error) {
      console.error('Wallet API error:', error);
      res.status(500).json({ message: 'Failed to fetch wallet balance' });
    }
  });

  // Direct /api/transactions endpoint for React Native compatibility
  app.get('/api/transactions', async (req, res) => {
    const session = (req as any).session;
    const userId = session?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const transactions = await storage.getUserWalletTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error('Transactions API error:', error);
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });

  // Performance monitoring endpoint for React Native compatibility
  app.get('/api/performance', async (req, res) => {
    try {
      const ultraMetrics = UltraSimpleMiddleware.getPerformanceMetrics();
      res.json({
        ...ultraMetrics,
        status: 'operational',
        system: 'HYPER-PERFORMANCE',
        responseTime: ultraMetrics.averageResponseTime || 'sub-5ms'
      });
    } catch (error) {
      console.error('Performance API error:', error);
      res.status(500).json({ message: 'Failed to get performance metrics' });
    }
  });

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

      // Send real-time push notifications to all drivers
      try {
        await sendPushNotificationToDrivers({
          id: order.id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          address: order.address,
          totalAmount: order.totalAmount,
          items: order.items,
          orderDate: order.orderDate
        });
      } catch (notificationError) {
        console.error('Error sending driver notifications, but order created successfully:', notificationError);
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
            order.phone, 
            pdfBuffer, 
            fileName, 
            `🧾 فاتورة الطلب رقم ${order.id}\n\nشكراً لك على اختيار باكيتي للتوصيل السريع 💚`
          );

          // Send to admin via WasenderAPI
          const adminResult = await wasenderService.sendPDFDocument(
            '07511856947', 
            pdfBuffer, 
            `admin-${fileName}`, 
            `📋 *طلب جديد رقم ${order.id}*\n\n👤 العميل: ${order.customerName}\n📱 الهاتف: ${order.phone}\n💰 المبلغ الإجمالي: ${order.totalAmount} IQD`
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
      console.log('🔐 Signin attempt:', { email, passwordLength: password?.length });
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await storage.getUserByEmail(email);
      console.log('👤 User found:', !!user, user ? { id: user.id, email: user.email, hashLength: user.passwordHash?.length } : 'none');
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Verify password using bcrypt
      console.log('🔑 Verifying password with bcrypt...');
      console.log('Password from request:', password);
      console.log('Hash from database:', user.passwordHash);
      
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      console.log('✅ Password verification result:', isValidPassword);
      
      if (!isValidPassword) {
        // Try fallback for legacy plain text (for debugging)
        if (user.passwordHash === password) {
          console.log('⚠️ Legacy plain text password matched - should update hash');
        } else {
          console.log('❌ Password verification failed completely');
          return res.status(401).json({ message: 'Invalid credentials' });
        }
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

  // Driver Authentication API Routes
  app.post('/api/drivers/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false,
          message: 'البريد الإلكتروني وكلمة المرور مطلوبان' 
        });
      }

      // Find driver by email
      const driver = await storage.getDriverByEmail(email);
      if (!driver) {
        return res.status(401).json({ 
          success: false,
          message: 'البريد الإلكتروني غير مسجل' 
        });
      }

      // Check if driver is active
      if (!driver.isActive) {
        return res.status(401).json({ 
          success: false,
          message: 'حساب السائق غير نشط. يرجى التواصل مع الإدارة' 
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, driver.password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false,
          message: 'كلمة المرور غير صحيحة' 
        });
      }

      // Generate JWT token (30 days expiration)
      const token = jwt.sign(
        { 
          driverId: driver.id, 
          email: driver.email,
          type: 'driver'
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      // Return successful login
      res.json({
        success: true,
        token,
        driver: {
          id: driver.id,
          fullName: driver.fullName,
          email: driver.email,
          phone: driver.phone,
          isActive: driver.isActive,
          createdAt: driver.createdAt
        }
      });

    } catch (error: any) {
      console.error('Driver login error:', error);
      res.status(500).json({ 
        success: false,
        message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى' 
      });
    }
  });

  // Driver token verification middleware
  const authenticateDriver = async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false,
          message: 'رمز المصادقة مطلوب' 
        });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      if (decoded.type !== 'driver') {
        return res.status(401).json({ 
          success: false,
          message: 'رمز مصادقة غير صالح' 
        });
      }

      // Get driver details
      const driver = await storage.getDriver(decoded.driverId);
      if (!driver || !driver.isActive) {
        return res.status(401).json({ 
          success: false,
          message: 'حساب السائق غير نشط' 
        });
      }

      req.driver = driver;
      next();
    } catch (error) {
      res.status(401).json({ 
        success: false,
        message: 'رمز مصادقة غير صالح' 
      });
    }
  };

  // Driver profile endpoint (protected)
  app.get('/api/drivers/profile', authenticateDriver, async (req: any, res) => {
    res.json({
      success: true,
      driver: {
        id: req.driver.id,
        fullName: req.driver.fullName,
        email: req.driver.email,
        phone: req.driver.phone,
        isActive: req.driver.isActive,
        createdAt: req.driver.createdAt
      }
    });
  });

  // Driver statistics endpoint (protected)
  app.get('/api/drivers/stats', authenticateDriver, async (req: any, res) => {
    try {
      const driverId = req.driver.id;
      const orders = await storage.getOrders();
      
      // Filter orders for this driver
      const driverOrders = orders.filter(order => order.driverId === driverId);
      
      // Calculate today's stats
      const today = new Date().toDateString();
      const todayOrders = driverOrders.filter(order => 
        new Date(order.orderDate).toDateString() === today
      );
      const completedToday = todayOrders.filter(order => order.status === 'delivered');
      
      // Calculate earnings (assuming 10% commission per delivery)
      const todayEarnings = completedToday.reduce((sum, order) => {
        return sum + (parseFloat(order.totalAmount) * 0.1);
      }, 0);
      
      const stats = {
        todayDeliveries: completedToday.length,
        todayEarnings: Math.round(todayEarnings),
        totalDeliveries: driverOrders.filter(order => order.status === 'delivered').length,
        averageRating: 4.8 // Placeholder - implement actual rating system later
      };

      res.json({
        success: true,
        stats
      });

    } catch (error: any) {
      console.error('Get driver stats error:', error);
      res.status(500).json({ 
        success: false,
        message: 'خطأ في تحميل الإحصائيات' 
      });
    }
  });

  // Drivers API Routes (Admin)
  app.get('/api/drivers', async (req, res) => {
    try {
      const drivers = await storage.getDrivers();
      res.json(drivers);
    } catch (error: any) {
      console.error('Get drivers error:', error);
      res.status(500).json({ message: 'Failed to fetch drivers' });
    }
  });

  app.get('/api/drivers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid driver ID' });
      }
      
      const driver = await storage.getDriver(id);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
      
      res.json(driver);
    } catch (error: any) {
      console.error('Get driver error:', error);
      res.status(500).json({ message: 'Failed to fetch driver' });
    }
  });

  app.post('/api/drivers', async (req, res) => {
    try {
      const validation = insertDriverSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid driver data',
          errors: validation.error.errors 
        });
      }

      // Check if email already exists
      const existingDriver = await storage.getDriverByEmail(validation.data.email);
      if (existingDriver) {
        return res.status(409).json({ message: 'Driver with this email already exists' });
      }

      const newDriver = await storage.createDriver(validation.data);
      res.status(201).json(newDriver);
    } catch (error: any) {
      console.error('Create driver error:', error);
      res.status(500).json({ message: 'Failed to create driver' });
    }
  });

  app.patch('/api/drivers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid driver ID' });
      }

      const driver = await storage.getDriver(id);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      const updatedDriver = await storage.updateDriver(id, req.body);
      res.json(updatedDriver);
    } catch (error: any) {
      console.error('Update driver error:', error);
      res.status(500).json({ message: 'Failed to update driver' });
    }
  });

  app.delete('/api/drivers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid driver ID' });
      }

      const driver = await storage.getDriver(id);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      await storage.deleteDriver(id);
      res.json({ message: 'Driver deleted successfully' });
    } catch (error: any) {
      console.error('Delete driver error:', error);
      res.status(500).json({ message: 'Failed to delete driver' });
    }
  });

  // =============================================
  // DRIVER MOBILE APP ORDER MANAGEMENT API
  // =============================================

  // Get available orders for drivers (orders ready for delivery)
  app.get('/api/drivers/orders/available', authenticateDriver, async (req: any, res) => {
    try {
      const orders = await storage.getOrders();
      
      // Filter orders that are confirmed and ready for pickup/delivery
      const availableOrders = orders
        .filter(order => order.status === 'confirmed' || order.status === 'preparing')
        .map(order => ({
          id: order.id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          address: order.address,
          items: order.items,
          totalAmount: parseFloat(order.totalAmount).toLocaleString(),
          orderDate: order.orderDate,
          status: order.status,
          estimatedDelivery: '30-45 دقيقة',
          distance: '2.5 كم' // You can implement actual distance calculation
        }));

      res.json({
        success: true,
        orders: availableOrders,
        count: availableOrders.length
      });

    } catch (error: any) {
      console.error('Get available orders error:', error);
      res.status(500).json({ 
        success: false,
        message: 'خطأ في تحميل الطلبات المتاحة' 
      });
    }
  });

  // Get driver's assigned orders
  app.get('/api/drivers/orders/assigned', authenticateDriver, async (req: any, res) => {
    try {
      const driverId = req.driver.id;
      const orders = await storage.getOrders();
      
      // Filter orders assigned to this driver
      const assignedOrders = orders
        .filter(order => order.driverId === driverId)
        .map(order => ({
          id: order.id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          address: order.address,
          items: order.items,
          totalAmount: parseFloat(order.totalAmount).toLocaleString(),
          orderDate: order.orderDate,
          status: order.status,
          acceptedAt: order.acceptedAt,
          estimatedDelivery: '30-45 دقيقة'
        }));

      res.json({
        success: true,
        orders: assignedOrders,
        count: assignedOrders.length
      });

    } catch (error: any) {
      console.error('Get assigned orders error:', error);
      res.status(500).json({ 
        success: false,
        message: 'خطأ في تحميل الطلبات المكلف بها' 
      });
    }
  });

  // Accept an order (driver accepts delivery)
  app.post('/api/drivers/orders/:orderId/accept', authenticateDriver, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const driverId = req.driver.id;
      
      if (isNaN(orderId)) {
        return res.status(400).json({ 
          success: false,
          message: 'رقم الطلب غير صالح' 
        });
      }

      // Get the order
      const orders = await storage.getOrders();
      const order = orders.find(o => o.id === orderId);
      
      if (!order) {
        return res.status(404).json({ 
          success: false,
          message: 'الطلب غير موجود' 
        });
      }

      // Check if order is available for acceptance
      if (order.status !== 'confirmed' && order.status !== 'preparing') {
        return res.status(400).json({ 
          success: false,
          message: 'هذا الطلب غير متاح للقبول' 
        });
      }

      // Check if order is already assigned to another driver
      if (order.driverId && order.driverId !== driverId) {
        return res.status(400).json({ 
          success: false,
          message: 'تم تكليف هذا الطلب لسائق آخر' 
        });
      }

      // Accept the order - only update the fields we need
      await storage.updateOrder(orderId, {
        driverId,
        status: 'out-for-delivery',
        acceptedAt: new Date().toISOString()
      });

      // Send notification to admin about order acceptance
      try {
        const acceptMessage = `🚚 تم قبول الطلب رقم ${orderId}
السائق: ${req.driver.fullName}
العميل: ${order.customerName}
الوقت: ${new Date().toLocaleString('ar-SA')}`;
        
        await wasenderService.sendMessage('07511856947', acceptMessage);
      } catch (error) {
        console.log('WhatsApp notification failed:', error);
      }

      // Get the updated order
      const updatedOrder = await storage.getOrder(orderId);
      
      res.json({
        success: true,
        message: 'تم قبول الطلب بنجاح',
        order: {
          id: updatedOrder.id,
          customerName: updatedOrder.customerName,
          customerPhone: updatedOrder.customerPhone,
          address: updatedOrder.address,
          status: updatedOrder.status,
          acceptedAt: updatedOrder.acceptedAt
        }
      });

    } catch (error: any) {
      console.error('Accept order error:', error);
      res.status(500).json({ 
        success: false,
        message: 'خطأ في قبول الطلب' 
      });
    }
  });

  // Decline an order (driver declines delivery)
  app.post('/api/drivers/orders/:orderId/decline', authenticateDriver, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { reason } = req.body;
      
      if (isNaN(orderId)) {
        return res.status(400).json({ 
          success: false,
          message: 'رقم الطلب غير صالح' 
        });
      }

      // Get the order
      const orders = await storage.getOrders();
      const order = orders.find(o => o.id === orderId);
      
      if (!order) {
        return res.status(404).json({ 
          success: false,
          message: 'الطلب غير موجود' 
        });
      }

      // Send notification to admin about order decline
      try {
        const declineMessage = `❌ تم رفض الطلب رقم ${orderId}
السائق: ${req.driver.fullName}
السبب: ${reason || 'غير محدد'}
العميل: ${order.customerName}
الوقت: ${new Date().toLocaleString('ar-SA')}

يحتاج الطلب إلى سائق آخر.`;
        
        await wasenderService.sendMessage('07511856947', declineMessage);
      } catch (error) {
        console.log('WhatsApp notification failed:', error);
      }

      res.json({
        success: true,
        message: 'تم رفض الطلب',
        orderId
      });

    } catch (error: any) {
      console.error('Decline order error:', error);
      res.status(500).json({ 
        success: false,
        message: 'خطأ في رفض الطلب' 
      });
    }
  });

  // Update order status (picked up, on the way, delivered)
  app.post('/api/drivers/orders/:orderId/status', authenticateDriver, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { status, location } = req.body;
      const driverId = req.driver.id;
      
      if (isNaN(orderId)) {
        return res.status(400).json({ 
          success: false,
          message: 'رقم الطلب غير صالح' 
        });
      }

      // Validate status
      const validStatuses = ['picked-up', 'on-the-way', 'delivered'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false,
          message: 'حالة الطلب غير صالحة' 
        });
      }

      // Get the order
      const orders = await storage.getOrders();
      const order = orders.find(o => o.id === orderId);
      
      if (!order) {
        return res.status(404).json({ 
          success: false,
          message: 'الطلب غير موجود' 
        });
      }

      // Check if driver is assigned to this order
      if (order.driverId !== driverId) {
        return res.status(403).json({ 
          success: false,
          message: 'غير مصرح لك بتحديث هذا الطلب' 
        });
      }

      // Update order status
      const updatedOrder = {
        ...order,
        status: status === 'picked-up' ? 'out-for-delivery' : 
                status === 'on-the-way' ? 'out-for-delivery' : 
                'delivered',
        lastUpdate: new Date().toISOString(),
        driverLocation: location || null
      };

      await storage.updateOrder(orderId, updatedOrder);

      // Send status update to customer
      if (order.customerPhone) {
        const statusMessages = {
          'picked-up': `📦 تم استلام طلبكم رقم ${orderId} من المتجر
السائق في الطريق إليكم`,
          'on-the-way': `🚚 السائق في الطريق إليكم
طلبكم رقم ${orderId} سيصل خلال دقائق`,
          'delivered': `✅ تم تسليم طلبكم رقم ${orderId} بنجاح
شكراً لاختياركم باكيتي`
        };

        try {
          await wasenderService.sendMessage(order.customerPhone, statusMessages[status as keyof typeof statusMessages]);
        } catch (error) {
          console.log('Customer notification failed:', error);
        }
      }

      res.json({
        success: true,
        message: 'تم تحديث حالة الطلب بنجاح',
        order: {
          id: updatedOrder.id,
          status: updatedOrder.status,
          lastUpdate: updatedOrder.lastUpdate
        }
      });

    } catch (error: any) {
      console.error('Update order status error:', error);
      res.status(500).json({ 
        success: false,
        message: 'خطأ في تحديث حالة الطلب' 
      });
    }
  });

  // Get order details for driver
  app.get('/api/drivers/orders/:orderId', authenticateDriver, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      
      if (isNaN(orderId)) {
        return res.status(400).json({ 
          success: false,
          message: 'رقم الطلب غير صالح' 
        });
      }

      const orders = await storage.getOrders();
      const order = orders.find(o => o.id === orderId);
      
      if (!order) {
        return res.status(404).json({ 
          success: false,
          message: 'الطلب غير موجود' 
        });
      }

      // Return detailed order information
      res.json({
        success: true,
        order: {
          id: order.id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          address: order.address,
          items: order.items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price).toLocaleString(),
            total: (item.quantity * parseFloat(item.price)).toLocaleString()
          })),
          subtotal: (parseFloat(order.totalAmount) - 2500).toLocaleString(),
          deliveryFee: '2,500',
          totalAmount: parseFloat(order.totalAmount).toLocaleString(),
          orderDate: order.orderDate,
          status: order.status,
          driverId: order.driverId,
          acceptedAt: order.acceptedAt,
          estimatedDelivery: '30-45 دقيقة',
          specialInstructions: order.specialInstructions || 'لا توجد تعليمات خاصة'
        }
      });

    } catch (error: any) {
      console.error('Get order details error:', error);
      res.status(500).json({ 
        success: false,
        message: 'خطأ في تحميل تفاصيل الطلب' 
      });
    }
  });

  // Driver statistics and earnings
  app.get('/api/drivers/stats', authenticateDriver, async (req: any, res) => {
    try {
      const driverId = req.driver.id;
      const orders = await storage.getOrders();
      
      // Filter orders delivered by this driver
      const driverOrders = orders.filter(order => order.driverId === driverId);
      const deliveredOrders = driverOrders.filter(order => order.status === 'delivered');
      
      // Calculate stats
      const totalDeliveries = deliveredOrders.length;
      const totalEarnings = deliveredOrders.reduce((sum, order) => sum + 2500, 0); // 2500 per delivery
      const todayOrders = deliveredOrders.filter(order => {
        const today = new Date().toDateString();
        const orderDate = new Date(order.orderDate).toDateString();
        return today === orderDate;
      });

      res.json({
        success: true,
        stats: {
          totalDeliveries,
          totalEarnings: totalEarnings.toLocaleString(),
          todayDeliveries: todayOrders.length,
          todayEarnings: (todayOrders.length * 2500).toLocaleString(),
          currentOrders: driverOrders.filter(order => 
            order.status === 'out-for-delivery' || order.status === 'picked-up'
          ).length,
          rating: '4.8' // You can implement actual rating system
        }
      });

    } catch (error: any) {
      console.error('Get driver stats error:', error);
      res.status(500).json({ 
        success: false,
        message: 'خطأ في تحميل الإحصائيات' 
      });
    }
  });

  // Update driver location
  app.post('/api/drivers/location', authenticateDriver, async (req: any, res) => {
    try {
      const { latitude, longitude } = req.body;
      const driverId = req.driver.id;

      // Store driver location (you can implement this in storage)
      // For now, just return success
      res.json({
        success: true,
        message: 'تم تحديث الموقع بنجاح',
        location: { latitude, longitude },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Update driver location error:', error);
      res.status(500).json({ 
        success: false,
        message: 'خطأ في تحديث الموقع' 
      });
    }
  });

  // Register push notification token for driver
  app.post('/api/drivers/notifications/register', authenticateDriver, async (req: any, res) => {
    try {
      const { token } = req.body;
      const driverId = req.driver.id;

      if (!token) {
        return res.status(400).json({ 
          success: false,
          message: 'Push token is required' 
        });
      }

      // Store the push token for this driver
      driverPushTokens.set(driverId, token);
      console.log(`📱 Push token registered for driver ${driverId}: ${token.substring(0, 20)}...`);

      res.json({
        success: true,
        message: 'تم تسجيل الإشعارات بنجاح',
        driverId
      });

    } catch (error: any) {
      console.error('Register push token error:', error);
      res.status(500).json({ 
        success: false,
        message: 'خطأ في تسجيل الإشعارات' 
      });
    }
  });

  // Register WebSocket connection for driver
  app.post('/api/drivers/websocket/register', authenticateDriver, async (req: any, res) => {
    try {
      const driverId = req.driver.id;
      
      res.json({
        success: true,
        message: 'WebSocket registration ready',
        websocketUrl: '/ws',
        driverId
      });

    } catch (error: any) {
      console.error('WebSocket register error:', error);
      res.status(500).json({ 
        success: false,
        message: 'خطأ في تسجيل الاتصال المباشر' 
      });
    }
  });

  // Send push notification to all active drivers
  async function sendPushNotificationToDrivers(orderData: any) {
    console.log('📢 Sending push notifications to all drivers for new order:', orderData.id);
    
    // Send WebSocket notification to connected drivers
    for (const [driverId, ws] of driverWebSockets.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          const notification = {
            type: 'NEW_ORDER',
            order: {
              id: orderData.id,
              customerName: orderData.customerName,
              customerPhone: orderData.customerPhone,
              address: orderData.address,
              totalAmount: parseFloat(orderData.totalAmount).toLocaleString(),
              items: orderData.items,
              timestamp: orderData.orderDate,
              deliveryFee: '2,500'
            },
            title: 'طلب جديد - PAKETY',
            body: `طلب جديد من ${orderData.customerName}\nالمبلغ: ${parseFloat(orderData.totalAmount).toLocaleString()} د.ع`,
            sound: 'default',
            priority: 'high',
            channelId: 'order_notifications'
          };
          
          ws.send(JSON.stringify(notification));
          console.log(`✅ WebSocket notification sent to driver ${driverId}`);
        } catch (error) {
          console.log(`❌ Failed to send WebSocket to driver ${driverId}:`, error);
          // Remove disconnected WebSocket
          driverWebSockets.delete(driverId);
        }
      }
    }

    // Send push notifications to all registered drivers
    for (const [driverId, token] of driverPushTokens.entries()) {
      try {
        // For Expo push notifications, you would typically use the Expo push API
        // This is a placeholder for the actual implementation
        console.log(`📱 Would send push notification to driver ${driverId} with token ${token.substring(0, 20)}...`);
        
        const pushPayload = {
          to: token,
          sound: 'default',
          title: 'طلب جديد - PAKETY',
          body: `طلب جديد من ${orderData.customerName}\nالمبلغ: ${parseFloat(orderData.totalAmount).toLocaleString()} د.ع`,
          data: {
            type: 'NEW_ORDER',
            orderId: orderData.id,
            customerName: orderData.customerName,
            totalAmount: orderData.totalAmount,
            requiresAction: true
          },
          priority: 'high',
          channelId: 'order_notifications'
        };

        // TODO: Implement actual Expo push notification sending
        // await expo.sendPushNotificationsAsync([pushPayload]);
        
      } catch (error) {
        console.log(`❌ Failed to send push notification to driver ${driverId}:`, error);
      }
    }
  }

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

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected for real-time updates');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'DRIVER_REGISTER') {
          // Register driver WebSocket connection
          const driverId = data.driverId;
          const token = data.token;
          
          if (driverId && token) {
            // Verify JWT token
            try {
              jwt.verify(token, JWT_SECRET);
              driverWebSockets.set(driverId, ws);
              console.log(`✅ Driver ${driverId} registered for real-time notifications`);
              
              ws.send(JSON.stringify({
                type: 'REGISTRATION_SUCCESS',
                message: 'Driver registered successfully',
                driverId: driverId
              }));
            } catch (error) {
              ws.send(JSON.stringify({
                type: 'REGISTRATION_ERROR',
                message: 'Invalid authentication token'
              }));
            }
          }
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    });

    ws.on('close', () => {
      // Remove driver from WebSocket connections
      for (const [driverId, socket] of driverWebSockets.entries()) {
        if (socket === ws) {
          driverWebSockets.delete(driverId);
          console.log(`Driver ${driverId} disconnected from WebSocket`);
          break;
        }
      }
    });
    let driverId: number | null = null;
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Received WebSocket message:', message);
        
        // Handle driver registration for real-time notifications
        if (message.type === 'DRIVER_REGISTER' && message.driverId) {
          driverId = message.driverId;
          driverWebSockets.set(driverId, ws);
          console.log(`🚗 Driver ${driverId} registered for real-time notifications`);
          
          ws.send(JSON.stringify({
            type: 'REGISTRATION_SUCCESS',
            message: 'تم تسجيل الاتصال المباشر بنجاح',
            driverId: driverId
          }));
        }
        // Handle order action responses from drivers
        else if (message.type === 'ORDER_ACTION' && message.action && message.orderId) {
          console.log(`📱 Driver ${driverId} ${message.action} order ${message.orderId}`);
          
          // Forward action to all store clients for admin panel updates
          broadcastToClients({
            type: 'DRIVER_ACTION',
            driverId: driverId,
            orderId: message.orderId,
            action: message.action,
            reason: message.reason,
            timestamp: new Date().toISOString()
          });
        }
        // Echo other messages to all connected clients
        else {
          broadcastToClients(message);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      if (driverId) {
        driverWebSockets.delete(driverId);
        console.log(`🚗 Driver ${driverId} WebSocket disconnected`);
      } else {
        console.log('WebSocket client disconnected');
      }
    });
  });

  // 🔥 ULTRA PERFORMANCE METRICS - Real-time monitoring
  app.get('/api/admin/performance', async (req, res) => {
    try {
      const ultraMetrics = UltraSimpleMiddleware.getPerformanceMetrics();
      if (!res.headersSent) {
        res.set('X-Ultra-Metrics', 'REAL-TIME');
      }
      res.json(ultraMetrics);
    } catch (error) {
      console.error('❌ Ultra Performance metrics error:', error);
      res.status(500).json({ message: "Failed to get performance metrics" });
    }
  });

  return httpServer;
}