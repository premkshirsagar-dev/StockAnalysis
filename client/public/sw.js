const CACHE_NAME = "nuclear-terminals-v1";
const APP_SHELL = ["/", "/manifest.webmanifest", "/nuclear-terminals-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.url.includes("/api/") || event.request.url.includes("socket.io")) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
