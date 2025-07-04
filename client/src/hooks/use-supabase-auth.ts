import { useState, useEffect } from 'react';
import { supabaseAuth } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useSupabaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { user }, error } = await supabaseAuth.getCurrentUser();
        if (error) throw error;
        
        setAuthState({
          user,
          loading: false,
          error: null,
        });

        console.log('Supabase Auth: Initial user state:', user?.email || 'No user');
      } catch (error: any) {
        console.error('Supabase Auth: Failed to get initial session', error);
        setAuthState({
          user: null,
          loading: false,
          error: error.message,
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabaseAuth.onAuthStateChange((event, session) => {
      console.log('Supabase Auth: State changed', event, session?.user?.email || 'No user');
      
      setAuthState({
        user: session?.user || null,
        loading: false,
        error: null,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const register = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Supabase Auth: Registering user', email);
      const { user } = await supabaseAuth.signUp(email, password);
      console.log('Supabase Auth: Registration successful', user?.email);
      return user;
    } catch (error: any) {
      console.error('Supabase Auth: Registration failed', error);
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Supabase Auth: Logging in user', email);
      const { user } = await supabaseAuth.signIn(email, password);
      console.log('Supabase Auth: Login successful', user?.email);
      return user;
    } catch (error: any) {
      console.error('Supabase Auth: Login failed', error);
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const logout = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Supabase Auth: Logging out user');
      await supabaseAuth.signOut();
      console.log('Supabase Auth: Logout successful');
    } catch (error: any) {
      console.error('Supabase Auth: Logout failed', error);
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