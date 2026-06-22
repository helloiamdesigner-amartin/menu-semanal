/* =========================================================
   CASITA — Screen: Recipes (Recetas)
   Grid de recetas con chips filtro y búsqueda
   ========================================================= */

const ScreenRecipes = (() => {

  let _activeFilter = 'todas';
  let _searchQuery  = '';

  const FILTERS = [
    { id: 'todas',     label: 'Todas' },
    { id: 'airfryer',  label: 'Airfryer' },
    { id: 'temporada', label: 'Temporada' },
    { id: 'favoritas', label: 'Favoritas ❤️' },
    { id: 'rapido',    label: 'Rápidas (<20 min)' },
  ];

  function render(params = {}) {
    if (params.filter) _activeFilter = params.filter;

    const container = Utils.el('screen-recipes');
    if (!container) return;

    container.innerHTML = `
      <!-- Header -->
      <div class="page-header">
        <div class="page-header-title">
          <h1>Recetas</h1>
          <p>Descubre ideas deliciosas para cada día</p>
        </div>
        <button class="page-header-action" id="recipes-search-btn"
          style="width:42px;height:42px;border:1.5px solid var(--c-border);border-radius:var(--r-md);background:var(--c-white);cursor:pointer;display:flex;align-items:center;justify-content:center;"
          aria-label="Buscar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--c-text-secondary)" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </div>

      <!-- Búsqueda (oculta por defecto) -->
      <div id="recipes-search-wrap" class="recipes-search" style="display:none;">
        <div class="search-input-wrap">
          <div class="search-icon">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <input type="search" id="recipes-search-input" placeholder="Buscar recetas..." autocomplete="off" autocorrect="off">
        </div>
      </div>

      <!-- Chips de filtro -->
      <div class="chips-row" style="padding-bottom:var(--sp-md);">
        ${FILTERS.map(f => `
          <button class="chip ${_activeFilter === f.id ? 'active' : ''} ${f.id === 'favoritas' ? 'fav-chip' : ''}"
            data-filter="${f.id}">${f.label}</button>
        `).join('')}
      </div>

      <!-- Grid de recetas -->
      <div id="recipes-grid-wrap" style="padding:0 var(--sp-lg) var(--sp-xl);">
        ${_renderGrid()}
      </div>
    `;

    _bindEvents(container);
  }

  function _getFilteredRecipes() {
    const recipes  = window.CasitaData?.recipes || [];
    const favs     = new Set(Ratings.getFavorites());
    const season   = Utils.currentSeason();

    let filtered = [...recipes];

    // Búsqueda
    if (_searchQuery) {
      const q = _searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.tags?.some(t => t.includes(q)) ||
        r.category?.includes(q)
      );
    }

    // Filtro activo
    switch (_activeFilter) {
      case 'airfryer':
        filtered = filtered.filter(r => r.cooking_device === 'airfryer' || r.tags?.includes('airfryer'));
        break;
      case 'temporada':
        filtered = filtered.filter(r => r.season?.includes(season));
        break;
      case 'favoritas':
        filtered = filtered.filter(r => favs.has(r.id));
        break;
      case 'rapido':
        filtered = filtered.filter(r => r.time_minutes <= 20);
        break;
      default:
        break;
    }

    return filtered;
  }

  function _renderGrid() {
    const recipes  = _getFilteredRecipes();
    const favs     = new Set(Ratings.getFavorites());

    if (!recipes.length) {
      return `<div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">Sin resultados</div>
        <div class="empty-state-desc">Prueba con otro filtro o búsqueda</div>
      </div>`;
    }

    // Primera receta → featured card (full width)
    const [first, ...rest] = recipes;

    return `
      <!-- Featured -->
      ${_renderFeaturedCard(first, favs.has(first.id))}

      <!-- Grid 2 columnas -->
      <div class="recipe-grid" style="margin-top:var(--sp-md);">
        ${rest.map((r, i) => _renderCard(r, favs.has(r.id), i)).join('')}
      </div>
    `;
  }

  function _renderFeaturedCard(recipe, isFav) {
    const avg = Ratings.getAverageScore(recipe.id);
    const tags = recipe.tags?.slice(0, 2) || [];

    return `
      <div class="recipe-card-featured stagger-item" data-recipe="${recipe.id}">
        <div class="recipe-card-photo-wrap" style="position:relative;">
          <img class="recipe-card-photo" style="aspect-ratio:16/9;"
            src="${Utils.imgWithFallback(recipe.image)}" alt="${recipe.name}"
            onerror="this.src='assets/images/meals/placeholder.jpg'">
          <div class="hero-tags" style="top:10px;left:10px;">
            ${tags.map(t => `<span class="hero-tag">${t}</span>`).join('')}
          </div>
          <button class="hero-heart heart-btn ${isFav ? 'is-fav' : ''}"
            style="top:10px;right:10px;" data-recipe="${recipe.id}" aria-label="Favorito">
            <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
        <div class="recipe-card-body">
          <div class="recipe-card-name" style="font-size:16px;">${recipe.name}</div>
          <div class="recipe-card-rating">
            <div class="stars">${Utils.renderStars(avg ? Math.round(avg) : 0)}</div>
            ${avg ? `<span>${avg}</span>` : '<span class="text-muted" style="font-size:11px;">Sin valorar</span>'}
            <span class="text-muted">· ${recipe.time_minutes} min</span>
          </div>
        </div>
      </div>
    `;
  }

  function _renderCard(recipe, isFav, index) {
    const avg  = Ratings.getAverageScore(recipe.id);
    const tag  = recipe.tags?.find(t => ['airfryer', 'temporada', 'especial'].includes(t));

    return `
      <div class="recipe-card stagger-item" data-recipe="${recipe.id}"
        style="animation-delay:${(index + 1) * 50}ms">
        <div class="recipe-card-photo-wrap" style="position:relative;">
          <img class="recipe-card-photo"
            src="${Utils.imgWithFallback(recipe.image)}" alt="${recipe.name}"
            onerror="this.src='assets/images/meals/placeholder.jpg'">
          ${tag ? `<div style="position:absolute;top:6px;left:6px;">
            <span class="hero-tag" style="font-size:10px;">${tag.charAt(0).toUpperCase() + tag.slice(1)}</span>
          </div>` : ''}
          <button class="heart-btn ${isFav ? 'is-fav' : ''}"
            style="position:absolute;top:6px;right:6px;width:32px;height:32px;background:rgba(255,255,255,0.9);border-radius:50%;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;"
            data-recipe="${recipe.id}" aria-label="Favorito">
            <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="${isFav ? 'var(--c-secondary)' : 'none'}">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
        <div class="recipe-card-body">
          <div class="recipe-card-name">${recipe.name}</div>
          <div class="recipe-card-meta">⏱ ${recipe.time_minutes} min</div>
          <div class="recipe-card-rating">
            <div class="stars">${Utils.renderStars(avg ? Math.round(avg) : 0)}</div>
            ${avg ? `<span>${avg}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /* ── Eventos ─────────────────────────────────────────────── */
  function _bindEvents(container) {
    // Chips filtro
    container.querySelectorAll('.chip[data-filter]').forEach(chip => {
      chip.addEventListener('click', () => {
        _activeFilter = chip.dataset.filter;
        _searchQuery  = '';
        render();
      });
    });

    // Abrir búsqueda
    Utils.el('recipes-search-btn')?.addEventListener('click', () => {
      const wrap  = Utils.el('recipes-search-wrap');
      const input = Utils.el('recipes-search-input');
      if (!wrap) return;
      const isOpen = wrap.style.display !== 'none';
      wrap.style.display = isOpen ? 'none' : 'block';
      if (!isOpen) input?.focus();
    });

    // Input de búsqueda
    Utils.el('recipes-search-input')?.addEventListener('input', Utils.debounce(e => {
      _searchQuery = e.target.value;
      const gridWrap = Utils.el('recipes-grid-wrap');
      if (gridWrap) gridWrap.innerHTML = _renderGrid();
      _bindGridEvents(container);
    }, 200));

    _bindGridEvents(container);
  }

  function _bindGridEvents(container) {
    // Click en tarjeta receta
    container.querySelectorAll('[data-recipe]').forEach(card => {
      if (card.classList.contains('heart-btn')) return;
      card.addEventListener('click', e => {
        if (e.target.closest('.heart-btn')) return;
        const recipeId = card.dataset.recipe;
        if (recipeId) Router.openSheet('recipe-detail', { recipe_id: recipeId });
      });
    });

    // Corazón favorito
    container.querySelectorAll('.heart-btn[data-recipe]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const recipeId = btn.dataset.recipe;
        const isFav    = Ratings.toggleFavorite(recipeId);
        btn.classList.toggle('is-fav', isFav);
        const svg = btn.querySelector('svg');
        if (svg) svg.setAttribute('fill', isFav ? 'var(--c-secondary)' : 'none');
        btn.classList.add('animating');
        setTimeout(() => btn.classList.remove('animating'), 400);
        Utils.haptic('medium');
      });
    });
  }

  function teardown() {
    _searchQuery = '';
  }

  return { render, teardown };
})();

window.ScreenRecipes = ScreenRecipes;
