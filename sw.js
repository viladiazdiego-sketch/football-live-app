const CACHE_NAME = 'matchfeed-v1';

const APP_SHELL = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// INSTALACIÓN
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

// ACTIVACIÓN
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            );
        }).then(() => self.clients.claim())
    );
});

// PETICIONES
self.addEventListener('fetch', event => {
    const request = event.request;

    // Solo nos interesan peticiones GET
    if (request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(request)
            .then(response => {
                // Guardamos en caché únicamente respuestas válidas
                if (response.ok) {
                    const responseClone = response.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseClone);
                    });
                }

                return response;
            })
            .catch(() => {
                // Si no hay Internet, usamos la caché
                return caches.match(request).then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // Si es una navegación y no tenemos la página solicitada,
                    // devolvemos la aplicación principal.
                    if (request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }

                    return new Response('', {
                        status: 503,
                        statusText: 'Offline'
                    });
                });
            })
    );
});
