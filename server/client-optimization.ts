// 🚀 CLIENT-SIDE OPTIMIZATION TECHNIQUES
// Making React Native and Web apps load instantly

export const ClientOptimizationHeaders = {
  // 📱 REACT NATIVE OPTIMIZATIONS
  reactNative: {
    'X-RN-Optimized': 'true',
    'X-Compression': 'gzip',
    'X-Cache-Strategy': 'aggressive',
    'X-Prefetch': 'enabled',
    'Content-Encoding': 'gzip'
  },

  // 🌐 WEB BROWSER OPTIMIZATIONS  
  web: {
    'X-Web-Optimized': 'true',
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  },

  // ⚡ PERFORMANCE HEADERS
  performance: {
    'X-Response-Time': '0ms', // Will be set dynamically
    'X-Cache-Status': 'MISS', // Will be set dynamically
    'X-Server-Timing': 'cache;dur=0, db;dur=0, total;dur=0',
    'X-Performance-Target': 'sub-5ms'
  }
};

// 🎯 SMART PAYLOAD OPTIMIZATION
export class PayloadOptimizer {
  static optimizeForClient(data: any, userAgent?: string): any {
    const isReactNative = userAgent?.includes('ReactNative') || userAgent?.includes('Expo');
    const isMobile = userAgent?.includes('Mobile') || isReactNative;

    if (isReactNative) {
      return this.optimizeForReactNative(data);
    } else if (isMobile) {
      return this.optimizeForMobile(data);
    } else {
      return this.optimizeForDesktop(data);
    }
  }

  // 📱 React Native specific optimizations
  private static optimizeForReactNative(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.compactObject(item));
    }
    return this.compactObject(data);
  }

  // 📱 Mobile web optimizations
  private static optimizeForMobile(data: any): any {
    // Remove unnecessary fields for mobile
    if (Array.isArray(data)) {
      return data.map(item => this.mobileCompact(item));
    }
    return this.mobileCompact(data);
  }

  // 🖥️ Desktop optimizations
  private static optimizeForDesktop(data: any): any {
    // Desktop can handle full payloads
    return data;
  }

  // 🗜️ Remove null/undefined values and compact objects
  private static compactObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    const compacted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object' && !Array.isArray(value)) {
          const nested = this.compactObject(value);
          if (Object.keys(nested).length > 0) {
            compacted[key] = nested;
          }
        } else {
          compacted[key] = value;
        }
      }
    }
    return compacted;
  }

  // 📱 Mobile-specific field removal
  private static mobileCompact(obj: any): any {
    const compacted = this.compactObject(obj);
    
    // Remove heavy fields for mobile
    const mobileExclude = ['fullDescription', 'metadata', 'additionalImages'];
    mobileExclude.forEach(field => {
      if (compacted[field]) delete compacted[field];
    });
    
    return compacted;
  }
}

// 🔮 SMART PREFETCHING STRATEGIES
export class SmartPrefetcher {
  private static prefetchRules = new Map([
    ['products', ['categories', 'cart']],
    ['categories', ['products']],
    ['cart', ['products', 'wallet', 'addresses']],
    ['orders', ['products', 'addresses', 'drivers']],
    ['wallet', ['orders', 'transactions']],
    ['auth', ['cart', 'addresses', 'wallet']]
  ]);

  static getSuggestedPrefetch(currentEndpoint: string): string[] {
    const resourceType = this.extractResourceType(currentEndpoint);
    return this.prefetchRules.get(resourceType) || [];
  }

  private static extractResourceType(endpoint: string): string {
    if (endpoint.includes('products')) return 'products';
    if (endpoint.includes('categories')) return 'categories';
    if (endpoint.includes('cart')) return 'cart';
    if (endpoint.includes('orders')) return 'orders';
    if (endpoint.includes('wallet')) return 'wallet';
    if (endpoint.includes('auth')) return 'auth';
    return 'unknown';
  }

  static generatePrefetchHeaders(suggestions: string[]): Record<string, string> {
    if (suggestions.length === 0) return {};
    
    return {
      'X-Prefetch-Suggestions': suggestions.join(','),
      'X-Prefetch-Priority': 'high',
      'Link': suggestions.map(s => `</api/${s}>; rel=prefetch`).join(', ')
    };
  }
}

// 💨 RESPONSE COMPRESSION
export class ResponseCompressor {
  static shouldCompress(userAgent?: string, acceptEncoding?: string): boolean {
    // Always compress for mobile and React Native
    if (userAgent?.includes('Mobile') || userAgent?.includes('ReactNative')) {
      return true;
    }
    
    // Check if client accepts compression
    return acceptEncoding?.includes('gzip') || acceptEncoding?.includes('deflate') || false;
  }

  static getOptimalCompression(payloadSize: number): string {
    if (payloadSize > 10000) return 'gzip'; // Large payloads
    if (payloadSize > 1000) return 'deflate'; // Medium payloads
    return 'none'; // Small payloads don't need compression
  }
}

// 📊 CLIENT PERFORMANCE METRICS
export class ClientMetrics {
  private static metrics = new Map<string, {
    totalRequests: number;
    totalTime: number;
    avgTime: number;
    cacheHits: number;
    userAgents: Set<string>;
  }>();

  static recordMetric(endpoint: string, responseTime: number, cacheHit: boolean, userAgent?: string) {
    const key = this.normalizeEndpoint(endpoint);
    const current = this.metrics.get(key) || {
      totalRequests: 0,
      totalTime: 0,
      avgTime: 0,
      cacheHits: 0,
      userAgents: new Set()
    };

    current.totalRequests++;
    current.totalTime += responseTime;
    current.avgTime = current.totalTime / current.totalRequests;
    if (cacheHit) current.cacheHits++;
    if (userAgent) current.userAgents.add(userAgent);

    this.metrics.set(key, current);
  }

  private static normalizeEndpoint(endpoint: string): string {
    // Remove query parameters and IDs for grouping
    return endpoint
      .replace(/\/\d+/g, '/:id')
      .replace(/\?.*$/, '')
      .toLowerCase();
  }

  static getPerformanceReport(): any {
    const report: any = {};
    
    for (const [endpoint, metrics] of this.metrics.entries()) {
      report[endpoint] = {
        totalRequests: metrics.totalRequests,
        avgResponseTime: Math.round(metrics.avgTime * 100) / 100,
        cacheHitRate: Math.round((metrics.cacheHits / metrics.totalRequests) * 100),
        clientTypes: Array.from(metrics.userAgents).length
      };
    }
    
    return report;
  }
}

// Export already defined above