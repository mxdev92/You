/**
 * WebAuthn utilities for passkey authentication
 */

import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import type { 
  RegistrationResponseJSON, 
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON
} from '@simplewebauthn/browser';
import { getDeviceInfo, getPasskeyTimeout } from './device-utils';

export interface PasskeyRegistrationResult {
  success: boolean;
  credential?: RegistrationResponseJSON;
  error?: string;
}

export interface PasskeyAuthenticationResult {
  success: boolean;
  credential?: AuthenticationResponseJSON;
  error?: string;
}

/**
 * Register a new passkey for the user
 */
export const registerPasskey = async (
  email: string,
  displayName: string
): Promise<PasskeyRegistrationResult> => {
  try {
    const deviceInfo = getDeviceInfo();
    
    // Get registration options from server
    const optionsResponse = await fetch('/api/webauthn/register/begin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email,
        displayName,
        deviceInfo: {
          isAndroid: deviceInfo.isAndroid,
          isIOS: deviceInfo.isIOS,
          isMobile: deviceInfo.isMobile
        }
      }),
    });

    if (!optionsResponse.ok) {
      throw new Error('Failed to get registration options');
    }

    const options: PublicKeyCredentialCreationOptionsJSON = await optionsResponse.json();
    
    // Configure timeout based on device
    options.timeout = getPasskeyTimeout(deviceInfo);

    // Start WebAuthn registration
    const credential = await startRegistration({ optionsJSON: options });

    // Send credential to server for verification
    const verificationResponse = await fetch('/api/webauthn/register/finish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email,
        credential,
        deviceInfo: {
          isAndroid: deviceInfo.isAndroid,
          isIOS: deviceInfo.isIOS,
          isMobile: deviceInfo.isMobile
        }
      }),
    });

    if (!verificationResponse.ok) {
      throw new Error('Failed to verify passkey registration');
    }

    const verificationResult = await verificationResponse.json();

    if (!verificationResult.verified) {
      throw new Error('Passkey registration verification failed');
    }

    return {
      success: true,
      credential
    };

  } catch (error: any) {
    console.error('Passkey registration failed:', error);
    
    let errorMessage = 'فشل في إنشاء مفتاح المرور';
    
    if (error.name === 'NotAllowedError') {
      errorMessage = 'تم إلغاء إنشاء مفتاح المرور';
    } else if (error.name === 'InvalidStateError') {
      errorMessage = 'مفتاح المرور موجود بالفعل لهذا الحساب';
    } else if (error.name === 'NotSupportedError') {
      errorMessage = 'جهازك لا يدعم مفاتيح المرور';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Authenticate using a passkey
 */
export const authenticateWithPasskey = async (
  email?: string
): Promise<PasskeyAuthenticationResult> => {
  try {
    const deviceInfo = getDeviceInfo();

    // Get authentication options from server
    const optionsResponse = await fetch('/api/webauthn/authenticate/begin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email,
        deviceInfo: {
          isAndroid: deviceInfo.isAndroid,
          isIOS: deviceInfo.isIOS,
          isMobile: deviceInfo.isMobile
        }
      }),
    });

    if (!optionsResponse.ok) {
      throw new Error('Failed to get authentication options');
    }

    const options: PublicKeyCredentialRequestOptionsJSON = await optionsResponse.json();
    
    // Configure timeout based on device
    options.timeout = getPasskeyTimeout(deviceInfo);

    // Start WebAuthn authentication
    const credential = await startAuthentication({ optionsJSON: options });

    // Send credential to server for verification
    const verificationResponse = await fetch('/api/webauthn/authenticate/finish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        credential,
        deviceInfo: {
          isAndroid: deviceInfo.isAndroid,
          isIOS: deviceInfo.isIOS,
          isMobile: deviceInfo.isMobile
        }
      }),
    });

    if (!verificationResponse.ok) {
      throw new Error('Failed to verify passkey authentication');
    }

    const verificationResult = await verificationResponse.json();

    if (!verificationResult.verified) {
      throw new Error('Passkey authentication verification failed');
    }

    return {
      success: true,
      credential
    };

  } catch (error: any) {
    console.error('Passkey authentication failed:', error);
    
    let errorMessage = 'فشل في تسجيل الدخول بمفتاح المرور';
    
    if (error.name === 'NotAllowedError') {
      errorMessage = 'تم إلغاء تسجيل الدخول';
    } else if (error.name === 'InvalidStateError') {
      errorMessage = 'لم يتم العثور على مفتاح مرور لهذا الحساب';
    } else if (error.name === 'NotSupportedError') {
      errorMessage = 'جهازك لا يدعم مفاتيح المرور';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Check if passkey is available for conditional UI (autofill)
 */
export const supportsConditionalUI = async (): Promise<boolean> => {
  try {
    if (!window.PublicKeyCredential || 
        typeof PublicKeyCredential.isConditionalMediationAvailable !== 'function') {
      return false;
    }
    
    return await PublicKeyCredential.isConditionalMediationAvailable();
  } catch (error) {
    console.warn('Error checking conditional UI support:', error);
    return false;
  }
};

/**
 * Start conditional authentication (autofill)
 */
export const startConditionalAuthentication = async (): Promise<PasskeyAuthenticationResult> => {
  try {
    const deviceInfo = getDeviceInfo();

    // Get authentication options for conditional UI
    const optionsResponse = await fetch('/api/webauthn/authenticate/begin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        conditional: true,
        deviceInfo: {
          isAndroid: deviceInfo.isAndroid,
          isIOS: deviceInfo.isIOS,
          isMobile: deviceInfo.isMobile
        }
      }),
    });

    if (!optionsResponse.ok) {
      throw new Error('Failed to get conditional authentication options');
    }

    const options: PublicKeyCredentialRequestOptionsJSON = await optionsResponse.json();
    
    // Configure timeout for conditional auth
    options.timeout = getPasskeyTimeout(deviceInfo);

    // Start conditional authentication (this will show in autofill)
    const credential = await startAuthentication({ 
      optionsJSON: options, 
      useBrowserAutofill: true 
    });

    // Verify the credential
    const verificationResponse = await fetch('/api/webauthn/authenticate/finish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        credential,
        conditional: true,
        deviceInfo: {
          isAndroid: deviceInfo.isAndroid,
          isIOS: deviceInfo.isIOS,
          isMobile: deviceInfo.isMobile
        }
      }),
    });

    if (!verificationResponse.ok) {
      throw new Error('Failed to verify conditional authentication');
    }

    const verificationResult = await verificationResponse.json();

    if (!verificationResult.verified) {
      throw new Error('Conditional authentication verification failed');
    }

    return {
      success: true,
      credential
    };

  } catch (error: any) {
    // Don't log errors for conditional auth as they're expected when user doesn't select
    if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
      console.error('Conditional authentication failed:', error);
    }
    
    return {
      success: false,
      error: 'فشل في المصادقة التلقائية'
    };
  }
};