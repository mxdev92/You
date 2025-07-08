import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? '***configured***' : 'missing',
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId ? '***configured***' : 'missing'
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Auth functions
export const signInWithGoogle = () => {
  return signInWithRedirect(auth, googleProvider);
};

export const signInWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signOutUser = () => {
  return signOut(auth);
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Phone Authentication with OTP
export const setupRecaptcha = (containerId: string) => {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA verified');
    }
  });
};

export const sendOTPToPhone = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
  try {
    console.log('Firebase: Sending OTP to phone:', phoneNumber);
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    console.log('Firebase: OTP sent successfully');
    return confirmationResult;
  } catch (error: any) {
    console.error('Firebase: Failed to send OTP:', error);
    throw error;
  }
};

export const verifyOTPAndSignIn = async (confirmationResult: any, otpCode: string) => {
  try {
    console.log('Firebase: Verifying OTP:', otpCode);
    const result = await confirmationResult.confirm(otpCode);
    console.log('Firebase: Phone verification successful:', result.user.phoneNumber);
    return result.user;
  } catch (error: any) {
    console.error('Firebase: OTP verification failed:', error);
    throw error;
  }
};

// Firestore functions for user data
export const createUserProfile = async (user: User, additionalData: any = {}) => {
  if (!user) return;
  
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    const { displayName, email } = user;
    const createdAt = new Date();
    
    try {
      await setDoc(userRef, {
        displayName,
        email,
        createdAt,
        ...additionalData
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  }
  
  return userRef;
};

export const getUserProfile = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() };
  }
  
  return null;
};

// User addresses in Firestore
export const createUserAddress = async (userId: string, addressData: any) => {
  const addressRef = doc(collection(db, 'addresses'));
  await setDoc(addressRef, {
    ...addressData,
    userId,
    createdAt: new Date(),
    id: addressRef.id
  });
  return { id: addressRef.id, ...addressData, userId, createdAt: new Date() };
};

export const getUserAddresses = async (userId: string) => {
  const addressesQuery = query(
    collection(db, 'addresses'),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(addressesQuery);
  const addresses: any[] = [];
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.userId === userId) {
      addresses.push({ id: doc.id, ...data });
    }
  });
  
  return addresses;
};