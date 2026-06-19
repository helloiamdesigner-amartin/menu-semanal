/* =========================================================
   CASITA — Service Worker v1.0
   Estrategia: Cache First (shell) + Stale While Revalidate (data)
   + Cache First with Network Fallback (imágenes)
   ========================================================= */

const CACHE_VERSION = 'v1.0.0';
const CACHE_STATIC  = `casita-static-${CACHE_VERSION}`;
const CACHE_DATA    = `casita-data-${CACHE_VERSION}`;
const CACHE_IMAGES  = `casita-images-${CACHE_VERSION}`;

/* Archivos del app shell — se cachean en install */
const SHELL_FILES = [
  './index.html',
  './offline.html',
  './manifest.json',
  './css/main.css',
  './css/components.css',
  './css/screens.css',
  './css/animations.css',
  './css/themes.css',
  './js/app.js',
  './js/router.js',
  './js/store.js',
  './js/sync.js',
  './js/modules/menu.js',
  './js/modules/learning.js',
  './js/modules/shopping.js',
  './js/modules/pantry.js',
  './js/modules/freezer.js',
  './js/modules/water.js',
  './js/modules/batch.js',
  './js/modules/ratings.js',
  './js/modules/notifications.js',
  './js/modules/utils.js',
  './js/screens/home.js',
  './js/screens/plan.js',
  './js/screens/shopping.js',
  './js/screens/recipes.js',
  './js/screens/hogar.js',
  './js/screens/recipe-detail.js',
  './js/screens/batch-detail.js',
  './js/screens/onboarding.js',
  './assets/images/meals/placeholder.jpg'
];

/* ── INSTALL ─────────────────────────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Install error:', err))
  );
});

/* ── ACTIVATE ────────────────────────────────────────────── */
self.addEventListener('activate', event => {
  const validCaches = [CACHE_STATIC, CACHE_DATA, CACHE_IMAGES];

  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => !validCaches.includes(key))
          .map(key => {
            console.log('[SW] Eliminando caché obsoleta:', key);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim())
  );
});

/* ── FETCH ───────────────────────────────────────────────── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* Solo interceptar peticiones del mismo origen */
  if (url.origin !== location.origin) return;

  const path = url.pathname;

  /* data.json → Stale While Revalidate */
  if (path.includes('data/data.json')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  /* Imágenes de recetas/despensa → Cache First + Network Fallback */
  if (path.includes('/assets/images/')) {
    event.respondWith(cacheFirstWithFallback(request));
    return;
  }

  /* App shell (HTML, CSS, JS, icons) → Cache First */
  event.respondWith(cacheFirst(request));
});

/* ── ESTRATEGIAS DE CACHÉ ────────────────────────────────── */

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_STATIC);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    /* Offline y no cacheado → offline.html para navegación */
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('./offline.html');
    }
    return new Response('', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_DATA);
  const cached = await cache.match(request);

  /* Revalidar en background */
  const fetchPromise = fetch(request)
    .then(async response => {
      if (!response.ok) return response;

      /* Detectar si la versión ha cambiado */
      const oldResponse = await cache.match(request);
      if (oldResponse) {
        const [oldJson, newJson] = await Promise.all([
          oldResponse.clone().json().catch(() => null),
          response.clone().json().catch(() => null)
        ]);

        if (oldJson && newJson && oldJson.meta?.version !== newJson.meta?.version) {
          /* Notificar a la app que hay datos nuevos */
          notifyClients({ type: 'DATA_UPDATED', version: newJson.meta.version });
        }
      }

      await cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  /* Servir desde caché inmediatamente, actualizar en background */
  return cached || await fetchPromise || new Response(
    JSON.stringify({ error: 'offline' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

async function cacheFirstWithFallback(request) {
  const cache = await caches.open(CACHE_IMAGES);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      return response;
    }
    throw new Error('Not ok');
  } catch {
    /* Fallback: imagen placeholder */
    const placeholder = await caches.match('./assets/images/meals/placeholder.jpg');
    return placeholder || new Response('', { status: 404 });
  }
}

/* ── MENSAJES ────────────────────────────────────────────── */
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function notifyClients(data) {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => client.postMessage(data));
}
