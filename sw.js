// Service Worker para Treino PWA
// Estratégia: network-first (sempre busca a versão mais nova quando online,
// só usa o cache como reserva se estiver offline)
const CACHE_NAME = 'treino-v2-' + '20260717';
const urlsToCache = [
  './rotina-treino-18.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // cache: 'reload' força buscar a versão real do servidor,
      // ignorando qualquer cache HTTP antigo do navegador
      const requests = urlsToCache.map(url => new Request(url, { cache: 'reload' }));
      return Promise.all(
        requests.map(req =>
          fetch(req).then(res => cache.put(req, res)).catch(err => {
            console.log('Falha ao pre-cachear', req.url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline: usa o que tiver no cache
        return caches.match(event.request);
      })
  );
});
