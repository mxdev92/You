import { useState, useEffect } from 'react';
import { localAuth, type LocalUser } from '@/lib/local-auth';

interface AuthState {
  user: LocalUser | null;
  loading: boolean;
  error: string | null;
}

export const useLocalAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: localAuth.getCurrentUser(),
    loading: false,
    error: null,
  });

  useEffect(() => {
    // Set up auth state listener
    const subscription = localAuth.onAuthStateChange((user) => {
      setAuthState(prev => ({
        ...prev,
        user,
        loading: false
      }));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const register = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Local Auth: Registering user', email);
      const user = await localAuth.signUp(email, password);
      setAuthState(prev => ({ ...prev, user, loading: false }));
      console.log('Local Auth: Registration successful', user.email);
      return user;
    } catch (error: any) {
      console.error('Local Auth: Registration failed', error);
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Local Auth: Logging in user', email);
      const user = await localAuth.signIn(email, password);
      setAuthState(prev => ({ ...prev, user, loading: false }));
      console.log('Local Auth: Login successful', user.email);
      return user;
    } catch (error: any) {
      console.error('Local Auth: Login failed', error);
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const logout = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Local Auth: Logging out user');
      await localAuth.signOut();
      setAuthState(prev => ({ ...prev, user: null, loading: false }));
      console.log('Local Auth: Logout successful');
    } catch (error: any) {
      console.error('Local Auth: Logout failed', error);
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