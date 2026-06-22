/* =========================================================
   CASITA — Screen: Shopping (Lista de la compra)
   Lista por secciones, checkboxes, WhatsApp
   ========================================================= */

const ScreenShopping = (() => {

  function render() {
    const container = Utils.el('screen-shopping');
    if (!container) return;

    const list     = Shopping.getActiveList();
    const progress = Shopping.getProgress();

    container.innerHTML = `
      <!-- Header -->
      <div class="shopping-header">
        <div>
          <h1>Lista de la compra</h1>
          <div class="mercadona-label">
            🛒 Mercadona
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </div>
        </div>
        <button class="btn btn-sm btn-secondary" onclick="ScreenShopping.openEditDialog()">
          ✏️ Editar lista
        </button>
      </div>

      <!-- Progreso -->
      <div class="shopping-progress-wrap">
        <div class="shopping-count">
          <strong>${progress.done}</strong> de <strong>${progress.total}</strong> productos
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill ${progress.pct === 100 ? 'complete' : ''}"
            style="width:${progress.pct}%"></div>
        </div>
      </div>

      <!-- Secciones de productos -->
      <div id="shopping-sections">
        ${list.sections.map(section => _renderSection(section)).join('')}
      </div>

      <!-- Botón WhatsApp (sticky bottom) -->
      <div style="padding:var(--sp-md) var(--sp-lg) var(--sp-xl);position:sticky;bottom:0;background:var(--c-bg);border-top:1px solid var(--c-border);">
        <button class="btn btn-terra btn-full" onclick="ScreenShopping.shareWhatsApp()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
          </svg>
          Compartir por WhatsApp
        </button>
      </div>
    `;

    _bindEvents(container);
  }

  function _renderSection(section) {
    const sectionProg = Shopping.getSectionProgress(section.id);
    const complete     = sectionProg.pct === 100;

    // Ordenar: pendientes primero, tachados al final
    const sortedItems = [...section.items].sort((a, b) => {
      if (a.checked === b.checked) return 0;
      return a.checked ? 1 : -1;
    });

    return `
      <div class="shopping-section" id="section-${section.id}">
        <div class="shopping-section-header">
          <span style="font-size:16px;">${section.icon}</span>
          <span class="shopping-section-label">${section.name}</span>
          ${complete ? `<span class="badge badge-success" style="margin-left:auto;">✓ Completado</span>` : ''}
        </div>
        <div class="shopping-section-body">
          ${sortedItems.map(item => _renderItem(item, section.id)).join('')}
        </div>
      </div>
    `;
  }

  function _renderItem(item, sectionId) {
    const isWater = item.is_water;
    const extraClass = isWater ? ' water-shopping-item' : '';

    if (isWater) {
      return `
        <div class="shopping-item${extraClass}" data-item="${item.id}" data-section="${sectionId}">
          <div class="shopping-item-check" style="border-color:var(--c-water);">
            <svg viewBox="0 0 24 24" fill="none"><polyline points="20,6 9,17 4,12"/></svg>
          </div>
          <div class="shopping-item-content">
            <div class="shopping-item-name" style="color:var(--c-water-dark);">
              ${item.quantity} ${item.name}
            </div>
            <div class="shopping-item-detail" style="color:var(--c-water);">🏋️ Producto pesado</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-water)" stroke-width="2">
            <polyline points="9,18 15,12 9,6"/>
          </svg>
        </div>
      `;
    }

    const qtyStr = item.quantity && item.unit ? `${item.quantity} ${item.unit}` : '';

    return `
      <div class="shopping-item${item.checked ? ' checked' : ''}${extraClass}"
        data-item="${item.id}" data-section="${sectionId}">
        <div class="shopping-item-check">
          <svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
        </div>
        <div class="shopping-item-content">
          <div class="shopping-item-name">${item.name}</div>
          ${qtyStr ? `<div class="shopping-item-detail">${qtyStr}</div>` : ''}
          ${item.in_pantry ? `<div class="shopping-item-detail" style="color:var(--c-primary);">✓ Tienes en despensa</div>` : ''}
          ${item.is_heavy ? `<div class="shopping-item-detail">🏋️ Producto pesado</div>` : ''}
        </div>
        ${item.image ? `<img class="shopping-item-photo" src="${item.image}" alt="${item.name}" onerror="this.style.display='none'">` : ''}
      </div>
    `;
  }

  /* ── Eventos ─────────────────────────────────────────────── */
  function _bindEvents(container) {
    // Delegar clicks en items
    container.addEventListener('click', e => {
      const item = e.target.closest('.shopping-item');
      if (!item || item.classList.contains('water-shopping-item')) return;

      const itemId    = item.dataset.item;
      const sectionId = item.dataset.section;
      if (!itemId) return;

      const result = Shopping.toggleItem(itemId);
      item.classList.toggle('checked', result.checked);

      // Animar check
      const checkEl = item.querySelector('.shopping-item-check svg');
      if (checkEl && result.checked) {
        checkEl.style.opacity = '1';
        checkEl.style.transform = 'scale(1)';
      } else if (checkEl) {
        checkEl.style.opacity = '0';
        checkEl.style.transform = 'scale(0)';
      }

      // Actualizar progreso global
      _updateProgress();

      // ¿Sección completada?
      if (result.checked && Shopping.isSectionComplete(sectionId)) {
        _showSectionComplete(sectionId);
      }

      // ¿Lista completa?
      if (Shopping.isListComplete()) {
        setTimeout(() => {
          if (confirm('🎉 ¡Lista completada! ¿Registrar la compra y actualizar despensa?')) {
            Shopping.completeShoppingTrip();
            Notifications.toastSuccess('¡Compra registrada!');
            render();
          }
        }, 500);
      }
    });
  }

  function _updateProgress() {
    const progress = Shopping.getProgress();
    const countEl  = document.querySelector('.shopping-count');
    const fillEl   = document.querySelector('.shopping-progress-wrap .progress-bar-fill');

    if (countEl) countEl.innerHTML = `<strong>${progress.done}</strong> de <strong>${progress.total}</strong> productos`;
    if (fillEl) {
      fillEl.style.width = `${progress.pct}%`;
      fillEl.classList.toggle('complete', progress.pct === 100);
    }
  }

  function _showSectionComplete(sectionId) {
    Utils.haptic('medium');
    const sectionEl = document.getElementById(`section-${sectionId}`);
    if (!sectionEl) return;
    const label = sectionEl.querySelector('.shopping-section-header');
    if (label && !label.querySelector('.badge')) {
      const badge = document.createElement('span');
      badge.className = 'badge badge-success';
      badge.style.marginLeft = 'auto';
      badge.textContent = '✓ Completado';
      label.appendChild(badge);
    }
  }

  function shareWhatsApp() {
    const text = Shopping.generateWhatsAppText();
    Utils.openWhatsApp(text);
  }

  function openEditDialog() {
    const name = prompt('Añadir producto:');
    if (!name?.trim()) return;
    Shopping.addManualItem(name.trim(), 1, 'unidad');
    render();
    Notifications.toastSuccess(`"${name}" añadido ✓`);
  }

  function teardown() {}

  return { render, teardown, shareWhatsApp, openEditDialog };
})();

window.ScreenShopping = ScreenShopping;
