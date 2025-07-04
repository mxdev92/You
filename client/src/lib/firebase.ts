import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, doc, setDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Types
export interface UserAddress {
  id?: string;
  userId: string;
  governorate: string;
  district: string;
  neighborhood: string;
  notes: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface Order {
  id?: string;
  userId: string;
  items: Array<{
    id: number;
    name: string;
    price: string;
    quantity: number;
    unit: string;
  }>;
  totalAmount: number;
  address: UserAddress;
  status: 'pending' | 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// Authentication functions
export const firebaseAuth = {
  signUp: async (email: string, password: string): Promise<User> => {
    console.log('Firebase Auth: Creating account for', email);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Firebase Auth: Account created successfully', userCredential.user.email);
      return userCredential.user;
    } catch (error: any) {
      console.error('Firebase Auth: Signup failed', error.code, error.message);
      throw new Error(getFirebaseErrorMessage(error.code));
    }
  },

  signIn: async (email: string, password: string): Promise<User> => {
    console.log('Firebase Auth: Signing in', email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase Auth: Sign in successful', userCredential.user.email);
      return userCredential.user;
    } catch (error: any) {
      console.error('Firebase Auth: Signin failed', error.code, error.message);
      throw new Error(getFirebaseErrorMessage(error.code));
    }
  },

  signOut: async (): Promise<void> => {
    console.log('Firebase Auth: Signing out');
    try {
      await signOut(auth);
      console.log('Firebase Auth: Sign out successful');
    } catch (error: any) {
      console.error('Firebase Auth: Signout failed', error);
      throw error;
    }
  },

  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser: (): User | null => {
    return auth.currentUser;
  }
};

// Address functions
export const addressService = {
  addAddress: async (address: Omit<UserAddress, 'id' | 'createdAt'>): Promise<string> => {
    try {
      console.log('Firebase: Adding address for user', address.userId);
      
      // If this is the default address, unset other default addresses
      if (address.isDefault) {
        await addressService.unsetDefaultAddresses(address.userId);
      }

      const addressData = {
        ...address,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'addresses'), addressData);
      console.log('Firebase: Address added successfully', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Firebase: Failed to add address', error);
      throw error;
    }
  },

  getUserAddresses: async (userId: string): Promise<UserAddress[]> => {
    try {
      console.log('Firebase: Fetching addresses for user', userId);
      const q = query(
        collection(db, 'addresses'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const addresses: UserAddress[] = [];
      
      querySnapshot.forEach((doc) => {
        addresses.push({
          id: doc.id,
          ...doc.data()
        } as UserAddress);
      });
      
      console.log('Firebase: Retrieved', addresses.length, 'addresses');
      return addresses;
    } catch (error) {
      console.error('Firebase: Failed to fetch addresses', error);
      throw error;
    }
  },

  getDefaultAddress: async (userId: string): Promise<UserAddress | null> => {
    try {
      const q = query(
        collection(db, 'addresses'),
        where('userId', '==', userId),
        where('isDefault', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as UserAddress;
    } catch (error) {
      console.error('Firebase: Failed to fetch default address', error);
      throw error;
    }
  },

  unsetDefaultAddresses: async (userId: string): Promise<void> => {
    try {
      const q = query(
        collection(db, 'addresses'),
        where('userId', '==', userId),
        where('isDefault', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const promises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, { isDefault: false })
      );
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Firebase: Failed to unset default addresses', error);
      throw error;
    }
  }
};

// Order functions
export const orderService = {
  createOrder: async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      console.log('Firebase: Creating order for user', order.userId);
      
      const orderData = {
        ...order,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      console.log('Firebase: Order created successfully', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Firebase: Failed to create order', error);
      throw error;
    }
  },

  getUserOrders: async (userId: string): Promise<Order[]> => {
    try {
      console.log('Firebase: Fetching orders for user', userId);
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const orders: Order[] = [];
      
      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data()
        } as Order);
      });
      
      console.log('Firebase: Retrieved', orders.length, 'orders');
      return orders;
    } catch (error) {
      console.error('Firebase: Failed to fetch orders', error);
      throw error;
    }
  }
};

// Error message mapping
function getFirebaseErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'هذا البريد الإلكتروني مستخدم بالفعل';
    case 'auth/weak-password':
      return 'كلمة المرور ضعيفة جداً';
    case 'auth/invalid-email':
      return 'البريد الإلكتروني غير صحيح';
    case 'auth/user-not-found':
      return 'المستخدم غير موجود';
    case 'auth/wrong-password':
      return 'كلمة المرور خاطئة';
    case 'auth/too-many-requests':
      return 'محاولات كثيرة، حاول مرة أخرى لاحقاً';
    case 'auth/network-request-failed':
      return 'خطأ في الاتصال، تحقق من الإنترنت';
    default:
      return 'حدث خطأ غير متوقع';
  }
}

console.log('Firebase services initialized successfully');