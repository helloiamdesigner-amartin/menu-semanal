/* =========================================================
   CASITA — Pantry Module
   Despensa: inventario editable, stock mínimo, alertas
   ========================================================= */

const Pantry = (() => {
  const { keys } = Store;

  function getAll() {
    return Store.get(keys.PANTRY_ITEMS) || [];
  }

  function save(items) {
    Store.set(keys.PANTRY_ITEMS, items);
    Store.set(keys.PANTRY_UPDATED, new Date().toISOString());
  }

  /* ── CRUD ────────────────────────────────────────────────── */
  function addItem(data) {
    const items = getAll();
    const item = {
      id: Utils.generateId('pantry'),
      ingredient_id: data.ingredient_id || null,
      name: data.name,
      quantity: data.quantity || 0,
      unit: data.unit || 'g',
      min_quantity: data.min_quantity || 0,
      image: data.image || null,
      added_at: Utils.today(),
      updated_at: Utils.today(),
      notes: data.notes || null,
      alert_enabled: data.alert_enabled !== false,
    };
    items.push(item);
    save(items);
    return item;
  }

  function updateItem(id, changes) {
    const items = getAll();
    const idx = items.findIndex(i => i.id === id);
    if (idx < 0) return null;
    items[idx] = { ...items[idx], ...changes, updated_at: Utils.today() };
    save(items);
    return items[idx];
  }

  function removeItem(id) {
    const items = getAll().filter(i => i.id !== id);
    save(items);
  }

  function setMinimum(id, minQty) {
    return updateItem(id, { min_quantity: minQty, alert_enabled: minQty > 0 });
  }

  /* ── Imagen base64 ───────────────────────────────────────── */
  function addImageBase64(id, base64Str) {
    // Verificar espacio disponible (~100KB por imagen)
    const estimatedSize = base64Str.length * 0.75; // base64 → bytes
    if (estimatedSize > 150000) {
      return { ok: false, error: 'La imagen es demasiado grande (máx. 150KB)' };
    }
    if (!Store.canStoreImage(estimatedSize)) {
      return { ok: false, error: 'Sin espacio suficiente en el dispositivo' };
    }
    updateItem(id, { image: base64Str });
    return { ok: true };
  }

  /* ── Alertas ─────────────────────────────────────────────── */
  function getAlerts() {
    return getAll().filter(i =>
      i.alert_enabled &&
      i.min_quantity > 0 &&
      i.quantity <= i.min_quantity
    );
  }

  function isLow(item) {
    return item.alert_enabled && item.min_quantity > 0 && item.quantity <= item.min_quantity;
  }

  function isEmpty(item) {
    return item.quantity <= 0;
  }

  /* ── Check contra lista de compra ───────────────────────── */
  function hasIngredient(ingredientId) {
    const items = getAll();
    return items.some(i =>
      i.ingredient_id === ingredientId && i.quantity > 0
    );
  }

  function getIngredientItem(ingredientId) {
    return getAll().find(i => i.ingredient_id === ingredientId) || null;
  }

  /* ── Importar desde lista de compra (después de comprar) ── */
  function importFromShoppingList(shoppingItems) {
    // shoppingItems: array de items marcados como comprados
    const pantryItems = getAll();

    shoppingItems.forEach(shopItem => {
      if (!shopItem.pantry_check || !shopItem.pantry_ingredient_id) return;

      const existingIdx = pantryItems.findIndex(
        p => p.ingredient_id === shopItem.pantry_ingredient_id
      );

      if (existingIdx >= 0) {
        // Sumar cantidad
        pantryItems[existingIdx].quantity += shopItem.quantity;
        pantryItems[existingIdx].updated_at = Utils.today();
      } else {
        // Añadir nuevo
        pantryItems.push({
          id: Utils.generateId('pantry'),
          ingredient_id: shopItem.pantry_ingredient_id,
          name: shopItem.name,
          quantity: shopItem.quantity,
          unit: shopItem.unit,
          min_quantity: 0,
          image: null,
          added_at: Utils.today(),
          updated_at: Utils.today(),
          notes: null,
          alert_enabled: false,
        });
      }
    });

    save(pantryItems);
  }

  /* ── Descontar ingredientes usados en el menú ───────────── */
  function deductForRecipe(recipeId) {
    const recipe = (window.CasitaData?.recipes || []).find(r => r.id === recipeId);
    if (!recipe) return;

    const items = getAll();

    recipe.ingredients
      .filter(ing => ing.pantry_item)
      .forEach(ing => {
        const idx = items.findIndex(p => p.ingredient_id === ing.id);
        if (idx >= 0) {
          items[idx].quantity = Math.max(0, items[idx].quantity - ing.quantity);
          items[idx].updated_at = Utils.today();
        }
      });

    save(items);
  }

  /* ── Inicializar despensa con valores por defecto ────────── */
  function initDefaults() {
    if (getAll().length > 0) return; // Ya tiene datos

    const defaults = [
      { ingredient_id: 'aove',           name: 'Aceite de oliva virgen extra', quantity: 750,  unit: 'ml', min_quantity: 200, alert_enabled: true },
      { ingredient_id: 'tomate-triturado', name: 'Tomate triturado (botes)',   quantity: 2,    unit: 'botes', min_quantity: 1, alert_enabled: true },
      { ingredient_id: 'garbanzos-bote', name: 'Garbanzos cocidos (botes)',    quantity: 2,    unit: 'botes', min_quantity: 1, alert_enabled: true },
      { ingredient_id: 'aceitunas-negras', name: 'Aceitunas negras',           quantity: 1,    unit: 'bote', min_quantity: 0, alert_enabled: false },
      { ingredient_id: 'comino',         name: 'Comino molido',                quantity: 50,   unit: 'g', min_quantity: 0, alert_enabled: false },
      { ingredient_id: 'pimenton',       name: 'Pimentón dulce',               quantity: 50,   unit: 'g', min_quantity: 0, alert_enabled: false },
      { ingredient_id: 'oregano',        name: 'Orégano',                      quantity: 20,   unit: 'g', min_quantity: 0, alert_enabled: false },
      { ingredient_id: 'vinagre',        name: 'Vinagre de jerez',             quantity: 250,  unit: 'ml', min_quantity: 0, alert_enabled: false },
      { ingredient_id: 'huevos',         name: 'Huevos',                       quantity: 6,    unit: 'unidades', min_quantity: 3, alert_enabled: true },
      { ingredient_id: 'lentejas-pardinas', name: 'Lentejas pardinas',         quantity: 500,  unit: 'g', min_quantity: 200, alert_enabled: true },
    ];

    const items = defaults.map(d => ({
      id: Utils.generateId('pantry'),
      ...d,
      image: null,
      added_at: Utils.today(),
      updated_at: Utils.today(),
      notes: null,
    }));

    save(items);
  }

  /* ── Stats para dashboard ────────────────────────────────── */
  function getStats() {
    const items = getAll();
    const alerts = getAlerts();
    return {
      total: items.length,
      alerts: alerts.length,
      empty: items.filter(isEmpty).length,
      alertItems: alerts,
    };
  }

  return {
    getAll, save, addItem, updateItem, removeItem, setMinimum,
    addImageBase64, getAlerts, isLow, isEmpty,
    hasIngredient, getIngredientItem,
    importFromShoppingList, deductForRecipe,
    initDefaults, getStats,
  };
})();

window.Pantry = Pantry;
