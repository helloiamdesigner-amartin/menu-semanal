/* =========================================================
   CASITA — Store (LocalStorage Abstraction Layer)
   Todo acceso a localStorage pasa por aquí.
   ========================================================= */

const Store = (() => {
  const PREFIX = 'casita_';

  const keys = {
    // App
    APP_VERSION:        'app_version',
    APP_INSTALLED_AT:   'app_installed_at',
    APP_ONBOARDING:     'app_onboarding_done',
    APP_QUINCENAL_ID:   'app_current_quincenal_id',
    APP_ACTIVE_USER:    'app_active_user',
    // Shopping
    SHOPPING_CHECKED:   'shopping_checked_items',
    SHOPPING_MANUAL:    'shopping_manual_items',
    SHOPPING_LAST:      'shopping_last_completed_at',
    SHOPPING_HISTORY:   'shopping_history',
    // Menu
    MENU_OVERRIDES:     'menu_overrides',
    MENU_HISTORY:       'menu_history',
    // Ratings
    RATINGS:            'ratings',
    CONSUMED_HISTORY:   'consumed_history',
    FAVORITES:          'favorite_recipes',
    NEVER_REPEAT:       'never_repeat',
    // Pantry
    PANTRY_ITEMS:       'pantry_items',
    PANTRY_UPDATED:     'pantry_last_updated',
    // Freezer
    FREEZER_ITEMS:      'freezer_items',
    FREEZER_UPDATED:    'freezer_last_updated',
    // Water
    WATER_DAILY_LOG:    'water_daily_log',
    WATER_BIWEEKLY:     'water_biweekly_bottles',
    // Batch
    BATCH_SESSIONS:     'batch_sessions',
    BATCH_PROGRESS:     'batch_current_progress',
    // Learning
    LEARNING_PROFILE:   'learning_profile',
    LEARNING_COMPUTED:  'learning_last_computed',
    // Data cache
    DATA_CACHE:         'data_cache',
  };

  const STORAGE_WARN_THRESHOLD = 0.85; // Avisar al 85% de uso

  function _key(k) { return PREFIX + k; }

  function get(key) {
    try {
      const raw = localStorage.getItem(_key(key));
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`[Store] Error leyendo ${key}:`, e);
      return null;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(_key(key), JSON.stringify(value));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('[Store] Cuota excedida, limpiando historial antiguo...');
        _evictOldHistory();
        try {
          localStorage.setItem(_key(key), JSON.stringify(value));
          return true;
        } catch {
          console.error('[Store] No se pudo guardar incluso tras eviction');
          return false;
        }
      }
      console.error(`[Store] Error escribiendo ${key}:`, e);
      return false;
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(_key(key));
      return true;
    } catch { return false; }
  }

  function clear(prefixFilter) {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) {
        if (!prefixFilter || k.startsWith(PREFIX + prefixFilter)) {
          keysToRemove.push(k);
        }
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }

  function getAll() {
    const result = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) {
        const shortKey = k.slice(PREFIX.length);
        try { result[shortKey] = JSON.parse(localStorage.getItem(k)); } catch {}
      }
    }
    return result;
  }

  function getStorageUsage() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) total += k.length + (localStorage.getItem(k) || '').length;
    }
    // localStorage típicamente tiene ~5MB = 5*1024*1024 chars (UTF-16)
    const maxBytes = 5 * 1024 * 1024;
    return {
      used: total * 2,       // chars → bytes aproximado (UTF-16)
      max: maxBytes,
      pct: (total * 2) / maxBytes,
      nearLimit: (total * 2) / maxBytes > STORAGE_WARN_THRESHOLD
    };
  }

  function canStoreImage(sizeBytes) {
    const usage = getStorageUsage();
    return (usage.used + sizeBytes) < usage.max * 0.9;
  }

  function exportBackup() {
    return JSON.stringify(getAll(), null, 2);
  }

  function importBackup(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      Object.entries(data).forEach(([k, v]) => set(k, v));
      return true;
    } catch (e) {
      console.error('[Store] Error en importBackup:', e);
      return false;
    }
  }

  /* Eviction: eliminar los registros de historial más antiguos */
  function _evictOldHistory() {
    // Recortar consumed_history a los últimos 60 días
    const consumed = get(keys.CONSUMED_HISTORY) || [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60);
    const trimmed = consumed.filter(e => new Date(e.consumed_date) >= cutoff);
    try {
      localStorage.setItem(_key(keys.CONSUMED_HISTORY), JSON.stringify(trimmed));
    } catch {}

    // Recortar shopping_history a las últimas 5 sesiones
    const shopHistory = get(keys.SHOPPING_HISTORY) || [];
    const trimmedShop = shopHistory.slice(-5);
    try {
      localStorage.setItem(_key(keys.SHOPPING_HISTORY), JSON.stringify(trimmedShop));
    } catch {}
  }

  function init() {
    // Verificar que localStorage está disponible
    try {
      const test = '__casita_test__';
      localStorage.setItem(test, '1');
      localStorage.removeItem(test);
      return true;
    } catch {
      console.error('[Store] localStorage no disponible');
      return false;
    }
  }

  return { keys, get, set, remove, clear, getAll, getStorageUsage, canStoreImage, exportBackup, importBackup, init };
})();

window.Store = Store;
