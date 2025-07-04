import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  setDoc,
  getDoc
} from "firebase/firestore";
import { auth, database } from "@/lib/firebase";
import { User } from "firebase/auth";

// User Profile Data
export interface UserProfile {
  id?: string;
  uid: string;
  displayName?: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

// Address Data
export interface UserAddress {
  id?: string;
  uid: string;
  governorate: string;
  district: string;
  neighborhood: string;
  street?: string;
  houseNumber?: string;
  floorNumber?: string;
  notes?: string;
  isDefault: boolean;
  createdAt: string;
}

// Cart Item Data
export interface UserCartItem {
  id?: string;
  uid: string;
  productId: number;
  productName: string;
  quantity: number;
  price: string;
  unit: string;
  addedAt: string;
  // Compatibility with existing cart structure
  product: {
    id: number;
    name: string;
    price: string;
    unit: string;
  };
}

// Order Data
export interface UserOrder {
  id?: string;
  uid: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: UserAddress;
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

// Utility function to get current user
const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Utility function to ensure user is authenticated
const ensureAuthenticated = (): string => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated');
  }
  return user.uid;
};

// User Profile Management
export const createOrUpdateUserProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
  const uid = ensureAuthenticated();
  const user = getCurrentUser()!;
  
  const userProfileData: UserProfile = {
    uid,
    email: user.email || '',
    displayName: user.displayName || profileData.displayName || '',
    phone: profileData.phone || '',
    createdAt: profileData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...profileData
  };
  
  const userDocRef = doc(db, 'userProfiles', uid);
  await setDoc(userDocRef, userProfileData, { merge: true });
  
  return { id: uid, ...userProfileData };
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  const uid = ensureAuthenticated();
  
  const userDocRef = doc(db, 'userProfiles', uid);
  const userDoc = await getDoc(userDocRef);
  
  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() } as UserProfile;
  }
  
  return null;
};

