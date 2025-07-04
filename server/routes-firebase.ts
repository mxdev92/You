import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { firebaseStorage } from "./firebase-realtime";
import { insertProductSchema, insertOrderSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(app: Express): Server {
  // Cache control headers
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

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await firebaseStorage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Failed to get categories:", error);
      res.status(500).json({ error: "Failed to get categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const category = await firebaseStorage.createCategory(req.body);
      res.json(category);
    } catch (error) {
      console.error("Failed to create category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await firebaseStorage.updateCategory(id, req.body);
      res.json(category);
    } catch (error) {
      console.error("Failed to update category:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await firebaseStorage.deleteCategory(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const search = req.query.search as string;
      
      let products = await firebaseStorage.getProducts();
      
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
      console.error("Failed to get products:", error);
      res.status(500).json({ error: "Failed to get products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await firebaseStorage.createProduct(validatedData);
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid product data", details: error.errors });
      }
      console.error("Failed to create product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await firebaseStorage.updateProduct(id, req.body);
      res.json(product);
    } catch (error) {
      console.error("Failed to update product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await firebaseStorage.deleteProduct(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Orders
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await firebaseStorage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Failed to get orders:", error);
      res.status(500).json({ error: "Failed to get orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await firebaseStorage.createOrder(validatedData);
      
      // Broadcast new order to WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: 'NEW_ORDER', 
            order: order 
          }));
        }
      });
      
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid order data", details: error.errors });
      }
      console.error("Failed to create order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const order = await firebaseStorage.updateOrderStatus(id, status);
      res.json(order);
    } catch (error) {
      console.error("Failed to update order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // Authentication routes (simplified for Firebase)
  app.get("/api/auth/session", (req, res) => {
    res.status(401).json({ message: "Use Firebase Authentication" });
  });

  app.post("/api/auth/signup", (req, res) => {
    res.status(401).json({ message: "Use Firebase Authentication" });
  });

  app.post("/api/auth/signin", (req, res) => {
    res.status(401).json({ message: "Use Firebase Authentication" });
  });

  app.post("/api/auth/signout", (req, res) => {
    res.status(401).json({ message: "Use Firebase Authentication" });
  });

  // Cart operations (simplified - using localStorage on client)
  app.get("/api/cart", (req, res) => {
    res.json([]);
  });

  app.post("/api/cart", (req, res) => {
    res.json({ success: true });
  });

  app.delete("/api/cart/:id", (req, res) => {
    res.json({ success: true });
  });

  app.patch("/api/cart/:id", (req, res) => {
    res.json({ success: true });
  });

  // User addresses (simplified)
  app.get("/api/user/addresses", (req, res) => {
    res.json([]);
  });

  app.post("/api/user/addresses", (req, res) => {
    res.json({ success: true });
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      console.log('Received WebSocket message:', message.toString());
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    // Send welcome message
    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'WebSocket connected' }));
  });

  return httpServer;
}