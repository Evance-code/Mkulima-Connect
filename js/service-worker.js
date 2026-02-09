// sw.js - Service Worker for offline functionality

const CACHE_NAME = 'mkulima-cache-v1';
const OFFLINE_URL = '/offline.html';

const urlsToCache = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/mobile-first.css',
    '/js/main.js',
    '/images/logo.svg',
    '/images/default-crop.jpg',
    '/images/default-avatar.png',
    OFFLINE_URL
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    // For API calls, use network-first strategy
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cache the response
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // If network fails, try cache
                    return caches.match(event.request);
                })
        );
        return;
    }

    // For HTML pages, use cache-first, network fallback
    if (event.request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }

                    return fetch(event.request)
                        .then(response => {
                            // Cache the response for future
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, responseClone);
                            });
                            return response;
                        })
                        .catch(() => {
                            // If both cache and network fail, show offline page
                            return caches.match(OFFLINE_URL);
                        });
                })
        );
        return;
    }

    // For other assets (CSS, JS, images), use cache-first
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});

// Background sync for offline data
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncOfflineData());
    }
});

async function syncOfflineData() {
    try {
        const offlineQueue = await getOfflineQueue();

        for (const item of offlineQueue) {
            await syncItem(item);
        }

        console.log('Background sync completed');
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

async function getOfflineQueue() {
    // This would get data from IndexedDB
    return [];
}

async function syncItem(item) {
    // Sync individual item to server
    // Implementation depends on your backend API
}