/**
 * WebAuthn API routes for passkey authentication
 */

import { Router } from 'express';
import { 
  generateRegistrationOptions, 
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyRegistrationResponseOpts,
  VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
import type { 
  RegistrationResponseJSON, 
  AuthenticationResponseJSON 
} from '@simplewebauthn/browser';
import { db } from './db';
import { users, passkeyCredentials } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

const router = Router();

// Domain configuration for WebAuthn
const RP_NAME = 'PAKETY';
const RP_ID = process.env.NODE_ENV === 'production' 
  ? 'pakety.replit.app' // Update this to your actual domain
  : 'localhost';
const ORIGIN = process.env.NODE_ENV === 'production'
  ? 'https://pakety.replit.app' // Update this to your actual origin
  : 'http://localhost:5000';

// In-memory storage for challenges (in production, use Redis or database)
const challengeStore = new Map<string, string>();

/**
 * Begin passkey registration
 */
router.post('/register/begin', async (req, res) => {
  try {
    const { email, displayName, deviceInfo } = req.body;

    if (!email || !displayName) {
      return res.status(400).json({ 
        error: 'Email and display name are required' 
      });
    }

    // Check if user exists
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Get existing credentials for this user
    const existingCredentials = await db
      .select()
      .from(passkeyCredentials)
      .where(eq(passkeyCredentials.userId, user.id));

    const options: GenerateRegistrationOptionsOpts = {
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: new TextEncoder().encode(user.id.toString()),
      userName: email,
      userDisplayName: displayName,
      timeout: deviceInfo?.isMobile ? 120000 : 60000,
      attestationType: 'none',
      excludeCredentials: existingCredentials.map(cred => ({
        id: cred.credentialId,
        transports: (cred.transports || []) as AuthenticatorTransport[],
      })),
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'required',
      },
      supportedAlgorithmIDs: [-7, -257], // ES256, RS256
    };

    const registrationOptions = await generateRegistrationOptions(options);

    // Store challenge
    challengeStore.set(email, registrationOptions.challenge);

    res.json(registrationOptions);
  } catch (error) {
    console.error('WebAuthn registration begin error:', error);
    res.status(500).json({ 
      error: 'Failed to generate registration options' 
    });
  }
});

/**
 * Finish passkey registration
 */
router.post('/register/finish', async (req, res) => {
  try {
    const { email, credential, deviceInfo }: {
      email: string;
      credential: RegistrationResponseJSON;
      deviceInfo?: any;
    } = req.body;

    if (!email || !credential) {
      return res.status(400).json({ 
        error: 'Email and credential are required' 
      });
    }

    // Get stored challenge
    const expectedChallenge = challengeStore.get(email);
    if (!expectedChallenge) {
      return res.status(400).json({ 
        error: 'Invalid or expired challenge' 
      });
    }

    // Get user
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    const opts: VerifyRegistrationResponseOpts = {
      response: credential,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    };

    const verification = await verifyRegistrationResponse(opts);

    if (verification.verified && verification.registrationInfo) {
      const { registrationInfo } = verification;
      
      // Store credential in database
      await db.insert(passkeyCredentials).values({
        userId: user.id,
        credentialId: registrationInfo.credentialID,
        credentialPublicKey: Buffer.from(registrationInfo.credentialPublicKey).toString('base64'),
        counter: registrationInfo.counter,
        deviceType: deviceInfo?.isAndroid ? 'android' : deviceInfo?.isIOS ? 'ios' : 'desktop',
        aaguid: registrationInfo.aaguid || null,
        credentialDeviceType: registrationInfo.credentialDeviceType,
        credentialBackedUp: registrationInfo.credentialBackedUp,
        transports: credential.response.transports || [],
      });

      // Remove challenge
      challengeStore.delete(email);

      res.json({ 
        verified: true,
        message: 'Passkey registered successfully' 
      });
    } else {
      res.status(400).json({ 
        verified: false,
        error: 'Registration verification failed' 
      });
    }
  } catch (error) {
    console.error('WebAuthn registration finish error:', error);
    res.status(500).json({ 
      error: 'Failed to verify registration' 
    });
  }
});

/**
 * Begin passkey authentication
 */
router.post('/authenticate/begin', async (req, res) => {
  try {
    const { email, conditional, deviceInfo } = req.body;

    let allowCredentials: { id: Uint8Array; type: 'public-key'; transports?: AuthenticatorTransport[]; }[] = [];

    if (email && !conditional) {
      // Get user's credentials for username-specific authentication
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (user) {
        const credentials = await db
          .select()
          .from(passkeyCredentials)
          .where(eq(passkeyCredentials.userId, user.id));

        allowCredentials = credentials.map(cred => ({
          id: new TextEncoder().encode(cred.credentialId),
          type: 'public-key' as const,
          transports: (cred.transports || []) as AuthenticatorTransport[],
        }));
      }
    }

    const options: GenerateAuthenticationOptionsOpts = {
      rpID: RP_ID,
      timeout: deviceInfo?.isMobile ? 120000 : 60000,
      allowCredentials: conditional ? [] : allowCredentials, // Empty for discoverable credentials
      userVerification: 'required',
    };

    const authenticationOptions = await generateAuthenticationOptions(options);

    // Store challenge
    const challengeKey = conditional ? 'conditional' : email || 'default';
    challengeStore.set(challengeKey, authenticationOptions.challenge);

    res.json(authenticationOptions);
  } catch (error) {
    console.error('WebAuthn authentication begin error:', error);
    res.status(500).json({ 
      error: 'Failed to generate authentication options' 
    });
  }
});

