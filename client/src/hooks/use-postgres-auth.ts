import { useState, useEffect } from 'react';
import { postgresAuth, type AuthUser } from '@/lib/postgres-auth';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export const usePostgresAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: postgresAuth.getCurrentUser(),
    loading: true,
    error: null,
  });

  useEffect(() => {
    console.log('PostgreSQL Auth: Setting up auth state listener');
    
    const unsubscribe = postgresAuth.onAuthStateChanged((user) => {
      console.log('PostgreSQL Auth: State changed', user ? `User: ${user.email}` : 'No user');
      setAuthState(prev => ({
        ...prev,
        user,
        loading: false
      }));
    });

    return unsubscribe.unsubscribe;
  }, []);

  const register = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Starting PostgreSQL auth process:', { isLogin: false, email });
      const user = await postgresAuth.signUp(email, password);
      setAuthState(prev => ({ ...prev, user, loading: false }));
      console.log('PostgreSQL registration completed successfully for:', user.email);
      return user;
    } catch (error: any) {
      console.error('PostgreSQL auth error:', error);
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Starting PostgreSQL auth process:', { isLogin: true, email });
      const user = await postgresAuth.signIn(email, password);
      setAuthState(prev => ({ ...prev, user, loading: false }));
      console.log('PostgreSQL login completed successfully for:', user.email);
      return user;
    } catch (error: any) {
      console.error('PostgreSQL auth error:', error);
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const logout = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Starting PostgreSQL logout process');
      await postgresAuth.signOut();
      setAuthState(prev => ({ ...prev, user: null, loading: false }));
      console.log('PostgreSQL logout completed successfully');
    } catch (error: any) {
      console.error('PostgreSQL logout error:', error);
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