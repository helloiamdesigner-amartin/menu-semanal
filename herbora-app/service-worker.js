/* =============================================================
   Herbora Sales App — Service Worker
   Estrategia: Cache-first para assets, Network-first para datos,
   Cache-first con fallback para imágenes de producto.
   ============================================================= */

const SW_VERSION = '1.0.0';
const CACHE_SHELL  = `herbora-shell-v${SW_VERSION}`;
const CACHE_DATA   = `herbora-data-v${SW_VERSION}`;
const CACHE_IMAGES = `herbora-images-v1`;
const MAX_IMAGE_CACHE = 200;

/* Assets precacheados en install */
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/components.css',
  './css/screens.css',
  './css/animations.css',
  './js/app.js',
  './js/data/catalog.js',
  './js/data/store.js',
  './js/data/db.js',
  './js/router/router.js',
  './js/views/entry.js',
  './js/views/auth.js',
  './js/views/dashboard.js',
  './js/views/catalog.js',
  './js/views/product.js',
  './js/views/order.js',
  './js/views/favorites.js',
  './js/views/history.js',
  './js/views/compare.js',
  './js/views/presentation.js',
  './js/views/more.js',
  './js/components/navbar.js',
  './js/components/product-card.js',
  './js/components/product-sheet.js',
  './js/components/order-item.js',
  './js/components/filters.js',
  './js/components/search.js',
  './js/components/badge.js',
  './js/components/empty-state.js',
  './js/components/toast.js',
  './js/components/modal.js',
  './js/utils/share.js',
  './js/utils/image.js',
  './js/utils/format.js',
  './js/utils/ean-scanner.js',
  './assets/images/placeholder-product.svg',
  './assets/logo/herbora-logo.svg',
];

/* ── INSTALL ─────────────────────────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_SHELL)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ── ACTIVATE ────────────────────────────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k =>
          k !== CACHE_SHELL &&
          k !== CACHE_DATA &&
          k !== CACHE_IMAGES
        ).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH ───────────────────────────────────────────────── */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const path = url.pathname;

  /* catalog-version.json → Network-first (timeout 4s) */
  if (path.includes('catalog-version.json')) {
    event.respondWith(networkFirstWithTimeout(event.request, CACHE_DATA, 4000));
    return;
  }

  /* products.json → Cache-first (la app controla el refresco) */
  if (path.includes('products.json')) {
    event.respondWith(cacheFirst(event.request, CACHE_DATA));
    return;
  }

  /* Imágenes de producto (herbora.es u otras externas) */
  if (isProductImage(url)) {
    event.respondWith(imageWithFallback(event.request));
    return;
  }

  /* Assets de shell (HTML, CSS, JS, SVG, icons) */
  if (isShellAsset(url)) {
    event.respondWith(cacheFirst(event.request, CACHE_SHELL));
    return;
  }

  /* Todo lo demás → Network-first con cache */
  event.respondWith(networkFirst(event.request, CACHE_SHELL));
});

/* ── ESTRATEGIAS ─────────────────────────────────────────── */

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function networkFirstWithTimeout(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), timeoutMs)
  );
  try {
    const response = await Promise.race([fetch(request), timeout]);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response(JSON.stringify({ version: 'offline' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function imageWithFallback(request) {
  const cache = await caches.open(CACHE_IMAGES);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request, { mode: 'no-cors' });
    if (response) {
      /* Gestionar tamaño de caché de imágenes (LRU simple) */
      const keys = await cache.keys();
      if (keys.length >= MAX_IMAGE_CACHE) {
        await cache.delete(keys[0]);
      }
      cache.put(request, response.clone());
      return response;
    }
  } catch { /* sin conexión o CORS */ }

  /* Fallback al placeholder elegante */
  const shell = await caches.open(CACHE_SHELL);
  const placeholder = await shell.match('./assets/images/placeholder-product.svg');
  return placeholder || new Response('', { status: 404 });
}

/* ── HELPERS ─────────────────────────────────────────────── */

function isProductImage(url) {
  const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
  return imageExts.some(ext => url.pathname.toLowerCase().endsWith(ext));
}

function isShellAsset(url) {
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin) return false;
  const ext = url.pathname.split('.').pop().toLowerCase();
  return ['html', 'css', 'js', 'svg', 'png', 'ico', 'json', 'woff2', 'woff'].includes(ext)
    && !url.pathname.includes('catalog-version')
    && !url.pathname.includes('products');
}

/* ── MENSAJE DESDE LA APP (para actualización manual de caché) ── */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_PRODUCTS') {
    const { url, version } = event.data;
    caches.open(CACHE_DATA).then(cache => {
      fetch(url).then(response => {
        if (response.ok) {
          cache.put(new Request('./data/products.json'), response.clone());
          cache.put(new Request('./data/catalog-version.json'),
            new Response(JSON.stringify({ version }), {
              headers: { 'Content-Type': 'application/json' }
            })
          );
        }
      });
    });
  }
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
