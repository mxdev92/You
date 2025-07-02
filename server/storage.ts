import { categories, products, cartItems, type Category, type Product, type CartItem, type InsertCategory, type InsertProduct, type InsertCartItem } from "@shared/schema";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategorySelection(id: number, isSelected: boolean): Promise<Category>;

  // Products
  getProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  updateProductDisplayOrder(id: number, displayOrder: number): Promise<Product>;

  // Cart
  getCartItems(): Promise<(CartItem & { product: Product })[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(id: number, quantity: number): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;
  clearCart(): Promise<void>;
}

export class MemStorage implements IStorage {
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private cartItems: Map<number, CartItem>;
  private currentCategoryId: number;
  private currentProductId: number;
  private currentCartItemId: number;

  constructor() {
    this.categories = new Map();
    this.products = new Map();
    this.cartItems = new Map();
    this.currentCategoryId = 1;
    this.currentProductId = 1;
    this.currentCartItemId = 1;

    // Initialize with sample data
    this.initializeData();
  }

  private async initializeData() {
    // Categories
    const categoriesData: InsertCategory[] = [
      { name: "Fruits", icon: "Apple", isSelected: true },
      { name: "Vegetables", icon: "Carrot", isSelected: false },
      { name: "Dairy", icon: "Milk", isSelected: false },
      { name: "Bakery", icon: "Cookie", isSelected: false },
      { name: "Seafood", icon: "Fish", isSelected: false },
      { name: "Meat", icon: "Beef", isSelected: false },
    ];

    for (const cat of categoriesData) {
      await this.createCategory(cat);
    }

    // Products
    const productsData: InsertProduct[] = [
      // Fruits (categoryId: 1)
      { name: "خوخ", price: "3000", unit: "1kg", imageUrl: "/attached_assets/images (15)_1751152986097.jpeg", categoryId: 1 },
      { name: "برتقال", price: "2000", unit: "1kg", imageUrl: "/attached_assets/images (8)_1751152300030.jpeg", categoryId: 1 },
      { name: "موز", price: "1500", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 1 },
      { name: "أناناس", price: "4000", unit: "1kg", imageUrl: "/attached_assets/images (9)_1751152602451.jpeg", categoryId: 1 },
      { name: "بطيخ", price: "1000", unit: "1kg", imageUrl: "/attached_assets/images (11)_1751152688549.jpeg", categoryId: 1 },
      { name: "كرز", price: "6000", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1528821128474-27f963b062bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 1 },
      { name: "جزر", price: "1250", unit: "1kg", imageUrl: "/attached_assets/images (18)_1751153326735.jpeg", categoryId: 1 },
      { name: "عرموط", price: "3000", unit: "1kg", imageUrl: "/attached_assets/images (19)_1751153415482.jpeg", categoryId: 1 },
      { name: "عنجاص", price: "2500", unit: "1kg", imageUrl: "/attached_assets/images (14)_1751153041747.jpeg", categoryId: 1 },
      { name: "مانغا", price: "6500", unit: "1kg", imageUrl: "/attached_assets/images (17)_1751153187591.jpeg", categoryId: 1 },
      { name: "رمان سوري", price: "5000", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1553538164-e3b29c571f21?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 1 },
      { name: "عنب أسود", price: "2000", unit: "1kg", imageUrl: "/attached_assets/images (10)_1751153251420.jpeg", categoryId: 1 },
      { name: "خوخ مسطح", price: "3000", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1594736797933-d0b22ba2c9c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 1 },
      { name: "تفاح أبيض صغير", price: "2000", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 1 },
      { name: "فاكهة التنين (قطعة)", price: "4000", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1558818498-28c1e002b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 1 },
      { name: "ركي", price: "1000", unit: "1kg", imageUrl: "/attached_assets/images (12)_1751153524180.jpeg", categoryId: 1 },
      { name: "تفاح أخضر", price: "2500", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 1 },
      
      // Other categories (keeping existing products)
      { name: "Fresh Spinach", price: "1000", unit: "0.5kg", imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 2 },
      { name: "Bell Peppers", price: "1000", unit: "0.5kg", imageUrl: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 2 },
      { name: "Fresh Carrots", price: "1000", unit: "0.5kg", imageUrl: "https://images.unsplash.com/photo-1445282768818-728615cc910a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 2 },
      { name: "Russet Potatoes", price: "1000", unit: "0.5kg", imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 2 },
      { name: "Fresh Tomatoes", price: "1000", unit: "0.5kg", imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 2 },
      { name: "Whole Milk", price: "1000", unit: "0.5L", imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 3 },
      { name: "Greek Yogurt", price: "1000", unit: "0.5kg", imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 3 },
      { name: "Whole Grain Bread", price: "1000", unit: "loaf", imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 4 },
      { name: "Salmon Fillet", price: "1000", unit: "0.5kg", imageUrl: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 5 },
    ];

    for (const prod of productsData) {
      await this.createProduct(prod);
    }
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { 
      ...insertCategory, 
      id,
      isSelected: insertCategory.isSelected ?? false
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategorySelection(id: number, isSelected: boolean): Promise<Category> {
    const category = this.categories.get(id);
    if (!category) {
      throw new Error("Category not found");
    }
    
    // Reset all categories to unselected
    this.categories.forEach(cat => cat.isSelected = false);
    
    // Set the selected category
    const updatedCategory = { ...category, isSelected };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.categoryId === categoryId);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = { 
      ...insertProduct, 
      id,
      categoryId: insertProduct.categoryId ?? null,
      available: insertProduct.available ?? true,
      displayOrder: insertProduct.displayOrder ?? 0
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, updateData: Partial<InsertProduct>): Promise<Product> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) {
      throw new Error("Product not found");
    }

    const updatedProduct: Product = {
      ...existingProduct,
      ...updateData,
      id, // Ensure ID stays the same
      categoryId: updateData.categoryId ?? existingProduct.categoryId
    };
    
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async getCartItems(): Promise<(CartItem & { product: Product })[]> {
    const items = Array.from(this.cartItems.values());
    return items.map(item => {
      const product = this.products.get(item.productId);
      if (!product) {
        throw new Error("Product not found for cart item");
      }
      return { ...item, product };
    });
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const existingItem = Array.from(this.cartItems.values()).find(
      item => item.productId === insertCartItem.productId
    );

    if (existingItem) {
      // Update quantity
      const updatedItem = { ...existingItem, quantity: existingItem.quantity + (insertCartItem.quantity ?? 1) };
      this.cartItems.set(existingItem.id, updatedItem);
      return updatedItem;
    }

    const id = this.currentCartItemId++;
    const cartItem: CartItem = {
      ...insertCartItem,
      id,
      quantity: insertCartItem.quantity ?? 1,
      addedAt: new Date().toISOString(),
    };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem> {
    const item = this.cartItems.get(id);
    if (!item) {
      throw new Error("Cart item not found");
    }
    const updatedItem = { ...item, quantity };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }

  async removeFromCart(id: number): Promise<void> {
    this.cartItems.delete(id);
  }

  async clearCart(): Promise<void> {
    this.cartItems.clear();
  }
  async updateProductDisplayOrder(id: number, displayOrder: number): Promise<Product> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) {
      throw new Error("Product not found");
    }

    const updatedProduct: Product = {
      ...existingProduct,
      displayOrder,
      id
    };
    
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
}

import { db } from "./db";
import { eq } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategorySelection(id: number, isSelected: boolean): Promise<Category> {
    const [updated] = await db.update(categories)
      .set({ isSelected })
      .where(eq(categories.id, id))
      .returning();
    return updated;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(products.displayOrder, products.id);
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.categoryId, categoryId));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updated] = await db.update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async getCartItems(): Promise<(CartItem & { product: Product })[]> {
    const items = await db.select({
      id: cartItems.id,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      addedAt: cartItems.addedAt,
      product: products
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id));
    
    return items.map(item => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      addedAt: item.addedAt,
      product: item.product
    }));
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const [newItem] = await db.insert(cartItems).values({
      ...item,
      addedAt: new Date().toISOString()
    }).returning();
    return newItem;
  }

  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem> {
    const [updated] = await db.update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updated;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(): Promise<void> {
    await db.delete(cartItems);
  }

  async updateProductDisplayOrder(id: number, displayOrder: number): Promise<Product> {
    const [updated] = await db.update(products)
      .set({ displayOrder })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }
}

