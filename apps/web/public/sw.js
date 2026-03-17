// Self-unregistering service worker
// This file exists to clear any stale service worker caches
self.addEventListener('install', () => {
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    // Clear all caches
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => caches.delete(cacheName))
            )
        }).then(() => {
            // Unregister this service worker
            return self.registration.unregister()
        })
    )
})
