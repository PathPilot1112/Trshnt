const CACHE_NAME = 'chernobyl-dynamic-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Only handle GET requests and local/http requests
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request fails, fall back to cache if available
          return cachedResponse;
        });

      // Cache-first for images/fonts, network-first for pages/scripts
      const isAsset = e.request.url.match(/\.(png|jpg|jpeg|gif|svg|woff2|css)$/);
      if (isAsset && cachedResponse) {
        return cachedResponse;
      }

      return fetchPromise.catch(() => cachedResponse);
    })
  );
});
