/* Offline-Speicher für Buddy (mit Buchhaltung).
   Online wird immer die neueste Fassung geladen (und zwischengespeichert),
   offline die zuletzt gespeicherte. Nach einer Änderung auf GitHub reicht
   es, die App einmal mit Internet zu öffnen. */
const CACHE = "buddy-buchhaltung-v1";
const FILES = ["./", "index.html", "adapter.js", "manifest.webmanifest",
  "vendor/jszip.min.js", "vendor/xlsx.full.min.js",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if(res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })
      .then(hit => hit || (req.mode === "navigate" ? caches.match("index.html") : undefined))
      .then(hit => hit || Response.error()))
  );
});
