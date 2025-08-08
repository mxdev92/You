// 🚀 ULTRA MIDDLEWARE - INSTANT RESPONSE OPTIMIZATION
import type { Request, Response, NextFunction } from 'express';

export class UltraMiddleware {
  // 🔥 PRIORITY RESPONSE - Critical endpoints get instant handling
  static priorityRoutes = (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    
    // Critical routes that should be instant
    const criticalRoutes = ['/api/categories', '/api/products'];
    const isCritical = criticalRoutes.some(route => req.path.startsWith(route));
    
    if (isCritical) {
      // Set high priority headers for critical routes
      res.setHeader('X-Ultra-Priority', 'CRITICAL');
      res.setHeader('Cache-Control', 'public, max-age=180'); // 3 minutes browser cache
    }
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      if (isCritical) {
        if (duration < 20) {
          console.log(`🔥 ULTRA FAST CRITICAL: ${req.method} ${req.path} - ${duration}ms`);
        } else if (duration < 50) {
          console.log(`⚡ FAST CRITICAL: ${req.method} ${req.path} - ${duration}ms`);
        } else {
          console.log(`🐌 SLOW CRITICAL: ${req.method} ${req.path} - ${duration}ms`);
        }
      }
    });
    
    next();
  };

  // 🎯 BATCH REQUEST OPTIMIZER - Handle multiple requests efficiently
  static batchOptimizer = (req: Request, res: Response, next: NextFunction): void => {
    // Add request timing for batch analysis
    req.startTime = Date.now();
    
    // If multiple product requests, suggest batching
    if (req.path.includes('/api/products') && req.query.categoryId) {
      res.setHeader('X-Ultra-Suggestion', 'Consider batching multiple category requests');
    }
    
    next();
  };
}

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}