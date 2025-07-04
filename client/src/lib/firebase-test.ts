// Test Firebase connection and diagnose issues
import { auth, db } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  console.log('=== FIREBASE CONNECTION DIAGNOSTIC ===');
  
  // Test 1: Check auth state
  console.log('1. Auth State:');
  console.log('   Current user:', auth.currentUser?.email || 'No user');
  console.log('   User UID:', auth.currentUser?.uid || 'No UID');
  
  // Test 2: Check Firestore connection
  console.log('2. Firestore Connection:');
  try {
    // Try to read from a test collection
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    console.log('   Firestore read test: SUCCESS');
    console.log('   Documents found:', snapshot.size);
  } catch (error: any) {
    console.error('   Firestore read test: FAILED', error.message);
  }
  
  // Test 3: Try to write to Firestore
  console.log('3. Firestore Write Test:');
  if (auth.currentUser) {
    try {
      const testDoc = await addDoc(collection(db, 'test'), {
        message: 'Connection test',
        timestamp: new Date().toISOString(),
        uid: auth.currentUser.uid
      });
      console.log('   Firestore write test: SUCCESS');
      console.log('   Document ID:', testDoc.id);
    } catch (error: any) {
      console.error('   Firestore write test: FAILED', error.message);
      console.error('   Error code:', error.code);
      console.error('   Full error:', error);
    }
  } else {
    console.log('   Firestore write test: SKIPPED (no authenticated user)');
  }
  
  // Test 4: Check userAddresses collection specifically
  console.log('4. UserAddresses Collection Test:');
  if (auth.currentUser) {
    try {
      const userAddressesCollection = collection(db, 'userAddresses');
      const addressSnapshot = await getDocs(userAddressesCollection);
      console.log('   UserAddresses read test: SUCCESS');
      console.log('   Existing addresses:', addressSnapshot.size);
    } catch (error: any) {
      console.error('   UserAddresses read test: FAILED', error.message);
    }
  }
  
  console.log('=== END DIAGNOSTIC ===');
};

// Call this function when user is authenticated
export const runDiagnostic = () => {
  if (auth.currentUser) {
    testFirebaseConnection();
  } else {
    console.log('Cannot run diagnostic - user not authenticated');
  }
};