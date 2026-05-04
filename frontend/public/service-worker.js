const APP_SHELL_CACHE = 'app-shell-v2';
const STATIC_CACHE = 'static-assets-v2';

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  '/screenshots/not-revealed.webp',
  '/screenshots/revealed.webp',
  '/screenshots/profile.webp',
  '/screenshots/desktop.webp',
  '/screenshots/mobile.webp',
];
const INJECTED_PRECACHE_URLS = globalThis.__WB_MANIFEST.map((entry) => entry.url);
const STATIC_DESTINATIONS = new Set(['style', 'script', 'worker', 'font', 'image']);

function normalizeCacheUrl(url) {
  const resolved = new URL(url, self.location.origin);

  // Treat root and index as a single app-shell entry.
  if (resolved.pathname === '/') {
    resolved.pathname = '/index.html';
  }

  return resolved.href;
}

self.addEventListener('install', (event) => {
  const normalizedToOriginal = new Map();

  [...APP_SHELL_URLS, ...INJECTED_PRECACHE_URLS].forEach((url) => {
    const normalized = normalizeCacheUrl(url);

    if (!normalizedToOriginal.has(normalized)) {
      normalizedToOriginal.set(normalized, url);
    }
  });

  const urlsToCache = [...normalizedToOriginal.values()];

  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) =>
      cache.addAll(urlsToCache).catch((error) => {
        console.warn('Failed to precache app shell resources:', error);
      }),
    ),
  );

  globalThis.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => ![APP_SHELL_CACHE, STATIC_CACHE].includes(cacheName))
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => globalThis.clients.claim())
      .then(() => {
        return globalThis.clients.matchAll({ type: 'window' }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'refresh' });
          });
        });
      }),
)});

function shouldHandleRequest(request) {
  if (request.method !== 'GET') {
    return false;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return STATIC_DESTINATIONS.has(request.destination);
  }

  if (url.pathname.startsWith('/data/')) {
    return false;
  }

  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/rpc/')
  ) {
    return false;
  }

  if (request.mode === 'navigate') {
    return true;
  }

  return STATIC_DESTINATIONS.has(request.destination);
}

function createOfflineResponse(request) {
  if (request.destination === 'image') {
    return new Response('', { status: 503, statusText: 'Offline image unavailable' });
  }

  if (request.destination === 'style') {
    return new Response('/* offline */', {
      status: 503,
      statusText: 'Offline stylesheet unavailable',
      headers: { 'Content-Type': 'text/css; charset=utf-8' },
    });
  }

  if (request.destination === 'script' || request.destination === 'worker') {
    return new Response('// offline', {
      status: 503,
      statusText: 'Offline script unavailable',
      headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
    });
  }

  return new Response('Offline resource unavailable', {
    status: 503,
    statusText: 'Offline resource unavailable',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (!shouldHandleRequest(request)) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put('/index.html', responseClone));
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(APP_SHELL_CACHE);
          return cache.match('/index.html');
        }),
    );

    return;
  }

  event.respondWith(
    caches
      .match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
          }

          return response;
        });
      })
      .catch(() => createOfflineResponse(request)),
  );
});