// Initialize database with sample data if empty
const initializeDatabase = async () => {
  try {
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length === 0) {
      // Create categories
      const categoriesData: InsertCategory[] = [
        { name: "Fruits", icon: "Apple", isSelected: true },
        { name: "Vegetables", icon: "Carrot", isSelected: false },
        { name: "Dairy", icon: "Milk", isSelected: false },
        { name: "Bakery", icon: "Cookie", isSelected: false },
        { name: "Seafood", icon: "Fish", isSelected: false },
        { name: "Meat", icon: "Beef", isSelected: false },
      ];

      for (const cat of categoriesData) {
        await db.insert(categories).values(cat);
      }

      // Create products
      const productsData: InsertProduct[] = [
        // Fruits (categoryId: 1)
        { name: "خوخ", price: "3000", unit: "1kg", imageUrl: "/attached_assets/images (15)_1751152986097.jpeg", categoryId: 1 },
        { name: "برتقال", price: "2000", unit: "1kg", imageUrl: "/attached_assets/images (8)_1751152300030.jpeg", categoryId: 1 },
        { name: "موز", price: "1500", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 1 },
        { name: "أناناس", price: "4000", unit: "1kg", imageUrl: "/attached_assets/images (9)_1751152602451.jpeg", categoryId: 1 },
        { name: "بطيخ", price: "1000", unit: "1kg", imageUrl: "/attached_assets/images (11)_1751152688549.jpeg", categoryId: 1 },
        { name: "كرز", price: "6000", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1528821128474-27f963b062bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 1 },
        { name: "جزر", price: "1250", unit: "1kg", imageUrl: "/attached_assets/images (18)_1751153326735.jpeg", categoryId: 1 },
        { name: "عرموط", price: "3000", unit: "1kg", imageUrl: "/attached_assets/images (19)_1751153415482.jpeg", categoryId: 1 },
        { name: "عنجاص", price: "2500", unit: "1kg", imageUrl: "/attached_assets/images (14)_1751153041747.jpeg", categoryId: 1 },
        { name: "مانغا", price: "6500", unit: "1kg", imageUrl: "/attached_assets/images (17)_1751153187591.jpeg", categoryId: 1 },
        { name: "رمان سوري", price: "5000", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1553538164-e3b29c571f21?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 1 },
        { name: "عنب أسود", price: "2000", unit: "1kg", imageUrl: "/attached_assets/images (10)_1751153251420.jpeg", categoryId: 1 },
        { name: "خوخ مسطح", price: "3000", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1594736797933-d0b22ba2c9c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 1 },
        { name: "تفاح أبيض صغير", price: "2000", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 1 },
        { name: "فاكهة التنين (قطعة)", price: "4000", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1558818498-28c1e002b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 1 },
        { name: "ركي", price: "1000", unit: "1kg", imageUrl: "/attached_assets/images (12)_1751153524180.jpeg", categoryId: 1 },
        { name: "تفاح أخضر", price: "2500", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 1 },
        
        // Vegetables (categoryId: 2)
        { name: "طماطم", price: "2000", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1546470427-e83cc095d99e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 2 },
        { name: "خيار", price: "1500", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1604977042946-2716e8d5dd0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 2 },
        { name: "خس", price: "1000", unit: "حزمة", imageUrl: "https://images.unsplash.com/photo-1556801410-6ddc6b999b5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 2 },
      ];

      for (const product of productsData) {
        await db.insert(products).values(product);
      }
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};

export const storage = new DatabaseStorage();

// Initialize database on startup
initializeDatabase();
