const BUILD_HASH = '__APP_BUILD_HASH__';
const LOG_ERRORS_IN_CONSOLE = true;
const SCOPE_URL = new URL(globalThis.registration.scope);
const CACHE_PREFIX = `english-app:${encodeURIComponent(SCOPE_URL.href)}:`;
const PRECACHE_CACHE = `${CACHE_PREFIX}precache:${BUILD_HASH}`;
const STATIC_CACHE = `${CACHE_PREFIX}static:${BUILD_HASH}`;
const SHELL_URL = new URL('index.html', SCOPE_URL).href;
const UPDATE_MARKER_URL = new URL('__service-worker-update-state__', SCOPE_URL).href;
const PRECACHE_URLS = (globalThis.__WB_MANIFEST || []).map((entry) =>
  new URL(entry.url, SCOPE_URL).href,
);
const STATIC_DESTINATIONS = new Set(['style', 'script', 'worker', 'font', 'image', 'manifest']);

function isInScope(url) {
  return url.origin === SCOPE_URL.origin && url.pathname.startsWith(SCOPE_URL.pathname);
}

function shouldHandleRequest(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  if (!isInScope(url)) return false;
  const path = url.pathname.slice(SCOPE_URL.pathname.length);
  if (/^(data|api|rest|rpc)(\/|$)/.test(path)) return false;
  return request.mode === 'navigate' || STATIC_DESTINATIONS.has(request.destination);
}

async function install() {
  const cache = await caches.open(PRECACHE_CACHE);
  await cache.addAll([...new Set([SHELL_URL, ...PRECACHE_URLS])]);
  const installType = globalThis.registration.active ? 'update' : 'first-install';
  await cache.put(UPDATE_MARKER_URL, new Response(installType));
  await globalThis.skipWaiting();
}

globalThis.addEventListener('install', (event) => {
  event.waitUntil(install());
});

async function activate() {
  const precache = await caches.open(PRECACHE_CACHE);
  const installType = await (await precache.match(UPDATE_MARKER_URL))?.text();
  const names = await caches.keys();
  const obsolete = names.filter(
    (name) => name.startsWith(CACHE_PREFIX) && ![PRECACHE_CACHE, STATIC_CACHE].includes(name),
  );
  const cleanupResults = await Promise.allSettled(obsolete.map((name) => caches.delete(name)));
  cleanupResults.forEach((result) => {
    if (LOG_ERRORS_IN_CONSOLE && result.status === 'rejected') {
      console.warn('Failed to remove obsolete cache:', result.reason);
    }
  });

  await globalThis.clients.claim();
  if (installType === 'update') {
    const clients = await globalThis.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      if (isInScope(new URL(client.url))) {
        client.postMessage({ type: 'refresh', version: BUILD_HASH });
      }
    }
  }

  try {
    await precache.delete(UPDATE_MARKER_URL);
  } catch (error) {
    if (LOG_ERRORS_IN_CONSOLE) {
      console.warn('Failed to remove service worker install marker:', error);
    }
  }
}

globalThis.addEventListener('activate', (event) => {
  event.waitUntil(activate());
});

function offlineResponse() {
  return new Response('Offline resource unavailable', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

async function storeResponse(cacheName, key, response) {
  try {
    const cache = await caches.open(cacheName);
    await cache.put(key, response);
  } catch (error) {
    if (LOG_ERRORS_IN_CONSOLE) {
      console.warn('Failed to cache resource:', error);
    }
  }
}

async function navigate(request, writes) {
  try {
    const response = await fetch(request);
    const isHtml = response.headers.get('Content-Type')?.includes('text/html');
    if (response.ok && isHtml) {
      writes.push(storeResponse(PRECACHE_CACHE, SHELL_URL, response.clone()));
    }
    return response;
  } catch {
    const cache = await caches.open(PRECACHE_CACHE);
    return (await cache.match(SHELL_URL)) || offlineResponse();
  }
}

async function staticResource(request, writes) {
  const runtime = await caches.open(STATIC_CACHE);
  const cached = await runtime.match(request);
  if (cached) return cached;
  const precache = await caches.open(PRECACHE_CACHE);
  const precached = await precache.match(request);
  if (precached) return precached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      writes.push(storeResponse(STATIC_CACHE, request, response.clone()));
    }
    return response;
  } catch {
    return offlineResponse();
  }
}

globalThis.addEventListener('fetch', (event) => {
  if (!shouldHandleRequest(event.request)) return;
  const writes = [];
  const response = event.request.mode === 'navigate'
    ? navigate(event.request, writes)
    : staticResource(event.request, writes);
  event.respondWith(response);
  event.waitUntil(response.then(() => Promise.all(writes)));
});
