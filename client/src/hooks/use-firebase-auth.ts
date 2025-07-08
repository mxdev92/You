import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  auth, 
  onAuthStateChange, 
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser,
  createUserProfile,
  getUserProfile,
  setupRecaptcha,
  sendOTPToPhone,
  verifyOTPAndSignIn
} from '../lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

interface AuthState {
  user: User | null;
  userProfile: any;
  loading: boolean;
  error: string | null;
}

export const useFirebaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userProfile: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    console.log('Firebase Auth: Setting up auth state listener');
    
    const unsubscribe = onAuthStateChange(async (user) => {
      console.log('Firebase Auth: State changed', user ? user.email : 'No user');
      
      if (user) {
        try {
          // Get or create user profile
          let userProfile = await getUserProfile(user.uid);
          if (!userProfile) {
            await createUserProfile(user);
            userProfile = await getUserProfile(user.uid);
          }
          
          setAuthState({
            user,
            userProfile,
            loading: false,
            error: null
          });
        } catch (error) {
          console.error('Firebase Auth: Error fetching user profile:', error);
          setAuthState({
            user,
            userProfile: null,
            loading: false,
            error: null
          });
        }
      } else {
        setAuthState({
          user: null,
          userProfile: null,
          loading: false,
          error: null
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Firebase Auth: Starting login process:', email);
      const userCredential = await signInWithEmail(email, password);
      console.log('Firebase Auth: Login successful:', userCredential.user.email);
      // Auth state will be updated by the listener
    } catch (error: any) {
      console.error('Firebase Auth: Login failed:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Login failed' 
      }));
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName?: string, phone?: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Firebase Auth: Starting registration process:', email);
      const userCredential = await signUpWithEmail(email, password);
      
      // Create user profile with additional data
      await createUserProfile(userCredential.user, {
        fullName: fullName || '',
        phone: phone || ''
      });
      
      console.log('Firebase Auth: Registration successful:', userCredential.user.email);
      
      // Return the user for immediate use
      return userCredential.user;
    } catch (error: any) {
      console.error('Firebase Auth: Registration failed:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Registration failed' 
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Firebase Auth: Signing out');
      await signOutUser();
      // Auth state will be updated by the listener
    } catch (error: any) {
      console.error('Firebase Auth: Logout failed:', error);
      throw error;
    }
  };

  const registerWithPhoneOTP = async (phoneNumber: string, fullName: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Firebase Auth: Starting phone OTP registration:', phoneNumber);
      
      // Create invisible reCAPTCHA
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        }
      });
      
      // Send OTP to phone number
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      console.log('Firebase: OTP sent successfully to', phoneNumber);
      
      return confirmationResult;
    } catch (error: any) {
      console.error('Firebase Auth: Phone registration failed:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Phone registration failed' 
      }));
      throw error;
    }
  };

  const verifyOTPAndComplete = async (confirmationResult: any, otpCode: string, fullName: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Firebase Auth: Verifying OTP and completing registration');
      
      const user = await verifyOTPAndSignIn(confirmationResult, otpCode);
      
      // Create user profile with additional data
      await createUserProfile(user, {
        fullName: fullName || '',
        phone: user.phoneNumber || ''
      });
      
      console.log('Firebase Auth: Phone registration completed successfully:', user.phoneNumber);
      return user;
    } catch (error: any) {
      console.error('Firebase Auth: OTP verification failed:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'OTP verification failed' 
      }));
      throw error;
    }
  };

  const loginWithPhoneOTP = async (phoneNumber: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Firebase Auth: Starting phone OTP login (without reCAPTCHA):', phoneNumber);
      
      // Return a mock confirmation for the OTP flow
      return {
        phoneNumber,
        confirm: async (otpCode: string) => {
          console.log('Mock OTP verification for code:', otpCode);
          return { user: { phoneNumber } };
        }
      };
    } catch (error: any) {
      console.error('Firebase Auth: Phone login failed:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Phone login failed' 
      }));
      throw error;
    }
  };

  const verifyLoginOTP = async (confirmationResult: any, otpCode: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Firebase Auth: Verifying login OTP');
      
      const user = await verifyOTPAndSignIn(confirmationResult, otpCode);
      
      console.log('Firebase Auth: Phone login completed successfully:', user.phoneNumber);
      return user;
    } catch (error: any) {
      console.error('Firebase Auth: Login OTP verification failed:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Login OTP verification failed' 
      }));
      throw error;
    }
  };

  // Hybrid approach: Create Firebase account with email-formatted phone for compatibility
  const registerWithEmailFromPhone = async (phone: string, password: string, fullName: string) => {
    const emailFromPhone = `${phone}@pakety.app`;
    return register(emailFromPhone, password, fullName, phone);
  };

  return {
    user: authState.user,
    userProfile: authState.userProfile,
    loading: authState.loading,
    error: authState.error,
    login,
    register,
    registerWithEmailFromPhone,
    logout,
    registerWithPhoneOTP,
    verifyOTPAndComplete,
    loginWithPhoneOTP,
    verifyLoginOTP,
    isAuthenticated: !!authState.user
  };
};