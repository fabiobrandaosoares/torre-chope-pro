// =====================================================
// SERVICE WORKER - TORRE CHOPPE PRO
// =====================================================

const CACHE = 'torre-choppe-pro-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './video_v3.mp4'
];

// =====================================================
// INSTALL
// =====================================================

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => {
        console.log('Cache aberto:', CACHE);
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => console.error('Cache install error:', err))
  );
  event.waitUntil(self.skipWaiting());
});

// =====================================================
// ACTIVATE
// =====================================================

self.addEventListener('activate', event => {
  console.log('SW ativado:', CACHE);
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      );
    }).catch(err => console.error('Cache cleanup error:', err))
  );
  event.waitUntil(self.clients.claim());
});

// =====================================================
// FETCH
// =====================================================

self.addEventListener('fetch', event => {
  const req = event.request;
  
  if(req.method !== 'GET' || !req.url.startsWith(self.location.origin)) {
    return fetch(req);
  }
  
  if(req.headers.has('range')) {
    return fetch(req);
  }
  
  if(req.url.includes('.mp4')) {
    event.respondWith(
      fetch(req)
        .then(response => {
          if(response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then(cache => {
              cache.put(req, clone);
            });
          }
          return response;
        })
        .catch(async () => {
          console.log('Vídeo offline:', req.url);
          return caches.match(req) || new Response('Vídeo offline', {status: 503});
        })
    );
    return;
  }
  
  event.respondWith(
    caches.match(req)
      .then(cached => {
        if(cached) return cached;
        return fetch(req)
          .then(response => {
            if(response && response.status === 200 && response.type === 'basic') {
              const clone = response.clone();
              caches.open(CACHE).then(cache => {
                cache.put(req, clone);
              });
            }
            return response;
          })
          .catch(() => new Response('Offline', {status: 503}));
      })
  );
});