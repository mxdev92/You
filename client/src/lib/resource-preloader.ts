// Professional resource preloader for instant loading performance

interface PreloadResource {
  type: 'script' | 'style' | 'image' | 'font' | 'prefetch';
  href: string;
  as?: string;
  crossorigin?: string;
}

class ResourcePreloader {
  private preloadedResources = new Set<string>();
  
  preload(resource: PreloadResource): void {
    if (this.preloadedResources.has(resource.href)) {
      return; // Already preloaded
    }

    const link = document.createElement('link');
    link.rel = resource.type === 'prefetch' ? 'prefetch' : 'preload';
    
    if (resource.as) {
      link.as = resource.as;
    }
    
    if (resource.crossorigin) {
      link.crossOrigin = resource.crossorigin;
    }
    
    link.href = resource.href;
    
    // Add to head
    document.head.appendChild(link);
    this.preloadedResources.add(resource.href);
  }

  preloadCriticalResources(): void {
    // Preload critical fonts
    this.preload({
      type: 'font',
      href: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap',
      as: 'style',
      crossorigin: 'anonymous'
    });

    // Preload likely next routes (based on user behavior)
    const probableRoutes = ['/auth', '/wallet'];
    probableRoutes.forEach(route => {
      this.preload({
        type: 'prefetch',
        href: route
      });
    });
  }

  preloadCategoryImages(categoryIds: number[]): void {
    // Preload category-specific images based on user interaction patterns
    categoryIds.slice(0, 3).forEach(id => { // Only preload top 3 categories
      this.preload({
        type: 'prefetch',
        href: `/api/products?categoryId=${id}`
      });
    });
  }
}

// Singleton instance
export const resourcePreloader = new ResourcePreloader();

// Auto-initialize critical resources
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      resourcePreloader.preloadCriticalResources();
    });
  } else {
    resourcePreloader.preloadCriticalResources();
  }
}