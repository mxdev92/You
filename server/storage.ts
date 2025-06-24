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
      { name: "Fruits", icon: "fas fa-apple-alt", isSelected: true },
      { name: "Vegetables", icon: "fas fa-carrot", isSelected: false },
      { name: "Dairy", icon: "fas fa-cheese", isSelected: false },
      { name: "Bakery", icon: "fas fa-bread-slice", isSelected: false },
      { name: "Seafood", icon: "fas fa-fish", isSelected: false },
      { name: "Meat", icon: "fas fa-drumstick-bite", isSelected: false },
    ];

    for (const cat of categoriesData) {
      await this.createCategory(cat);
    }

    // Products
    const productsData: InsertProduct[] = [
      { name: "Organic Apples", price: "4.99", unit: "lb", imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 1 },
      { name: "Fresh Spinach", price: "2.49", unit: "bunch", imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 2 },
      { name: "Bell Peppers", price: "3.99", unit: "lb", imageUrl: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 2 },
      { name: "Fresh Carrots", price: "1.99", unit: "lb", imageUrl: "https://images.unsplash.com/photo-1445282768818-728615cc910a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 2 },
      { name: "Strawberries", price: "5.99", unit: "lb", imageUrl: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 1 },
      { name: "Russet Potatoes", price: "3.49", unit: "5lb", imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 2 },
      { name: "Whole Milk", price: "3.29", unit: "gal", imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 3 },
      { name: "Salmon Fillet", price: "12.99", unit: "lb", imageUrl: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 5 },
      { name: "Greek Yogurt", price: "4.49", unit: "32oz", imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 3 },
      { name: "Bananas", price: "2.99", unit: "bunch", imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 1 },
      { name: "Whole Grain Bread", price: "2.99", unit: "loaf", imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 4 },
      { name: "Fresh Tomatoes", price: "4.50", unit: "lb", imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", categoryId: 2 },
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
    const category: Category = { ...insertCategory, id };
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
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
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
      const updatedItem = { ...existingItem, quantity: existingItem.quantity + insertCartItem.quantity };
      this.cartItems.set(existingItem.id, updatedItem);
      return updatedItem;
    }

    const id = this.currentCartItemId++;
    const cartItem: CartItem = {
      ...insertCartItem,
      id,
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
}

export const storage = new MemStorage();
