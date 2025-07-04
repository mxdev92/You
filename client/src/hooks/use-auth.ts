import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, loginWithEmail, registerWithEmail, logout } from '@/lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await loginWithEmail(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await registerWithEmail(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Clear user state immediately
      setUser(null);
      
      // Clear any local storage data
      localStorage.clear();
      sessionStorage.clear();
      
      // Logout from Firebase
      await logout();
      
      console.log('Authentication state cleared successfully');
    } catch (err: any) {
      setError(err.message);
      console.error('Error during sign out:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    signOut,
    isAuthenticated: !!user
  };
}