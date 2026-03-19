const CACHE_NAME = "jg-wholesale-v3";
const STATIC_ASSETS = [
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// Install - cache only static assets (NOT the page itself)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate - clean ALL old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip Supabase - handled by IndexedDB in app
  if (url.hostname.includes("supabase.co")) return;

  // Skip Vercel internals
  if (url.pathname.startsWith("/_next/")) return;

  // Navigation (page loads) - ALWAYS network first, no cache fallback for HTML
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/") || new Response("Offline"))
    );
    return;
  }

  // Icons and manifest - cache first
  if (url.pathname.match(/\.(png|ico|json)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else - network first
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});