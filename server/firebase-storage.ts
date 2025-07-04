import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration for server
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase for server
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
import type { 
  Category, 
  Product, 
  User, 
  UserAddress, 
  Order, 
  InsertCategory, 
  InsertProduct, 
  InsertUser, 
  InsertUserAddress, 
  InsertOrder 
} from '@shared/schema';

export class FirebaseStorage {
  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const categoriesRef = collection(db, 'categories');
      const q = query(categoriesRef, orderBy('displayOrder', 'asc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      })) as Category[];
    } catch (error) {
      console.error('Firebase: Failed to get categories', error);
      throw error;
    }
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    try {
      const categoriesRef = collection(db, 'categories');
      const docRef = await addDoc(categoriesRef, {
        ...category,
        createdAt: new Date()
      });
      
      const newCategory = {
        id: parseInt(docRef.id),
        ...category
      } as Category;
      
      return newCategory;
    } catch (error) {
      console.error('Firebase: Failed to create category', error);
      throw error;
    }
  }

  async updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category> {
    try {
      const categoryRef = doc(db, 'categories', id.toString());
      await updateDoc(categoryRef, {
        ...updates,
        updatedAt: new Date()
      });
      
      const updatedDoc = await getDoc(categoryRef);
      return {
        id,
        ...updatedDoc.data()
      } as Category;
    } catch (error) {
      console.error('Firebase: Failed to update category', error);
      throw error;
    }
  }

  async deleteCategory(id: number): Promise<void> {
    try {
      const categoryRef = doc(db, 'categories', id.toString());
      await deleteDoc(categoryRef);
    } catch (error) {
      console.error('Firebase: Failed to delete category', error);
      throw error;
    }
  }

  // Products
  async getProducts(): Promise<Product[]> {
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('displayOrder', 'asc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      })) as Product[];
    } catch (error) {
      console.error('Firebase: Failed to get products', error);
      throw error;
    }
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    try {
      const productsRef = collection(db, 'products');
      const q = query(
        productsRef, 
        where('categoryId', '==', categoryId),
        orderBy('displayOrder', 'asc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      })) as Product[];
    } catch (error) {
      console.error('Firebase: Failed to get products by category', error);
      throw error;
    }
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    try {
      const productsRef = collection(db, 'products');
      
      // Generate a custom numeric ID
      const snapshot = await getDocs(productsRef);
      const maxId = snapshot.docs.reduce((max, doc) => {
        const id = parseInt(doc.id);
        return id > max ? id : max;
      }, 0);
      
      const newId = maxId + 1;
      const productRef = doc(db, 'products', newId.toString());
      
      const productData = {
        ...product,
        createdAt: new Date()
      };
      
      await setDoc(productRef, productData);
      
      return {
        id: newId,
        ...product
      } as Product;
    } catch (error) {
      console.error('Firebase: Failed to create product', error);
      throw error;
    }
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product> {
    try {
      const productRef = doc(db, 'products', id.toString());
      await updateDoc(productRef, {
        ...updates,
        updatedAt: new Date()
      });
      
      const updatedDoc = await getDoc(productRef);
      return {
        id,
        ...updatedDoc.data()
      } as Product;
    } catch (error) {
      console.error('Firebase: Failed to update product', error);
      throw error;
    }
  }

  async deleteProduct(id: number): Promise<void> {
    try {
      const productRef = doc(db, 'products', id.toString());
      await deleteDoc(productRef);
    } catch (error) {
      console.error('Firebase: Failed to delete product', error);
      throw error;
    }
  }

  // Users
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return undefined;
      
      const doc = snapshot.docs[0];
      return {
        id: parseInt(doc.id),
        ...doc.data()
      } as User;
    } catch (error) {
      console.error('Firebase: Failed to get user by email', error);
      throw error;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const usersRef = collection(db, 'users');
      
      // Generate a custom numeric ID
      const snapshot = await getDocs(usersRef);
      const maxId = snapshot.docs.reduce((max, doc) => {
        const id = parseInt(doc.id);
        return id > max ? id : max;
      }, 0);
      
      const newId = maxId + 1;
      const userRef = doc(db, 'users', newId.toString());
      
      const userData = {
        ...user,
        createdAt: new Date()
      };
      
      await setDoc(userRef, userData);
      
      return {
        id: newId,
        ...user
      } as User;
    } catch (error) {
      console.error('Firebase: Failed to create user', error);
      throw error;
    }
  }

  // User Addresses
  async getUserAddresses(userId: number): Promise<UserAddress[]> {
    try {
      const addressesRef = collection(db, 'userAddresses');
      const q = query(
        addressesRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      })) as UserAddress[];
    } catch (error) {
      console.error('Firebase: Failed to get user addresses', error);
      throw error;
    }
  }

  async createUserAddress(address: InsertUserAddress): Promise<UserAddress> {
    try {
      const addressesRef = collection(db, 'userAddresses');
      
      // Generate a custom numeric ID
      const snapshot = await getDocs(addressesRef);
      const maxId = snapshot.docs.reduce((max, doc) => {
        const id = parseInt(doc.id);
        return id > max ? id : max;
      }, 0);
      
      const newId = maxId + 1;
      const addressRef = doc(db, 'userAddresses', newId.toString());
      
      const addressData = {
        ...address,
        createdAt: new Date()
      };
      
      await setDoc(addressRef, addressData);
      
      return {
        id: newId,
        ...address,
        createdAt: new Date()
      } as UserAddress;
    } catch (error) {
      console.error('Firebase: Failed to create user address', error);
      throw error;
    }
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('orderDate', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      })) as Order[];
    } catch (error) {
      console.error('Firebase: Failed to get orders', error);
      throw error;
    }
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    try {
      const ordersRef = collection(db, 'orders');
      
      // Generate a custom numeric ID
      const snapshot = await getDocs(ordersRef);
      const maxId = snapshot.docs.reduce((max, doc) => {
        const id = parseInt(doc.id);
        return id > max ? id : max;
      }, 0);
      
      const newId = maxId + 1;
      const orderRef = doc(db, 'orders', newId.toString());
      
      const orderData = {
        ...order,
        orderDate: new Date()
      };
      
      await setDoc(orderRef, orderData);
      
      return {
        id: newId,
        ...order,
        orderDate: new Date()
      } as Order;
    } catch (error) {
      console.error('Firebase: Failed to create order', error);
      throw error;
    }
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    try {
      const orderRef = doc(db, 'orders', id.toString());
      await updateDoc(orderRef, {
        status,
        updatedAt: new Date()
      });
      
      const updatedDoc = await getDoc(orderRef);
      return {
        id,
        ...updatedDoc.data()
      } as Order;
    } catch (error) {
      console.error('Firebase: Failed to update order status', error);
      throw error;
    }
  }
}

export const firebaseStorage = new FirebaseStorage();