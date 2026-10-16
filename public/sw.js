// Incursion Progressive Web App (PWA) Service Worker
const CACHE_NAME = 'incursion-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/formulas',
  '/manifest.json',
  '/icon.svg',
  '/logo.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

// Install: Cache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: Purge old cache generations
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: Network-first strategy for dynamic content with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Bypass API routes and external URLs (e.g. GitHub API, Google Drive streams)
  if (
    request.url.includes('/api/') ||
    request.method !== 'GET' ||
    !request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone and store valid 200 responses in cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If HTML navigation, return root cache
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
          return new Response('Network offline. Cached asset unavailable.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' }),
          });
        });
      })
  );
});
