/* =========================================================
   CASITA — Sync Module
   Carga data.json, detecta versión nueva, merge con estado
   ========================================================= */

const Sync = (() => {

  let _pendingUpdate = null; // Nueva versión pendiente de aplicar

  /* ── Carga inicial ───────────────────────────────────────── */
  async function loadDataJson() {
    try {
      const res  = await fetch('./data/data.json', { cache: 'no-store' });
      const data = await res.json();
      _applyData(data);
      return data;
    } catch (err) {
      // Offline o error: intentar desde caché localStorage
      console.warn('[Sync] fetch falló, usando caché local:', err);
      const cached = Store.get(Store.keys.DATA_CACHE);
      if (cached) {
        _applyData(cached);
        return cached;
      }
      throw new Error('Sin datos disponibles y sin conexión');
    }
  }

  function _applyData(data) {
    window.CasitaData = Object.freeze(data);
  }

  /* ── Detectar y aplicar actualización quincenal ─────────── */
  async function checkForUpdate() {
    try {
      const res  = await fetch('./data/data.json', { cache: 'reload' });
      const data = await res.json();
      const storedVersion = Store.get(Store.keys.APP_VERSION);

      if (data.meta?.version !== storedVersion) {
        _pendingUpdate = data;
        Notifications.showUpdateBanner(data.meta.version);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  function hasPendingUpdate() {
    return !!_pendingUpdate;
  }

  function applyUpdate() {
    if (!_pendingUpdate) return;

    const newData = _pendingUpdate;
    const oldQuincenalId = Store.get(Store.keys.APP_QUINCENAL_ID);

    // Archivar menú anterior antes de actualizar
    if (oldQuincenalId && oldQuincenalId !== newData.meta.quincenal_id) {
      Menu.archiveCurrentMenu();
      Shopping.resetForNewQuincena();
    }

    // Aplicar nuevos datos
    _applyData(newData);
    Store.set(Store.keys.DATA_CACHE, newData);
    Store.set(Store.keys.APP_VERSION, newData.meta.version);
    Store.set(Store.keys.APP_QUINCENAL_ID, newData.meta.quincenal_id);

    // Recalcular perfil de aprendizaje
    Learning.compute();

    // Verificar caducidades y alertas
    Freezer.checkExpiry();
    Pantry.checkAlerts?.();

    _pendingUpdate = null;
    Notifications.hideUpdateBanner();
    Notifications.toastSuccess('Menú actualizado ✓');

    // Re-renderizar pantalla actual
    if (window.Router) {
      Router.refresh();
    }
  }

  /* ── Primer arranque ─────────────────────────────────────── */
  function mergeWithLocalState(data) {
    const storedVersion    = Store.get(Store.keys.APP_VERSION);
    const storedQuincenalId = Store.get(Store.keys.APP_QUINCENAL_ID);
    const isNewVersion     = data.meta.version !== storedVersion;
    const isNewQuincena    = data.meta.quincenal_id !== storedQuincenalId;

    if (isNewVersion || isNewQuincena) {
      // Primera vez o nueva quincena
      if (isNewQuincena && storedQuincenalId) {
        Menu.archiveCurrentMenu();
        Shopping.resetForNewQuincena();
      }

      Store.set(Store.keys.APP_VERSION,      data.meta.version);
      Store.set(Store.keys.APP_QUINCENAL_ID, data.meta.quincenal_id);
      Store.set(Store.keys.DATA_CACHE,       data);
    }

    // Siempre exponer los datos
    _applyData(data);
  }

  /* ── Escuchar mensajes del Service Worker ─────────────────── */
  function listenToServiceWorker() {
    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data?.type === 'DATA_UPDATED') {
        checkForUpdate();
      }
    });
  }

  /* ── Export / Import backup ──────────────────────────────── */
  function exportFullBackup() {
    const backup = {
      exported_at:  new Date().toISOString(),
      app_version:  Store.get(Store.keys.APP_VERSION),
      state:        Store.getAll(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `casita-backup-${Utils.today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importFullBackup(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const ok = Store.importBackup(e.target.result);
        if (ok) {
          resolve(true);
          Notifications.toastSuccess('Backup restaurado ✓');
        } else {
          reject(new Error('Formato de backup inválido'));
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  return {
    loadDataJson, mergeWithLocalState, checkForUpdate,
    hasPendingUpdate, applyUpdate,
    listenToServiceWorker,
    exportFullBackup, importFullBackup,
  };
})();

window.Sync = Sync;
