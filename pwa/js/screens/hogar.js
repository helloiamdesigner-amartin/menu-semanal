/* =========================================================
   CASITA — Screen: Mi Hogar
   Tabs: Congelador / Despensa / Agua
   ========================================================= */

const ScreenHogar = (() => {

  let _activeTab = 'congelador';

  function render(params = {}) {
    if (params.tab) _activeTab = params.tab;

    const container = Utils.el('screen-hogar');
    if (!container) return;

    const freezStats = Freezer.getStats();
    const pantStats  = Pantry.getStats();
    const waterProg  = Water.getBiweeklyProgress();

    container.innerHTML = `
      <!-- Header -->
      <div class="page-header">
        <div class="page-header-title">
          <h1>Hogar</h1>
          <p>Gestiona tu inventario y consumo</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="hogar-tabs" style="margin:0 var(--sp-lg) var(--sp-md);">
        <button class="hogar-tab ${_activeTab === 'congelador' ? 'active' : ''}" data-tab="congelador">
          ❄️ Congelador
        </button>
        <button class="hogar-tab ${_activeTab === 'despensa' ? 'active' : ''}" data-tab="despensa">
          🫙 Despensa
        </button>
        <button class="hogar-tab ${_activeTab === 'agua' ? 'active' : ''}" data-tab="agua">
          💧 Agua
        </button>
      </div>

      <!-- Stats 3 cols -->
      <div class="hogar-stats">
        <div class="hogar-stat" onclick="ScreenHogar.switchTab('congelador')">
          <div class="hogar-stat-icon">❄️</div>
          <div class="hogar-stat-number">${freezStats.total}</div>
          <div class="hogar-stat-label">productos</div>
          <div class="hogar-stat-label" style="font-weight:600;color:var(--c-text-secondary);">Congelador</div>
        </div>
        <div class="hogar-stat" onclick="ScreenHogar.switchTab('despensa')">
          <div class="hogar-stat-icon">🫙</div>
          <div class="hogar-stat-number" style="color:${pantStats.alerts > 0 ? 'var(--c-warning)' : 'inherit'}">${pantStats.total}</div>
          <div class="hogar-stat-label">productos</div>
          <div class="hogar-stat-label" style="font-weight:600;color:var(--c-text-secondary);">Despensa</div>
        </div>
        <div class="hogar-stat" onclick="ScreenHogar.switchTab('agua')">
          <div class="hogar-stat-icon">💧</div>
          <div class="hogar-stat-number" style="color:var(--c-water);">${waterProg.bottles} / ${waterProg.goal_bottles}</div>
          <div class="hogar-stat-label">garrafas</div>
          <div class="hogar-stat-label" style="font-weight:600;color:var(--c-water);">Agua</div>
        </div>
      </div>

      <!-- Contenido de los tabs -->
      <div id="hogar-tab-congelador" class="hogar-tab-content ${_activeTab === 'congelador' ? 'active' : ''}">
        ${_renderCongelador()}
      </div>
      <div id="hogar-tab-despensa" class="hogar-tab-content ${_activeTab === 'despensa' ? 'active' : ''}">
        ${_renderDespensa()}
      </div>
      <div id="hogar-tab-agua" class="hogar-tab-content ${_activeTab === 'agua' ? 'active' : ''}">
        ${_renderAgua()}
      </div>

      <div style="height:var(--sp-xxl)"></div>
    `;

    _bindEvents(container);
  }

  /* ── Congelador ──────────────────────────────────────────── */
  function _renderCongelador() {
    const items   = Freezer.getAll();
    const expiring = items.filter(i => i.status === 'use_soon' || i.status === 'expired');

    if (!items.length) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">❄️</div>
          <div class="empty-state-title">Congelador vacío</div>
          <div class="empty-state-desc">Los platos del batch cooking aparecerán aquí</div>
        </div>
      `;
    }

    return `
      ${expiring.length ? `
        <div style="padding:0 var(--sp-lg) var(--sp-sm);">
          <div class="badge badge-warning">⚠️ ${expiring.length} item${expiring.length > 1 ? 's' : ''} caducan pronto</div>
        </div>
      ` : ''}

      <div style="padding:0 var(--sp-lg) var(--sp-sm);">
        <div class="label-section">CONGELADOR</div>
      </div>
      <div style="margin:0 var(--sp-lg);background:var(--c-white);border:1px solid var(--c-border);border-radius:var(--r-lg);overflow:hidden;">
        ${items.map(item => _renderFreezerItem(item)).join('')}
      </div>

      <div style="padding:var(--sp-md) var(--sp-lg) 0;">
        <button class="btn btn-secondary btn-full" onclick="ScreenHogar.addFreezerItem()">
          + Añadir al congelador
        </button>
      </div>
    `;
  }

  function _renderFreezerItem(item) {
    const statusBadge = {
      ok:       `<span class="badge badge-success">OK ✓</span>`,
      use_soon: `<span class="badge badge-warning">⏰ Usar pronto</span>`,
      expired:  `<span class="badge badge-danger">⚠️ Caducado</span>`,
    }[item.status] || '';

    const dateLabel = item.frozen_at
      ? `${item.quantity} ${item.unit} · ${Utils.formatDate(item.frozen_at, { day: 'numeric', month: 'short' })}`
      : `${item.quantity} ${item.unit}`;

    return `
      <div class="inventory-item" data-freezer-id="${item.id}">
        <div class="inventory-item-photo">
          ${item.image
            ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--r-md);">`
            : '❄️'}
        </div>
        <div class="inventory-item-content">
          <div class="inventory-item-name">${item.name}</div>
          <div class="inventory-item-detail">${dateLabel}</div>
        </div>
        <div class="inventory-item-status">${statusBadge}</div>
        <div class="list-row-chevron">
          <svg viewBox="0 0 24 24"><polyline points="9,18 15,12 9,6"/></svg>
        </div>
      </div>
    `;
  }

  /* ── Despensa ────────────────────────────────────────────── */
  function _renderDespensa() {
    const items   = Pantry.getAll();
    const alerts  = Pantry.getAlerts();

    if (!items.length) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">🫙</div>
          <div class="empty-state-title">Despensa vacía</div>
          <div class="empty-state-desc">Añade tus productos básicos</div>
          <button class="btn btn-primary btn-sm" onclick="ScreenHogar.initPantryDefaults()">
            Cargar productos básicos
          </button>
        </div>
      `;
    }

    // Separar con alerta del resto
    const alertItems  = items.filter(i => Pantry.isLow(i));
    const normalItems = items.filter(i => !Pantry.isLow(i));

    return `
      ${alertItems.length ? `
        <div style="padding:0 var(--sp-lg) var(--sp-sm);">
          <div class="label-section">BAJO MÍNIMO</div>
        </div>
        <div style="margin:0 var(--sp-lg) var(--sp-md);background:var(--c-white);border:1px solid var(--c-danger-pale);border-radius:var(--r-lg);overflow:hidden;">
          ${alertItems.map(item => _renderPantryItem(item)).join('')}
        </div>
      ` : ''}

      <div style="padding:0 var(--sp-lg) var(--sp-sm);">
        <div class="label-section">DESPENSA</div>
      </div>
      <div style="margin:0 var(--sp-lg);background:var(--c-white);border:1px solid var(--c-border);border-radius:var(--r-lg);overflow:hidden;">
        ${normalItems.map(item => _renderPantryItem(item)).join('')}
      </div>

      <div style="padding:var(--sp-md) var(--sp-lg) 0;">
        <button class="btn btn-secondary btn-full" onclick="ScreenHogar.addPantryItem()">
          + Añadir a despensa
        </button>
      </div>
    `;
  }

  function _renderPantryItem(item) {
    const isLow  = Pantry.isLow(item);
    const badge  = isLow
      ? `<span class="badge badge-danger">⚠️ Casi vacío</span>`
      : '';

    return `
      <div class="inventory-item" data-pantry-id="${item.id}">
        <div class="inventory-item-photo">
          ${item.image
            ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--r-md);">`
            : '🫙'}
        </div>
        <div class="inventory-item-content">
          <div class="inventory-item-name">${item.name}</div>
          <div class="inventory-item-detail">${item.quantity} ${item.unit}</div>
        </div>
        <div class="inventory-item-status">${badge}</div>
        <div class="list-row-chevron">
          <svg viewBox="0 0 24 24"><polyline points="9,18 15,12 9,6"/></svg>
        </div>
      </div>
    `;
  }

  /* ── Agua ────────────────────────────────────────────────── */
  function _renderAgua() {
    const prog  = Water.getBiweeklyProgress();
    const daily = Water.getDailyAverage();
    const todayProg = Water.getTodayProgress();

    return `
      <div class="water-section" style="margin:0 var(--sp-lg);">
        <div style="display:flex;gap:var(--sp-md);align-items:center;">
          <div style="font-size:56px;">💧</div>
          <div style="flex:1;">
            <div style="font-size:12px;color:var(--c-water);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Objetivo quincenal</div>
            <div class="water-quincenal-row">
              <span class="water-big-number">${prog.bottles}</span>
              <span class="water-goal">/ ${prog.goal_bottles} garrafas (${prog.goal_liters} litros)</span>
            </div>
            <div class="progress-bar" style="margin:10px 0 8px;">
              <div class="progress-bar-fill water" style="width:${prog.percentage}%"></div>
            </div>
            <div style="font-size:13px;color:var(--c-water);">
              ${prog.reached
                ? '✅ ¡Objetivo quincenal completado!'
                : `Te quedan ${prog.bottles_remaining} garrafas para completar tu objetivo`}
            </div>
          </div>
        </div>
      </div>

      <!-- Hoy -->
      <div style="padding:var(--sp-md) var(--sp-lg) 0;">
        <div class="label-section" style="margin-bottom:var(--sp-sm);">HOY</div>
        <div style="background:var(--c-white);border:1px solid var(--c-border);border-radius:var(--r-lg);padding:var(--sp-md);">
          <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
            <span style="font-weight:600;">Consumo diario</span>
            <span style="color:var(--c-water);font-weight:700;">${todayProg.current_l} / ${todayProg.goal_l} L</span>
          </div>
          <div class="progress-bar" style="margin-bottom:12px;">
            <div class="progress-bar-fill water" style="width:${todayProg.percentage}%"></div>
          </div>
          <div class="water-btns">
            <button class="water-btn" onclick="ScreenHogar.addWater(250)">+250 ml</button>
            <button class="water-btn" onclick="ScreenHogar.addWater(500)">+500 ml</button>
            <button class="water-btn bottle-btn" onclick="ScreenHogar.addBottle()">+1 garrafa</button>
          </div>
        </div>
      </div>

      <!-- Media diaria -->
      <div style="padding:var(--sp-md) var(--sp-lg) 0;">
        <div style="background:var(--c-white);border:1px solid var(--c-border);border-radius:var(--r-lg);padding:var(--sp-md);display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-weight:600;">Media diaria (14 días)</div>
            <div style="font-size:13px;color:var(--c-text-muted);">Historial de esta quincena</div>
          </div>
          <div style="font-size:20px;font-weight:700;color:var(--c-water);">${daily} L</div>
        </div>
      </div>
    `;
  }

  /* ── Acciones ─────────────────────────────────────────────── */
  function switchTab(tab) {
    _activeTab = tab;
    document.querySelectorAll('.hogar-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.querySelectorAll('.hogar-tab-content').forEach(c => {
      c.classList.toggle('active', c.id === `hogar-tab-${tab}`);
    });
  }

  function addWater(ml) {
    const result = Water.addEntry(ml);
    if (result.reached) Notifications.toastSuccess('💧 ¡Objetivo diario conseguido!');
    else Notifications.toastInfo(`💧 +${Utils.formatLiters(ml)}`);
    Utils.el(`hogar-tab-agua`).innerHTML = _renderAgua();
    _bindAguaEvents();
  }

  function addBottle() {
    const { bottleMl } = Water.getConfig();
    addWater(bottleMl);
  }

  function addPantryItem() {
    const name = prompt('Nombre del producto:');
    if (!name?.trim()) return;
    const qty  = parseFloat(prompt('Cantidad:') || '0');
    const unit = prompt('Unidad (g, ml, unidades, botes...):') || 'unidad';
    Pantry.addItem({ name: name.trim(), quantity: qty, unit });
    Notifications.toastSuccess(`"${name}" añadido a la despensa ✓`);
    Utils.el('hogar-tab-despensa').innerHTML = _renderDespensa();
    _bindDespensaEvents();
  }

  function addFreezerItem() {
    const name = prompt('¿Qué vas a congelar?');
    if (!name?.trim()) return;
    const qty  = parseFloat(prompt('Cantidad:') || '1');
    const unit = prompt('Unidad (raciones, litros, g...):') || 'raciones';
    Freezer.addItem({ name: name.trim(), quantity: qty, unit });
    Notifications.toastSuccess(`"${name}" añadido al congelador ✓`);
    Utils.el('hogar-tab-congelador').innerHTML = _renderCongelador();
    _bindCongeladorEvents();
  }

  function initPantryDefaults() {
    Pantry.initDefaults();
    Notifications.toastSuccess('Despensa inicializada con productos básicos ✓');
    Utils.el('hogar-tab-despensa').innerHTML = _renderDespensa();
    _bindDespensaEvents();
  }

  /* ── Eventos ─────────────────────────────────────────────── */
  function _bindEvents(container) {
    container.querySelectorAll('.hogar-tab').forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    _bindCongeladorEvents();
    _bindDespensaEvents();
    _bindAguaEvents();
  }

  function _bindCongeladorEvents() {
    document.querySelectorAll('[data-freezer-id]').forEach(row => {
      row.addEventListener('click', () => {
        const id   = row.dataset.freezerId;
        const item = Freezer.getAll().find(i => i.id === id);
        if (!item) return;
        if (confirm(`¿Usar "${item.name}"? Se marcará como consumido.`)) {
          Freezer.consumeItem(id);
          Notifications.toastSuccess('Producto consumido del congelador ✓');
          Utils.el('hogar-tab-congelador').innerHTML = _renderCongelador();
          _bindCongeladorEvents();
        }
      });
    });
  }

  function _bindDespensaEvents() {
    document.querySelectorAll('[data-pantry-id]').forEach(row => {
      row.addEventListener('click', () => {
        const id   = row.dataset.pantryId;
        const item = Pantry.getAll().find(i => i.id === id);
        if (!item) return;
        const newQty = parseFloat(prompt(`Actualizar cantidad de "${item.name}" (actual: ${item.quantity} ${item.unit}):`, item.quantity));
        if (!isNaN(newQty)) {
          Pantry.updateItem(id, { quantity: newQty });
          Notifications.toastSuccess('Despensa actualizada ✓');
          Utils.el('hogar-tab-despensa').innerHTML = _renderDespensa();
          _bindDespensaEvents();
        }
      });
    });
  }

  function _bindAguaEvents() {
    // Los botones de agua usan onclick inline
  }

  function teardown() {}

  return { render, teardown, switchTab, addWater, addBottle, addPantryItem, addFreezerItem, initPantryDefaults };
})();

window.ScreenHogar = ScreenHogar;
