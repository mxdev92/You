const CACHE_NAME = 'pakety-v1.0.0';
const API_CACHE_NAME = 'pakety-api-v1.0.0';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Cache Google Fonts
  'https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&display=swap',
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('PWA Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('PWA Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('PWA Cache failed:', error);
      })
  );
});

// Fetch event with proper offline support for grocery browsing
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle API calls with stale-while-revalidate strategy
  if (url.pathname.startsWith('/api/')) {
    // For grocery data (products, categories), use cache-first for offline browsing
    if (url.pathname.includes('/api/products') || url.pathname.includes('/api/categories')) {
      event.respondWith(
        caches.open(API_CACHE_NAME).then(cache => {
          return cache.match(request).then(cachedResponse => {
            const fetchPromise = fetch(request).then(networkResponse => {
              // Update cache with fresh data
              cache.put(request, networkResponse.clone());
              return networkResponse;
            }).catch(() => {
              // Return cached version if network fails (offline mode)
              return cachedResponse;
            });
            
            // Return cached version immediately, update in background
            return cachedResponse || fetchPromise;
          });
        })
      );
      return;
    }
    
    // For other API calls (orders, auth), try network first
    event.respondWith(
      fetch(request).catch(() => {
        // Could add specific offline fallbacks here
        return new Response(
          JSON.stringify({ error: 'Offline', message: 'تحقق من اتصال الإنترنت' }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }
  
  // Handle static assets
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(request);
      })
  );
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