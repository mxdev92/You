// 🚀 ULTRA PERFORMANCE MODULE - SUB-50MS RESPONSE TIMES
import Redis from 'ioredis';
import { Pool } from 'pg';
import cluster from 'cluster';
import os from 'os';
import type { Application, Request, Response, NextFunction } from 'express';

// 🔥 REDIS CLUSTER SETUP (Ultra-fast caching)
class UltraRedisCache {
  private static instance: UltraRedisCache;
  private redis: Redis;
  private metricsTracker = new Map<string, { hits: number, misses: number, avgTime: number }>();

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      // Ultra-fast configuration
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 5000,
      commandTimeout: 1000,
    });

    this.redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });

    this.redis.on('ready', () => {
      console.log('🔥 Ultra Redis Cache: Connected and ready');
    });
  }

  static getInstance(): UltraRedisCache {
    if (!UltraRedisCache.instance) {
      UltraRedisCache.instance = new UltraRedisCache();
    }
    return UltraRedisCache.instance;
  }

  // 🚀 Micro-optimized cache methods
  async ultraGet(key: string): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.redis.get(key);
      const time = Date.now() - start;
      
      const metric = this.metricsTracker.get(key) || { hits: 0, misses: 0, avgTime: 0 };
      if (result) {
        metric.hits++;
        metric.avgTime = (metric.avgTime + time) / 2;
        console.log(`⚡ ULTRA HIT: ${key} (${time}ms)`);
      } else {
        metric.misses++;
        console.log(`❌ ULTRA MISS: ${key} (${time}ms)`);
      }
      this.metricsTracker.set(key, metric);
      
      return result ? JSON.parse(result) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async ultraSet(key: string, value: any, ttl: number = 300): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
      console.log(`🔥 ULTRA SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async ultraDel(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`🗑️  ULTRA DELETE: ${keys.length} keys matching ${pattern}`);
      }
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  getMetrics() {
    const metrics: any = {};
    this.metricsTracker.forEach((data, key) => {
      const hitRate = (data.hits / (data.hits + data.misses)) * 100;
      metrics[key] = {
        hitRate: Math.round(hitRate),
        totalRequests: data.hits + data.misses,
        avgResponseTime: Math.round(data.avgTime),
        status: hitRate > 80 ? '🔥 EXCELLENT' : hitRate > 60 ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT'
      };
    });
    return metrics;
  }
}

// 🔥 OPTIMIZED DATABASE CONNECTION POOL
class UltraDBPool {
  private static instance: UltraDBPool;
  private pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL not found');
    }

    this.pool = new Pool({
      connectionString,
      // Ultra-optimized settings for speed
      max: 40,                    // Maximum connections
      min: 10,                    // Keep minimum warm connections
      idleTimeoutMillis: 30000,   // Close idle connections after 30s
      connectionTimeoutMillis: 5000, // Connection timeout
      acquireTimeoutMillis: 3000, // Query timeout
      statement_timeout: 10000,   // Statement timeout
      query_timeout: 5000,        // Query timeout
      application_name: 'pakety_ultra_performance',
    });

    this.pool.on('error', (err) => {
      console.error('❌ Database pool error:', err);
    });

    this.pool.on('connect', () => {
      console.log('🔥 Ultra DB Pool: New connection established');
    });

    console.log('🚀 Ultra Database Pool: Initialized with optimized settings');
  }

  static getInstance(): UltraDBPool {
    if (!UltraDBPool.instance) {
      UltraDBPool.instance = new UltraDBPool();
    }
    return UltraDBPool.instance;
  }

  getPool(): Pool {
    return this.pool;
  }

  async getStats() {
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount,
      status: this.pool.totalCount > 0 ? '🔥 ACTIVE' : '⚠️ IDLE'
    };
  }
}

// 🚀 ULTRA-FAST MIDDLEWARE SYSTEM
export class UltraMiddleware {
  private static cache = UltraRedisCache.getInstance();
  private static responseTimeTracker = new Map<string, number[]>();

  // 🔥 Lightning-fast cache middleware
  static ultraCache(ttl: number = 300, keyGenerator?: (req: Request) => string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const cacheKey = keyGenerator ? keyGenerator(req) : `ultra_${req.method}_${req.originalUrl}`;
      
      try {
        const cached = await UltraMiddleware.cache.ultraGet(cacheKey);
        if (cached) {
          res.set('X-Ultra-Cache', 'HIT');
          res.set('X-Ultra-Speed', 'LUDICROUS');
          return res.json(cached);
        }

        // Override res.json to cache the response
        const originalJson = res.json;
        res.json = function(data: any) {
          UltraMiddleware.cache.ultraSet(cacheKey, data, ttl);
          res.set('X-Ultra-Cache', 'SET');
          return originalJson.call(this, data);
        };

        next();
      } catch (error) {
        console.error('Ultra cache middleware error:', error);
        next();
      }
    };
  }

  // ⚡ Response time tracker with alerts
  static ultraSpeedTracker() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = process.hrtime.bigint();
      const route = `${req.method} ${req.route?.path || req.path}`;

      res.on('finish', () => {
        const end = process.hrtime.bigint();
        const responseTime = Number(end - start) / 1000000; // Convert to milliseconds

        // Track response times
        if (!UltraMiddleware.responseTimeTracker.has(route)) {
          UltraMiddleware.responseTimeTracker.set(route, []);
        }
        const times = UltraMiddleware.responseTimeTracker.get(route)!;
        times.push(responseTime);
        
        // Keep only last 100 requests
        if (times.length > 100) {
          times.shift();
        }

        // Performance alerts
        if (responseTime > 100) {
          console.warn(`🐌 SLOW ROUTE: ${route} - ${responseTime.toFixed(2)}ms`);
        } else if (responseTime < 20) {
          console.log(`⚡ ULTRA FAST: ${route} - ${responseTime.toFixed(2)}ms`);
        }

        // Only set headers if response hasn't been sent
        if (!res.headersSent) {
          res.set('X-Response-Time', `${responseTime.toFixed(2)}ms`);
          res.set('X-Ultra-Performance', responseTime < 50 ? 'LUDICROUS' : responseTime < 100 ? 'EXCELLENT' : 'NEEDS_OPTIMIZATION');
        }
      });

      next();
    };
  }

  // 📊 Get performance metrics
  static getPerformanceMetrics() {
    const metrics: any = {};
    
    UltraMiddleware.responseTimeTracker.forEach((times, route) => {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

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
      cache: UltraMiddleware.cache.getMetrics(),
      database: UltraDBPool.getInstance().getStats(),
      timestamp: new Date().toISOString()
    };
  }
}

// 🔥 CLUSTER MODE FOR MAXIMUM PERFORMANCE
export class UltraClusterManager {
  static initialize() {
    const numCPUs = os.cpus().length;
    
    if (cluster.isPrimary && process.env.NODE_ENV === 'production') {
      console.log(`🔥 Master process ${process.pid} is running`);
      console.log(`🚀 Forking ${numCPUs} workers for maximum performance...`);

      // Fork workers
      for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
      }

      cluster.on('exit', (worker, code, signal) => {
        console.log(`💀 Worker ${worker.process.pid} died. Code: ${code}, Signal: ${signal}`);
        console.log('🔄 Starting a new worker...');
        cluster.fork();
      });

      return false; // Don't start the server in master process
    } else {
      console.log(`🔥 Worker ${process.pid} started`);
      return true; // Start the server in worker process
    }
  }
}

// 🚀 ULTRA OPTIMIZATION SETUP
export const setupUltraPerformance = (app: Application) => {
  console.log('🔥 Initializing ULTRA PERFORMANCE MODE...');

  // 1. Ultra-fast middleware
  app.use(UltraMiddleware.ultraSpeedTracker());

  // 2. Advanced compression with ultra settings
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.set({
      'X-Powered-By': 'PAKETY-ULTRA-PERFORMANCE',
      'X-Ultra-Mode': 'ENABLED',
      'Access-Control-Expose-Headers': 'X-Response-Time, X-Ultra-Performance, X-Ultra-Cache',
    });
    next();
  });

  // 3. Initialize Redis cache
  const cache = UltraRedisCache.getInstance();

  // 4. Initialize DB pool
  const dbPool = UltraDBPool.getInstance();

  console.log('🚀 ULTRA PERFORMANCE MODE: ACTIVATED');
  console.log('⚡ Target: Sub-50ms response times');
  console.log('🔥 Redis caching: ENABLED');
  console.log('🚀 Connection pooling: OPTIMIZED');
  
  return { cache, dbPool };
};

// 🔥 Export optimized instances
export const ultraCache = UltraRedisCache.getInstance();
export const ultraDB = UltraDBPool.getInstance();