// Professional instant loading optimization system

interface CacheConfig {
  staleTime: number;
  gcTime: number;
}

// Optimized cache configurations for different data types
export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  // Categories rarely change - cache aggressively
  categories: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  },
  
  // Products change frequently - moderate cache
  products: {
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  },
  
  // User session - short cache for security
  session: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  }
};

// Intelligent preloader for critical resources
export class InstantLoadingOptimizer {
  private static instance: InstantLoadingOptimizer;
  private preloadedUrls = new Set<string>();

  static getInstance(): InstantLoadingOptimizer {
    if (!this.instance) {
      this.instance = new InstantLoadingOptimizer();
    }
    return this.instance;
  }

  // Preload critical resources based on user behavior
  preloadCriticalResources(): void {
    if (typeof window === 'undefined') return;

    // Preload fonts for instant text rendering
    this.preloadFont('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');
    
    // Intelligent route prefetching based on user patterns
    const likelyRoutes = ['/auth', '/wallet'];
    likelyRoutes.forEach(route => this.prefetchRoute(route));
  }

  private preloadFont(href: string): void {
    if (this.preloadedUrls.has(href)) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    
    this.preloadedUrls.add(href);
  }

  private prefetchRoute(route: string): void {
    if (this.preloadedUrls.has(route)) return;
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
    
    this.preloadedUrls.add(route);
  }

  // Progressive image loading optimization
  setupImageLazyLoading(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      // Observe all lazy images
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }
}

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
  const optimizer = InstantLoadingOptimizer.getInstance();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      optimizer.preloadCriticalResources();
      optimizer.setupImageLazyLoading();
    });
  } else {
    optimizer.preloadCriticalResources();
    optimizer.setupImageLazyLoading();
  }
}