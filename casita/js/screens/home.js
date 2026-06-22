/* =========================================================
   CASITA — Screen: Home (Inicio)
   Dashboard principal con menú del día, agua, stats
   ========================================================= */

const ScreenHome = (() => {

  function render() {
    const container = Utils.el('screen-home');
    if (!container) return;

    const today       = Utils.today();
    const todayMenu   = Menu.getTodayMeals();
    const featured    = Menu.getTodayFeatured();
    const waterProg   = Water.getTodayProgress();
    const biwkProg    = Water.getBiweeklyProgress();
    const freezStats  = Freezer.getStats();
    const pantStats   = Pantry.getStats();
    const specialRecipe = Menu.getSpecialRecipe();
    const greeting    = Utils.greetingTime();
    const userName    = window.CasitaData?.config?.household?.users?.[0]?.name || 'Alba';

    container.innerHTML = `
      <!-- Logo -->
      <div class="app-logo">Casita</div>

      <!-- Hero photo con la comida destacada -->
      ${_renderHero(featured)}

      <!-- Saludo -->
      <div class="greeting-section">
        <div class="greeting-name">${greeting}, ${userName}</div>
        <div class="greeting-date">${Utils.formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      </div>

      <!-- Card resumen de hoy -->
      ${_renderTodayCard(todayMenu)}

      <!-- Card de agua -->
      ${_renderWaterCard(waterProg)}

      <!-- Stats grid (congelador + despensa) -->
      <div class="stats-grid">
        ${_renderStatCard('❄️', 'Congelador', freezStats.total, 'productos', 'congelador', freezStats.expiringSoon > 0 ? `⚠️ ${freezStats.expiringSoon} caducan pronto` : 'Todo OK', freezStats.expiringSoon > 0 ? 'warning' : 'ok')}
        ${_renderStatCard('🫙', 'Despensa', pantStats.total, 'productos', 'despensa', pantStats.alerts > 0 ? `⚠️ ${pantStats.alerts} bajo mínimo` : 'Bien surtida', pantStats.alerts > 0 ? 'warning' : 'ok')}
      </div>

      <!-- Especial semanal -->
      ${specialRecipe ? _renderSpecialCard(specialRecipe) : ''}

      <!-- Padding final -->
      <div style="height: var(--sp-xl)"></div>
    `;

    _bindEvents(container);
    Notifications.updateAllBadges();
  }

  function _renderHero(featured) {
    if (!featured) {
      return `<div class="hero-photo" style="background:var(--c-surface);display:flex;align-items:center;justify-content:center;">
        <span style="font-size:48px">🍽️</span>
      </div>`;
    }

    const isFav = Ratings.isFavorite(featured.recipe_id);
    const tags  = featured.recipe?.tags?.slice(0, 2) || [];

    return `
      <div class="hero-photo" id="home-hero" data-recipe="${featured.recipe_id || ''}">
        <img src="${Utils.imgWithFallback(featured.image)}" alt="${featured.recipe_name || ''}"
          onerror="this.src='assets/images/meals/placeholder.jpg'">
        <div class="hero-photo-overlay"></div>

        <div class="hero-tags">
          ${tags.map(t => `<span class="hero-tag">${_tagLabel(t)}</span>`).join('')}
        </div>

        <button class="hero-heart heart-btn ${isFav ? 'is-fav' : ''}"
          id="home-fav-btn" data-recipe="${featured.recipe_id}" aria-label="Favorito">
          <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <div class="heart-particles">
            <div class="heart-particle p1"></div>
            <div class="heart-particle p2"></div>
            <div class="heart-particle p3"></div>
            <div class="heart-particle p4"></div>
          </div>
        </button>

        <div class="hero-photo-content">
          <div class="hero-photo-eyebrow">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
            </svg>
            PLAN PARA HOY
          </div>
          <div class="hero-photo-title">${featured.recipe_name || ''}</div>
          ${featured.recipe ? `
          <div class="hero-photo-meta">
            <span>⏱ ${featured.recipe.time_minutes} min</span>
            <span>👥 ${featured.recipe.servings} raciones</span>
          </div>` : ''}
        </div>
      </div>
    `;
  }

  function _renderTodayCard(todayMenu) {
    if (!todayMenu) {
      return `<div class="today-card" style="padding:var(--sp-lg);text-align:center;margin:0 var(--sp-lg);">
        <p class="text-muted">No hay menú para hoy</p>
      </div>`;
    }

    const meals = [
      { key: 'breakfast', label: 'DESAYUNO', icon: '🌅', type: 'breakfast' },
      { key: 'lunch',     label: 'COMIDA',   icon: '☀️',  type: 'lunch' },
      { key: 'dinner',    label: 'CENA',     icon: '🌙', type: 'dinner' },
    ];

    return `
      <div class="today-card stagger-item">
        <div class="today-card-header">
          <div style="display:flex;align-items:center;gap:8px;font-weight:600;font-size:15px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--c-primary)" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Resumen de hoy
          </div>
          <span class="text-muted" style="font-size:13px;">3 comidas</span>
        </div>
        <div class="today-card-meals">
          ${meals.map(m => {
            const meal = todayMenu[m.key];
            const name = meal?.simple_description || meal?.recipe_name || '—';
            return `
              <div class="today-meal-col" data-recipe="${meal?.recipe_id || ''}" data-meal="${m.key}">
                <div class="today-meal-icon ${m.type}">${m.icon}</div>
                <div class="today-meal-type">${m.label}</div>
                <div class="today-meal-name">${name}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function _renderWaterCard(prog) {
    return `
      <div class="water-card stagger-item">
        <div class="water-card-header">
          <div class="water-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--c-water)" stroke="none">
              <path d="M12 2C12 2 5 9.5 5 14a7 7 0 0 0 14 0C19 9.5 12 2 12 2z"/>
            </svg>
            Agua
          </div>
          <div class="water-card-amount">${prog.current_l} / ${prog.goal_l} litros</div>
        </div>
        <div class="progress-bar" style="margin-bottom:12px;">
          <div class="progress-bar-fill water ${prog.reached ? 'complete' : ''}"
            style="width:${prog.percentage}%"></div>
        </div>
        <div class="water-btns">
          <button class="water-btn" onclick="ScreenHome.addWater(250)">+ 250 ml</button>
          <button class="water-btn" onclick="ScreenHome.addWater(500)">+ 500 ml</button>
          <button class="water-btn bottle-btn" onclick="ScreenHome.addWater(1000)">+ 1 litro</button>
        </div>
      </div>
    `;
  }

  function _renderStatCard(icon, title, number, unit, tab, subText, subType) {
    return `
      <div class="stat-card stagger-item" onclick="Router.navigate('hogar', {tab:'${tab}'})">
        <div style="font-size:24px;margin-bottom:4px;">${icon}</div>
        <div class="stat-card-number">${number}</div>
        <div class="stat-card-label">${unit}</div>
        <div class="stat-card-label" style="font-weight:600;color:var(--c-text-secondary);margin-top:2px;">${title}</div>
        <div class="stat-card-sub ${subType}">${subText}</div>
      </div>
    `;
  }

  function _renderSpecialCard(recipe) {
    return `
      <div class="special-card stagger-item" id="home-special-card" data-recipe="${recipe.id}">
        <img class="special-card-photo"
          src="${Utils.imgWithFallback(recipe.image)}"
          alt="${recipe.name}"
          onerror="this.src='assets/images/meals/placeholder.jpg'">
        <div class="special-card-body">
          <div class="special-card-eyebrow">ESPECIAL DE LA SEMANA ——</div>
          <div class="special-card-title">${recipe.name}</div>
          <div class="special-card-sub">${recipe.description || ''}</div>
          <button class="special-card-btn">Ver receta</button>
        </div>
      </div>
    `;
  }

  function _tagLabel(tag) {
    const map = { airfryer: '✈ Airfryer', temporada: '🌿 Temporada', mediterranea: '🫒 Med.' };
    return map[tag] || tag;
  }

  /* ── Eventos ─────────────────────────────────────────────── */
  function _bindEvents(container) {
    // Hero → abrir receta
    container.querySelector('#home-hero')?.addEventListener('click', e => {
      if (e.target.closest('.hero-heart')) return;
      const recipeId = e.currentTarget.dataset.recipe;
      if (recipeId) Router.openSheet('recipe-detail', { recipe_id: recipeId });
    });

    // Favorito
    container.querySelector('#home-fav-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      const recipeId = e.currentTarget.dataset.recipe;
      const isFav    = Ratings.toggleFavorite(recipeId);
      e.currentTarget.classList.toggle('is-fav', isFav);
      e.currentTarget.classList.add('animating');
      setTimeout(() => e.currentTarget.classList.remove('animating'), 400);
      Notifications.toastSuccess(isFav ? '❤️ Añadida a favoritas' : 'Eliminada de favoritas');
    });

    // Comidas del día → abrir receta
    container.querySelectorAll('.today-meal-col').forEach(col => {
      col.addEventListener('click', () => {
        const recipeId = col.dataset.recipe;
        if (recipeId) Router.openSheet('recipe-detail', { recipe_id: recipeId });
        else Router.navigate('plan');
      });
    });

    // Especial semanal
    container.querySelector('#home-special-card')?.addEventListener('click', e => {
      const recipeId = e.currentTarget.dataset.recipe;
      if (recipeId) Router.openSheet('recipe-detail', { recipe_id: recipeId });
    });
  }

  /* ── Acción agua (llamada inline) ───────────────────────── */
  function addWater(ml) {
    const result = Water.addEntry(ml);
    if (result.justReached) {
      Notifications.toastSuccess('🎉 ¡Objetivo de agua conseguido!');
    } else {
      Notifications.toastInfo(`💧 +${Utils.formatLiters(ml)} — Total: ${Utils.formatLiters(result.newTotal)}`);
    }
    // Re-renderizar solo la card de agua
    const prog     = Water.getTodayProgress();
    const fill     = document.querySelector('.water-card .progress-bar-fill');
    const amount   = document.querySelector('.water-card-amount');
    if (fill)   fill.style.width = `${prog.percentage}%`;
    if (amount) amount.textContent = `${prog.current_l} / ${prog.goal_l} litros`;
    Utils.haptic('light');
  }

  function teardown() { /* Sin listeners globales que limpiar */ }

  return { render, teardown, addWater };
})();

window.ScreenHome = ScreenHome;
