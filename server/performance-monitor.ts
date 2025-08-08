import type { Request, Response } from 'express';
import { HyperPerformanceEngine } from './hyper-performance';
import { DatabaseOptimizer } from './database-optimizer';
import { ClientMetrics } from './client-optimization';

// 📊 PERFORMANCE MONITORING & REPORTING SYSTEM
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private systemMetrics = {
    startTime: Date.now(),
    totalRequests: 0,
    responseTimeStats: {
      fastest: Infinity,
      slowest: 0,
      average: 0,
      sub1ms: 0,
      sub5ms: 0,
      sub10ms: 0,
      sub50ms: 0,
      over50ms: 0
    },
    cacheStats: {
      totalHits: 0,
      totalMisses: 0,
      hitRate: 0
    }
  };

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  recordRequest(responseTime: number, cacheHit: boolean = false) {
    this.systemMetrics.totalRequests++;
    
    // Update response time stats
    const stats = this.systemMetrics.responseTimeStats;
    if (responseTime < stats.fastest) stats.fastest = responseTime;
    if (responseTime > stats.slowest) stats.slowest = responseTime;
    
    // Calculate running average
    stats.average = ((stats.average * (this.systemMetrics.totalRequests - 1)) + responseTime) / this.systemMetrics.totalRequests;
    
    // Categorize response times
    if (responseTime < 1) stats.sub1ms++;
    else if (responseTime < 5) stats.sub5ms++;
    else if (responseTime < 10) stats.sub10ms++;
    else if (responseTime < 50) stats.sub50ms++;
    else stats.over50ms++;
    
    // Update cache stats
    if (cacheHit) {
      this.systemMetrics.cacheStats.totalHits++;
    } else {
      this.systemMetrics.cacheStats.totalMisses++;
    }
    
    const totalCacheRequests = this.systemMetrics.cacheStats.totalHits + this.systemMetrics.cacheStats.totalMisses;
    if (totalCacheRequests > 0) {
      this.systemMetrics.cacheStats.hitRate = (this.systemMetrics.cacheStats.totalHits / totalCacheRequests) * 100;
    }
  }

  getSystemReport(): any {
    const uptime = Date.now() - this.systemMetrics.startTime;
    const hyperEngine = HyperPerformanceEngine.getInstance();
    const dbOptimizer = DatabaseOptimizer.getInstance();
    
    return {
      system: {
        uptime: Math.round(uptime / 1000),
        uptimeFormatted: this.formatUptime(uptime),
        totalRequests: this.systemMetrics.totalRequests,
        requestsPerSecond: Math.round((this.systemMetrics.totalRequests / (uptime / 1000)) * 100) / 100
      },
      performance: {
        responseTime: {
          fastest: Math.round(this.systemMetrics.responseTimeStats.fastest * 100) / 100,
          slowest: Math.round(this.systemMetrics.responseTimeStats.slowest * 100) / 100,
          average: Math.round(this.systemMetrics.responseTimeStats.average * 100) / 100,
          distribution: {
            'sub-1ms': this.systemMetrics.responseTimeStats.sub1ms,
            '1-5ms': this.systemMetrics.responseTimeStats.sub5ms,
            '5-10ms': this.systemMetrics.responseTimeStats.sub10ms,
            '10-50ms': this.systemMetrics.responseTimeStats.sub50ms,
            'over-50ms': this.systemMetrics.responseTimeStats.over50ms
          },
          percentages: this.calculatePercentages()
        },
        caching: {
          hitRate: Math.round(this.systemMetrics.cacheStats.hitRate * 100) / 100,
          totalHits: this.systemMetrics.cacheStats.totalHits,
          totalMisses: this.systemMetrics.cacheStats.totalMisses,
          hyperCacheStats: hyperEngine.getCacheStats(),
          dbCacheStats: dbOptimizer.getStats()
        }
      },
      benchmarks: {
        vsFirebase: this.compareToFirebase(),
        vsSupabase: this.compareToSupabase(),
        performance_grade: this.getPerformanceGrade()
      },
      clientMetrics: ClientMetrics.getPerformanceReport(),
      recommendations: this.getOptimizationRecommendations()
    };
  }

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  private calculatePercentages(): any {
    const total = this.systemMetrics.totalRequests;
    if (total === 0) return {};
    
    const stats = this.systemMetrics.responseTimeStats;
    return {
      'sub-1ms': Math.round((stats.sub1ms / total) * 100),
      '1-5ms': Math.round((stats.sub5ms / total) * 100),
      '5-10ms': Math.round((stats.sub10ms / total) * 100),
      '10-50ms': Math.round((stats.sub50ms / total) * 100),
      'over-50ms': Math.round((stats.over50ms / total) * 100)
    };
  }

  private compareToFirebase(): any {
    const avgResponseTime = this.systemMetrics.responseTimeStats.average;
    const firebaseAvg = 50; // Firebase typical response time
    const improvement = Math.round(((firebaseAvg - avgResponseTime) / firebaseAvg) * 100);
    
    return {
      pakety_avg: Math.round(avgResponseTime * 100) / 100,
      firebase_avg: firebaseAvg,
      improvement_percentage: improvement,
      speed_multiplier: Math.round((firebaseAvg / avgResponseTime) * 10) / 10,
      status: improvement > 0 ? '🚀 FASTER' : '🔄 COMPETITIVE'
    };
  }

  private compareToSupabase(): any {
    const avgResponseTime = this.systemMetrics.responseTimeStats.average;
    const supabaseAvg = 35; // Supabase typical response time
    const improvement = Math.round(((supabaseAvg - avgResponseTime) / supabaseAvg) * 100);
    
    return {
      pakety_avg: Math.round(avgResponseTime * 100) / 100,
      supabase_avg: supabaseAvg,
      improvement_percentage: improvement,
      speed_multiplier: Math.round((supabaseAvg / avgResponseTime) * 10) / 10,
      status: improvement > 0 ? '🚀 FASTER' : '🔄 COMPETITIVE'
    };
  }

  private getPerformanceGrade(): string {
    const avgTime = this.systemMetrics.responseTimeStats.average;
    const cacheHitRate = this.systemMetrics.cacheStats.hitRate;
    
    if (avgTime < 5 && cacheHitRate > 80) return 'A+ EXCEPTIONAL';
    if (avgTime < 10 && cacheHitRate > 70) return 'A EXCELLENT';
    if (avgTime < 20 && cacheHitRate > 60) return 'B+ VERY GOOD';
    if (avgTime < 30 && cacheHitRate > 50) return 'B GOOD';
    if (avgTime < 50) return 'C AVERAGE';
    return 'D NEEDS IMPROVEMENT';
  }

  private getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.systemMetrics.responseTimeStats;
    const cacheStats = this.systemMetrics.cacheStats;
    
    if (stats.average > 20) {
      recommendations.push('Consider implementing more aggressive caching');
    }
    
    if (cacheStats.hitRate < 70) {
      recommendations.push('Optimize cache TTL values for better hit rates');
    }
    
    if (stats.over50ms > stats.totalRequests * 0.1) {
      recommendations.push('Investigate slow queries causing >50ms responses');
    }
    
    if (stats.sub5ms < stats.totalRequests * 0.8) {
      recommendations.push('Focus on achieving more sub-5ms responses');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('🚀 Performance is optimal! System outperforming industry standards.');
    }
    
    return recommendations;
  }
}

// 📊 PERFORMANCE ENDPOINT HANDLER
export const performanceHandler = (req: Request, res: Response) => {
  const startTime = Date.now();
  const monitor = PerformanceMonitor.getInstance();
  
  try {
    const report = monitor.getSystemReport();
    const responseTime = Date.now() - startTime;
    
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    res.setHeader('X-Performance-Grade', report.benchmarks.performance_grade);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Record this request
    monitor.recordRequest(responseTime, false);
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      ...report
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    monitor.recordRequest(responseTime, false);
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate performance report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};