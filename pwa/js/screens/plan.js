/* =========================================================
   CASITA — Screen: Plan (Menú quincenal)
   Calendario semanal, detalle del día, batch cooking
   ========================================================= */

const ScreenPlan = (() => {

  let _selectedDate = Utils.today();
  let _weekOffset   = 0; // 0 = semana actual

  function render(params = {}) {
    if (params.date) _selectedDate = params.date;
    else _selectedDate = Utils.today();
    _weekOffset = 0;

    const container = Utils.el('screen-plan');
    if (!container) return;

    const period = Menu.getQuincenalPeriod();

    container.innerHTML = `
      <!-- Header -->
      <div class="plan-header">
        <div>
          <h1>Menú quincenal</h1>
          <p class="text-muted" style="font-size:13px;margin-top:2px;">Planifica tus comidas</p>
        </div>
        <button class="quincenal-selector" onclick="ScreenPlan.openPeriodSelector()">
          ${period?.label || 'Esta quincena'}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="6,9 12,15 18,9"/>
          </svg>
        </button>
      </div>

      <!-- Calendario semanal -->
      <div class="calendar-wrap">
        <div class="calendar-nav">
          <button class="calendar-nav-btn" id="plan-prev-week" aria-label="Semana anterior">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
          </button>
          <div id="plan-week-label" style="font-size:13px;font-weight:600;color:var(--c-text-muted)"></div>
          <button class="calendar-nav-btn" id="plan-next-week" aria-label="Semana siguiente">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </button>
        </div>
        <div class="calendar-row" id="plan-calendar-row"></div>
      </div>

      <!-- Hero del día seleccionado -->
      <div style="padding:var(--sp-md) var(--sp-lg) 0;">
        <div id="plan-day-hero" class="day-hero"></div>
      </div>

      <!-- Comidas del día -->
      <div style="padding:var(--sp-md) var(--sp-lg) 0;">
        <div id="plan-day-meals" class="day-meals-card"></div>
      </div>

      <!-- Batch cooking teaser (si es sábado o hay plan) -->
      <div style="padding:var(--sp-md) var(--sp-lg) 0;" id="plan-batch-wrap"></div>

      <div style="height:var(--sp-xl)"></div>
    `;

    _renderCalendar();
    _renderSelectedDay();
    _renderBatchTeaser();
    _bindEvents(container);
  }

  /* ── Calendario ──────────────────────────────────────────── */
  function _renderCalendar() {
    const baseDate  = Utils.addDays(Utils.today(), _weekOffset * 7);
    const weekDates = Utils.getWeekDays(baseDate);
    const labels    = Utils.DAY_NAMES_SHORT_FROM_MONDAY();
    const activeMenu = Menu.getActiveMenu();
    const today     = Utils.today();

    // Filtrar solo días del menú
    const menuDates = new Set(activeMenu.days.map(d => d.date));

    const row = Utils.el('plan-calendar-row');
    if (!row) return;

    row.innerHTML = weekDates.map((date, i) => {
      const isToday    = date === today;
      const isSelected = date === _selectedDate;
      const hasPlan    = menuDates.has(date);
      const isWeekend  = i >= 5;
      const dayNum     = Utils.parseDate(date).getDate();

      const classes = [
        'calendar-day',
        isToday    ? 'today'    : '',
        isSelected ? 'selected' : '',
        hasPlan    ? 'has-plan' : '',
        isWeekend  ? 'weekend'  : '',
      ].filter(Boolean).join(' ');

      return `
        <button class="${classes}" data-date="${date}" aria-label="${date}">
          <span class="calendar-day-label">${labels[i]}</span>
          <span class="calendar-day-number">${dayNum}</span>
        </button>
      `;
    }).join('');

    // Semana label
    const weekLabel = Utils.el('plan-week-label');
    if (weekLabel) {
      const startDay = Utils.parseDate(weekDates[0]).getDate();
      const endDay   = Utils.parseDate(weekDates[6]).getDate();
      weekLabel.textContent = `${startDay}–${endDay} jun`;
    }
  }

  /* ── Día seleccionado ────────────────────────────────────── */
  function _renderSelectedDay() {
    const dayMenu  = Menu.getDayMenu(_selectedDate);
    const heroEl   = Utils.el('plan-day-hero');
    const mealsEl  = Utils.el('plan-day-meals');
    if (!heroEl || !mealsEl) return;

    if (!dayMenu) {
      heroEl.innerHTML  = `<div class="empty-state"><div class="empty-state-icon">📅</div>
        <div class="empty-state-title">Sin menú este día</div></div>`;
      mealsEl.innerHTML = '';
      return;
    }

    // Hero foto (la comida featured o lunch)
    const featured = dayMenu.lunch?.is_featured ? dayMenu.lunch
      : dayMenu.lunch?.recipe_id ? dayMenu.lunch
      : null;

    if (featured) {
      const isSpecial = featured.special_type;
      heroEl.innerHTML = `
        <div class="hero-photo" style="border-radius:var(--c-r-lg, 16px);overflow:hidden;height:200px;">
          <img src="${Utils.imgWithFallback(featured.image)}" alt="${featured.recipe_name}"
            style="width:100%;height:100%;object-fit:cover;"
            onerror="this.src='assets/images/meals/placeholder.jpg'">
          <div class="hero-photo-overlay"></div>
          ${isSpecial ? `<div class="hero-tags"><span class="hero-tag">✨ ${isSpecial.charAt(0).toUpperCase() + isSpecial.slice(1)}</span></div>` : ''}
          <div class="hero-photo-content">
            <div class="hero-photo-eyebrow">COMIDA DE HOY</div>
            <div class="hero-photo-title">${featured.recipe_name}</div>
          </div>
        </div>
      `;
      heroEl.querySelector('.hero-photo').addEventListener('click', () => {
        if (featured.recipe_id) Router.openSheet('recipe-detail', { recipe_id: featured.recipe_id });
      });
    } else {
      heroEl.innerHTML = '';
    }

    // Lista de comidas
    const meals = [
      { key: 'breakfast', label: 'Desayuno', icon: '🌅', bg: '#FFF3E0', color: '#E65100' },
      { key: 'lunch',     label: 'Comida',   icon: '☀️',  bg: 'var(--c-primary-ghost)', color: 'var(--c-primary)' },
      { key: 'dinner',    label: 'Cena',     icon: '🌙', bg: '#EDE7F6', color: '#6A1B9A' },
    ];

    mealsEl.innerHTML = meals.map(m => {
      const meal = dayMenu[m.key];
      const name = meal?.simple_description || meal?.recipe_name || 'Sin planificar';
      const hasRecipe = !!meal?.recipe_id;

      return `
        <div class="list-row" data-recipe="${meal?.recipe_id || ''}" data-date="${_selectedDate}" data-meal="${m.key}">
          <div class="list-row-icon" style="background:${m.bg};font-size:18px;">${m.icon}</div>
          <div class="list-row-content">
            <div class="list-row-title">${m.label}</div>
            <div class="list-row-subtitle" style="color:${hasRecipe ? 'var(--c-text-secondary)' : 'var(--c-text-muted)'};">${name}</div>
          </div>
          ${hasRecipe ? `
          <div class="list-row-chevron">
            <svg viewBox="0 0 24 24"><polyline points="9,18 15,12 9,6"/></svg>
          </div>` : ''}
        </div>
      `;
    }).join('');

    // Añadir fila de Batch cooking si es sábado
    const batchPlan = Menu.getBatchPlan();
    if (batchPlan && Utils.isSaturday(_selectedDate)) {
      mealsEl.innerHTML += `
        <div class="list-row" id="plan-batch-row">
          <div class="list-row-icon" style="background:var(--c-primary-pale);font-size:18px;">🍳</div>
          <div class="list-row-content">
            <div class="list-row-title">Batch cooking — Sábado</div>
            <div class="list-row-subtitle">Prepara varias recetas y ahorra tiempo</div>
          </div>
          <div class="list-row-chevron"><svg viewBox="0 0 24 24"><polyline points="9,18 15,12 9,6"/></svg></div>
        </div>
      `;
    }

    // Eventos en filas de comida
    mealsEl.querySelectorAll('.list-row[data-recipe]').forEach(row => {
      row.addEventListener('click', () => {
        const recipeId = row.dataset.recipe;
        if (recipeId) Router.openSheet('recipe-detail', { recipe_id: recipeId });
      });
    });

    mealsEl.querySelector('#plan-batch-row')?.addEventListener('click', () => {
      Router.openSheet('batch-detail', {});
    });
  }

  /* ── Batch teaser ─────────────────────────────────────────── */
  function _renderBatchTeaser() {
    const wrap     = Utils.el('plan-batch-wrap');
    const batchPlan = Menu.getBatchPlan();
    if (!wrap || !batchPlan) return;

    // Solo mostrar si no es el día seleccionado un sábado (ya aparece en la lista)
    if (Utils.isSaturday(_selectedDate)) { wrap.innerHTML = ''; return; }

    const stats = Batch.getSessionStats();

    wrap.innerHTML = `
      <div class="batch-teaser" onclick="Router.openSheet('batch-detail', {})">
        <div style="font-size:28px">🍳</div>
        <div>
          <div style="font-weight:600;color:var(--c-primary-dark);">Batch cooking — Sábado</div>
          <div style="font-size:13px;color:var(--c-primary);">
            ${stats ? `${stats.total_tasks} recetas · ${Utils.formatMinutes(stats.total_minutes)}` : 'Prepara y ahorra tiempo'}
          </div>
        </div>
        <div class="list-row-chevron" style="margin-left:auto;">
          <svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:var(--c-primary);fill:none;stroke-width:2;">
            <polyline points="9,18 15,12 9,6"/>
          </svg>
        </div>
      </div>
    `;
  }

  /* ── Eventos ─────────────────────────────────────────────── */
  function _bindEvents(container) {
    // Días del calendario
    container.addEventListener('click', e => {
      const dayBtn = e.target.closest('.calendar-day');
      if (dayBtn?.dataset.date) {
        _selectedDate = dayBtn.dataset.date;
        _renderCalendar();
        _renderSelectedDay();
        _renderBatchTeaser();
      }
    });

    Utils.el('plan-prev-week')?.addEventListener('click', () => {
      _weekOffset--;
      _renderCalendar();
    });

    Utils.el('plan-next-week')?.addEventListener('click', () => {
      _weekOffset++;
      _renderCalendar();
    });
  }

  function openPeriodSelector() {
    // Simplificado: solo muestra info de la quincena actual
    const period = Menu.getQuincenalPeriod();
    Notifications.toastInfo(`Quincena ${period?.id || ''}: ${period?.label || ''}`);
  }

  function teardown() {}

  return { render, teardown, openPeriodSelector };
})();

window.ScreenPlan = ScreenPlan;
