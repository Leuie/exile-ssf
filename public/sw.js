// Exile SSF Offline-Ready PWA Service Worker (v3.40.0)
// - Static assets (/assets/*, /logo.png, /manifest.webmanifest): Stale-While-Revalidate
// - App shell navigation (Cheat Sheets, Vendor Recipes, Regex Studio, etc.): Network-First with cached SPA fallback
// - Live API routes (/api/*): Network-Only so Cloudflare league and stash data are never stale

const CACHE_NAME = 'exile-ssf-pwa-v340';
const APP_SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/logo.png', '/favicon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('exile-ssf-pwa-') && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Never intercept cross-origin requests or live backend API calls
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Navigation requests: Network-first with cached SPA index.html fallback when offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match('/index.html').then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Hashed build assets & icons: Stale-While-Revalidate
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webmanifest')
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkFetch = fetch(req)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});
