// PWA Service Worker Registration
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('PWA: Service Worker registered successfully:', registration);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              console.log('PWA: New update available');
              // Could show update notification here
            }
          });
        }
      });
      
    } catch (error) {
      console.error('PWA: Service Worker registration failed:', error);
    }
  } else {
    console.log('PWA: Service Worker not supported');
  }
};

// Check if app is running as PWA
export const isPWA = (): boolean => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isInWebAppiOS = (window.navigator as any).standalone === true;
  return isStandalone || isInWebAppiOS;
};

// Get install prompt availability
export const isInstallPromptAvailable = (): boolean => {
  return 'beforeinstallprompt' in window;
};

// Add to home screen for iOS Safari
export const showIOSInstallInstructions = (): void => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  
  if (isIOS && isSafari && !isPWA()) {
    // Could show iOS-specific install instructions
    console.log('PWA: iOS Safari detected - show install instructions');
  }
};