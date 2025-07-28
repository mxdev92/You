import { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken } from './firebase-config';

export interface AuthenticatedRequest extends Request {
  firebaseUser?: {
    uid: string;
    email?: string;
    name?: string;
    picture?: string;
    driver?: boolean;
    role?: string;
  };
}

// Firebase authentication middleware
export const firebaseAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decodedToken = await verifyFirebaseToken(token);
      
      req.firebaseUser = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        driver: decodedToken.driver || false,
        role: decodedToken.role || 'user'
      };
      
      next();
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ message: 'Authentication server error' });
  }
};

// Driver-only middleware
export const driverOnly = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.firebaseUser) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!req.firebaseUser.driver) {
    return res.status(403).json({ message: 'Driver access required' });
  }

  next();
};

// Optional authentication middleware (for routes that work with or without auth)
export const optionalFirebaseAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decodedToken = await verifyFirebaseToken(token);
        
        req.firebaseUser = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name,
          picture: decodedToken.picture,
          driver: decodedToken.driver || false,
          role: decodedToken.role || 'user'
        };
      } catch (error) {
        // Continue without auth if token is invalid
        console.log('Optional auth failed, continuing without authentication');
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional authentication middleware error:', error);
    next(); // Continue even if there's an error
  }
};