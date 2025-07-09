import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import { initializeLanguage } from "./hooks/use-language.ts";
import "./index.css";

// Initialize language settings
initializeLanguage();

const queryClient = new QueryClient();

// App version for cache busting - UPDATE THIS WHEN DEPLOYING
const APP_VERSION = "2.3.0-stable-admin-fix"; // Fixed admin panel categories and deployment cache

// Aggressive cache clearing for deployment issues
const forceAppUpdate = () => {
  const storedVersion = localStorage.getItem('pakety_app_version');
  const lastUpdate = localStorage.getItem('pakety_last_update');
  const currentTime = Date.now();
  
  // Force update conditions
  const needsUpdate = !storedVersion || 
                     storedVersion !== APP_VERSION ||
                     !lastUpdate ||
                     (currentTime - parseInt(lastUpdate)) > 24 * 60 * 60 * 1000; // 24 hours
  
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
    
    // Force a hard reload for users on old versions
    if (storedVersion && storedVersion !== APP_VERSION) {
      console.log('Hard reloading for version change...');
      window.location.href = window.location.href + '?v=' + currentTime; // Force reload from server
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
