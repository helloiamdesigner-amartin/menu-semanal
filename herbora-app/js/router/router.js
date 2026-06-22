/* =============================================================
   Herbora Sales App — Router SPA (hash-based)
   Compatible con GitHub Pages. Todas las rutas son /#/...
   ============================================================= */

const _routes = {};
let _currentRoute = null;
let _beforeEach = null;
let _afterEach = null;

export const Router = {

  /* Registrar una ruta */
  on(path, handler) {
    _routes[path] = handler;
    return this;
  },

  /* Guard global: se ejecuta antes de cada navegación */
  beforeEach(fn) { _beforeEach = fn; return this; },
  afterEach(fn)  { _afterEach  = fn; return this; },

  /* Navegar a una ruta */
  push(path) {
    window.location.hash = path.startsWith('/') ? path : '/' + path;
  },

  replace(path) {
    const base = window.location.href.split('#')[0];
    window.history.replaceState(null, '', base + '#' + (path.startsWith('/') ? path : '/' + path));
    this._resolve();
  },

  /* Navegar atrás */
  back() { window.history.back(); },

  /* Ruta actual */
  current() { return _currentRoute; },

  /* Inicializar: escuchar cambios de hash */
  init() {
    window.addEventListener('hashchange', () => this._resolve());
    this._resolve();
  },

  /* Resolver la ruta actual */
  _resolve() {
    const hash = window.location.hash.slice(1) || '/';
    const [pathRaw, queryStr] = hash.split('?');
    const path = pathRaw || '/';

    /* Parsear query string */
    const params = {};
    if (queryStr) {
      queryStr.split('&').forEach(pair => {
        const [k, v] = pair.split('=');
        if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }

    /* Encontrar handler: primero exacto, luego patrones */
    let handler = null;
    let routeParams = {};

    for (const [pattern, fn] of Object.entries(_routes)) {
      const match = _matchRoute(pattern, path);
      if (match !== null) {
        handler = fn;
        routeParams = match;
        break;
      }
    }

    if (!handler) {
      /* Ruta no encontrada → inicio */
      console.warn(`[Router] Ruta no encontrada: ${path} → redirigiendo a /`);
      this.replace('/');
      return;
    }

    const route = { path, params: routeParams, query: params };

    /* Guard global */
    if (_beforeEach) {
      const result = _beforeEach(route, _currentRoute);
      if (result === false) return;
      if (typeof result === 'string') {
        this.replace(result);
        return;
      }
    }

    _currentRoute = route;
    handler(route);

    if (_afterEach) _afterEach(route);
  },
};

/* ── Matching de rutas con parámetros (:id) ─────────────── */
function _matchRoute(pattern, path) {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts    = path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}
