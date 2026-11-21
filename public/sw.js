// Minimal PWA service worker enabling standalone desktop & mobile installation without caching stale API responses
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Network first passthrough so live Cloudflare D1 data is always fresh
});
