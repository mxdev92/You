// Version checker to ensure users get latest deployment
const CURRENT_VERSION = "2.4.0-arabic-buttons";
const VERSION_CHECK_KEY = "app-version";
const CACHE_CLEAR_KEY = "cache-cleared";

export function checkAndClearCache() {
  try {
    const storedVersion = localStorage.getItem(VERSION_CHECK_KEY);
    const cacheCleared = localStorage.getItem(CACHE_CLEAR_KEY);
    
    // If version is different or cache not cleared for this version
    if (storedVersion !== CURRENT_VERSION || cacheCleared !== CURRENT_VERSION) {
      console.log(`Version update detected: ${storedVersion} -> ${CURRENT_VERSION}`);
      
      // Clear all caches
      clearAllCaches();
      
      // Update stored version
      localStorage.setItem(VERSION_CHECK_KEY, CURRENT_VERSION);
      localStorage.setItem(CACHE_CLEAR_KEY, CURRENT_VERSION);
      
      // Force hard reload after short delay
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Version check failed:', error);
    return false;
  }
}

function clearAllCaches() {
  try {
    // Clear localStorage (keep authentication)
    const authKeys = ['auth-token', 'user-session', 'connect.sid'];
    const authData: Record<string, string> = {};
    
    authKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) authData[key] = value;
    });
    
    localStorage.clear();
    
    // Restore auth data
    Object.entries(authData).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear browser cache if available
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Clear service worker cache
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.update();
        });
      });
    }
    
    console.log('All caches cleared for version update');
  } catch (error) {
    console.error('Cache clearing failed:', error);
  }
}

// Force reload with cache bypass
export function forceHardReload() {
  try {
    // Multiple methods to ensure cache bypass
    window.location.href = window.location.href + '?v=' + Date.now();
  } catch (error) {
    window.location.reload();
  }
}

// Check version on app startup
export function initVersionChecker() {
  // Check immediately
  const needsReload = checkAndClearCache();
  
  if (!needsReload) {
    // Set up periodic checking every 30 seconds
    setInterval(checkAndClearCache, 30000);
  }
}