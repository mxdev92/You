import { categories, products, cartItems, orders, users, userAddresses, walletTransactions, drivers, settings, coupons, type Category, type Product, type CartItem, type Order, type User, type UserAddress, type WalletTransaction, type Driver, type Settings, type Coupon, type InsertCategory, type InsertProduct, type InsertCartItem, type InsertOrder, type InsertUser, type InsertUserAddress, type InsertWalletTransaction, type InsertDriver, type InsertSettings, type InsertCoupon } from "@shared/schema";
import { db } from "./db";
import { eq, sql, and } from "drizzle-orm";

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
  deleteProduct(id: number): Promise<void>;

  // Cart
  getCartItems(userId?: number): Promise<(CartItem & { product: Product })[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(id: number, quantity: number): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;
  clearCart(userId?: number): Promise<void>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<Order>): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  deleteOrder(id: number): Promise<void>;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // User Addresses
  getUserAddresses(userId: number): Promise<UserAddress[]>;
  createUserAddress(address: InsertUserAddress): Promise<UserAddress>;

  // Wallet Operations
  getUserWalletBalance(userId: number): Promise<number>;
  updateUserWalletBalance(userId: number, amount: number): Promise<User>;
  createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction>;
  getUserWalletTransactions(userId: number): Promise<WalletTransaction[]>;
  updateWalletTransactionStatus(transactionId: number, status: string): Promise<WalletTransaction>;

  // Drivers
  getDrivers(): Promise<Driver[]>;
  getDriver(id: number): Promise<Driver | undefined>;
  getDriverByEmail(email: string): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: number, driver: Partial<InsertDriver>): Promise<Driver>;
  deleteDriver(id: number): Promise<void>;

  // Settings
  getSettings(): Promise<Settings[]>;
  getSetting(key: string): Promise<Settings | undefined>;
  updateSetting(key: string, value: string, type: string, description?: string): Promise<Settings>;

  // Coupons
  getCoupons(): Promise<Coupon[]>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: number, coupon: Partial<InsertCoupon>): Promise<Coupon>;
  deleteCoupon(id: number): Promise<void>;
  incrementCouponUsage(id: number): Promise<Coupon>;
}

export class MemStorage implements IStorage {
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private cartItems: Map<number, CartItem>;
  private orders: Map<number, Order>;
  private users: Map<number, User>;
  private userAddresses: Map<number, UserAddress>;
  private coupons: Map<number, Coupon>;
  private currentCategoryId: number;
  private currentProductId: number;
  private currentCartItemId: number;
  private currentOrderId: number;
  private currentUserId: number;
  private currentUserAddressId: number;
  private currentCouponId: number;

  constructor() {
    this.categories = new Map();
    this.products = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.users = new Map();
    this.userAddresses = new Map();
    this.coupons = new Map();
    this.currentCategoryId = 1;
    this.currentProductId = 1;
    this.currentCartItemId = 1;
    this.currentOrderId = 1;
    this.currentUserId = 1;
    this.currentUserAddressId = 1;
    this.currentCouponId = 1;

    // Initialize with sample data
    this.initializeData();
  }

