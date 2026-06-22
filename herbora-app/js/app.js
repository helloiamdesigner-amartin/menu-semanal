/* =============================================================
   Herbora Sales App — Bootstrap principal
   Inicialización, Service Worker, Router, gestión offline
   ============================================================= */

import { DB }      from './data/db.js';
import { Store }   from './data/store.js';
import { Catalog } from './data/catalog.js';
import { Router }  from './router/router.js';

import { initNavbar, showNavbar } from './components/navbar.js';
import { Toast } from './components/toast.js';

import { renderEntry }        from './views/entry.js';
import { renderAuth }         from './views/auth.js';
import { renderDashboard }    from './views/dashboard.js';
import { renderCatalog }      from './views/catalog.js';
import { renderProduct }      from './views/product.js';
import { renderOrder }        from './views/order.js';
import { renderFavorites }    from './views/favorites.js';
import { renderHistory, renderHistoryDetail } from './views/history.js';
import { renderCompare }      from './views/compare.js';
import { renderPresentation } from './views/presentation.js';
import { renderMore }         from './views/more.js';

/* ── IDs de pantallas ───────────────────────────────────── */
const ALL_SCREENS = [
  'screen-entry', 'screen-auth', 'screen-dashboard',
  'screen-catalog', 'screen-product', 'screen-order',
  'screen-favorites', 'screen-history', 'screen-compare',
  'screen-presentation', 'screen-more',
];

/* ── Mostrar una pantalla, ocultar el resto ─────────────── */
function showScreen(id) {
  ALL_SCREENS.forEach(sid => {
    const el = document.getElementById(sid);
    if (el) el.classList.toggle('active', sid === id);
  });
  /* Scroll al inicio de la pantalla activa */
  const activeEl = document.getElementById(id);
  if (activeEl) activeEl.scrollTop = 0;
}

/* ── Guardar prompt de instalación PWA ──────────────────── */
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  window._pwaInstallPrompt = e;
});

/* ── Inicialización principal ───────────────────────────── */
async function init() {
  try {
    /* 1. Inicializar IndexedDB */
    await DB.init();

    /* 2. Inicializar Store (estado global) */
    await Store.init();

    /* 3. Cargar catálogo (IndexedDB → bundle → red) */
    const catalogOk = await Catalog.init();
    if (!catalogOk) {
      Toast.show('No se pudo cargar el catálogo. Conecta a internet.', 'error');
    }

    /* 4. Montar navbar */
    initNavbar();

    /* 5. Configurar router */
    _setupRouter();

    /* 6. Registrar Service Worker */
    _registerSW();

    /* 7. Gestión de estado online/offline */
    _setupOffline();

    /* 8. Ocultar splash tras el primer render */
    Router.afterEach(() => { window._hideSplash?.(); });

    /* 9. Iniciar router */
    Router.init();

  } catch (err) {
    console.error('[App] Error de inicialización:', err);
    document.body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                  min-height:100dvh;gap:16px;padding:24px;text-align:center;font-family:sans-serif;">
        <div style="font-size:36px;">⚠️</div>
        <div style="font-size:18px;font-weight:600;">Error al iniciar la app</div>
        <p style="font-size:14px;color:#7A7A7A;">Recarga la página para intentarlo de nuevo.</p>
        <button onclick="location.reload()" style="padding:12px 24px;background:#0E6270;color:white;border:none;border-radius:24px;cursor:pointer;font-size:16px;">
          Recargar
        </button>
      </div>`;
  }
}

/* ── Configurar rutas ───────────────────────────────────── */
function _setupRouter() {

  /* Guard: si no hay modo de usuario, redirigir a entrada */
  Router.beforeEach((to, from) => {
    const protectedRoutes = [
      '/', '/catalogo', '/pedido', '/favoritos',
      '/historial', '/comparador', '/mas',
    ];
    const isProtected = protectedRoutes.some(r =>
      to.path === r || to.path.startsWith(r + '/')
    );
    const hasMode = Store.getUserMode() !== null;

    if (isProtected && !hasMode) {
      return '/entrada';
    }
  });

  /* Rutas */
  Router.on('/entrada', route => {
    showScreen('screen-entry');
    renderEntry();
  });

  Router.on('/auth', route => {
    showScreen('screen-auth');
    renderAuth();
  });

  Router.on('/', route => {
    showScreen('screen-dashboard');
    renderDashboard();
  });

  Router.on('/catalogo', route => {
    showScreen('screen-catalog');
    renderCatalog(route);
  });

  Router.on('/producto/:ref', route => {
    showScreen('screen-product');
    renderProduct(route);
  });

  Router.on('/pedido', route => {
    showScreen('screen-order');
    renderOrder();
  });

  Router.on('/favoritos', route => {
    showScreen('screen-favorites');
    renderFavorites();
  });

  Router.on('/historial', route => {
    showScreen('screen-history');
    renderHistory();
  });

  Router.on('/historial/:id', route => {
    showScreen('screen-history');
    renderHistoryDetail(route);
  });

  Router.on('/comparador', route => {
    showScreen('screen-compare');
    renderCompare();
  });

  Router.on('/presentacion/:ref', route => {
    showScreen('screen-presentation');
    renderPresentation(route);
  });

  Router.on('/mas', route => {
    showScreen('screen-more');
    renderMore();
  });
}

/* ── Service Worker ─────────────────────────────────────── */
function _registerSW() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('./service-worker.js', { scope: './' })
    .then(reg => {
      console.info('[SW] Registrado:', reg.scope);

      /* Detectar actualización del SW */
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            Toast.info('Nueva versión disponible. Recarga para actualizar.');
          }
        });
      });
    })
    .catch(err => console.warn('[SW] Error de registro:', err));
}

/* ── Online / Offline ───────────────────────────────────── */
function _setupOffline() {
  const banner = document.getElementById('offline-banner');

  function updateBanner() {
    if (banner) banner.classList.toggle('visible', !navigator.onLine);
  }

  updateBanner();
  window.addEventListener('online',  updateBanner);
  window.addEventListener('offline', () => {
    updateBanner();
    Toast.show('Sin conexión. Usando catálogo guardado.', 'error');
  });
}

/* ── Arrancar ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', init);
