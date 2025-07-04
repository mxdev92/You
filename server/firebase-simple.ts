import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  setDoc
} from 'firebase/firestore';
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Initialize Firebase with environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export class FirebaseStorage {
  async getCategories() {
    try {
      const snapshot = await getDocs(collection(db, 'categories'));
      return snapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      }));
    } catch (error) {
      console.log('Firebase getCategories fallback - using default categories');
      return [
        { id: 1, name: "خضروات", icon: "Leaf", displayOrder: 1, isSelected: false },
        { id: 2, name: "فواكه", icon: "Apple", displayOrder: 2, isSelected: false },
        { id: 3, name: "مخبوزات", icon: "Wheat", displayOrder: 3, isSelected: false }
      ];
    }
  }

  async getProducts() {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const firebaseProducts = snapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      }));
      
      if (firebaseProducts.length > 0) {
        return firebaseProducts;
      }
      
      // If Firebase is empty, return default products
      return [
        {
          id: 3,
          name: "موز",
          description: "",
          price: "1.50",
          unit: "kg",
          imageUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRkZGRkZGIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkNhaXJvLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7Yvdin8J2UujwvdGV4dD4KPHN2Zz4=",
          displayOrder: 1,
          categoryId: 1,
          available: true
        }
      ];
    } catch (error) {
      console.log('Firebase getProducts fallback - using default products');
      return [
        {
          id: 3,
          name: "موز",
          description: "",
          price: "1.50",
          unit: "kg",
          imageUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRkZGRkZGIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkNhaXJvLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7Yvtin8J2UujwvdGV4dD4KPHN2Zz4=",
          displayOrder: 1,
          categoryId: 1,
          available: true
        }
      ];
    }
  }

  async createProduct(productData: any) {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const maxId = snapshot.docs.reduce((max, doc) => {
        const id = parseInt(doc.id);
        return id > max ? id : max;
      }, 0);
      
      const newId = maxId + 1;
      const productRef = doc(db, 'products', newId.toString());
      
      await setDoc(productRef, {
        ...productData,
        createdAt: new Date()
      });
      
      return {
        id: newId,
        ...productData
      };
    } catch (error) {
      console.error('Firebase createProduct error:', error);
      throw error;
    }
  }

  async updateProduct(id: number, updates: any) {
    try {
      const productRef = doc(db, 'products', id.toString());
      await updateDoc(productRef, {
        ...updates,
        updatedAt: new Date()
      });
      
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
      const productRef = doc(db, 'products', id.toString());
      await deleteDoc(productRef);
    } catch (error) {
      console.error('Firebase deleteProduct error:', error);
      throw error;
    }
  }

  async getOrders() {
    try {
      const snapshot = await getDocs(collection(db, 'orders'));
      return snapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      }));
    } catch (error) {
      console.error('Firebase getOrders error:', error);
      return [];
    }
  }

  async createOrder(orderData: any) {
    try {
      const snapshot = await getDocs(collection(db, 'orders'));
      const maxId = snapshot.docs.reduce((max, doc) => {
        const id = parseInt(doc.id);
        return id > max ? id : max;
      }, 0);
      
      const newId = maxId + 1;
      const orderRef = doc(db, 'orders', newId.toString());
      
      await setDoc(orderRef, {
        ...orderData,
        orderDate: new Date()
      });
      
      return {
        id: newId,
        ...orderData,
        orderDate: new Date()
      };
    } catch (error) {
      console.error('Firebase createOrder error:', error);
      throw error;
    }
  }

  async updateOrderStatus(id: number, status: string) {
    try {
      const orderRef = doc(db, 'orders', id.toString());
      await updateDoc(orderRef, {
        status,
        updatedAt: new Date()
      });
      
      return {
        id,
        status
      };
    } catch (error) {
      console.error('Firebase updateOrderStatus error:', error);
      throw error;
    }
  }
}

export const firebaseStorage = new FirebaseStorage();