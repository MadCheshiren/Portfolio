// Service Worker for Portfolio - Caches assets for offline access and faster repeat visits
const CACHE_NAME = 'portfolio-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/portfolio.css',
  '/portfolio.js',
  '/profile.jpg',
  '/profile.webp',
  '/Kirren_Michael_Fraginal_Resume.pdf',
  '/scene.splinecode' // Spline 3D scene file
];

// Install: Cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching core assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch(err => console.error('[SW] Cache failed:', err))
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and cross-origin requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      // Return cached version if available
      if (cached) {
        // Update cache in background (stale-while-revalidate)
        fetch(event.request).then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, response.clone());
            });
          }
        }).catch(() => {});
        return cached;
      }

      // Otherwise fetch from network
      return fetch(event.request).then(response => {
        if (!response || !response.ok) return response;
        
        // Cache new requests dynamically
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        
        return response;
      }).catch(() => {
        // Offline fallback could go here
        console.log('[SW] Network failed for:', event.request.url);
      });
    })
  );
});
