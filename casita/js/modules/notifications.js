/* =========================================================
   CASITA — Notifications Module
   Notificaciones in-app y banners contextuales
   ========================================================= */

const Notifications = (() => {

  /* ── Toast (snackbar) ────────────────────────────────────── */
  function toast(message, type = 'default', duration = 2500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `toast${type !== 'default' ? ` toast-${type}` : ''}`;
    el.textContent = message;

    container.appendChild(el);

    setTimeout(() => {
      el.classList.add('toast-out');
      setTimeout(() => el.remove(), 250);
    }, duration);
  }

  function toastSuccess(msg) { toast(msg, 'success'); Utils.haptic('medium'); }
  function toastInfo(msg)    { toast(msg, 'info'); }
  function toastWarning(msg) { toast('⚠️ ' + msg, 'warning'); }

  /* ── Banner de actualización de datos ───────────────────── */
  function showUpdateBanner(version) {
    const banner = document.getElementById('update-banner');
    if (!banner) return;

    banner.innerHTML = `
      <span>🆕 Nuevo menú disponible (${version})</span>
      <button onclick="Sync.applyUpdate(); Notifications.hideUpdateBanner()" 
        style="background:white;color:var(--c-primary);border:none;border-radius:20px;padding:6px 14px;font-weight:600;cursor:pointer;font-family:var(--font-system);font-size:13px;">
        Actualizar
      </button>
    `;
    banner.classList.remove('hidden');
  }

  function hideUpdateBanner() {
    const banner = document.getElementById('update-banner');
    if (banner) banner.classList.add('hidden');
  }

  /* ── Alertas contextuales (al abrir pantallas) ───────────── */
  function checkContextualAlerts() {
    const alerts = [];
    const today  = Utils.today();

    // Alertas de caducidad en congelador
    const expiring = Freezer.getExpiringSoon();
    if (expiring.length) {
      alerts.push({
        type:    'freezer',
        message: `${expiring.length} item${expiring.length > 1 ? 's' : ''} en el congelador caducan pronto`,
        screen:  'hogar',
        tab:     'congelador',
      });
    }

    // Alertas de stock mínimo en despensa
    const pantryAlerts = Pantry.getAlerts();
    if (pantryAlerts.length) {
      alerts.push({
        type:    'pantry',
        message: `${pantryAlerts.length} producto${pantryAlerts.length > 1 ? 's' : ''} bajo mínimo en despensa`,
        screen:  'hogar',
        tab:     'despensa',
      });
    }

    // Recordatorio de planificación (sábado)
    if (Utils.isSaturday(today)) {
      const batchPlan = Menu.getBatchPlan();
      const batchDate = batchPlan?.date;
      if (batchDate === today && !Batch.isSessionActive()) {
        alerts.push({
          type:    'batch',
          message: '¡Es sábado! ¿Empezamos el batch cooking?',
          screen:  'plan',
          action:  'batch',
        });
      }
    }

    // Objetivo de agua
    const waterProgress = Water.getTodayProgress();
    const hour = new Date().getHours();
    if (hour >= 20 && !waterProgress.reached) {
      const remaining = (waterProgress.goal_ml - waterProgress.current_ml);
      alerts.push({
        type:    'water',
        message: `Te quedan ${Utils.formatLiters(remaining)} para tu objetivo de agua de hoy`,
        screen:  null,
        action:  null,
      });
    }

    return alerts;
  }

  /* ── Sugerencia de valorar ───────────────────────────────── */
  function promptRating(recipeId, recipeName) {
    return new Promise(resolve => {
      const sheet = document.getElementById('sheet-rate-recipe');
      if (!sheet || !window.ScreenRateRecipe) {
        resolve(null);
        return;
      }
      window.ScreenRateRecipe.open(recipeId, recipeName, resolve);
    });
  }

  /* ── Badge en tab bar ───────────────────────────────────────── */
  function setTabBadge(tabId, count) {
    const tab = document.querySelector(`[data-tab="${tabId}"]`);
    if (!tab) return;

    let badge = tab.querySelector('.tab-badge');
    if (!count) {
      if (badge) badge.remove();
      return;
    }

    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'tab-badge';
      tab.style.position = 'relative';
      tab.appendChild(badge);
    }

    badge.textContent = count > 9 ? '9+' : count;
  }

  function updateAllBadges() {
    const pantryAlerts  = Pantry.getAlerts().length;
    const freezerAlerts = Freezer.getExpiringSoon().length;
    const total = pantryAlerts + freezerAlerts;
    setTabBadge('hogar', total || 0);
  }

  /* ── App Badge (iOS 16.4+) ───────────────────────────────── */
  function setAppBadge(count) {
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        navigator.setAppBadge(count).catch(() => {});
      } else {
        navigator.clearAppBadge?.().catch(() => {});
      }
    }
  }

  return {
    toast, toastSuccess, toastInfo, toastWarning,
    showUpdateBanner, hideUpdateBanner,
    checkContextualAlerts, promptRating,
    setTabBadge, updateAllBadges, setAppBadge,
  };
})();

window.Notifications = Notifications;
