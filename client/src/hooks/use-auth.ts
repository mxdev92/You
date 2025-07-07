// DEPRECATED: Use usePostgresAuth instead
// This file is kept for backward compatibility only
export function useAuth() {
  throw new Error('useAuth is deprecated. Use usePostgresAuth instead');
}
    const unsubscribe = onAuthStateChange(async (user) => {
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
      
      const result = await reliableLogin(email, password);
      console.log('Login successful:', result.user.email);
      // Don't set loading to false here - let onAuthStateChange handle it
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
      
      const result = await reliableRegister(email, password);
      console.log('Registration successful:', result.user.email);
      // Don't set loading to false here - let onAuthStateChange handle it
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
      
      // Call the reliable logout function (this will reload the page)
      await reliableLogout();
      
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