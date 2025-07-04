import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, loginWithEmail, registerWithEmail, logout } from '@/lib/firebase';
import { migrateUserDataOnAuth, clearUserDataOnLogout } from '@/lib/firebase-user-data';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      console.log('Auth state changed:', user ? `${user.email} (${user.uid})` : 'No user');
      setUser(user);
      
      if (user) {
        // User authenticated - migrate/setup their data
        try {
          await migrateUserDataOnAuth();
          console.log('User data migration completed for:', user.email);
        } catch (error) {
          console.error('Error during user data migration:', error);
        }
      } else {
        // User logged out - clear local caches
        try {
          await clearUserDataOnLogout();
          console.log('User data cleanup completed');
        } catch (error) {
          console.error('Error during user data cleanup:', error);
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Login timed out after 10 seconds')), 10000);
      });

      const result = await Promise.race([
        loginWithEmail(email, password),
        timeoutPromise
      ]) as any;
      
      console.log('Login successful:', result.user.email);
      // Don't set loading to false here - let onAuthChange handle it
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Registration timed out after 10 seconds')), 10000);
      });

      const result = await Promise.race([
        registerWithEmail(email, password),
        timeoutPromise
      ]) as any;
      
      console.log('Registration successful:', result.user.email);
      // Don't set loading to false here - let onAuthChange handle it
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      
      // Clear user state immediately
      setUser(null);
      
      // Call the complete logout function (this will reload the page)
      await logout();
      
    } catch (err: any) {
      setError(err.message);
      console.error('Error during sign out:', err);
      // Force reload even if there's an error
      window.location.reload();
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