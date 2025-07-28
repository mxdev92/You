import { Router } from 'express';
import { adminAuth, setDriverClaims } from './firebase-config';
import { storage } from './storage';
import { firebaseAuthMiddleware, AuthenticatedRequest } from './firebase-auth-middleware';

const router = Router();

// Sign up route - creates Firebase user and PostgreSQL user record
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, phone, governorate, district, landmark } = req.body;

    // Create Firebase user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: fullName
    });

    // Create PostgreSQL user record (keeping existing structure)
    const user = await storage.createUser({
      email,
      fullName,
      phone,
      firebaseUid: userRecord.uid // Link to Firebase user
    });

    // Create address record
    await storage.createAddress({
      userId: user.id,
      governorate,
      district,
      landmark
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        firebaseUid: userRecord.uid
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Driver login route - creates driver claims
router.post('/driver-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if driver exists in PostgreSQL
    const driver = await storage.getDriverByEmail(email);
    if (!driver) {
      return res.status(401).json({ message: 'Driver not found' });
    }

    // Create Firebase user for driver if doesn't exist
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (error) {
      // Create Firebase user for driver
      userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: driver.fullName
      });
    }

    // Set driver custom claims
    await setDriverClaims(userRecord.uid, true);

    res.json({
      message: 'Driver authenticated successfully',
      driver: {
        id: driver.id,
        email: driver.email,
        fullName: driver.fullName,
        firebaseUid: userRecord.uid
      }
    });
  } catch (error) {
    console.error('Driver login error:', error);
    res.status(500).json({ message: 'Driver authentication failed' });
  }
});

// Get current user info (Firebase + PostgreSQL)
router.get('/user', firebaseAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.firebaseUser) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Get user from PostgreSQL using Firebase UID
    const user = await storage.getUserByFirebaseUid(req.firebaseUser.uid);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      firebaseUid: req.firebaseUser.uid,
      isDriver: req.firebaseUser.driver || false
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user info' });
  }
});

// Get driver info
router.get('/driver', firebaseAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.firebaseUser || !req.firebaseUser.driver) {
      return res.status(403).json({ message: 'Driver access required' });
    }

    // Get driver from PostgreSQL using Firebase UID
    const driver = await storage.getDriverByFirebaseUid(req.firebaseUser.uid);
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json({
      id: driver.id,
      email: driver.email,
      fullName: driver.fullName,
      phone: driver.phone,
      firebaseUid: req.firebaseUser.uid
    });
  } catch (error) {
    console.error('Get driver error:', error);
    res.status(500).json({ message: 'Failed to get driver info' });
  }
});

// Refresh Firebase token
router.post('/refresh-token', firebaseAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.firebaseUser) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Token is already verified by middleware, just return success
    res.json({ message: 'Token is valid' });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Token refresh failed' });
  }
});

export default router;