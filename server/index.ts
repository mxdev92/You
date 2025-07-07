import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import whatsappService from "./whatsapp-service-bulletproof-permanent.js";
import baileysOTPService from "./baileys-otp-service.js";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Health check endpoint for deployment
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Configure session middleware with persistent sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'yalla-jeetek-secret-key-12345',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on activity
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year - effectively permanent
  }
}));

// Serve attached assets (uploaded images)
app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    
    // Initialize WhatsApp services AFTER server is listening
    initializeWhatsAppService();
    initializeBaileysOTPService();
  });
})();

// Initialize WhatsApp service with timeout and error handling
async function initializeWhatsAppService() {
  try {
    console.log('🚀 Starting WhatsApp service initialization...');
    
    // Add timeout to prevent blocking
    const initPromise = whatsappService.initialize();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('WhatsApp initialization timeout')), 30000)
    );
    
    await Promise.race([initPromise, timeoutPromise]);
    console.log('✅ WhatsApp service initialized successfully');
  } catch (error) {
    console.error('❌ WhatsApp service initialization failed:', error);
    console.log('📱 WhatsApp features will be disabled until connected');
    console.log('📱 Server is running normally without WhatsApp functionality');
  }
}

// Initialize Baileys OTP service with timeout and error handling
async function initializeBaileysOTPService() {
  // Add delay to avoid conflicts
  setTimeout(async () => {
    try {
      console.log('🚀 Starting Baileys WhatsApp OTP service...');
      
      // Add timeout to prevent blocking
      const initPromise = baileysOTPService.initialize();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Baileys OTP initialization timeout')), 30000)
      );
      
      await Promise.race([initPromise, timeoutPromise]);
      console.log('✅ Baileys WhatsApp OTP service ready');
    } catch (error) {
      console.error('❌ Baileys OTP service initialization failed:', error);
      console.log('📱 OTP will use manual fallback when needed');
    }
  }, 7000); // Start 7 seconds after server start
}
