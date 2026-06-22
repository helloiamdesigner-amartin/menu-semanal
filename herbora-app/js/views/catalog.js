/* =============================================================
   Herbora Sales App — Vista: Catálogo
   Búsqueda, filtros dinámicos, vista grid/lista.
   REGLA: sin listas hardcodeadas. Todo del catálogo.
   ============================================================= */

import { Catalog } from '../data/catalog.js';
import { Filters } from '../components/filters.js';
import { Store }   from '../data/store.js';
import { showNavbar } from '../components/navbar.js';
import { createProductCard, createProductListItem, createSkeletonCards } from '../components/product-card.js';
import { EmptyStates } from '../components/empty-state.js';
import { normalize } from '../utils/format.js';

let _viewMode     = 'grid';  // 'grid' | 'list'
let _searchTerm   = '';
let _activeFilters = { brands: [], lines: [], formats: [], badges: [] };
let _debounceTimer = null;

export function renderCatalog(route = {}) {
  const screen = document.getElementById('screen-catalog');
  showNavbar(true);

  /* Leer parámetros de la URL */
  const presetBrand = route.query?.brand || null;
  const presetSearch = route.query?.search || '';

  if (presetBrand) {
    _activeFilters.brands = [presetBrand];
  } else {
    _activeFilters.brands = [];
  }
  _searchTerm = presetSearch;

  screen.innerHTML = `
    <!-- Cabecera sticky con buscador -->
    <div class="catalog-header">
      <div class="catalog-search-row">
        <div class="search-wrap" style="flex:1;" id="search-container">
          <span class="search-icon">🔍</span>
          <input
            class="input"
            type="search"
            id="catalog-search"
            placeholder="Buscar producto, REF o EAN…"
            value="${presetSearch}"
            autocomplete="off"
            inputmode="search"
          >
          <div class="search-clear" id="search-clear">✕</div>
        </div>
        <button class="btn btn-icon btn-icon-secondary" id="btn-filters" aria-label="Filtros" style="flex-shrink:0;width:44px;height:44px;">
          ⊟<span id="filter-count" style="display:none;margin-left:2px;font-size:10px;"></span>
        </button>
      </div>
    </div>

    <!-- Chips de marcas (scroll horizontal, dinámico) -->
    <div class="catalog-filters-bar">
      <div class="chips-row" id="brand-chips"></div>
    </div>

    <!-- Meta: contador + toggle vista -->
    <div class="catalog-meta-row">
      <span class="catalog-count" id="catalog-count">Cargando…</span>
      <div class="view-toggle">
        <button class="view-toggle-btn${_viewMode === 'grid' ? ' active' : ''}" id="btn-grid" aria-label="Vista cuadrícula">⊞</button>
        <button class="view-toggle-btn${_viewMode === 'list' ? ' active' : ''}" id="btn-list" aria-label="Vista lista">≡</button>
      </div>
    </div>

    <!-- Contenedor de productos -->
    <div id="catalog-products"></div>
  `;

  /* Inicializar filtros */
  Filters.init(() => {
    _activeFilters = Filters.getActive();
    _render();
    _updateFilterBadge();
  });

  /* Render inicial */
  _render();

  /* Chips de marcas: generadas dinámicamente del catálogo */
  const filters = Catalog.getFilters();
  const chipsRow = screen.querySelector('#brand-chips');
  if (chipsRow && filters.brands) {
    Filters.renderBrandChips(chipsRow, filters.brands, _activeFilters.brands);
  }

  /* Buscador con debounce */
  const searchInput = screen.querySelector('#catalog-search');
  const searchClear = screen.querySelector('#search-clear');
  const searchWrap  = screen.querySelector('#search-container');

  searchInput?.addEventListener('input', e => {
    _searchTerm = e.target.value;
    searchWrap.classList.toggle('has-value', !!_searchTerm);
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => _render(), 250);
  });

  searchClear?.addEventListener('click', () => {
    searchInput.value = '';
    _searchTerm = '';
    searchWrap.classList.remove('has-value');
    _render();
    searchInput.focus();
  });

  if (presetSearch) searchWrap.classList.add('has-value');

  /* Botón filtros */
  screen.querySelector('#btn-filters')?.addEventListener('click', () => {
    Filters.openPanel(filters);
  });

  /* Toggle vista */
  screen.querySelector('#btn-grid')?.addEventListener('click', () => {
    _viewMode = 'grid';
    screen.querySelector('#btn-grid').classList.add('active');
    screen.querySelector('#btn-list').classList.remove('active');
    _render();
  });

  screen.querySelector('#btn-list')?.addEventListener('click', () => {
    _viewMode = 'list';
    screen.querySelector('#btn-list').classList.add('active');
    screen.querySelector('#btn-grid').classList.remove('active');
    _render();
  });

  /* Refrescar si el catálogo se actualiza en background */
  window.addEventListener('catalog:updated', () => _render(), { once: true });
}

function _render() {
  const productsEl = document.querySelector('#catalog-products');
  const countEl    = document.querySelector('#catalog-count');
  if (!productsEl) return;

  /* Mostrar skeletons mientras se busca */
  productsEl.className = _viewMode === 'grid' ? 'catalog-grid' : 'catalog-list';

  /* Obtener productos filtrados */
  let products = _searchTerm
    ? Catalog.search(_searchTerm)
    : Catalog.filter(_activeFilters);

  /* Si hay búsqueda Y filtros activos: aplicar filtros sobre el resultado de búsqueda */
  if (_searchTerm && Filters.hasActive()) {
    const { brands, lines, formats, badges } = _activeFilters;
    if (brands.length)  products = products.filter(p => brands.includes(p.brand));
    if (lines.length)   products = products.filter(p => lines.includes(p.line));
    if (formats.length) products = products.filter(p => formats.includes(p.format));
    if (badges.length)  products = products.filter(p =>
      badges.some(b => (p.badges || []).includes(b))
    );
  }

  /* Contador */
  if (countEl) {
    countEl.textContent = `${products.length} producto${products.length !== 1 ? 's' : ''}`;
  }

  /* Vacío */
  if (products.length === 0) {
    productsEl.innerHTML = '';
    productsEl.appendChild(EmptyStates.noProducts(() => {
      _searchTerm = '';
      Filters.clear();
      _activeFilters = { brands: [], lines: [], formats: [], badges: [] };
      const inp = document.querySelector('#catalog-search');
      if (inp) { inp.value = ''; }
      _render();
    }));
    return;
  }

  /* Renderizar tarjetas */
  const frag = document.createDocumentFragment();
  const isCommercial = Store.isCommercial();

  products.forEach(product => {
    const card = _viewMode === 'grid'
      ? createProductCard(product, { showAddBtn: true })
      : createProductListItem(product);
    frag.appendChild(card);
  });

  productsEl.innerHTML = '';
  productsEl.appendChild(frag);
}

function _updateFilterBadge() {
  const countEl = document.querySelector('#filter-count');
  const btnFilters = document.querySelector('#btn-filters');
  if (!countEl || !btnFilters) return;
  const count = Filters.countActive();
  if (count > 0) {
    countEl.textContent = count;
    countEl.style.display = '';
    btnFilters.style.background = 'var(--color-accent)';
  } else {
    countEl.style.display = 'none';
    btnFilters.style.background = '';
  }
}
