import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, signInUser, signUpUser, signOutUser } from '@/lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      console.log('🔥 Firebase Auth State Changed:', user?.email || 'No user');
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await signInUser(email, password);
      console.log('🔥 Firebase Login successful:', result.email);
      return result;
    } catch (err: any) {
      console.error('🔥 Firebase Login error:', err);
      setError(err.message || 'Login failed');
      setLoading(false);
      throw err;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await signUpUser(email, password);
      console.log('🔥 Firebase Registration successful:', result.email);
      return result;
    } catch (err: any) {
      console.error('🔥 Firebase Registration error:', err);
      setError(err.message || 'Registration failed');
      setLoading(false);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await signOutUser();
      console.log('🔥 Firebase Sign out successful');
    } catch (err: any) {
      setError(err.message || 'Sign out failed');
      console.error('🔥 Firebase Sign out error:', err);
      throw err;
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