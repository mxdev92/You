import { useState, useEffect } from 'react';
import { postgresAuth, type AuthUser } from '@/lib/postgres-auth';
import { queryClient } from '@/lib/queryClient';

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
    console.log('PostgreSQL Auth: Setting up ultra-stable auth state listener');
    
    const unsubscribe = postgresAuth.onAuthStateChanged((user) => {
      console.log('PostgreSQL Auth: State changed', user ? `✅ User: ${user.email}` : '❌ No user');
      setAuthState(prev => ({
        ...prev,
        user,
        loading: false,
        lastStateChange: new Date().toISOString()
      }));
    });

    // Aggressive session restoration on page load
    const initializeAuth = async () => {
      try {
        console.log('🔄 Starting aggressive session restoration...');
        await postgresAuth.initializeAuth();
        console.log('✅ Session restoration completed');
      } catch (error) {
        console.warn('⚠️ Session restoration failed:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    initializeAuth();

    return unsubscribe.unsubscribe;
  }, []); // Keep empty dependency array for page load only

  const register = async (email: string, password: string, fullName?: string, phone?: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Starting PostgreSQL auth process:', { isLogin: false, email });
      
      // CRITICAL SECURITY FIX: Clear cache before registration to ensure fresh user data
      console.log('🔒 SECURITY: Clearing cache before registration to ensure clean user data');
      queryClient.clear();
      
      const user = await postgresAuth.signUp(email, password, fullName, phone);
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
      
      // CRITICAL SECURITY FIX: Clear cache before login to prevent previous user data
      console.log('🔒 SECURITY: Clearing cache before login to ensure fresh user data');
      queryClient.clear();
      
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
      
      // CRITICAL SECURITY FIX: Clear all cached data to prevent cross-user contamination
      console.log('🔒 SECURITY: Clearing all cached user data to prevent cross-user access');
      queryClient.clear();
      
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