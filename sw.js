/* ============================================
   doyouknow.app — Service Worker
   Cache-first strategy with stale-while-revalidate for HTML
   ============================================ */

const CACHE_NAME = 'dyk-918e2cdb501c';

// Core shell pages and assets
const CORE_URLS = [
  '/',
  '/en/',
  '/ar/',
  '/en/offline.html',
  '/ar/offline.html',
  '/assets/css/style.css',
  '/assets/js/site.js',
  '/assets/js/search-index.en.json',
  '/assets/js/search-index.ar.json',
  '/assets/images/logo.svg',
  '/assets/images/og-en.png',
  '/assets/images/og-ar.png'
];

const PRECACHE_URLS = CORE_URLS;

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

function isHtmlRequest(request) {
  return request.destination === 'document' ||
    request.headers.get('accept')?.includes('text/html');
}

function isAssetRequest(request) {
  const url = new URL(request.url);
  return request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/assets/');
}

function isApiOrExternal(request) {
  const url = new URL(request.url);
  return url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/');
}

// Stale-while-revalidate for HTML pages
function staleWhileRevalidate(event) {
  const request = event.request;
  return caches.match(request).then(function(cached) {
    const fetchPromise = fetch(request).then(function(networkResponse) {
      if (networkResponse && networkResponse.status === 200) {
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(request, clone);
        });
      }
      return networkResponse;
    }).catch(function() {
      // Network failed; we already returned cached version
    });
    return cached || fetchPromise;
  });
}

// Cache-first for assets
function cacheFirst(event) {
  const request = event.request;
  return caches.match(request).then(function(cached) {
    if (cached) {
      return cached;
    }
    return fetch(request).then(function(networkResponse) {
      if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(request, clone);
        });
      }
      return networkResponse;
    });
  });
}

self.addEventListener('fetch', function(event) {
  const request = event.request;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API or external resources: network only
  if (isApiOrExternal(request)) {
    return;
  }

  // HTML pages: stale-while-revalidate
  if (isHtmlRequest(request)) {
    event.respondWith(
      staleWhileRevalidate(event).catch(function() {
        const url = new URL(request.url);
        const isArabic = url.pathname.startsWith('/ar/');
        return caches.match(isArabic ? '/ar/offline.html' : '/en/offline.html');
      })
    );
    return;
  }

  // Assets: cache-first
  if (isAssetRequest(request)) {
    event.respondWith(
      cacheFirst(event).catch(function() {
        // Silently fail for non-critical assets
      })
    );
    return;
  }

  // Fallback: try cache then network
  event.respondWith(
    caches.match(request).then(function(cached) {
      return cached || fetch(request);
    })
  );
});
