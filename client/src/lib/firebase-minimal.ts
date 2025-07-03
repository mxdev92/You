import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, connectFirestoreEmulator } from "firebase/firestore";

// Simplified Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
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
  db = getFirestore(app);
  
  console.log('Firebase initialized successfully');
  console.log('Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
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

// Create order with comprehensive error handling
export const createOrder = async (order: Omit<Order, 'id'>) => {
  console.log('=== CREATING ORDER ===');
  console.log('Order data:', order);
  
  try {
    // Check if Firebase is properly initialized
    if (!db) {
      throw new Error('Firebase database not initialized');
    }
    
    // Sign in anonymously if not already authenticated
    if (!auth?.currentUser) {
      console.log('Signing in anonymously...');
      await signInAnonymously(auth!);
      console.log('Anonymous sign-in successful');
    }
    
    // Prepare order data
    const orderData = {
      ...order,
      orderDate: new Date().toISOString(),
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      uid: auth?.currentUser?.uid || 'anonymous'
    };
    
    console.log('Adding document to Firestore...');
    console.log('Auth user:', auth?.currentUser?.uid);
    
    // Create the document
    const docRef = await addDoc(collection(db, 'orders'), orderData);
    
    console.log('=== ORDER CREATED SUCCESSFULLY ===');
    console.log('Document ID:', docRef.id);
    
    return docRef.id;
    
  } catch (error: any) {
    console.error('=== ORDER CREATION FAILED ===');
    console.error('Error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Provide specific error messages
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please ensure Firebase security rules allow anonymous access.');
    } else if (error.code === 'unavailable') {
      throw new Error('Firebase service is temporarily unavailable.');
    } else if (error.message?.includes('transport')) {
      throw new Error('Network transport error. Check Firebase project configuration.');
    } else if (error.code === 'failed-precondition') {
      throw new Error('Firebase project configuration error.');
    }
    
    throw new Error(`Order creation failed: ${error.message}`);
  }
};

export const getOrders = async () => {
  try {
    if (!auth?.currentUser) {
      await signInAnonymously(auth!);
    }
    
    const q = query(collection(db!, 'orders'), orderBy('orderDate', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  try {
    if (!auth?.currentUser) {
      await signInAnonymously(auth!);
    }
    
    const orderRef = doc(db!, 'orders', orderId);
    await updateDoc(orderRef, { status });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

export const deleteOrder = async (orderId: string) => {
  try {
    if (!auth?.currentUser) {
      await signInAnonymously(auth!);
    }
    
    const orderRef = doc(db!, 'orders', orderId);
    await deleteDoc(orderRef);
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};