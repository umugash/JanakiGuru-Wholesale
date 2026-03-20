const CACHE_NAME = "jg-wholesale-v5";
const STATIC_ASSETS = [
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

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

  if (request.method !== "GET") return;
  if (url.hostname.includes("supabase.co")) return;
  if (url.pathname.startsWith("/_next/")) return;

  // For navigation - ALWAYS try network, then try cache
  // Never return a custom offline page - let the React app handle offline UI
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Return cached version of the app shell if available
          return caches.match(request)
            .then(cached => cached || caches.match("/"))
            .then(cached => cached || new Response(
              `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JG Wholesale</title><style>*{margin:0;padding:0;box-sizing:border-box}body{min-height:100vh;background:linear-gradient(160deg,#fff9f9,#fff);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui,sans-serif;padding:32px 24px;text-align:center}.logo{font-size:18px;font-weight:800;color:#b91c1c;margin-bottom:4px}.sub{font-size:11px;color:#9ca3af;margin-bottom:28px}.icon{font-size:64px;margin-bottom:16px}h1{font-size:22px;font-weight:800;color:#b91c1c;margin-bottom:10px}p{font-size:14px;color:#6b7280;line-height:1.6;margin-bottom:24px;max-width:280px}.card{background:#fff;border:2px solid #fee2e2;border-radius:18px;padding:18px 20px;margin-bottom:24px;width:100%;max-width:320px;box-shadow:0 4px 20px rgba(220,38,38,0.08)}.tip{display:flex;align-items:center;gap:10px;margin-bottom:10px;text-align:left}.tip-icon{font-size:18px;flex-shrink:0}.tip-text{font-size:13px;color:#374151;line-height:1.4}.btn{background:linear-gradient(135deg,#ef4444,#b91c1c);color:#fff;border:none;border-radius:14px;padding:14px 40px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(220,38,38,0.3);width:100%;max-width:320px;font-family:system-ui,sans-serif}</style></head><body><div class="logo">🏬 JG Wholesale</div><div class="sub">Janaki Guru Enterprises, Thoothukudi</div><div class="icon">📴</div><h1>You are Offline</h1><p>No internet connection. Connect to internet to load the latest prices.</p><div class="card"><div class="tip"><span class="tip-icon">📱</span><span class="tip-text">Turn on Mobile Data or Wi-Fi</span></div><div class="tip"><span class="tip-icon">✈️</span><span class="tip-text">Make sure Airplane Mode is off</span></div><div class="tip"><span class="tip-icon">🔄</span><span class="tip-text">Tap Reload after connecting</span></div></div><button class="btn" onclick="window.location.reload()">🔄 Reload</button><script>window.addEventListener('online',function(){window.location.reload()});<\/script></body></html>`,
              { headers: { "Content-Type": "text/html" } }
            ));
        })
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
        }).catch(() => new Response("", { status: 404 }));
      })
    );
    return;
  }

  // Everything else - network first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});