const BUILD_HASH = '__APP_BUILD_HASH__';
const SCOPE_URL = new URL(globalThis.registration.scope);
const CACHE_PREFIX = `english-app:${encodeURIComponent(SCOPE_URL.href)}:`;
const APP_SHELL_CACHE = `${CACHE_PREFIX}shell:${BUILD_HASH}`;
const STATIC_CACHE = `${CACHE_PREFIX}static:${BUILD_HASH}`;
const SHELL_URL = new URL('index.html', SCOPE_URL).href;
const PRECACHE_URLS = (globalThis.__WB_MANIFEST || []).map((entry) =>
  new URL(entry.url, SCOPE_URL).href,
);
const STATIC_DESTINATIONS = new Set(['style', 'script', 'worker', 'font', 'image']);

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
  const cache = await caches.open(APP_SHELL_CACHE);
  await cache.addAll([...new Set([SHELL_URL, ...PRECACHE_URLS])]);
  await globalThis.skipWaiting();
}

globalThis.addEventListener('install', (event) => {
  event.waitUntil(install());
});

async function activate() {
  const names = await caches.keys();
  const obsolete = names.filter(
    (name) => name.startsWith(CACHE_PREFIX) && ![APP_SHELL_CACHE, STATIC_CACHE].includes(name),
  );
  await Promise.all(obsolete.map((name) => caches.delete(name)));
  await globalThis.clients.claim();
  const clients = await globalThis.clients.matchAll({ type: 'window' });
  for (const client of clients) {
    if (isInScope(new URL(client.url))) {
      client.postMessage({ type: 'refresh', version: BUILD_HASH });
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
    console.warn('Failed to cache resource:', error);
  }
}

async function navigate(request, writes) {
  try {
    const response = await fetch(request);
    const isHtml = response.headers.get('Content-Type')?.includes('text/html');
    if (response.ok && isHtml) {
      writes.push(storeResponse(APP_SHELL_CACHE, SHELL_URL, response.clone()));
    }
    return response;
  } catch {
    const cache = await caches.open(APP_SHELL_CACHE);
    return (await cache.match(SHELL_URL)) || offlineResponse();
  }
}

async function staticResource(request, writes) {
  const runtime = await caches.open(STATIC_CACHE);
  const cached = await runtime.match(request);
  if (cached) return cached;
  const precache = await caches.open(APP_SHELL_CACHE);
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
