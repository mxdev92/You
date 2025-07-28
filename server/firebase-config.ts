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
let adminApp;
if (!getApps().length) {
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
    }
    
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch (parseError) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON:', parseError);
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY must be valid JSON');
    }
    
    // Validate required fields
    if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
      throw new Error('Service account JSON must contain private_key, client_email, and project_id fields');
    }

    adminApp = initializeAdminApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    
    console.log('🔥 Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
} else {
  adminApp = getApps()[0];
}

export const adminAuth = getAdminAuth(adminApp);
export const adminDb = getAdminFirestore(adminApp);

// Helper function to verify Firebase Auth token
export async function verifyFirebaseToken(token: string) {
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