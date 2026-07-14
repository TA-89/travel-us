/* Roadtrip CHI->NYC Service Worker — Cache-Version pro Release hochzaehlen! */
const CACHE = "roadtrip-chi-nyc-v2.2";
const ASSETS = [
  ".", "index.html", "manifest.json",
  "icon-192.png", "icon-512.png",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c =>
    Promise.allSettled(ASSETS.map(a => c.add(a)))
  ).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener("message", e => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("cartocdn") || e.request.url.includes("tile")) return;
  // Seiten-Navigation: IMMER zuerst das Netz (frische Version), Cache nur offline
  if (e.request.mode === "navigate" || e.request.destination === "document") {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request).then(h => h || caches.match("index.html")))
    );
    return;
  }
  // Uebrige Assets: cache-first
  e.respondWith(
    caches.match(e.request).then(hit => hit ||
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
    )
  );
});
