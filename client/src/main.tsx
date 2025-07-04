import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import { initializeLanguage } from "./hooks/use-language.ts";
import "./index.css";

// Initialize language settings
initializeLanguage();

const queryClient = new QueryClient();

// App version for cache busting after deployment - UPDATE THIS WHEN DEPLOYING
const APP_VERSION = "2.1.0-realtime";

// Clear browser cache for users on old versions
const clearOldCache = () => {
  const storedVersion = localStorage.getItem('pakety_app_version');
  
  if (storedVersion && storedVersion !== APP_VERSION) {
    console.log('New version detected, clearing cache...');
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear service worker cache if exists  
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    
    // Force cache reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
  }
  
  // Store current version
  localStorage.setItem('pakety_app_version', APP_VERSION);
};

// Execute cache clearing on app load
clearOldCache();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
