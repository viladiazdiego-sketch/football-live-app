const CACHE_NAME = 'aspace-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  // For navigation, serve index.html (App Shell)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch('/index.html').catch(() => caches.match('/index.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then(resp => resp || fetch(req).then(res => {
      // cache new requests
      return caches.open(CACHE_NAME).then(cache => {
        cache.put(req, res.clone());
        return res;
      });
    }).catch(()=>caches.match('/index.html')))
  );
});
