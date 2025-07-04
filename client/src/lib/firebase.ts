import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User, signInAnonymously, setPersistence, browserSessionPersistence, connectAuthEmulator } from "firebase/auth";
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

// Force session-only persistence to prevent cached authentication
setPersistence(auth, browserSessionPersistence).catch(console.error);

// Test database connection
export const testConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    const testDoc = doc(db, '_test', 'connection');
    // This will fail gracefully if there are permission issues
    await getDocs(query(collection(db, '_test')));
    console.log('Firebase connection test successful');
    return true;
  } catch (error: any) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
};

// Auth functions
export const loginWithEmail = async (email: string, password: string) => {
  try {
    // Clear any cached authentication data first
    localStorage.removeItem('firebase:authUser');
    sessionStorage.clear();
    
    // Sign in with fresh state
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in successfully:', result.user.email);
    
    return result;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, password: string) => {
  try {
    // First ensure we're signed out completely
    await signOut(auth);
    
    // Clear any existing authentication data
    localStorage.removeItem('firebase:authUser');
    sessionStorage.clear();
    
    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Create new account with fresh state
    const result = await createUserWithEmailAndPassword(auth, email, password);
    console.log('New account created successfully:', result.user.email);
    
    return result;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    console.log('Starting complete logout process...');
    
    // Sign out from Firebase first
    await signOut(auth);
    
    // Clear ALL possible storage locations
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear Firebase-specific storage keys
    const firebaseKeys = [
      'firebase:authUser',
      'firebase:host',
      'firebase:previous_websocket_failure'
    ];
    
    firebaseKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Clear IndexedDB databases used by Firebase
    try {
      await new Promise((resolve, reject) => {
        const deleteReq = indexedDB.deleteDatabase('firebaseLocalStorageDb');
        deleteReq.onsuccess = () => resolve(true);
        deleteReq.onerror = () => reject(deleteReq.error);
      });
    } catch (err) {
      console.log('IndexedDB cleanup completed');
    }
    
    // Force page reload to completely reset authentication state
    console.log('Authentication cleared completely. Reloading page...');
    window.location.reload();
    
  } catch (error) {
    console.error('Error during logout:', error);
    // Force reload even if there's an error
    window.location.reload();
  }
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

// Ensure anonymous authentication for Firestore access
const ensureAuth = async () => {
  if (!auth.currentUser) {
    console.log('No user authenticated, signing in anonymously...');
    await signInAnonymously(auth);
    console.log('Anonymous authentication successful');
  }
};

export const createOrder = async (order: Omit<Order, 'id'>) => {
  console.log('Creating order in Firebase:', order);
  
  try {
    // Check Firebase configuration
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
    
    if (!config.apiKey || !config.projectId || !config.appId) {
      throw new Error('Firebase configuration is incomplete');
    }
    
    // Ensure user is authenticated (anonymous or email)
    await ensureAuth();
    
    // Prepare order data with timestamp
    const orderData = {
      ...order,
      orderDate: new Date().toISOString(),
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      userId: auth.currentUser?.uid || 'anonymous'
    };
    
    console.log('Attempting to add document to Firestore...');
    console.log('Current user:', auth.currentUser?.uid);
    
    // Use a timeout wrapper to prevent infinite hanging
    const createOrderPromise = addDoc(collection(db, 'orders'), orderData);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000);
    });
    
    const docRef = await Promise.race([createOrderPromise, timeoutPromise]);
    console.log('Order created successfully with ID:', docRef.id);
    return docRef.id;
    
  } catch (error: any) {
    console.error('Firebase error details:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Map Firebase errors to user-friendly messages
    let errorMessage = 'Order submission failed. ';
    
    if (error.code === 'unavailable') {
      errorMessage += 'Firebase service is temporarily unavailable.';
    } else if (error.code === 'permission-denied') {
      errorMessage += 'Permission denied. Check Firebase security rules.';
    } else if (error.code === 'unauthenticated') {
      errorMessage += 'Authentication failed. Please try again.';
    } else if (error.message?.includes('transport')) {
      errorMessage += 'Network connection issue detected.';
    } else if (error.message?.includes('timeout')) {
      errorMessage += 'Request timed out. Please try again.';
    } else if (error.code === 'network-request-failed') {
      errorMessage += 'Network request failed. Check your internet connection.';
    } else {
      errorMessage += error.message || 'Unknown error occurred.';
    }
    
    throw new Error(errorMessage);
  }
};

export const getOrders = async () => {
  try {
    await ensureAuth();
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