/* =========================================================
   CASITA — Router
   SPA navigation: hash routing, bottom sheets, transiciones
   ========================================================= */

const Router = (() => {

  let _current     = 'home';
  let _previous    = null;
  let _params      = {};
  let _screenStack = [];
  let _activeSheet = null;
  let _initialized = false;

  const SCREENS = ['home', 'plan', 'shopping', 'recipes', 'hogar', 'onboarding'];
  const SHEETS  = ['recipe-detail', 'batch-detail', 'rate-recipe', 'add-pantry-item', 'add-freezer-item', 'day-detail'];

  /* Mapa screen → módulo de renderizado */
  const SCREEN_MODULES = {
    home:       () => window.ScreenHome,
    plan:       () => window.ScreenPlan,
    shopping:   () => window.ScreenShopping,
    recipes:    () => window.ScreenRecipes,
    hogar:      () => window.ScreenHogar,
    onboarding: () => window.ScreenOnboarding,
  };

  const SHEET_MODULES = {
    'recipe-detail':  () => window.ScreenRecipeDetail,
    'batch-detail':   () => window.ScreenBatchDetail,
    'rate-recipe':    () => window.ScreenRateRecipe,
  };

  /* ── Inicialización ──────────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    // Escuchar popstate (botón atrás del navegador)
    window.addEventListener('popstate', _handlePopState);

    // Leer pantalla desde URL si viene de shortcut
    const urlParams = new URLSearchParams(window.location.search);
    const urlScreen = urlParams.get('screen');

    // Leer hash
    const hashScreen = window.location.hash.replace('#', '') || null;

    const startScreen = urlScreen || hashScreen || 'home';
    navigate(SCREENS.includes(startScreen) ? startScreen : 'home', {}, { replace: true });
  }

  /* ── Navegación principal ────────────────────────────────── */
  function navigate(screenId, params = {}, options = {}) {
    if (!SCREENS.includes(screenId)) {
      console.warn('[Router] Pantalla desconocida:', screenId);
      return;
    }

    // Cerrar sheet si hay uno abierto
    if (_activeSheet) closeSheet();

    // Teardown pantalla actual
    const currentModule = SCREEN_MODULES[_current]?.();
    if (currentModule?.teardown) currentModule.teardown();

    // Actualizar estado
    _previous    = _current;
    _current     = screenId;
    _params      = params;

    if (screenId !== _previous) {
      _screenStack.push(screenId);
      if (_screenStack.length > 10) _screenStack.shift();
    }

    // Actualizar URL (hash routing para GitHub Pages)
    const newHash = `#${screenId}`;
    if (options.replace) {
      history.replaceState({ screen: screenId, params }, '', newHash);
    } else {
      history.pushState({ screen: screenId, params }, '', newHash);
    }

    // Actualizar tab bar
    _updateTabBar(screenId);

    // Mostrar pantalla
    _showScreen(screenId, params);

    // Scroll al top
    const container = document.getElementById('screen-container');
    if (container) container.scrollTop = 0;
  }

  function _handlePopState(event) {
    const screenId = event.state?.screen || 'home';
    const params   = event.state?.params || {};
    if (SCREENS.includes(screenId)) {
      _showScreen(screenId, params, true); // true = no pushState
      _updateTabBar(screenId);
      _current = screenId;
    }
  }

  function back() {
    if (_screenStack.length > 1) {
      _screenStack.pop();
      navigate(_screenStack[_screenStack.length - 1]);
    } else {
      navigate('home');
    }
  }

  function refresh() {
    const module = SCREEN_MODULES[_current]?.();
    if (module?.render) module.render(_params);
  }

  /* ── Mostrar pantalla ────────────────────────────────────── */
  function _showScreen(screenId, params = {}, fromPopState = false) {
    // Ocultar todas las pantallas
    SCREENS.forEach(id => {
      const el = document.getElementById(`screen-${id}`);
      if (el) {
        el.classList.remove('active', 'entering');
      }
    });

    // Mostrar pantalla objetivo
    const targetEl = document.getElementById(`screen-${screenId}`);
    if (targetEl) {
      targetEl.classList.add('active', 'entering');
      setTimeout(() => targetEl.classList.remove('entering'), 250);
    }

    // Renderizar contenido
    const module = SCREEN_MODULES[screenId]?.();
    if (module?.render) {
      module.render(params);
    }
  }

  /* ── Tab bar ─────────────────────────────────────────────── */
  function _updateTabBar(screenId) {
    document.querySelectorAll('.tab-item').forEach(tab => {
      const tabScreen = tab.dataset.tab;
      tab.classList.toggle('active', tabScreen === screenId);
    });
  }

  /* ── Bottom Sheets ───────────────────────────────────────── */
  function openSheet(sheetId, params = {}) {
    const sheetEl = document.getElementById(`sheet-${sheetId}`);
    if (!sheetEl) return;

    _activeSheet = sheetId;

    // Overlay
    const overlay = document.getElementById('sheet-overlay');
    if (overlay) {
      overlay.classList.add('active');
      overlay.onclick = closeSheet;
    }

    sheetEl.classList.add('open');

    // Renderizar contenido del sheet
    const module = SHEET_MODULES[sheetId]?.();
    if (module?.render) module.render(params);

    // Prevenir scroll del body
    document.getElementById('screen-container').style.overflow = 'hidden';
  }

  function closeSheet() {
    if (!_activeSheet) return;

    const sheetEl = document.getElementById(`sheet-${_activeSheet}`);
    if (sheetEl) sheetEl.classList.remove('open');

    const overlay = document.getElementById('sheet-overlay');
    if (overlay) overlay.classList.remove('active');

    const module = SHEET_MODULES[_activeSheet]?.();
    if (module?.teardown) module.teardown();

    _activeSheet = null;
    document.getElementById('screen-container').style.overflow = '';
  }

  /* ── Getters ─────────────────────────────────────────────── */
  function getCurrent()    { return _current; }
  function getPrevious()   { return _previous; }
  function getParams()     { return _params; }
  function getActiveSheet(){ return _activeSheet; }

  return {
    init, navigate, back, refresh,
    openSheet, closeSheet,
    getCurrent, getPrevious, getParams, getActiveSheet,
  };
})();

window.Router = Router;
