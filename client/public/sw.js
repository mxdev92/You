const CACHE_NAME = 'pakety-v2.4.1-arabic';
const API_CACHE_NAME = 'pakety-api-v2.4.1-arabic';
const urlsToCache = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('PWA Service Worker installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('PWA Cache opened');
        return cache.addAll(urlsToCache).catch(error => {
          console.log('PWA Cache failed for some assets:', error);
          // Don't fail the whole installation if some assets fail to cache
        });
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('PWA Service Worker activating...');
  // Take control immediately
  event.waitUntil(clients.claim());
});

// Fetch event - minimal interference with app loading
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip service worker for navigation requests to prevent blank screen
  if (request.mode === 'navigate') {
    return;
  }
  
  // Handle API calls with simple network-first strategy
  if (url.pathname.startsWith('/api/')) {
    // For grocery data (products, categories), cache for offline browsing
    if (url.pathname.includes('/api/products') || url.pathname.includes('/api/categories')) {
      event.respondWith(
        fetch(request).then(networkResponse => {
          // Cache successful responses
          if (networkResponse.ok) {
            caches.open(API_CACHE_NAME).then(cache => {
              cache.put(request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => {
          // Return cached version if network fails
          return caches.open(API_CACHE_NAME).then(cache => {
            return cache.match(request);
          });
        })
      );
      return;
    }
    
    // For other API calls, just use network
    return;
  }
  
  // Handle static assets with network-first
  if (request.destination === 'image' || request.destination === 'font' || 
      url.pathname.includes('/icons/') || url.pathname.includes('/manifest.json')) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request);
      })
    );
  }
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('PWA Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('PWA Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle background sync for orders
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-order') {
    console.log('PWA Background sync for orders triggered');
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  // Sync pending orders when connection is restored
  console.log('PWA Syncing pending orders...');
  // This would integrate with your order system
}