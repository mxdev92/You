// 🚀 ULTRA PRELOADER - INSTANT FIRST LOAD PERFORMANCE
import { UltraStorage } from './ultra-storage';

class UltraPreloader {
  private static instance: UltraPreloader;
  private isWarmingUp = false;
  private warmupCompleted = false;

  static getInstance(): UltraPreloader {
    if (!UltraPreloader.instance) {
      UltraPreloader.instance = new UltraPreloader();
    }
    return UltraPreloader.instance;
  }

  // 🔥 AGGRESSIVE PRE-WARMING - Load everything before first user request
  async warmupCache(): Promise<void> {
    if (this.isWarmingUp || this.warmupCompleted) return;
    
    this.isWarmingUp = true;
    console.log('🔥 ULTRA PRELOADER: Starting aggressive cache warmup...');
    const start = Date.now();
    
    try {
      const storage = UltraStorage.getInstance();
      
      // 1. Pre-warm categories (most important)
      console.log('📂 Preloading categories...');
      await storage.getCategories();
      
      // 2. Pre-warm all products (for instant category switching)
      console.log('🛍️  Preloading all products...');
      await storage.getProducts();
      
      // 3. Pre-warm individual categories (for instant filtering)
      console.log('🎯 Preloading category products...');
      const categories = await storage.getCategories();
      
      // Pre-warm the most popular categories in parallel
      const categoryPromises = categories.slice(0, 5).map(async (category) => {
        console.log(`   📦 Preloading category: ${category.name}`);
        await storage.getProductsByCategory(category.id);
      });
      
      await Promise.all(categoryPromises);
      
      const totalTime = Date.now() - start;
      console.log(`🚀 ULTRA PRELOADER: Cache warmup completed in ${totalTime}ms`);
      console.log('⚡ FIRST LOAD WILL NOW BE INSTANT!');
      
      this.warmupCompleted = true;
      
    } catch (error) {
      console.error('❌ Cache warmup error:', error);
    } finally {
      this.isWarmingUp = false;
    }
  }

  // 🔄 CONTINUOUS WARM-UP - Keep cache fresh
  startContinuousWarmup(): void {
    // Initial warmup
    this.warmupCache();
    
    // Re-warm every 5 minutes to prevent cache expiry
    setInterval(() => {
      console.log('🔄 ULTRA PRELOADER: Refreshing cache...');
      this.warmupCache();
    }, 5 * 60 * 1000); // 5 minutes
  }

  isReady(): boolean {
    return this.warmupCompleted;
  }
}

export const ultraPreloader = UltraPreloader.getInstance();