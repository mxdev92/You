import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import { initializeLanguage } from "./hooks/use-language.ts";
import "./index.css";

// Import instant loading optimizer
import "./lib/instant-loading-optimizer";

// Initialize language settings
initializeLanguage();

const queryClient = new QueryClient();

// App version for cache busting - UPDATE THIS WHEN DEPLOYING
const APP_VERSION = "2.4.0-arabic-buttons"; // Fixed cart badges and Arabic add-to-cart buttons

// Aggressive cache clearing for deployment issues
const forceAppUpdate = () => {
  const storedVersion = localStorage.getItem('pakety_app_version');
  const lastUpdate = localStorage.getItem('pakety_last_update');
  const currentTime = Date.now();
  
  // Force update conditions - ALWAYS update for version changes
  const needsUpdate = !storedVersion || 
                     storedVersion !== APP_VERSION ||
                     !lastUpdate ||
                     (currentTime - parseInt(lastUpdate)) > 1 * 60 * 60 * 1000; // 1 hour for aggressive updates
  
  if (needsUpdate) {
    console.log('Forcing app update - clearing all cache...');
    
    // Clear everything aggressively
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear service workers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.unregister();
            console.log('Service worker unregistered');
          });
        });
      }
      
      // Clear cache API
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
            console.log('Cache deleted:', name);
          });
        });
      }
      
      // Clear indexedDB if exists
      if ('indexedDB' in window) {
        indexedDB.databases?.().then(databases => {
          databases.forEach(db => {
            if (db.name) {
              indexedDB.deleteDatabase(db.name);
              console.log('IndexedDB deleted:', db.name);
            }
          });
        });
      }
      
    } catch (error) {
      console.log('Cache clearing completed with minor errors:', error);
    }
    
    // Set new version and timestamp
    localStorage.setItem('pakety_app_version', APP_VERSION);
    localStorage.setItem('pakety_last_update', currentTime.toString());
    
    // Force a hard reload for users on old versions or first time
    if (!storedVersion || storedVersion !== APP_VERSION) {
      console.log('Hard reloading for version change...');
      // Multiple methods to ensure cache bypass
      setTimeout(() => {
        if (window.location.search.includes('cache-clear')) {
          window.location.reload(true as any); // Force reload
        } else {
          window.location.href = window.location.origin + window.location.pathname + '?cache-clear=' + currentTime; 
        }
      }, 500);
    }
  }
};

// Execute aggressive update check
forceAppUpdate();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
