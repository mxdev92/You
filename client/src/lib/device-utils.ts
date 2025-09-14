/**
 * Device detection utilities for passkey support
 */

export interface DeviceInfo {
  isAndroid: boolean;
  isIOS: boolean;
  isMobile: boolean;
  supportsPasskeys: boolean;
  userAgent: string;
}

/**
 * Detect device type and passkey support
 */
export const getDeviceInfo = (): DeviceInfo => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  const isAndroid = /android/.test(userAgent);
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isMobile = isAndroid || isIOS;
  
  // Check for passkey support (WebAuthn with platform authenticator)
  const supportsPasskeys = !!(
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  );

  return {
    isAndroid,
    isIOS,
    isMobile,
    supportsPasskeys,
    userAgent
  };
};

/**
 * Check if passkeys are supported on this device
 */
export const checkPasskeySupport = async (): Promise<boolean> => {
  const deviceInfo = getDeviceInfo();
  
  if (!deviceInfo.supportsPasskeys) {
    return false;
  }

  try {
    // Check if platform authenticator is available
    const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    
    // Check if conditional UI is supported (for autofill)
    const isConditionalSupported = typeof PublicKeyCredential.isConditionalMediationAvailable === 'function'
      ? await PublicKeyCredential.isConditionalMediationAvailable()
      : false;

    return isAvailable && (deviceInfo.isMobile ? true : isConditionalSupported);
  } catch (error) {
    console.warn('Error checking passkey support:', error);
    return false;
  }
};

/**
 * Get platform-specific passkey messaging
 */
export const getPasskeyMessage = (deviceInfo: DeviceInfo): string => {
  if (deviceInfo.isIOS) {
    return 'استخدم Touch ID أو Face ID أو رمز المرور';
  } else if (deviceInfo.isAndroid) {
    return 'استخدم بصمة الإصبع أو الوجه أو رمز المرور';
  } else {
    return 'استخدم مفتاح الأمان أو المصادقة البيومترية';
  }
};

/**
 * Get appropriate timeout for passkey operations based on device
 */
export const getPasskeyTimeout = (deviceInfo: DeviceInfo): number => {
  // Mobile devices might need more time for biometric auth
  return deviceInfo.isMobile ? 120000 : 60000; // 2 minutes mobile, 1 minute desktop
};