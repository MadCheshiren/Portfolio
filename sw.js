/* Service Worker - Caches assets for offline access */

// Cache Configuration
const CACHE_NAME = 'portfolio-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/portfolio.css',
  '/portfolio.js',
  '/profile.jpg',
  '/profile.webp',
  '/Kirren_Michael_Fraginal_Resume.pdf',
  '/background.mp4',
  '/story.json'
];

// Install Event - Cache core assets

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

// Activate Event - Clean up old caches
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

// Fetch Event - Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and cross-origin requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Normalize URL - remove hash fragments for cache matching
  const url = new URL(event.request.url);
  const normalizedUrl = url.origin + url.pathname;
  const normalizedRequest = new Request(normalizedUrl, {
    method: event.request.method,
    headers: event.request.headers,
    mode: event.request.mode,
    credentials: event.request.credentials
  });

  event.respondWith(
    caches.match(normalizedRequest).then(cached => {
      // Return cached version if available
      if (cached) {
        // Update cache in background (stale-while-revalidate)
        fetch(normalizedRequest).then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(normalizedRequest, response.clone());
            });
          }
        }).catch(() => {});
        return cached;
      }

      // Otherwise fetch from network
      return fetch(event.request).then(response => {
        if (!response || !response.ok) return response;

        // Cache new requests dynamically (use normalized URL)
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(normalizedRequest, responseClone);
        });

        return response;
      }).catch(() => {
        // Offline fallback could go here
        console.log('[SW] Network failed for:', event.request.url);
      });
    })
  );
});
