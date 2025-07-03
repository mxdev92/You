import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDatabase, ref, push, set, get, update, remove, orderByChild, query } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  databaseURL: `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
let app;
let auth;
let db;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getDatabase(app);
  
  console.log('Firebase Realtime Database initialized successfully');
  console.log('Database URL:', firebaseConfig.databaseURL);
} catch (error) {
  console.error('Firebase initialization failed:', error);
}

export { auth, db };

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
  deliveryTime?: string;
  notes?: string;
}

// Ensure authentication
const ensureAuth = async () => {
  if (!auth?.currentUser) {
    console.log('Signing in anonymously for Realtime Database...');
    await signInAnonymously(auth!);
    console.log('Anonymous authentication successful');
  }
};

export const createOrder = async (order: Omit<Order, 'id'>) => {
  console.log('=== CREATING ORDER IN REALTIME DATABASE ===');
  console.log('Order data:', order);
  
  try {
    if (!db) {
      throw new Error('Firebase Realtime Database not initialized');
    }
    
    await ensureAuth();
    
    // Prepare order data
    const orderData = {
      ...order,
      orderDate: new Date().toISOString(),
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      uid: auth?.currentUser?.uid || 'anonymous'
    };
    
    console.log('Adding order to Realtime Database...');
    console.log('Auth user:', auth?.currentUser?.uid);
    
    // Push to orders collection
    const ordersRef = ref(db, 'orders');
    const newOrderRef = push(ordersRef);
    await set(newOrderRef, orderData);
    
    const orderId = newOrderRef.key!;
    console.log('=== ORDER CREATED SUCCESSFULLY ===');
    console.log('Order ID:', orderId);
    
    return orderId;
    
  } catch (error: any) {
    console.error('=== ORDER CREATION FAILED ===');
    console.error('Error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Provide specific error messages
    if (error.code === 'PERMISSION_DENIED') {
      throw new Error('Permission denied. Please ensure Firebase Realtime Database rules allow access.');
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error('Network error. Check your internet connection.');
    } else if (error.message?.includes('Database URL')) {
      throw new Error('Database URL configuration error. Check Firebase project settings.');
    }
    
    throw new Error(`Order creation failed: ${error.message}`);
  }
};

export const getOrders = async (): Promise<(Order & { id: string })[]> => {
  try {
    if (!db) {
      throw new Error('Firebase Realtime Database not initialized');
    }
    
    await ensureAuth();
    
    console.log('Fetching orders from Realtime Database...');
    const ordersRef = ref(db, 'orders');
    const snapshot = await get(ordersRef);
    
    if (!snapshot.exists()) {
      console.log('No orders found in database');
      return [];
    }
    
    const ordersData = snapshot.val();
    const orders = Object.keys(ordersData).map(key => ({
      id: key,
      ...ordersData[key]
    })).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    
    console.log('Orders fetched successfully:', orders.length);
    return orders;
    
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  try {
    if (!db) {
      throw new Error('Firebase Realtime Database not initialized');
    }
    
    await ensureAuth();
    
    const orderRef = ref(db, `orders/${orderId}`);
    await update(orderRef, { status });
    
    console.log('Order status updated successfully');
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

export const deleteOrder = async (orderId: string) => {
  try {
    if (!db) {
      throw new Error('Firebase Realtime Database not initialized');
    }
    
    await ensureAuth();
    
    const orderRef = ref(db, `orders/${orderId}`);
    await remove(orderRef);
    
    console.log('Order deleted successfully');
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};