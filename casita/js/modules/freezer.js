/* =========================================================
   CASITA — Freezer Module
   Congelador: inventario, caducidades, batch cooking
   ========================================================= */

const Freezer = (() => {
  const { keys } = Store;

  const USE_SOON_DAYS = 7; // Avisar si caducan en ≤7 días

  function getAll() {
    return Store.get(keys.FREEZER_ITEMS) || [];
  }

  function save(items) {
    Store.set(keys.FREEZER_ITEMS, items);
    Store.set(keys.FREEZER_UPDATED, new Date().toISOString());
  }

  /* ── Estado de caducidad ─────────────────────────────────── */
  function computeStatus(item) {
    if (!item.expires_at) return 'ok';
    const daysLeft = Utils.daysBetween(Utils.today(), item.expires_at);
    if (daysLeft < 0)           return 'expired';
    if (daysLeft <= USE_SOON_DAYS) return 'use_soon';
    return 'ok';
  }

  function withStatus(item) {
    return { ...item, status: computeStatus(item) };
  }

  function getAllWithStatus() {
    return getAll().map(withStatus);
  }

  /* ── CRUD ────────────────────────────────────────────────── */
  function addItem(data) {
    const items = getAll();

    let expiresAt = data.expires_at || null;
    if (!expiresAt && data.recipe_id) {
      const recipe = (window.CasitaData?.recipes || []).find(r => r.id === data.recipe_id);
      if (recipe?.freezer_duration_weeks) {
        expiresAt = Utils.addDays(Utils.today(), recipe.freezer_duration_weeks * 7);
      }
    }
    if (!expiresAt && data.frozen_at && data.duration_weeks) {
      expiresAt = Utils.addDays(data.frozen_at, data.duration_weeks * 7);
    }

    const item = {
      id: Utils.generateId('freezer'),
      recipe_id:      data.recipe_id      || null,
      name:           data.name,
      quantity:       data.quantity        || 1,
      unit:           data.unit            || 'raciones',
      frozen_at:      data.frozen_at       || Utils.today(),
      expires_at:     expiresAt,
      image:          data.image           || null,
      batch_task_id:  data.batch_task_id   || null,
      notes:          data.notes           || null,
    };

    items.push(item);
    save(items);
    return item;
  }

  function addFromBatch(task) {
    const recipe = (window.CasitaData?.recipes || []).find(r => r.id === task.recipe_id);
    return addItem({
      recipe_id:     task.recipe_id,
      name:          task.recipe_name,
      quantity:      task.result_portions,
      unit:          task.result_unit,
      image:         recipe?.image || null,
      batch_task_id: task.id,
      notes:         `Preparado en batch cooking`,
    });
  }

  function updateItem(id, changes) {
    const items = getAll();
    const idx = items.findIndex(i => i.id === id);
    if (idx < 0) return null;
    items[idx] = { ...items[idx], ...changes };
    save(items);
    return items[idx];
  }

  function removeItem(id) {
    save(getAll().filter(i => i.id !== id));
  }

  /* Consumir N porciones de un ítem */
  function consumeItem(id, qty = 1) {
    const items = getAll();
    const idx = items.findIndex(i => i.id === id);
    if (idx < 0) return;
    items[idx].quantity -= qty;
    if (items[idx].quantity <= 0) {
      items.splice(idx, 1);
    }
    save(items);
  }

  /* ── Actualizar estados ──────────────────────────────────── */
  function checkExpiry() {
    // Solo recalcula en memoria, el status se computa al leer
    const items = getAllWithStatus();
    const expiringSoon  = items.filter(i => i.status === 'use_soon');
    const expired       = items.filter(i => i.status === 'expired');
    return { expiringSoon, expired };
  }

  function getExpiringSoon() {
    return getAllWithStatus().filter(i => i.status === 'use_soon' || i.status === 'expired');
  }

  /* ── Sugerencias para el menú ───────────────────────────── */
  function getSuggestedForMenu() {
    const items = getAllWithStatus().filter(i =>
      i.recipe_id &&
      i.status !== 'expired' &&
      i.quantity > 0
    );
    // Priorizar los que caducan antes
    return items.sort((a, b) => {
      if (!a.expires_at) return 1;
      if (!b.expires_at) return -1;
      return a.expires_at.localeCompare(b.expires_at);
    });
  }

  /* ── Stats ───────────────────────────────────────────────── */
  function getStats() {
    const items = getAllWithStatus();
    return {
      total:        items.length,
      expiringSoon: items.filter(i => i.status === 'use_soon').length,
      expired:      items.filter(i => i.status === 'expired').length,
      ok:           items.filter(i => i.status === 'ok').length,
    };
  }

  return {
    getAll: getAllWithStatus, getAllRaw: getAll,
    addItem, addFromBatch, updateItem, removeItem, consumeItem,
    checkExpiry, getExpiringSoon, getSuggestedForMenu, getStats,
  };
})();

window.Freezer = Freezer;
