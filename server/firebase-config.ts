import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeApp as initializeAdminApp, cert, getApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

// Firebase client configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase client app
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Firebase Admin SDK
let adminApp: any = null;
let isFirebaseReady = false;

if (!getApps().length) {
  try {
    // Try FIREBASE_SERVICE_ACCOUNT_KEY2 first, then fallback to original
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY2 || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      console.warn('⚠️ No Firebase service account key configured - Firebase features disabled');
    } else if (serviceAccountKey.startsWith('var admin')) {
      console.warn('⚠️ Invalid Firebase service account key format - Firebase features disabled');
    } else {
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(serviceAccountKey);
      } catch (parseError) {
        console.warn('⚠️ Failed to parse Firebase service account key as JSON - Firebase features disabled');
        serviceAccount = null;
      }
      
      if (serviceAccount && serviceAccount.private_key && serviceAccount.client_email && serviceAccount.project_id) {
        adminApp = initializeAdminApp({
          credential: cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        isFirebaseReady = true;
        console.log('🔥 Firebase Admin SDK initialized successfully');
      } else {
        console.warn('⚠️ Invalid service account format - Firebase features disabled');
      }
    }
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error.message);
    console.warn('⚠️ Continuing without Firebase - legacy PostgreSQL auth will be used');
  }
} else {
  adminApp = getApps()[0];
  isFirebaseReady = true;
}

export const adminAuth = adminApp ? getAdminAuth(adminApp) : null;
export const adminDb = adminApp ? getAdminFirestore(adminApp) : null;
export { isFirebaseReady };

// Helper function to verify Firebase Auth token
export async function verifyFirebaseToken(token: string) {
  if (!adminAuth) {
    throw new Error('Firebase Admin not initialized');
  }
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    throw error;
  }
}

// Helper function to set custom claims for driver role
export async function setDriverClaims(uid: string, isDriver: boolean = true) {
  if (!adminAuth) {
    throw new Error('Firebase Admin not initialized');
  }
  try {
    await adminAuth.setCustomUserClaims(uid, { 
      driver: isDriver,
      role: isDriver ? 'driver' : 'user'
    });
    return true;
  } catch (error) {
    console.error('Error setting driver claims:', error);
    throw error;
  }
}