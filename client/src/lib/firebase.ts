import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase (prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth functions
export const loginWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmail = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logout = () => {
  return signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Orders Management Functions
export interface Order {
  id?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: {
    governorate: string;
    district: string;
    neighborhood: string;
    street: string;
    houseNumber: string;
    floorNumber?: string;
    notes?: string;
  };
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    price: string;
    unit: string;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled';
  orderDate: string;
  deliveryDate?: string;
  notes?: string;
}

export const createOrder = async (order: Omit<Order, 'id'>) => {
  try {
    console.log('Firebase createOrder called with:', order);
    
    // Validate Firebase config
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
    
    console.log('Firebase config check:', {
      hasApiKey: !!config.apiKey,
      hasProjectId: !!config.projectId,
      hasAppId: !!config.appId
    });
    
    if (!config.apiKey || !config.projectId || !config.appId) {
      throw new Error('Firebase configuration is incomplete. Please check environment variables.');
    }
    
    const orderWithDefaults = {
      ...order,
      orderDate: new Date().toISOString(),
      status: 'pending' as const
    };
    
    console.log('Adding document to Firestore...');
    const docRef = await addDoc(collection(db, 'orders'), orderWithDefaults);
    console.log('Order successfully created with ID:', docRef.id);
    
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating order:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Provide more specific error messages
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check Firebase security rules.');
    } else if (error.code === 'unavailable') {
      throw new Error('Firebase service is temporarily unavailable. Please try again.');
    } else if (error.message?.includes('fetch')) {
      throw new Error('Network connection error. Please check your internet connection.');
    }
    
    throw new Error(error.message || 'Unknown error occurred while creating order.');
  }
};

export const getOrders = async () => {
  try {
    console.log('Fetching orders from Firebase...');
    const q = query(collection(db, 'orders'), orderBy('orderDate', 'desc'));
    const querySnapshot = await getDocs(q);
    console.log('Orders fetched successfully:', querySnapshot.size);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  } catch (error) {
    console.error('Error fetching orders:', error);
    // Return empty array instead of throwing to prevent infinite loading
    return [];
  }
};

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

export const deleteOrder = async (orderId: string) => {
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

// Product management functions
export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  unit: string;
  available: boolean;
  displayOrder?: number;
  imageUrl: string;
  createdAt: string;
}

export const createProduct = async (product: Omit<Product, 'id' | 'createdAt'>) => {
  try {
    const productData = {
      ...product,
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'products'), productData);
    return { id: docRef.id, ...productData };
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const getProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

export const uploadProductImage = async (file: File): Promise<string> => {
  try {
    // For now, return a placeholder URL
    // In a real implementation, you would upload to Firebase Storage
    return '/api/placeholder/60/60';
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};