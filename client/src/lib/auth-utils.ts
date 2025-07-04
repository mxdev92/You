// Reliable authentication utilities with comprehensive error handling
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';

// Maximum time to wait for Firebase operations
const FIREBASE_TIMEOUT = 8000;

// Create a promise that rejects after timeout
const createTimeoutPromise = (ms: number, operation: string) => {
  return new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} timed out after ${ms}ms`));
    }, ms);
  });
};

// Robust login function with timeout protection
export const reliableLogin = async (email: string, password: string) => {
  console.log('Starting reliable login for:', email);
  
  try {
    const result = await Promise.race([
      signInWithEmailAndPassword(auth, email, password),
      createTimeoutPromise(FIREBASE_TIMEOUT, 'Login')
    ]);
    
    console.log('Login successful:', result.user.email);
    return result;
  } catch (error: any) {
    console.error('Login failed:', error);
    throw new Error(error.message || 'Login failed');
  }
};

// Robust registration function with timeout protection
export const reliableRegister = async (email: string, password: string) => {
  console.log('Starting reliable registration for:', email);
  
  try {
    // Clear any existing auth state first
    try {
      await firebaseSignOut(auth);
      console.log('Cleared existing auth state');
    } catch (e) {
      console.log('No existing auth state to clear');
    }

    // Small delay to ensure cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const result = await Promise.race([
      createUserWithEmailAndPassword(auth, email, password),
      createTimeoutPromise(FIREBASE_TIMEOUT, 'Registration')
    ]);
    
    console.log('Registration successful:', result.user.email);
    return result;
  } catch (error: any) {
    console.error('Registration failed:', error);
    throw new Error(error.message || 'Registration failed');
  }
};

// Robust logout function
export const reliableLogout = async () => {
  console.log('Starting reliable logout...');
  
  try {
    await Promise.race([
      firebaseSignOut(auth),
      createTimeoutPromise(FIREBASE_TIMEOUT, 'Logout')
    ]);
    
    console.log('Logout successful');
    
    // Clear local storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Force page reload to ensure clean state
    setTimeout(() => {
      window.location.reload();
    }, 100);
    
  } catch (error: any) {
    console.error('Logout failed:', error);
    // Even if logout fails, clear local state and reload
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  }
};

// Check if user is currently authenticated
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Enhanced auth state listener with timeout protection
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  console.log('Setting up auth state listener...');
  
  return auth.onAuthStateChanged((user) => {
    console.log('Auth state changed:', user ? `${user.email} (${user.uid})` : 'No user');
    callback(user);
  });
};