// Address Management
export const getUserAddresses = async (): Promise<UserAddress[]> => {
  const uid = ensureAuthenticated();
  
  const addressesQuery = query(
    collection(db, 'userAddresses'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(addressesQuery);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as UserAddress[];
};

export const addUserAddress = async (addressData: Omit<UserAddress, 'id' | 'uid' | 'createdAt'>): Promise<UserAddress> => {
  const uid = ensureAuthenticated();
  
  const newAddress: Omit<UserAddress, 'id'> = {
    ...addressData,
    uid,
    createdAt: new Date().toISOString()
  };
  
  console.log('Adding address to Firestore:', newAddress);
  
  // Retry logic for Firestore operations
  let retries = 3;
  let lastError: any;
  
  while (retries > 0) {
    try {
      console.log(`Attempting to add address (${4 - retries}/3)...`);
      const docRef = await addDoc(collection(db, 'userAddresses'), newAddress);
      console.log('Address added successfully with ID:', docRef.id);
      return { id: docRef.id, ...newAddress };
    } catch (error: any) {
      lastError = error;
      retries--;
      console.warn(`Address add attempt failed (${3 - retries}/3):`, error.message);
      
      if (retries > 0) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
      }
    }
  }
  
  console.error('All address add attempts failed:', lastError);
  throw new Error(`فشل في حفظ العنوان: ${lastError.message || 'خطأ في الاتصال'}`);
};

export const updateUserAddress = async (addressId: string, addressData: Partial<UserAddress>): Promise<void> => {
  const uid = ensureAuthenticated();
  
  const addressRef = doc(db, 'userAddresses', addressId);
  await updateDoc(addressRef, {
    ...addressData,
    uid // Ensure uid cannot be changed
  });
};

export const deleteUserAddress = async (addressId: string): Promise<void> => {
  ensureAuthenticated();
  
  const addressRef = doc(db, 'userAddresses', addressId);
  await deleteDoc(addressRef);
};

export const setDefaultAddress = async (addressId: string): Promise<void> => {
  const uid = ensureAuthenticated();
  
  // First, remove default from all other addresses
  const addressesQuery = query(
    collection(db, 'userAddresses'),
    where('uid', '==', uid),
    where('isDefault', '==', true)
  );
  
  const existingDefaults = await getDocs(addressesQuery);
  await Promise.all(
    existingDefaults.docs.map(doc => 
      updateDoc(doc.ref, { isDefault: false })
    )
  );
  
  // Set the new default
  const addressRef = doc(db, 'userAddresses', addressId);
  await updateDoc(addressRef, { isDefault: true });
};

// Cart Management
export const getUserCartItems = async (): Promise<UserCartItem[]> => {
  const uid = ensureAuthenticated();
  
  const cartQuery = query(
    collection(db, 'userCartItems'),
    where('uid', '==', uid),
    orderBy('addedAt', 'desc')
  );
  
  const querySnapshot = await getDocs(cartQuery);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as UserCartItem[];
};

export const addToUserCart = async (cartItem: Omit<UserCartItem, 'id' | 'uid' | 'addedAt' | 'product'>): Promise<UserCartItem> => {
  const uid = ensureAuthenticated();
  
  // Create the product structure for compatibility
  const productData = {
    id: cartItem.productId,
    name: cartItem.productName,
    price: cartItem.price,
    unit: cartItem.unit
  };
  
  // Check if item already exists in cart
  const existingQuery = query(
    collection(db, 'userCartItems'),
    where('uid', '==', uid),
    where('productId', '==', cartItem.productId)
  );
  
  const existingItems = await getDocs(existingQuery);
  
  if (!existingItems.empty) {
    // Update existing item quantity
    const existingItem = existingItems.docs[0];
    const currentQuantity = existingItem.data().quantity;
    const newQuantity = currentQuantity + cartItem.quantity;
    
    await updateDoc(existingItem.ref, { quantity: newQuantity });
    
    return {
      id: existingItem.id,
      ...existingItem.data(),
      quantity: newQuantity,
      product: productData
    } as UserCartItem;
  } else {
    // Add new item to cart
    const newCartItem: Omit<UserCartItem, 'id'> = {
      ...cartItem,
      uid,
      addedAt: new Date().toISOString(),
      product: productData
    };
    
    const docRef = await addDoc(collection(db, 'userCartItems'), newCartItem);
    return { id: docRef.id, ...newCartItem };
  }
};

export const updateCartItemQuantity = async (cartItemId: string, quantity: number): Promise<void> => {
  ensureAuthenticated();
  
  if (quantity <= 0) {
    await deleteUserCartItem(cartItemId);
    return;
  }
  
  const cartItemRef = doc(db, 'userCartItems', cartItemId);
  await updateDoc(cartItemRef, { quantity });
};

export const deleteUserCartItem = async (cartItemId: string): Promise<void> => {
  ensureAuthenticated();
  
  const cartItemRef = doc(db, 'userCartItems', cartItemId);
  await deleteDoc(cartItemRef);
};

export const clearUserCart = async (): Promise<void> => {
  const uid = ensureAuthenticated();
  
  const cartQuery = query(
    collection(db, 'userCartItems'),
    where('uid', '==', uid)
  );
  
  const querySnapshot = await getDocs(cartQuery);
  await Promise.all(
    querySnapshot.docs.map(doc => deleteDoc(doc.ref))
  );
};

// Order Management
export const getUserOrders = async (): Promise<UserOrder[]> => {
  const uid = ensureAuthenticated();
  
  const ordersQuery = query(
    collection(db, 'userOrders'),
    where('uid', '==', uid),
    orderBy('orderDate', 'desc')
  );
  
  const querySnapshot = await getDocs(ordersQuery);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as UserOrder[];
};

export const createUserOrder = async (orderData: Omit<UserOrder, 'id' | 'uid' | 'orderDate'>): Promise<UserOrder> => {
  const uid = ensureAuthenticated();
  
  const newOrder: Omit<UserOrder, 'id'> = {
    ...orderData,
    uid,
    orderDate: new Date().toISOString()
  };
  
  const docRef = await addDoc(collection(db, 'userOrders'), newOrder);
  
  // Clear user's cart after successful order
  await clearUserCart();
  
  return { id: docRef.id, ...newOrder };
};

export const updateUserOrderStatus = async (orderId: string, status: UserOrder['status']): Promise<void> => {
  ensureAuthenticated();
  
  const orderRef = doc(db, 'userOrders', orderId);
  await updateDoc(orderRef, { status });
};

// Data Migration and Cleanup
export const migrateUserDataOnAuth = async (): Promise<void> => {
  const uid = ensureAuthenticated();
  const user = getCurrentUser()!;
  
  console.log('Migrating user data for:', user.email);
  
  // Create or update user profile
  await createOrUpdateUserProfile({
    displayName: user.displayName || '',
    phone: ''
  });
  
  console.log('User profile created/updated');
};

export const clearUserDataOnLogout = async (): Promise<void> => {
  // This function can be called to clear any local caches
  // The actual Firebase data remains associated with the user account
  console.log('Clearing local user data caches');
};