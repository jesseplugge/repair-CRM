// Minimal service worker: exists only to make the app installable and to show
// a clear "you're offline" screen when there's no connection at all. It never
// caches app pages, API routes, or data — this app shows live business data
// (repairs, stock, invoices, money), so silently serving a stale cached page
// while offline would be actively misleading. Only the offline fallback shell
// and static icons are cached.
const CACHE = 'repair-crm-shell-v1';
const SHELL_ASSETS = ['/offline.html', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return; // only guard page navigations, never data/API requests

  event.respondWith(
    fetch(event.request).catch(() => caches.match('/offline.html'))
  );
});
