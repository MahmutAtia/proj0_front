const CACHE_NAME = 'my-sakai-react-app-cache-v1';
const urlsToCache = [
    '/',
    // Add other important assets you want to pre-cache here
    // For example:
    // '/manifest.json',
    // '/icons/icon-192x192.png',
    // '/styles/layout/layout.scss', // Note: SCSS won't be directly cacheable, cache the compiled CSS
    // '/themes/lara-light-indigo/theme.css',
];

// Install event: fires when the browser installs the service worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching app shell');
                // Add all URLs to the cache
                // Add a catch for individual asset caching failures
                return Promise.all(
                    urlsToCache.map(url => {
                        return cache.add(url).catch(reason => {
                            console.warn(`Service Worker: Failed to cache ${url}`, reason);
                        });
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: App shell cached successfully');
                // Force the waiting service worker to become the active service worker.
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Caching failed', error);
            })
    );
});

// Activate event: fires when the service worker is activated
// This is a good place to clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activated successfully and old caches cleaned.');
            // Tell the active service worker to take control of the page immediately.
            return self.clients.claim();
        })
    );
});

// Fetch event: fires every time the app requests a resource (e.g., CSS, JS, image, API call)
self.addEventListener('fetch', (event) => {
    // console.log('Service Worker: Fetching', event.request.url);

    // Example: Cache-First Strategy (Network Falling Back to Cache)
    // More complex strategies exist (Network first, Cache only, etc.)
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    // console.log('Service Worker: Found in cache', event.request.url);
                    return response; // Serve from cache
                }
                // console.log('Service Worker: Not in cache, fetching from network', event.request.url);
                return fetch(event.request).then(
                    (networkResponse) => {
                        // If we got a valid response, clone it and cache it for future use
                        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return networkResponse;
                    }
                ).catch(error => {
                    console.error('Service Worker: Fetch failed; returning offline page or error.', error);
                    // Optionally, return a fallback offline page:
                    // return caches.match('/offline.html');
                });
            })
    );
});
