const APP_SHELL_CACHE = 'app-shell-v1';
const STATIC_CACHE = 'static-assets-v1';

const APP_SHELL_URLS = ['/', '/index.html', '/manifest.json', '/vite.svg'];
const STATIC_DESTINATIONS = new Set(['style', 'script', 'worker', 'font', 'image']);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_URLS)));

  self.skipWaiting();
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
      .then(() => self.clients.claim())
      .then(() => {
        return self.clients.matchAll({ type: 'window' }).then((clients) => {
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
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (!response.ok) {
          return response;
        }

        const responseClone = response.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
        return response;
      });
    }),
  );
});
