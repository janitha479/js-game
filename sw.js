/**
 * Service Worker for Quiz Game
 * Caches all assets for fast repeated loads
 */

const CACHE_NAME = 'quiz-game-v1';

// List of assets to cache on install
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/config.js',
    '/js/game.js',
    // Videos
    '/assets/videos/idle.mp4',
    '/assets/videos/success.mp4',
    '/assets/videos/failure.mp4',
    // Background images
    '/assets/images/bg.png',
    '/assets/images/bg1.png',
    '/assets/images/bg2.png',
    '/assets/images/bg4.png',
    // Display images
    '/assets/images/display1.png',
    '/assets/images/display2.png',
    '/assets/images/display3.png',
    // Transition images
    '/assets/images/ab.png',
    '/assets/images/retain.png',
    '/assets/images/lock.png',
    // Answer images - Question 1
    '/assets/images/answers/d1_a1.png',
    '/assets/images/answers/d1_a2.png',
    '/assets/images/answers/d1_a3.png',
    '/assets/images/answers/d1_a4.png',
    '/assets/images/answers/d1_a5.png',
    '/assets/images/answers/d1_a6.png',
    // Answer images - Question 2
    '/assets/images/answers/d2_a1.png',
    '/assets/images/answers/d2_a2.png',
    '/assets/images/answers/d2_a3.png',
    '/assets/images/answers/d2_a4.png',
    '/assets/images/answers/d2_a5.png',
    '/assets/images/answers/d2_a6.png',
    // Answer images - Question 3
    '/assets/images/answers/d3_a1.png',
    '/assets/images/answers/d3_a2.png',
    '/assets/images/answers/d3_a3.png',
    '/assets/images/answers/d3_a4.png',
    '/assets/images/answers/d3_a5.png',
    '/assets/images/answers/d3_a6.png'
];

// Install event - cache all assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching all assets...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[SW] All assets cached successfully!');
                return self.skipWaiting();
            })
            .catch((err) => {
                console.error('[SW] Failed to cache assets:', err);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache first, then network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version
                    return cachedResponse;
                }
                
                // Not in cache, fetch from network
                return fetch(event.request).then((networkResponse) => {
                    // Cache the new resource for future use
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                });
            })
            .catch(() => {
                // If both cache and network fail, return a fallback for HTML
                if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('/index.html');
                }
            })
    );
});
