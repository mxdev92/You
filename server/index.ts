import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import path from "path";
import { registerRoutes } from "./routes";
import expoApiRoutes from "./expo-api-routes.js";
import { setupVite, serveStatic, log } from "./vite";

// 🚨 CRITICAL: Check environment variables for deployment
if (!process.env.DATABASE_URL) {
  console.error('❌ DEPLOYMENT ERROR: DATABASE_URL is missing');
  console.error('🔧 Set DATABASE_URL environment variable for deployment');
  // Don't exit in development, but warn
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Configure session middleware with persistent sessions and PostgreSQL store
import connect_pg_simple from 'connect-pg-simple';

const pgSession = connect_pg_simple(session);

app.use(session({
  store: new pgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'session',
    createTableIfMissing: true,
    pruneSessionInterval: false, // Don't auto-delete sessions
    errorLog: (...args) => console.error('PG Session Error:', ...args)
  }),
  secret: process.env.SESSION_SECRET || 'yalla-jeetek-secret-key-12345',
  resave: true, // CRITICAL: Force resave to store to ensure data persistence
  saveUninitialized: false, // Don't create sessions for unauthenticated users
  rolling: true, // Reset expiration on activity
  name: 'connect.sid', // Must match cookie name exactly
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year - effectively permanent
    sameSite: 'lax', // Important for cross-origin requests
    domain: undefined // Let Express determine the domain automatically
  }
}));

// Serve attached assets (uploaded images)
app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

// Aggressive cache control for production deployment updates
app.use((req, res, next) => {
  // Force no cache for HTML files and main app routes
  if (req.path === '/' || req.path.endsWith('.html') || req.path.includes('index')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Last-Modified', '0');
    res.setHeader('If-Modified-Since', '0');
    res.setHeader('ETag', '');
  }
  // API endpoints should never be cached
  if (req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Type', 'application/json');
  }
  next();
});

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
  try {
    console.log('🚀 Starting PAKETY server...');
    console.log('📊 Environment:', process.env.NODE_ENV);
    console.log('🔗 Database URL present:', !!process.env.DATABASE_URL);

    // Register Expo mobile API routes BEFORE main routes to avoid conflicts
    app.use(expoApiRoutes);
    
    const server = await registerRoutes(app);
    console.log('✅ Routes registered successfully');

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error details for debugging
    console.error('🚨 SERVER ERROR:', {
      status,
      message,
      stack: err.stack,
      url: _req.url,
      method: _req.method
    });

    res.status(status).json({ 
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err 
      })
    });
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
    const port = process.env.PORT || 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      console.log(`🚀 PAKETY server running on port ${port}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`💡 Ultra Performance Mode: ACTIVE`);
      log(`serving on port ${port}`);
    });

  } catch (error) {
    console.error('💥 FATAL ERROR starting server:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();
