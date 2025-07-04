import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, push, set, get, update, remove, query, orderByChild } from "firebase/database";

// Firebase configuration using your Realtime Database
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  databaseURL: "https://qiwiq-3a8a1-default-rtdb.firebaseio.com/",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

console.log('Firebase Realtime Database initialized successfully');
console.log('Database URL:', firebaseConfig.databaseURL);

export class FirebaseRealtimeStorage {
  async getCategories() {
    try {
      // Force reset categories to the new 4 categories
      const newCategories = [
        { id: 1, name: "خضروات", icon: "Leaf", displayOrder: 1, isSelected: false },
        { id: 2, name: "فواكة", icon: "Apple", displayOrder: 2, isSelected: false },
        { id: 3, name: "ماء", icon: "Droplets", displayOrder: 3, isSelected: false },
        { id: 4, name: "خبز", icon: "Wheat", displayOrder: 4, isSelected: false }
      ];
      
      // Clear all existing categories and set new ones
      const categoriesRef = ref(db, 'categories');
      await set(categoriesRef, null); // Clear all
      
      // Save new categories to Firebase
      for (const category of newCategories) {
        await set(ref(db, `categories/${category.id}`), category);
      }
      
      console.log('Categories reset to new 4 categories:', newCategories);
      return newCategories;
    } catch (error) {
      console.error('Firebase getCategories error:', error);
      return [
        { id: 1, name: "خضروات", icon: "Leaf", displayOrder: 1, isSelected: false },
        { id: 2, name: "فواكة", icon: "Apple", displayOrder: 2, isSelected: false },
        { id: 3, name: "ماء", icon: "Droplets", displayOrder: 3, isSelected: false },
        { id: 4, name: "خبز", icon: "Wheat", displayOrder: 4, isSelected: false }
      ];
    }
  }

  async getProducts() {
    try {
      const productsRef = ref(db, 'products');
      const snapshot = await get(productsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(key => ({
          id: parseInt(key),
          ...data[key]
        }));
      }
      
      // Initialize default product if none exist
      const defaultProduct = {
        id: 3,
        name: "موز",
        description: "",
        price: "1.50",
        unit: "kg",
        imageUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRkZGRkZGIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkNhaXJvLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7Yvdin8J2UujwvdGV4dD4KPHN2Zz4=",
        displayOrder: 1,
        categoryId: 2,
        available: true
      };
      
      // Save default product to Firebase
      await set(ref(db, `products/${defaultProduct.id}`), defaultProduct);
      
      return [defaultProduct];
    } catch (error) {
      console.error('Firebase getProducts error:', error);
      return [
        {
          id: 3,
          name: "موز",
          description: "",
          price: "1.50",
          unit: "kg",
          imageUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRkZGRkZGIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkNhaXJvLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7Yvdin8J2UujwvdGV4dD4KPHN2Zz4=",
          displayOrder: 1,
          categoryId: 2,
          available: true
        }
      ];
    }
  }

  async createProduct(productData: any) {
    try {
      // Get current products to determine next ID
      const productsRef = ref(db, 'products');
      const snapshot = await get(productsRef);
      
      let nextId = 1;
      if (snapshot.exists()) {
        const data = snapshot.val();
        const ids = Object.keys(data).map(key => parseInt(key));
        nextId = Math.max(...ids) + 1;
      }
      
      const newProduct = {
        ...productData,
        id: nextId,
        createdAt: new Date().toISOString()
      };
      
      // Save to Firebase with the ID as the key
      await set(ref(db, `products/${nextId}`), newProduct);
      
      console.log('Product created successfully in Firebase:', newProduct);
      return newProduct;
    } catch (error) {
      console.error('Firebase createProduct error:', error);
      throw error;
    }
  }

  async updateProduct(id: number, updates: any) {
    try {
      const productRef = ref(db, `products/${id}`);
      await update(productRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
      console.log('Product updated successfully in Firebase:', id);
      return {
        id,
        ...updates
      };
    } catch (error) {
      console.error('Firebase updateProduct error:', error);
      throw error;
    }
  }

  async deleteProduct(id: number) {
    try {
      const productRef = ref(db, `products/${id}`);
      await remove(productRef);
      console.log('Product deleted successfully from Firebase:', id);
    } catch (error) {
      console.error('Firebase deleteProduct error:', error);
      throw error;
    }
  }

  async getOrders() {
    try {
      const ordersRef = ref(db, 'orders');
      const snapshot = await get(ordersRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(key => ({
          id: parseInt(key),
          ...data[key]
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Firebase getOrders error:', error);
      return [];
    }
  }

  async createOrder(orderData: any) {
    try {
      // Get current orders to determine next ID
      const ordersRef = ref(db, 'orders');
      const snapshot = await get(ordersRef);
      
      let nextId = 1;
      if (snapshot.exists()) {
        const data = snapshot.val();
        const ids = Object.keys(data).map(key => parseInt(key));
        nextId = Math.max(...ids) + 1;
      }
      
      const newOrder = {
        ...orderData,
        id: nextId,
        orderDate: new Date().toISOString()
      };
      
      // Save to Firebase with the ID as the key
      await set(ref(db, `orders/${nextId}`), newOrder);
      
      console.log('Order created successfully in Firebase:', newOrder);
      return newOrder;
    } catch (error) {
      console.error('Firebase createOrder error:', error);
      throw error;
    }
  }

  async updateOrderStatus(id: number, status: string) {
    try {
      const orderRef = ref(db, `orders/${id}`);
      await update(orderRef, {
        status,
        updatedAt: new Date().toISOString()
      });
      
      console.log('Order status updated successfully in Firebase:', id, status);
      return {
        id,
        status
      };
    } catch (error) {
      console.error('Firebase updateOrderStatus error:', error);
      throw error;
    }
  }

  async createCategory(categoryData: any) {
    try {
      // Get current categories to determine next ID
      const categoriesRef = ref(db, 'categories');
      const snapshot = await get(categoriesRef);
      
      let nextId = 1;
      if (snapshot.exists()) {
        const data = snapshot.val();
        const ids = Object.keys(data).map(key => parseInt(key));
        nextId = Math.max(...ids) + 1;
      }
      
      const newCategory = {
        ...categoryData,
        id: nextId,
        createdAt: new Date().toISOString()
      };
      
      // Save to Firebase with the ID as the key
      await set(ref(db, `categories/${nextId}`), newCategory);
      
      console.log('Category created successfully in Firebase:', newCategory);
      return newCategory;
    } catch (error) {
      console.error('Firebase createCategory error:', error);
      throw error;
    }
  }

  async updateCategory(id: number, updates: any) {
    try {
      const categoryRef = ref(db, `categories/${id}`);
      await update(categoryRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
      console.log('Category updated successfully in Firebase:', id);
      return {
        id,
        ...updates
      };
    } catch (error) {
      console.error('Firebase updateCategory error:', error);
      throw error;
    }
  }

  async deleteCategory(id: number) {
    try {
      const categoryRef = ref(db, `categories/${id}`);
      await remove(categoryRef);
      console.log('Category deleted successfully from Firebase:', id);
    } catch (error) {
      console.error('Firebase deleteCategory error:', error);
      throw error;
    }
  }
}

export const firebaseStorage = new FirebaseRealtimeStorage();