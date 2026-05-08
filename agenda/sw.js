// Agenda — offline shell service worker
const CACHE = 'agenda-v30';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './js/data.js',
  './js/sync.js',
  './js/mov-remux.js',
  './js/primitives.jsx',
  './js/screens-main.jsx',
  './js/screens-secondary.jsx',
  './js/screens-settings.jsx',
  './js/screen-login.jsx',
  './js/screen-album.jsx',
  './js/screen-extra-page.jsx',
  './js/app.jsx',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first for the shell so deploys propagate; cache is the offline fallback.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/book')) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(req))
  );
});
