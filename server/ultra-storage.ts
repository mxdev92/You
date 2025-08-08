// 🔥 ULTRA-FAST STORAGE LAYER - SUB-20MS DATABASE QUERIES
import { db } from './db';
import { ultraSimpleCache } from './ultra-performance-simple';
import { 
  categories, 
  products, 
  users, 
  orders,
  type Category,
  type Product,
  type User,
  type Order
} from '@shared/schema';
import { eq, desc, sql, and, inArray } from 'drizzle-orm';

// 🚀 ULTRA-OPTIMIZED STORAGE CLASS
export class UltraStorage {
  private static instance: UltraStorage;

  static getInstance(): UltraStorage {
    if (!UltraStorage.instance) {
      UltraStorage.instance = new UltraStorage();
    }
    return UltraStorage.instance;
  }

  // 🔥 CATEGORIES - Lightning Fast
  async getCategories(): Promise<Category[]> {
    const cacheKey = 'ultra:categories:all';
    
    // Check ultra cache first
    const cached = await ultraSimpleCache.ultraGet(cacheKey);
    if (cached) return cached;

    console.log('🔥 Ultra DB Query: Categories');
    const start = Date.now();
    
    // Optimized query with only essential fields
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        icon: categories.icon,
        isSelected: categories.isSelected,
        displayOrder: categories.displayOrder
      })
      .from(categories)
      .orderBy(categories.displayOrder, categories.name);

    const queryTime = Date.now() - start;
    console.log(`⚡ Ultra Categories Query: ${queryTime}ms`);

    // Cache for 10 minutes (categories rarely change)
    await ultraSimpleCache.ultraSet(cacheKey, result, 600);

    return result;
  }

  // 🔥 PRODUCTS - Ultra-optimized with intelligent caching
  async getProducts(): Promise<Product[]> {
    const cacheKey = 'ultra:products:all';
    
    const cached = await ultraSimpleCache.ultraGet(cacheKey);
    if (cached) return cached;

    console.log('🔥 Ultra DB Query: All Products');
    const start = Date.now();

    const result = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        unit: products.unit,
        imageUrl: products.imageUrl,
        categoryId: products.categoryId,
        available: products.available,
        displayOrder: products.displayOrder
      })
      .from(products)
      .where(eq(products.available, true))
      .orderBy(products.displayOrder, products.name);

    const queryTime = Date.now() - start;
    console.log(`⚡ Ultra Products Query: ${queryTime}ms`);

    // Cache for 3 minutes
    await ultraSimpleCache.ultraSet(cacheKey, result, 180);

    return result;
  }

  // 🚀 PRODUCTS BY CATEGORY - Micro-optimized
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    const cacheKey = `ultra:products:category:${categoryId}`;
    
    const cached = await ultraSimpleCache.ultraGet(cacheKey);
    if (cached) return cached;

    console.log(`🔥 Ultra DB Query: Products for category ${categoryId}`);
    const start = Date.now();

    const result = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        unit: products.unit,
        imageUrl: products.imageUrl,
        categoryId: products.categoryId,
        available: products.available,
        displayOrder: products.displayOrder
      })
      .from(products)
      .where(and(
        eq(products.categoryId, categoryId),
        eq(products.available, true)
      ))
      .orderBy(products.displayOrder, products.name);

    const queryTime = Date.now() - start;
    console.log(`⚡ Ultra Products by Category Query: ${queryTime}ms`);

    // Cache for 3 minutes
    await ultraSimpleCache.ultraSet(cacheKey, result, 180);

    return result;
  }

  // 🔥 PRODUCT SEARCH - Lightning fast with caching
  async searchProducts(query: string): Promise<Product[]> {
    const cacheKey = `ultra:products:search:${query.toLowerCase()}`;
    
    const cached = await ultraSimpleCache.ultraGet(cacheKey);
    if (cached) return cached;

    console.log(`🔥 Ultra DB Query: Search "${query}"`);
    const start = Date.now();

    const result = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        unit: products.unit,
        imageUrl: products.imageUrl,
        categoryId: products.categoryId,
        available: products.available,
        displayOrder: products.displayOrder
      })
      .from(products)
      .where(and(
        eq(products.available, true),
        sql`LOWER(${products.name}) LIKE ${`%${query.toLowerCase()}%`}`
      ))
      .orderBy(products.displayOrder, products.name)
      .limit(50); // Limit results for performance

    const queryTime = Date.now() - start;
    console.log(`⚡ Ultra Product Search Query: ${queryTime}ms`);

    // Cache search results for 1 minute (shorter due to dynamic nature)
    await ultraSimpleCache.ultraSet(cacheKey, result, 60);

    return result;
  }

  // 🔥 BATCH PRODUCTS - Ultra-efficient bulk retrieval
  async getProductsByIds(ids: number[]): Promise<Product[]> {
    const cacheKey = `ultra:products:batch:${ids.sort().join(',')}`;
    
    const cached = await ultraSimpleCache.ultraGet(cacheKey);
    if (cached) return cached;

    console.log(`🔥 Ultra DB Query: Batch products (${ids.length} items)`);
    const start = Date.now();

    const result = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        unit: products.unit,
        imageUrl: products.imageUrl,
        categoryId: products.categoryId,
        available: products.available,
        displayOrder: products.displayOrder
      })
      .from(products)
      .where(and(
        inArray(products.id, ids),
        eq(products.available, true)
      ))
      .orderBy(products.displayOrder);

    const queryTime = Date.now() - start;
    console.log(`⚡ Ultra Batch Products Query: ${queryTime}ms`);

    // Cache for 2 minutes
    await ultraSimpleCache.ultraSet(cacheKey, result, 120);

    return result;
  }

  // 🔥 SINGLE PRODUCT - Ultra-fast with aggressive caching
  async getProduct(id: number): Promise<Product | undefined> {
    const cacheKey = `ultra:product:${id}`;
    
    const cached = await ultraSimpleCache.ultraGet(cacheKey);
    if (cached) return cached;

    console.log(`🔥 Ultra DB Query: Single product ${id}`);
    const start = Date.now();

    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    const queryTime = Date.now() - start;
    console.log(`⚡ Ultra Single Product Query: ${queryTime}ms`);

    const product = result[0] || undefined;
    
    // Cache single products for 5 minutes
    await ultraSimpleCache.ultraSet(cacheKey, product, 300);

    return product;
  }

  // 🔥 USER OPERATIONS - Ultra-optimized
  async getUserByEmail(email: string): Promise<User | undefined> {
    const cacheKey = `ultra:user:email:${email}`;
    
    const cached = await ultraSimpleCache.ultraGet(cacheKey);
    if (cached) return cached;

    console.log(`🔥 Ultra DB Query: User by email`);
    const start = Date.now();

    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const queryTime = Date.now() - start;
    console.log(`⚡ Ultra User by Email Query: ${queryTime}ms`);

    const user = result[0] || undefined;
    
    // Cache user for 5 minutes (users don't change frequently)
    if (user) {
      await ultraSimpleCache.ultraSet(cacheKey, user, 300);
    }

    return user;
  }

  // 🔥 ORDERS - Lightning fast recent orders
  async getRecentOrders(userId: number, limit: number = 10): Promise<Order[]> {
    const cacheKey = `ultra:orders:user:${userId}:recent:${limit}`;
    
    const cached = await ultraSimpleCache.ultraGet(cacheKey);
    if (cached) return cached;

    console.log(`🔥 Ultra DB Query: Recent orders for user ${userId}`);
    const start = Date.now();

    const result = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.orderDate))
      .limit(limit);

    const queryTime = Date.now() - start;
    console.log(`⚡ Ultra Recent Orders Query: ${queryTime}ms`);

    // Cache for 1 minute (orders change frequently)
    await ultraSimpleCache.ultraSet(cacheKey, result, 60);

    return result;
  }

  // 🔥 CACHE INVALIDATION - Smart cache management
  async invalidateProductCaches(categoryId?: number) {
    console.log('🗑️  Ultra Cache Invalidation: Products');
    
    await ultraSimpleCache.ultraDel('ultra:products:*');
    
    if (categoryId) {
      await ultraSimpleCache.ultraDel(`ultra:products:category:${categoryId}`);
    }
  }

  async invalidateCategoryCache() {
    console.log('🗑️  Ultra Cache Invalidation: Categories');
    await ultraSimpleCache.ultraDel('ultra:categories:*');
  }

  async invalidateUserCache(email: string) {
    console.log('🗑️  Ultra Cache Invalidation: User');
    await ultraSimpleCache.ultraDel(`ultra:user:email:${email}`);
  }
}

// 🚀 Export ultra-optimized storage instance
export const ultraStorage = UltraStorage.getInstance();