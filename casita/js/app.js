/* =========================================================
   CASITA — App.js (Entry Point)
   Inicialización, Service Worker, ciclo de vida
   ========================================================= */

(async function initCasita() {

  /* 1. Inicializar Store */
  if (!Store.init()) {
    console.error('[Casita] localStorage no disponible');
    document.body.innerHTML = `
      <div style="padding:40px;text-align:center;font-family:sans-serif;">
        <p>Casita necesita almacenamiento local para funcionar.</p>
        <p style="color:#666;font-size:14px;">Activa las cookies/almacenamiento en Safari → Configuración → Safari.</p>
      </div>
    `;
    return;
  }

  /* 2. Cargar data.json */
  try {
    const data = await Sync.loadDataJson();
    Sync.mergeWithLocalState(data);
  } catch (err) {
    console.error('[Casita] Error cargando datos:', err);
  }

  /* 3. Inicializar módulos */
  Water.checkDayReset();
  Freezer.checkExpiry();
  Pantry.initDefaults(); // Solo actúa si la despensa está vacía
  Learning.getProfile(); // Carga o computa el perfil

  /* 4. Inicializar Router */
  Router.init();

  /* 5. Registrar Service Worker */
  _registerServiceWorker();

  /* 6. Escuchar mensajes del SW (actualizaciones de datos) */
  Sync.listenToServiceWorker();

  /* 7. Alertas contextuales tras cargar */
  setTimeout(() => {
    Notifications.updateAllBadges();
    _checkStartupAlerts();
  }, 1500);

  /* 8. ¿Viene de shortcut PWA? */
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('source') === 'pwa') {
    // App abierta desde icono en home screen
    _checkForDataUpdate();
  }

})();

/* ── Service Worker ──────────────────────────────────────── */
async function _registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });

    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Nuevo SW instalado pero esperando — en Casita aplicamos automáticamente
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });

    console.log('[Casita] Service Worker registrado:', reg.scope);
  } catch (err) {
    console.warn('[Casita] SW no registrado:', err);
  }
}

/* ── Verificar actualización de datos en background ──────── */
async function _checkForDataUpdate() {
  // Esperar 3s después de cargar para no bloquear la UI
  await new Promise(r => setTimeout(r, 3000));
  await Sync.checkForUpdate();
}

/* ── Alertas de inicio ───────────────────────────────────── */
function _checkStartupAlerts() {
  const alerts = Notifications.checkContextualAlerts();
  if (alerts.length) {
    // Mostrar la primera alerta relevante
    const first = alerts[0];
    if (first.type === 'batch') {
      Notifications.toastInfo(first.message);
    }
  }
}

/* ── Visibilidad (volver a primer plano) ─────────────────── */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // Recalcular caducidades y alertas
    Freezer.checkExpiry();
    Notifications.updateAllBadges();
    Water.checkDayReset();
    // Verificar si hay actualización pendiente del SW
    _checkForDataUpdate();
  }
});
