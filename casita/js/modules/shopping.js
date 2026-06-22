/* =========================================================
   CASITA — Shopping Module
   Lista de la compra: generación, estado, WhatsApp
   ========================================================= */

const Shopping = (() => {
  const { keys } = Store;

  /* ── Lista base (desde data.json) ───────────────────────── */
  function getBaseList() {
    return window.CasitaData?.shoppingList || { sections: [] };
  }

  /* ── Estado (ítems tachados + manuales) ─────────────────── */
  function getChecked() {
    return new Set(Store.get(keys.SHOPPING_CHECKED) || []);
  }

  function getManualItems() {
    return Store.get(keys.SHOPPING_MANUAL) || [];
  }

  /* ── Lista activa (base + manuales + estado) ────────────── */
  function getActiveList() {
    const base    = getBaseList();
    const checked = getChecked();
    const manual  = getManualItems();

    // Clonar secciones e inyectar estado "checked"
    const sections = base.sections.map(section => ({
      ...section,
      items: section.items.map(item => ({
        ...item,
        checked: checked.has(item.id),
        in_pantry: item.pantry_check ? Pantry.hasIngredient(item.pantry_ingredient_id) : false,
      })),
    }));

    // Añadir ítems manuales en sección "otros" o la existente
    if (manual.length) {
      const othersSection = sections.find(s => s.id === 'otros') || {
        id: 'otros',
        name: 'Otros',
        supermarket_order: 99,
        icon: '➕',
        items: [],
      };

      const manualWithState = manual.map(item => ({
        ...item,
        checked: checked.has(item.id),
        in_pantry: false,
      }));

      if (!sections.find(s => s.id === 'otros')) {
        othersSection.items = manualWithState;
        sections.push(othersSection);
      } else {
        sections.find(s => s.id === 'otros').items.push(...manualWithState);
      }
    }

    return { ...base, sections };
  }

  /* ── Progreso global ─────────────────────────────────────── */
  function getProgress() {
    const list    = getActiveList();
    const checked = getChecked();
    let total = 0, done = 0;

    list.sections.forEach(s => {
      s.items.forEach(i => {
        total++;
        if (checked.has(i.id)) done++;
      });
    });

    return { total, done, pct: Utils.pct(done, total) };
  }

  function getSectionProgress(sectionId) {
    const list    = getActiveList();
    const checked = getChecked();
    const section = list.sections.find(s => s.id === sectionId);
    if (!section) return { total: 0, done: 0, pct: 0 };
    const total = section.items.length;
    const done  = section.items.filter(i => checked.has(i.id)).length;
    return { total, done, pct: Utils.pct(done, total) };
  }

  /* ── Toggle ítem ─────────────────────────────────────────── */
  function toggleItem(itemId) {
    const checked = getChecked();
    if (checked.has(itemId)) {
      checked.delete(itemId);
    } else {
      checked.add(itemId);
      Utils.haptic('light');
    }
    Store.set(keys.SHOPPING_CHECKED, [...checked]);

    // Verificar si la sección se completó
    return { checked: checked.has(itemId) };
  }

  function isSectionComplete(sectionId) {
    const { total, done } = getSectionProgress(sectionId);
    return total > 0 && done === total;
  }

  function isListComplete() {
    const { total, done } = getProgress();
    return total > 0 && done === total;
  }

  /* ── Añadir ítem manual ──────────────────────────────────── */
  function addManualItem(name, quantity, unit, sectionId = 'otros') {
    const manual = getManualItems();
    const item = {
      id:          Utils.generateId('manual'),
      ingredient_id: null,
      name,
      quantity:    quantity || 1,
      unit:        unit || 'unidad',
      recipe_ids:  [],
      image:       null,
      is_water:    false,
      is_heavy:    false,
      pantry_check: false,
      pantry_ingredient_id: null,
      manual:      true,
      section_id:  sectionId,
    };
    manual.push(item);
    Store.set(keys.SHOPPING_MANUAL, manual);
    return item;
  }

  function removeManualItem(itemId) {
    const manual = getManualItems().filter(i => i.id !== itemId);
    Store.set(keys.SHOPPING_MANUAL, manual);
  }

  /* ── Limpiar lista (al completar la compra) ──────────────── */
  function completeShoppingTrip() {
    const progress = getProgress();
    const history  = Store.get(keys.SHOPPING_HISTORY) || [];

    history.push({
      date:       new Date().toISOString(),
      items_done: progress.done,
      items_total: progress.total,
      quincenal_id: Store.get(keys.APP_QUINCENAL_ID),
    });

    Store.set(keys.SHOPPING_HISTORY, history.slice(-10));
    Store.set(keys.SHOPPING_LAST, new Date().toISOString());

    // Actualizar despensa con ítems comprados
    const list    = getActiveList();
    const checked = getChecked();
    const boughtPantryItems = [];

    list.sections.forEach(section => {
      section.items.forEach(item => {
        if (checked.has(item.id) && item.pantry_check) {
          boughtPantryItems.push(item);
        }
      });
    });

    if (boughtPantryItems.length) {
      Pantry.importFromShoppingList(boughtPantryItems);
    }

    // Limpiar estado de la lista
    Store.set(keys.SHOPPING_CHECKED, []);
    Store.set(keys.SHOPPING_MANUAL, []);
  }

  /* ── WhatsApp ────────────────────────────────────────────── */
  function generateWhatsAppText() {
    const list    = getActiveList();
    const checked = getChecked();
    const lines   = ['🛒 *Lista de la compra Casita*\n'];

    list.sections.forEach(section => {
      const pending = section.items.filter(i => !checked.has(i.id));
      if (!pending.length) return;

      lines.push(`\n*${section.name.toUpperCase()}*`);
      pending.forEach(item => {
        const qty = item.quantity && item.unit
          ? `${item.quantity} ${item.unit}`
          : '';
        lines.push(`□ ${item.name}${qty ? ' — ' + qty : ''}`);
      });
    });

    lines.push(`\n_Generado con Casita 🏠_`);
    return lines.join('\n');
  }

  /* ── Check contra despensa ───────────────────────────────── */
  function checkAgainstPantry() {
    const list = getActiveList();
    const inPantry = [];

    list.sections.forEach(section => {
      section.items.forEach(item => {
        if (item.in_pantry) inPantry.push(item);
      });
    });

    return inPantry;
  }

  /* ── Resetear al cambiar de quincena ─────────────────────── */
  function resetForNewQuincena() {
    Store.set(keys.SHOPPING_CHECKED, []);
    // Mantener ítems manuales que el usuario haya añadido
  }

  return {
    getBaseList, getActiveList, getProgress, getSectionProgress,
    toggleItem, isSectionComplete, isListComplete,
    addManualItem, removeManualItem,
    completeShoppingTrip,
    generateWhatsAppText, checkAgainstPantry,
    resetForNewQuincena,
  };
})();

window.Shopping = Shopping;
