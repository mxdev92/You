import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, getAuthToken, checkDriverRole } from '@/lib/firebase';

interface FirebaseAuthState {
  user: User | null;
  loading: boolean;
  isDriver: boolean;
  token: string | null;
}

export const useFirebaseAuth = () => {
  const [authState, setAuthState] = useState<FirebaseAuthState>({
    user: null,
    loading: true,
    isDriver: false,
    token: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        try {
          const [token, isDriver] = await Promise.all([
            getAuthToken(),
            checkDriverRole()
          ]);
          
          setAuthState({
            user,
            loading: false,
            isDriver,
            token
          });
        } catch (error) {
          console.error('Error getting user data:', error);
          setAuthState({
            user,
            loading: false,
            isDriver: false,
            token: null
          });
        }
      } else {
        setAuthState({
          user: null,
          loading: false,
          isDriver: false,
          token: null
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshToken = async () => {
    if (authState.user) {
      try {
        const token = await getAuthToken();
        setAuthState(prev => ({ ...prev, token }));
        return token;
      } catch (error) {
        console.error('Error refreshing token:', error);
        return null;
      }
    }
    return null;
  };

  return {
    ...authState,
    isAuthenticated: !!authState.user,
    refreshToken
  };
};