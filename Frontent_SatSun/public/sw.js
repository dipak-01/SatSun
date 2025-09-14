// service worker for SatSun
// Bump the cache name to invalidate any previously cached dynamic API responses.
const CACHE_NAME = "satsun-static-v2";
const CORE_ASSETS = ["/", "/index.html", "/logo.svg", "/logo.ico"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

// Network-first for HTML, cache-first for others
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only manage GET requests
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isHTML =
    request.mode === "navigate" ||
    request.headers.get("accept")?.includes("text/html");

  // Never cache API responses; always go to the network for them.
  if (isSameOrigin && url.pathname.startsWith("/api")) return;

  // HTML navigations: network-first so app updates deploy quickly
  if (isHTML) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // For static assets (scripts, styles, fonts, images), use cache-first.
  const allowedStatic = ["script", "style", "font", "image"];
  if (!allowedStatic.includes(request.destination)) {
    // For other requests (e.g., data/json not under /api), just fall back to network.
    return; // Let the browser han  dle it normally (network)
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => cached);
    })
  );
});
