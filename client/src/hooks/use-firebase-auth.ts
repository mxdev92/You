import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useFirebaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    console.log('Firebase Auth: Setting up auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Firebase Auth: State changed', user ? user.email : 'No user');
      
      setAuthState({
        user,
        loading: false,
        error: null
      });
    });

    return () => unsubscribe();
  }, []);

  const registerWithEmailPassword = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Firebase Auth: Starting email/password registration:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Firebase Auth: Registration successful:', userCredential.user.email);
      return userCredential.user;
    } catch (error: any) {
      console.error('Firebase Auth: Registration failed:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Registration failed' 
      }));
      throw error;
    }
  };

  const signInWithEmailPassword = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Firebase Auth: Starting email/password sign in:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase Auth: Sign in successful:', userCredential.user.email);
      return userCredential.user;
    } catch (error: any) {
      console.error('Firebase Auth: Sign in failed:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Sign in failed' 
      }));
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      console.log('Firebase Auth: Sign out successful');
    } catch (error: any) {
      console.error('Firebase Auth: Sign out failed:', error);
      throw error;
    }
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    registerWithEmailPassword,
    signInWithEmailPassword,
    signOut: signOutUser
  };
};