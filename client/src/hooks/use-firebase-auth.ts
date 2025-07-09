import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useFirebaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: firebaseAuth.getCurrentUser(),
    loading: true,
    error: null,
  });

  useEffect(() => {
    console.log('Firebase Auth: Setting up auth state listener');
    
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      console.log('Firebase Auth: State changed', user ? `User: ${user.email}` : 'No user');
      setAuthState(prev => ({
        ...prev,
        user,
        loading: false
      }));
    });

    return unsubscribe;
  }, []);

  const register = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Starting auth process:', { isLogin: false, email });
      const user = await firebaseAuth.signUp(email, password);
      setAuthState(prev => ({ ...prev, user, loading: false }));
      console.log('Registration completed successfully for:', user.email);
      return user;
    } catch (error: any) {
      console.error('Auth error:', error);
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Starting auth process:', { isLogin: true, email });
      const user = await firebaseAuth.signIn(email, password);
      setAuthState(prev => ({ ...prev, user, loading: false }));
      console.log('Login completed successfully for:', user.email);
      return user;
    } catch (error: any) {
      console.error('Auth error:', error);
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const logout = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Starting logout process');
      await firebaseAuth.signOut();
      setAuthState(prev => ({ ...prev, user: null, loading: false }));
      console.log('Logout completed successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    register,
    login,
    logout,
  };
};