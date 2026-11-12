// ReWear service worker: an offline page, nothing else.
//
// Pages always come from the network. Only when that fails (no signal) does the
// shopper get offline.html instead of the browser's error page. Nothing else is
// cached, so the site can never show an old version of itself.
// Registered from src/main.jsx in production builds only.

const CACHE = "rewear-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" }))));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only page loads; images, scripts and API calls go straight to the network
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(OFFLINE_URL);
      return cached || Response.error();
    })
  );
});
