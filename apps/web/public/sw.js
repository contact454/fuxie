const CACHE_NAME = 'fuxie-cache-v1'
const OFFLINE_URL = '/offline.html'

// Assets to precache on install
const INITIAL_CACHED_RESOURCES = [
  '/',
  OFFLINE_URL,
  '/mascot/core/fuxie-core-happy.png',
  '/mascot/core/fuxie-core-happy-wave.png',
  '/mascot/core/fuxie-core-celebrate.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Don't fail the whole install if one asset fails
      return Promise.allSettled(
        INITIAL_CACHED_RESOURCES.map((url) =>
          cache.add(url).catch((err) => console.log(`[SW] Precache failed for ${url}`, err))
        )
      )
    }).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // API Requests (Stale-While-Revalidate pattern)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone())
            })
          }
          return networkResponse
        }).catch((err) => {
          console.warn('[SW] API fetch failed:', err)
          // If offline and no cached response, we just let it fail
          if (cachedResponse) return cachedResponse
          throw err
        })

        return cachedResponse || fetchPromise
      })
    )
    return
  }

  // HTML Page Requests (Network First, fallback to cached offline page)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone())
            return response
          })
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            return caches.match(OFFLINE_URL)
          })
        })
    )
    return
  }

  // Static Assets (Cache First pattern)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok && event.request.url.startsWith('http')) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone())
          })
        }
        return networkResponse
      })
    })
  )
})

// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title || 'Fuxie 🦊'
  const options = {
    body: data.body || 'Bạn có thông báo mới!',
    icon: '/mascot/core/fuxie-core-happy.png',
    badge: '/mascot/core/fuxie-core-happy.png',
    data: { url: data.url || '/dashboard' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(self.clients.openWindow(event.notification.data.url))
  }
})
