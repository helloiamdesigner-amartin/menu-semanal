const CACHE_NAME = 'mesa-v1.2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/data.json',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/img/hero_lunch.jpg',
  '/img/hero_dinner.jpg',
  '/img/bg_fish.jpg',
  '/img/bg_veg.jpg',
  '/img/bg_meat.jpg',
  '/img/bg_leg.jpg',
  '/img/bg_special.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname.endsWith('data.json')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match('/index.html'))
      )
  );
});
