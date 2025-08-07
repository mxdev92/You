// 🚀 PAKETY Performance Optimization Module
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import type { Application, Request, Response, NextFunction } from 'express';

// 📊 Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, { totalTime: number, requests: number, payloadSize: number }> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  logRequest(route: string, responseTime: number, payloadSize: number) {
    const existing = this.metrics.get(route) || { totalTime: 0, requests: 0, payloadSize: 0 };
    existing.totalTime += responseTime;
    existing.requests++;
    existing.payloadSize += payloadSize;
    this.metrics.set(route, existing);

    // Log slow requests (>300ms)
    if (responseTime > 300) {
      console.warn(`🐌 SLOW REQUEST: ${route} - ${responseTime}ms - ${payloadSize} bytes`);
    }
  }

  getMetrics() {
    const summary: any = {};
    this.metrics.forEach((data, route) => {
      summary[route] = {
        avgResponseTime: Math.round(data.totalTime / data.requests),
        totalRequests: data.requests,
        avgPayloadSize: Math.round(data.payloadSize / data.requests)
      };
    });
    return summary;
  }

  reset() {
    this.metrics.clear();
  }
}

// 🗄️ Smart caching system
export class SmartCache {
  private static instance: SmartCache;
  private cache: NodeCache;

  constructor() {
    // Default TTL: 60 seconds for most data
    this.cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });
  }

  static getInstance(): SmartCache {
    if (!SmartCache.instance) {
      SmartCache.instance = new SmartCache();
    }
    return SmartCache.instance;
  }

  // Cache products by category (2 minutes TTL)
  cacheProducts(categoryId: number | 'all', products: any[]) {
    const key = `products_${categoryId}`;
    this.cache.set(key, products, 120);
    console.log(`✅ Cached ${products.length} products for category: ${categoryId}`);
  }

  getProducts(categoryId: number | 'all'): any[] | null {
    const key = `products_${categoryId}`;
    const cached = this.cache.get(key);
    if (cached) {
      console.log(`🎯 Cache HIT for products: ${categoryId}`);
      return cached as any[];
    }
    console.log(`❌ Cache MISS for products: ${categoryId}`);
    return null;
  }

  // Cache categories (5 minutes TTL)
  cacheCategories(categories: any[]) {
    this.cache.set('categories', categories, 300);
    console.log(`✅ Cached ${categories.length} categories`);
  }

  getCategories(): any[] | null {
    const cached = this.cache.get('categories');
    if (cached) {
      console.log(`🎯 Cache HIT for categories`);
      return cached as any[];
    }
    console.log(`❌ Cache MISS for categories`);
    return null;
  }

  // Invalidate cache when data changes
  invalidateProducts(categoryId?: number) {
    if (categoryId) {
      this.cache.del(`products_${categoryId}`);
      console.log(`🗑️ Invalidated cache for category: ${categoryId}`);
    } else {
      // Invalidate all product caches
      const keys = this.cache.keys().filter(key => key.startsWith('products_'));
      keys.forEach(key => this.cache.del(key));
      console.log(`🗑️ Invalidated all product caches`);
    }
  }

  invalidateCategories() {
    this.cache.del('categories');
    console.log(`🗑️ Invalidated categories cache`);
  }

  getStats() {
    return this.cache.getStats();
  }
}

// 🔧 Performance middleware
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function(data: any) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const payloadSize = Buffer.byteLength(JSON.stringify(data || ''), 'utf8');
    
    PerformanceMonitor.getInstance().logRequest(
      `${req.method} ${req.path}`,
      responseTime,
      payloadSize
    );

    return originalSend.call(this, data);
  };

  next();
};

// 📦 Optimized JSON response helper
export const sendOptimizedResponse = (res: Response, data: any, cacheControl = 'public, max-age=60') => {
  // Set caching headers
  res.set('Cache-Control', cacheControl);
  res.set('ETag', `"${Date.now()}"`);
  
  // Remove null/undefined values to reduce payload
  const cleanData = JSON.parse(JSON.stringify(data, (key, value) => {
    return value === null || value === undefined ? undefined : value;
  }));

  return res.json(cleanData);
};

// 🛡️ Security and performance setup
export const setupPerformanceOptimizations = (app: Application) => {
  // 1. Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for API usage
    crossOriginEmbedderPolicy: false
  }));

  // 2. Compression (Gzip/Brotli)
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Good balance between speed and compression
    threshold: 1024 // Only compress responses > 1KB
  }));

  // 3. Rate limiting with trust proxy
  app.set('trust proxy', 1); // Trust first proxy
  
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 300, // Limit each IP to 300 requests per minute
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // 4. Performance monitoring
  app.use(performanceMiddleware);

  // 5. Keep-alive headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.set('Connection', 'keep-alive');
    next();
  });

  console.log('🚀 Performance optimizations enabled: Compression, Rate Limiting, Caching, Monitoring');
};

// 📈 Performance metrics endpoint
export const getPerformanceMetrics = () => {
  const monitor = PerformanceMonitor.getInstance();
  const cache = SmartCache.getInstance();
  
  return {
    timestamp: new Date().toISOString(),
    requests: monitor.getMetrics(),
    cache: cache.getStats(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    targets: {
      p90_latency_target_ms: 300,
      cache_hit_target_percent: 80,
      payload_reduction_target_percent: 50
    }
  };
};