/**
 * Finish passkey authentication
 */
router.post('/authenticate/finish', async (req, res) => {
  try {
    const { credential, conditional, deviceInfo }: {
      credential: AuthenticationResponseJSON;
      conditional?: boolean;
      deviceInfo?: any;
    } = req.body;

    if (!credential) {
      return res.status(400).json({ 
        error: 'Credential is required' 
      });
    }

    // Get stored challenge
    const challengeKey = conditional ? 'conditional' : 'default';
    const expectedChallenge = challengeStore.get(challengeKey);
    if (!expectedChallenge) {
      return res.status(400).json({ 
        error: 'Invalid or expired challenge' 
      });
    }

    // Find the credential in database
    const [dbCredential] = await db
      .select({
        id: passkeyCredentials.id,
        userId: passkeyCredentials.userId,
        credentialId: passkeyCredentials.credentialId,
        credentialPublicKey: passkeyCredentials.credentialPublicKey,
        counter: passkeyCredentials.counter,
        transports: passkeyCredentials.transports,
        userEmail: users.email,
        userFullName: users.fullName,
      })
      .from(passkeyCredentials)
      .innerJoin(users, eq(users.id, passkeyCredentials.userId))
      .where(eq(passkeyCredentials.credentialId, credential.id));

    if (!dbCredential) {
      return res.status(404).json({ 
        error: 'Credential not found' 
      });
    }

    const opts: VerifyAuthenticationResponseOpts = {
      response: credential,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: new TextEncoder().encode(dbCredential.credentialId),
        credentialPublicKey: Buffer.from(dbCredential.credentialPublicKey, 'base64'),
        counter: dbCredential.counter,
        transports: (dbCredential.transports || []) as AuthenticatorTransport[],
      },
      requireUserVerification: true,
    };

    const verification = await verifyAuthenticationResponse(opts);

    if (verification.verified) {
      // Update counter
      await db
        .update(passkeyCredentials)
        .set({ 
          counter: verification.authenticationInfo.newCounter,
          lastUsedAt: new Date(),
        })
        .where(eq(passkeyCredentials.id, dbCredential.id));

      // Remove challenge
      challengeStore.delete(challengeKey);

      // Create session for the user (similar to regular login)
      req.session.userId = dbCredential.userId;
      req.session.userEmail = dbCredential.userEmail;
      req.session.loginTime = new Date().toISOString();
      req.session.lastChecked = new Date().toISOString();

      res.json({ 
        verified: true,
        user: {
          id: dbCredential.userId,
          email: dbCredential.userEmail,
          fullName: dbCredential.userFullName,
        },
        message: 'Authentication successful' 
      });
    } else {
      res.status(400).json({ 
        verified: false,
        error: 'Authentication verification failed' 
      });
    }
  } catch (error) {
    console.error('WebAuthn authentication finish error:', error);
    res.status(500).json({ 
      error: 'Failed to verify authentication' 
    });
  }
});

/**
 * Get user's passkeys
 */
router.get('/credentials/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Check if user is authenticated and requesting their own credentials
    if (req.session.userId !== userId) {
      return res.status(403).json({ 
        error: 'Unauthorized' 
      });
    }

    const credentials = await db
      .select({
        id: passkeyCredentials.id,
        deviceType: passkeyCredentials.deviceType,
        createdAt: passkeyCredentials.createdAt,
        lastUsedAt: passkeyCredentials.lastUsedAt,
        credentialBackedUp: passkeyCredentials.credentialBackedUp,
      })
      .from(passkeyCredentials)
      .where(eq(passkeyCredentials.userId, userId));

    res.json(credentials);
  } catch (error) {
    console.error('Get credentials error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch credentials' 
    });
  }
});

/**
 * Delete a passkey
 */
router.delete('/credentials/:credentialId', async (req, res) => {
  try {
    const credentialId = req.params.credentialId;
    
    // Check if user owns this credential
    const [credential] = await db
      .select()
      .from(passkeyCredentials)
      .where(eq(passkeyCredentials.id, parseInt(credentialId)));

    if (!credential || credential.userId !== req.session.userId) {
      return res.status(403).json({ 
        error: 'Unauthorized' 
      });
    }

    await db
      .delete(passkeyCredentials)
      .where(eq(passkeyCredentials.id, parseInt(credentialId)));

    res.json({ 
      success: true,
      message: 'Passkey deleted successfully' 
    });
  } catch (error) {
    console.error('Delete credential error:', error);
    res.status(500).json({ 
      error: 'Failed to delete credential' 
    });
  }
});

export default router;