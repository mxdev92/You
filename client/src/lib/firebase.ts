import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User, signInAnonymously, setPersistence, browserSessionPersistence, connectAuthEmulator } from "firebase/auth";
import { initializeFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, connectFirestoreEmulator, enableNetwork, disableNetwork } from "firebase/firestore";

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

// Fix Firestore connection issues with force long polling
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // This fixes the WebChannel transport errors
  useFetchStreams: false,
});

console.log('Firestore initialized with force long polling to fix transport errors');

// Auth persistence configuration
setPersistence(auth, browserSessionPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

// Allow normal Firebase auth persistence for better user experience
// Only clear storage during explicit logout, not on initialization

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
    console.log('Starting login...');
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
    console.log('Starting fresh account creation...');
    
    // Complete authentication state clearing
    try {
      await signOut(auth);
    } catch (e) {
      console.log('No existing user to sign out');
    }
    
    // Clear any existing auth state
    
    // Wait for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Create new account with completely fresh state
    console.log('Creating new account for:', email);
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firebase account creation timed out after 8 seconds')), 8000);
    });

    const result = await Promise.race([
      createUserWithEmailAndPassword(auth, email, password),
      timeoutPromise
    ]) as any;
    
    console.log('New account created successfully:', result.user.email);
    
    return result;
  } catch (error: any) {
    console.error('Error creating account:', error);
    
    // If it's an "email already in use" error, clear everything and try to sign in instead
    if (error.code === 'auth/email-already-in-use') {
      console.log('Email already exists, attempting to sign in instead...');
      try {
        
        await new Promise(resolve => setTimeout(resolve, 100));
        return await signInWithEmailAndPassword(auth, email, password);
      } catch (signInError) {
        console.error('Sign in also failed:', signInError);
        throw new Error('Account exists but password is incorrect');
      }
    }
    
    throw error;
  }
};

export const logout = async () => {
  try {
    console.log('Starting complete logout process...');
    
    // Sign out from Firebase first
    await signOut(auth);
    
    // Aggressive storage clearing
    
    
    // Additional aggressive cleanup
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all possible Firebase-related keys
    const allFirebasePatterns = [
      'firebase',
      'authUser',
      'persist',
      'Firebase',
      'fbase_key',
      'fbaseuser',
      'app-check',
      'remoteConfig'
    ];
    
    allFirebasePatterns.forEach(pattern => {
      Object.keys(localStorage).forEach(key => {
        if (key.toLowerCase().includes(pattern.toLowerCase())) {
          localStorage.removeItem(key);
        }
      });
      Object.keys(sessionStorage).forEach(key => {
        if (key.toLowerCase().includes(pattern.toLowerCase())) {
          sessionStorage.removeItem(key);
        }
      });
    });
    
    // Clear IndexedDB databases used by Firebase
    try {
      const databases = ['firebaseLocalStorageDb', 'firebase-heartbeat-database', 'firebase-installations-database'];
      await Promise.all(databases.map(dbName => 
        new Promise((resolve) => {
          const deleteReq = indexedDB.deleteDatabase(dbName);
          deleteReq.onsuccess = () => resolve(true);
          deleteReq.onerror = () => resolve(false);
          // Timeout after 2 seconds
          setTimeout(() => resolve(false), 2000);
        })
      ));
    } catch (err) {
      console.log('IndexedDB cleanup completed');
    }
    
    // Clear service worker caches if they exist
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      }
    } catch (err) {
      console.log('Service worker cleanup completed');
    }
    
    // Force page reload to completely reset authentication state
    console.log('Authentication cleared completely. Reloading page...');
    setTimeout(() => {
      window.location.href = window.location.origin;
    }, 100);
    
  } catch (error) {
    console.error('Error during logout:', error);
    // Force reload even if there's an error
    setTimeout(() => {
      window.location.href = window.location.origin;
    }, 100);
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    // Check for inconsistent authentication state
    if (user && user.email) {
      // Check if this user matches what should be in storage
      const expectedUser = sessionStorage.getItem('expected_user');
      if (expectedUser && expectedUser !== user.email) {
        console.log('Authentication state mismatch detected, clearing...');
        
        signOut(auth).then(() => {
          setTimeout(() => window.location.reload(), 100);
        });
        return;
      }
      
      // Store the current authenticated user
      sessionStorage.setItem('expected_user', user.email);
    } else {
      // No user, clear expected user
      sessionStorage.removeItem('expected_user');
    }
    
    callback(user);
  });
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