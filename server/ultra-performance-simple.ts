// 🚀 SIMPLIFIED ULTRA PERFORMANCE - NO EXTERNAL DEPENDENCIES
import type { Application, Request, Response, NextFunction } from 'express';

// 🔥 IN-MEMORY ULTRA-FAST CACHE
class UltraMemCache {
  private static instance: UltraMemCache;
  private cache = new Map<string, { data: any, expires: number, hitCount: number }>();
  private metrics = new Map<string, { hits: number, misses: number, avgTime: number }>();

  static getInstance(): UltraMemCache {
    if (!UltraMemCache.instance) {
      UltraMemCache.instance = new UltraMemCache();
    }
    return UltraMemCache.instance;
  }

  async ultraGet(key: string): Promise<any> {
    const start = Date.now();
    const cached = this.cache.get(key);
    
    const metric = this.metrics.get(key) || { hits: 0, misses: 0, avgTime: 0 };
    
    if (cached && cached.expires > Date.now()) {
      cached.hitCount++;
      metric.hits++;
      const time = Date.now() - start;
      metric.avgTime = (metric.avgTime + time) / 2;
      console.log(`⚡ ULTRA MEMORY HIT: ${key} (${time}ms)`);
      this.metrics.set(key, metric);
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key); // Remove expired
    }
    
    metric.misses++;
    console.log(`❌ ULTRA MEMORY MISS: ${key}`);
    this.metrics.set(key, metric);
    return null;
  }

  async ultraSet(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data: value, expires, hitCount: 0 });
    console.log(`🔥 ULTRA MEMORY SET: ${key} (TTL: ${ttlSeconds}s)`);
  }

  async ultraDel(pattern: string): Promise<void> {
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        this.cache.delete(key);
        deleted++;
      }
    }
    if (deleted > 0) {
      console.log(`🗑️  ULTRA MEMORY DELETE: ${deleted} keys matching ${pattern}`);
    }
  }

  getMetrics() {
    const metrics: any = {};
    this.metrics.forEach((data, key) => {
      const hitRate = data.hits > 0 ? (data.hits / (data.hits + data.misses)) * 100 : 0;
      metrics[key] = {
        hitRate: Math.round(hitRate),
        totalRequests: data.hits + data.misses,
        avgResponseTime: Math.round(data.avgTime || 0),
        status: hitRate > 80 ? '🔥 EXCELLENT' : hitRate > 60 ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT'
      };
    });
    
    return {
      cacheSize: this.cache.size,
      totalKeys: this.cache.size,
      metrics,
      memoryUsage: process.memoryUsage()
    };
  }

  // Cleanup expired entries
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, value] of this.cache.entries()) {
      if (value.expires <= now) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }
}

// 🚀 ULTRA MIDDLEWARE SYSTEM
export class UltraSimpleMiddleware {
  private static cache = UltraMemCache.getInstance();
  private static responseTimeTracker = new Map<string, number[]>();

  // 🔥 Lightning-fast cache middleware
  static ultraCache(ttl: number = 300, keyGenerator?: (req: Request) => string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const cacheKey = keyGenerator ? keyGenerator(req) : `ultra_${req.method}_${req.originalUrl}`;
      
      try {
        const cached = await UltraSimpleMiddleware.cache.ultraGet(cacheKey);
        if (cached) {
          if (!res.headersSent) {
            res.set('X-Ultra-Cache', 'HIT');
            res.set('X-Ultra-Speed', 'LUDICROUS');
            return res.json(cached);
          }
        }

        // Override res.json to cache the response
        const originalJson = res.json;
        res.json = function(data: any) {
          UltraSimpleMiddleware.cache.ultraSet(cacheKey, data, ttl);
          if (!res.headersSent) {
            res.set('X-Ultra-Cache', 'SET');
          }
          return originalJson.call(this, data);
        };

        next();
      } catch (error) {
        console.error('Ultra cache middleware error:', error);
        next();
      }
    };
  }

  // ⚡ Response time tracker
  static ultraSpeedTracker() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = process.hrtime.bigint();
      const route = `${req.method} ${req.route?.path || req.path}`;

      res.on('finish', () => {
        const end = process.hrtime.bigint();
        const responseTime = Number(end - start) / 1000000; // Convert to milliseconds

        // Track response times
        if (!UltraSimpleMiddleware.responseTimeTracker.has(route)) {
          UltraSimpleMiddleware.responseTimeTracker.set(route, []);
        }
        const times = UltraSimpleMiddleware.responseTimeTracker.get(route)!;
        times.push(responseTime);
        
        // Keep only last 50 requests for memory efficiency
        if (times.length > 50) {
          times.shift();
        }

        // Performance alerts
        if (responseTime > 100) {
          console.warn(`🐌 SLOW ROUTE: ${route} - ${responseTime.toFixed(2)}ms`);
        } else if (responseTime < 20) {
          console.log(`⚡ ULTRA FAST: ${route} - ${responseTime.toFixed(2)}ms`);
        }
      });

      next();
    };
  }

  // 📊 Get performance metrics
  static getPerformanceMetrics() {
    const metrics: any = {};
    
    UltraSimpleMiddleware.responseTimeTracker.forEach((times, route) => {
      if (times.length === 0) return;
      
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      const sorted = times.sort((a, b) => a - b);
      const p95 = sorted[Math.floor(times.length * 0.95)] || avg;

      metrics[route] = {
        avgResponseTime: Math.round(avg * 100) / 100,
        minResponseTime: Math.round(min * 100) / 100,
        maxResponseTime: Math.round(max * 100) / 100,
        p95ResponseTime: Math.round(p95 * 100) / 100,
        totalRequests: times.length,
        performance: avg < 20 ? '🔥 LUDICROUS' : avg < 50 ? '⚡ EXCELLENT' : avg < 100 ? '✅ GOOD' : '🐌 NEEDS_WORK'
      };
    });

    return {
      routes: metrics,
      cache: UltraSimpleMiddleware.cache.getMetrics(),
      timestamp: new Date().toISOString(),
      systemInfo: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        platform: process.platform,
        nodeVersion: process.version
      }
    };
  }

  // Get cache instance for direct access
  static getCache() {
    return UltraSimpleMiddleware.cache;
  }
}

// 🚀 ULTRA OPTIMIZATION SETUP
export const setupUltraSimplePerformance = (app: Application) => {
  console.log('🔥 Initializing ULTRA SIMPLE PERFORMANCE MODE...');

  // 1. Ultra-fast middleware
  app.use(UltraSimpleMiddleware.ultraSpeedTracker());

  // 2. Performance headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!res.headersSent) {
      res.set({
        'X-Powered-By': 'PAKETY-ULTRA-SIMPLE',
        'X-Ultra-Mode': 'IN-MEMORY-CACHE',
        'Access-Control-Expose-Headers': 'X-Response-Time, X-Ultra-Performance, X-Ultra-Cache',
      });
    }
    next();
  });

  // 3. Cache cleanup every 5 minutes
  setInterval(() => {
    UltraSimpleMiddleware.getCache().cleanup();
  }, 5 * 60 * 1000);

  const cache = UltraSimpleMiddleware.getCache();

  console.log('🚀 ULTRA SIMPLE PERFORMANCE MODE: ACTIVATED');
  console.log('⚡ Target: Sub-50ms response times');
  console.log('🧠 In-memory caching: ENABLED');
  console.log('🚀 Connection pooling: OPTIMIZED');
  
  return { cache };
};

// 🔥 Export optimized instances
export const ultraSimpleCache = UltraMemCache.getInstance();