  private async initializeData() {
    // Categories
    const categoriesData: InsertCategory[] = [
      { name: "Fruits", icon: "Apple", isSelected: false },
      { name: "Vegetables", icon: "Carrot", isSelected: true },
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
    const result = await db.select().from(categories).orderBy(categories.displayOrder, categories.name);
    return result;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { 
      ...insertCategory, 
      id,
      isSelected: insertCategory.isSelected ?? false,
      displayOrder: insertCategory.displayOrder ?? 999
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
    const updatedCategory = { ...category, isSelected, displayOrder: category.displayOrder || 0 };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async getProducts(): Promise<Product[]> {
    const result = await db.select().from(products).orderBy(products.displayOrder, products.name);
    return result;
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    const result = await db.select().from(products)
      .where(eq(products.categoryId, categoryId))
      .orderBy(products.displayOrder, products.name);
    return result;
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

  async deleteProduct(id: number): Promise<void> {
    this.products.delete(id);
  }

  async getCartItems(userId?: number): Promise<(CartItem & { product: Product })[]> {
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

  async clearCart(userId?: number): Promise<void> {
    this.cartItems.clear();
  }

  // User authentication methods (stub implementations for MemStorage)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phone === phone);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = {
      id,
      ...user,
      createdAt: new Date()
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async getUserAddresses(userId: number): Promise<UserAddress[]> {
    return Array.from(this.userAddresses.values()).filter(addr => addr.userId === userId);
  }

  async createUserAddress(address: InsertUserAddress): Promise<UserAddress> {
    const id = this.currentUserAddressId++;
    const newAddress: UserAddress = {
      id,
      ...address,
      createdAt: new Date()
    };
    this.userAddresses.set(id, newAddress);
    return newAddress;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) => 
      new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const order: Order = {
      id,
      ...insertOrder,
      status: insertOrder.status || "pending",
      orderDate: new Date(),
      deliveryTime: insertOrder.deliveryTime || null,
      notes: insertOrder.notes || null,
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) {
      throw new Error(`Order with id ${id} not found`);
    }
    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async updateOrder(id: number, order: Partial<Order>): Promise<Order> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) {
      throw new Error(`Order with id ${id} not found`);
    }
    const updatedOrder = { ...existingOrder, ...order, id };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<void> {
    this.orders.delete(id);
  }

  async deleteUser(id: number): Promise<void> {
    this.users.delete(id);
  }

  // Wallet Operations (MemStorage stub implementations)
  async getUserWalletBalance(userId: number): Promise<number> {
    const user = this.users.get(userId);
    return user ? parseFloat(user.walletBalance || "0") : 0;
  }

  async updateUserWalletBalance(userId: number, amount: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    const updatedUser = { ...user, walletBalance: String(amount) };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction> {
    // MemStorage stub - returning a mock transaction for development
    return {
      id: Math.floor(Math.random() * 1000),
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      status: transaction.status || 'pending',
      zaincashTransactionId: transaction.zaincashTransactionId || null,
      orderId: transaction.orderId || null,
      createdAt: new Date()
    };
  }

  async getUserWalletTransactions(userId: number): Promise<WalletTransaction[]> {
    // MemStorage stub - returning empty array for development
    return [];
  }

  async updateWalletTransactionStatus(transactionId: number, status: string): Promise<WalletTransaction> {
    // MemStorage stub - returning a mock transaction for development
    return {
      id: transactionId,
      userId: 1,
      type: 'deposit',
      amount: '0',
      description: 'Mock transaction',
      status,
      zaincashTransactionId: null,
      orderId: null,
      createdAt: new Date()
    };
  }

  // Settings methods (MemStorage stubs - for development only)
  async getSettings(): Promise<Settings[]> {
    // MemStorage stub - returning mock settings for development
    return [
      {
        id: 1,
        key: 'delivery_fee',
        value: '3500',
        type: 'number',
        description: 'Delivery fee in Iraqi Dinars',
        updatedAt: new Date()
      }
    ];
  }

  async getSetting(key: string): Promise<Settings | undefined> {
    // MemStorage stub - returning mock setting for development
    if (key === 'delivery_fee') {
      return {
        id: 1,
        key: 'delivery_fee',
        value: '3500',
        type: 'number',
        description: 'Delivery fee in Iraqi Dinars',
        updatedAt: new Date()
      };
    }
    return undefined;
  }

  async updateSetting(key: string, value: string, type: string, description?: string): Promise<Settings> {
    // MemStorage stub - returning mock updated setting for development
    return {
      id: 1,
      key,
      value,
      type,
      description: description || 'Mock setting',
      updatedAt: new Date()
    };
  }

  // Driver methods (MemStorage stubs - for development only)
  async getDrivers(): Promise<Driver[]> {
    // MemStorage stub - returning empty array for development
    return [];
  }

  async getDriver(id: number): Promise<Driver | undefined> {
    // MemStorage stub - returning undefined for development
    return undefined;
  }

  async getDriverByEmail(email: string): Promise<Driver | undefined> {
    // MemStorage stub - returning undefined for development
    return undefined;
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    // MemStorage stub - returning mock driver for development
    return {
      id: 1,
      fullName: driver.fullName,
      phone: driver.phone,
      email: driver.email,
      password: driver.password,
      isActive: driver.isActive || true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async updateDriver(id: number, driver: Partial<InsertDriver>): Promise<Driver> {
    // MemStorage stub - returning mock updated driver for development
    return {
      id,
      fullName: driver.fullName || 'Mock Driver',
      phone: driver.phone || '1234567890',
      email: driver.email || 'mock@example.com',
      password: driver.password || 'mockpassword',
      isActive: driver.isActive !== undefined ? driver.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async deleteDriver(id: number): Promise<void> {
    // MemStorage stub - no operation for development
    return;
  }

  // Coupon methods (MemStorage stubs - for development only)
  async getCoupons(): Promise<Coupon[]> {
    return Array.from(this.coupons.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const normalizedCode = code.toUpperCase();
    return Array.from(this.coupons.values()).find(coupon => 
      coupon.code.toUpperCase() === normalizedCode
    );
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const id = this.currentCouponId++;
    const newCoupon: Coupon = {
      id,
      ...coupon,
      code: coupon.code.toUpperCase(),
      usedCount: 0,
      createdAt: new Date()
    };
    this.coupons.set(id, newCoupon);
    return newCoupon;
  }

  async updateCoupon(id: number, couponData: Partial<InsertCoupon>): Promise<Coupon> {
    const existingCoupon = this.coupons.get(id);
    if (!existingCoupon) {
      throw new Error(`Coupon with id ${id} not found`);
    }

    const updatedCoupon: Coupon = {
      ...existingCoupon,
      ...couponData,
      id,
      code: couponData.code ? couponData.code.toUpperCase() : existingCoupon.code
    };
    
    this.coupons.set(id, updatedCoupon);
    return updatedCoupon;
  }

  async deleteCoupon(id: number): Promise<void> {
    this.coupons.delete(id);
  }

  async incrementCouponUsage(id: number): Promise<Coupon> {
    const coupon = this.coupons.get(id);
    if (!coupon) {
      throw new Error(`Coupon with id ${id} not found`);
    }
    
    const updatedCoupon = { ...coupon, usedCount: coupon.usedCount + 1 };
    this.coupons.set(id, updatedCoupon);
    return updatedCoupon;
  }
}

export class DatabaseStorage implements IStorage {
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.displayOrder, categories.id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategorySelection(id: number, isSelected: boolean): Promise<Category> {
    // First, deselect all categories
    await db.update(categories)
      .set({ isSelected: false });
    
    // Then select the target category
    const [updated] = await db.update(categories)
      .set({ isSelected })
      .where(eq(categories.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Category with id ${id} not found`);
    }
    
    return updated;
  }

  async getProducts(): Promise<Product[]> {
    const result = await db.select().from(products);
    return result.sort((a, b) => {
      const orderA = a.displayOrder === 0 || a.displayOrder >= 999 ? 9999 : a.displayOrder;
      const orderB = b.displayOrder === 0 || b.displayOrder >= 999 ? 9999 : b.displayOrder;
      if (orderA !== orderB) return orderA - orderB;
      return a.id - b.id;
    });
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    const result = await db.select().from(products).where(eq(products.categoryId, categoryId));
    return result.sort((a, b) => {
      const orderA = a.displayOrder === 0 || a.displayOrder >= 999 ? 9999 : a.displayOrder;
      const orderB = b.displayOrder === 0 || b.displayOrder >= 999 ? 9999 : b.displayOrder;
      if (orderA !== orderB) return orderA - orderB;
      return a.id - b.id;
    });
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

  async updateProductDisplayOrder(id: number, displayOrder: number): Promise<Product> {
    const [updated] = await db.update(products)
      .set({ displayOrder })
      .where(eq(products.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Product with id ${id} not found`);
    }
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getCartItems(userId?: number): Promise<(CartItem & { product: Product })[]> {
    let query = db.select({
      id: cartItems.id,
      userId: cartItems.userId,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      addedAt: cartItems.addedAt,
      product: products
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id));
    
    if (userId) {
      query = query.where(eq(cartItems.userId, userId));
    } else {
      // For anonymous users, get cart items without userId
      query = query.where(sql`${cartItems.userId} IS NULL`);
    }
    
    const items = await query;
    
    return items.map(item => ({
      id: item.id,
      userId: item.userId,
      productId: item.productId,
      quantity: item.quantity,
      addedAt: item.addedAt,
      product: item.product
    }));
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart for this user and product
    let existingItem;
    if (item.userId) {
      // For authenticated users, check by both productId and userId
      existingItem = await db.select().from(cartItems)
        .where(
          and(
            eq(cartItems.productId, item.productId),
            eq(cartItems.userId, item.userId)
          )
        );
    } else {
      // For anonymous users, check by productId where userId is NULL
      existingItem = await db.select().from(cartItems)
        .where(
          and(
            eq(cartItems.productId, item.productId),
            sql`${cartItems.userId} IS NULL`
          )
        );
    }

    if (existingItem.length > 0) {
      // Update quantity of existing item - handle decimal quantities properly
      const currentQuantity = parseFloat(existingItem[0].quantity);
      const addQuantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : (item.quantity || 1);
      const updatedQuantity = String(currentQuantity + addQuantity);
      const [updatedItem] = await db.update(cartItems)
        .set({ quantity: updatedQuantity })
        .where(eq(cartItems.id, existingItem[0].id))
        .returning();
      return updatedItem;
    }

    // Create new item if it doesn't exist
    const [newItem] = await db.insert(cartItems).values({
      ...item,
      addedAt: new Date().toISOString()
    }).returning();
    return newItem;
  }

  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem> {
    const [updated] = await db.update(cartItems)
      .set({ quantity: String(quantity) })
      .where(eq(cartItems.id, id))
      .returning();
    return updated;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId?: number): Promise<void> {
    if (userId) {
      await db.delete(cartItems).where(eq(cartItems.userId, userId));
    } else {
      // For anonymous users, clear cart items without userId
      await db.delete(cartItems).where(sql`${cartItems.userId} IS NULL`);
    }
  }


  // Orders
  async getOrders(): Promise<Order[]> {
    const result = await db.select().from(orders).orderBy(sql`${orders.orderDate} DESC`);
    return result;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: number, order: Partial<Order>): Promise<Order> {
    // Handle timestamp fields properly
    const updateData: any = { ...order };
    if (updateData.acceptedAt && typeof updateData.acceptedAt === 'string') {
      updateData.acceptedAt = new Date(updateData.acceptedAt);
    }
    if (updateData.lastUpdate && typeof updateData.lastUpdate === 'string') {
      updateData.lastUpdate = new Date(updateData.lastUpdate);
    }
    
    const [updated] = await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updated] = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async deleteOrder(id: number): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(sql`LOWER(${users.email}) = LOWER(${email})`);
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(sql`${users.createdAt} DESC`);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async deleteUser(id: number): Promise<void> {
    // First delete all related data (addresses, cart items, orders) for this user
    await db.delete(userAddresses).where(eq(userAddresses.userId, id));
    await db.delete(cartItems).where(eq(cartItems.userId, id));
    await db.delete(orders).where(eq(orders.userId, id));
    
    // Then delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  // User Addresses
  async getUserAddresses(userId: number): Promise<UserAddress[]> {
    return await db.select().from(userAddresses).where(eq(userAddresses.userId, userId));
  }

  async createUserAddress(address: InsertUserAddress): Promise<UserAddress> {
    // If this is the default address, unset all other default addresses for this user
    if (address.isDefault) {
      await db.update(userAddresses)
        .set({ isDefault: false })
        .where(eq(userAddresses.userId, address.userId));
    }

    const [newAddress] = await db.insert(userAddresses).values(address).returning();
    return newAddress;
  }

  // Wallet Operations
  async getUserWalletBalance(userId: number): Promise<number> {
    const [user] = await db.select({ walletBalance: users.walletBalance })
      .from(users)
      .where(eq(users.id, userId));
    return user ? parseFloat(user.walletBalance) : 0;
  }

  async updateUserWalletBalance(userId: number, amount: number): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({ walletBalance: String(amount) })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction> {
    const [newTransaction] = await db.insert(walletTransactions).values(transaction).returning();
    return newTransaction;
  }

  async getUserWalletTransactions(userId: number): Promise<WalletTransaction[]> {
    return await db.select()
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(sql`${walletTransactions.createdAt} DESC`);
  }

  async updateWalletTransactionStatus(transactionId: number, status: string): Promise<WalletTransaction> {
    const [updatedTransaction] = await db.update(walletTransactions)
      .set({ status })
      .where(eq(walletTransactions.id, transactionId))
      .returning();
    return updatedTransaction;
  }

  // Drivers Implementation
  async getDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers).orderBy(sql`${drivers.createdAt} DESC`);
  }

  async getDriver(id: number): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver || undefined;
  }

  async getDriverByEmail(email: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.email, email));
    return driver || undefined;
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const [newDriver] = await db.insert(drivers).values(driver).returning();
    return newDriver;
  }

  async updateDriver(id: number, driver: Partial<InsertDriver>): Promise<Driver> {
    const [updated] = await db.update(drivers)
      .set({ ...driver, updatedAt: sql`NOW()` })
      .where(eq(drivers.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Driver with id ${id} not found`);
    }
    return updated;
  }

  async deleteDriver(id: number): Promise<void> {
    await db.delete(drivers).where(eq(drivers.id, id));
  }

  // Settings Implementation
  async getSettings(): Promise<Settings[]> {
    return await db.select().from(settings).orderBy(sql`${settings.updatedAt} DESC`);
  }

  async getSetting(key: string): Promise<Settings | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async updateSetting(key: string, value: string, type: string, description?: string): Promise<Settings> {
    const updateData: any = {
      value,
      type,
      updatedAt: sql`NOW()`
    };
    
    if (description !== undefined) {
      updateData.description = description;
    }

    const [updated] = await db.insert(settings)
      .values({
        key,
        value,
        type,
        description
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: updateData
      })
      .returning();
    
    return updated;
  }

  // Coupons Implementation
  async getCoupons(): Promise<Coupon[]> {
    return await db.select().from(coupons).orderBy(sql`${coupons.createdAt} DESC`);
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const normalizedCode = code.toUpperCase();
    const [coupon] = await db.select().from(coupons).where(sql`UPPER(${coupons.code}) = ${normalizedCode}`);
    return coupon || undefined;
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const [newCoupon] = await db.insert(coupons).values({
      ...coupon,
      code: coupon.code.toUpperCase()
    }).returning();
    return newCoupon;
  }

  async updateCoupon(id: number, couponData: Partial<InsertCoupon>): Promise<Coupon> {
    const updateData = couponData.code 
      ? { ...couponData, code: couponData.code.toUpperCase() }
      : couponData;

    const [updated] = await db.update(coupons)
      .set(updateData)
      .where(eq(coupons.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Coupon with id ${id} not found`);
    }
    
    return updated;
  }

  async deleteCoupon(id: number): Promise<void> {
    await db.delete(coupons).where(eq(coupons.id, id));
  }

  async incrementCouponUsage(id: number): Promise<Coupon> {
    const [updated] = await db.update(coupons)
      .set({ usedCount: sql`${coupons.usedCount} + 1` })
      .where(eq(coupons.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Coupon with id ${id} not found`);
    }
    
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
