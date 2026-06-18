/**
 * Service worker de Pliego.
 *
 * Estrategias:
 *   - Navegaciones (HTML)      -> network-first con fallback al shell cacheado (offline).
 *   - /api/*                   -> network-first con fallback a cache.
 *   - Carátulas de Open Library-> stale-while-revalidate.
 *   - Resto de assets propios  -> cache-first.
 */
const VERSION = "pliego-v2";
const STATIC = `static-${VERSION}`;
const API = `api-${VERSION}`;
const COVERS = `covers-${VERSION}`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(navigationHandler(request));
    return;
  }
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API));
    return;
  }
  if (url.hostname.includes("openlibrary.org")) {
    event.respondWith(staleWhileRevalidate(request, COVERS));
    return;
  }
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, STATIC));
    return;
  }
});

async function navigationHandler(request) {
  const cache = await caches.open(STATIC);
  try {
    const res = await fetch(request);
    cache.put("/index.html", res.clone());
    return res;
  } catch (e) {
    return (await cache.match("/index.html")) || (await cache.match("/")) || Response.error();
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw e;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
}
