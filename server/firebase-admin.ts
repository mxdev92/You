import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Use project ID from environment
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    
    if (!projectId) {
      throw new Error('VITE_FIREBASE_PROJECT_ID environment variable is required');
    }

    admin.initializeApp({
      projectId: projectId,
      // For development, we'll use application default credentials or emulator
    });

    console.log('🔥 Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  }
}

export { admin };

// Function to delete all Firebase users
export async function deleteAllFirebaseUsers(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    const listUsersResult = await admin.auth().listUsers();
    const users = listUsersResult.users;
    
    if (users.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    console.log(`🗑️ Found ${users.length} Firebase users to delete`);
    
    // Delete users in batches
    const deletePromises = users.map(user => admin.auth().deleteUser(user.uid));
    await Promise.all(deletePromises);
    
    console.log(`✅ Successfully deleted ${users.length} Firebase users`);
    return { success: true, deletedCount: users.length };
    
  } catch (error) {
    console.error('❌ Error deleting Firebase users:', error);
    return { 
      success: false, 
      deletedCount: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}