/* =============================================================
   Herbora Sales App — Módulo de catálogo
   Carga products.json, gestiona versiones, construye índices.
   REGLA: nunca hardcodear marcas, líneas, formatos ni badges.
   Todo se deriva dinámicamente del JSON.
   ============================================================= */

import { DB } from './db.js';
import { Toast } from '../components/toast.js';

/* URL base relativa (compatible con GitHub Pages) */
const BASE = './';
const VERSION_URL  = `${BASE}data/catalog-version.json`;
const PRODUCTS_URL = `${BASE}data/products.json`;
const VERSION_TIMEOUT_MS = 5000;

/* ── Estado interno del módulo ──────────────────────────── */
let _products    = [];   // productos activos (status !== draft, !== hidden, !== discontinued)
let _allProducts = [];   // TODOS los productos incluyendo discontinued/hidden
let _filters     = {};   // filtros derivados dinámicamente
let _searchIndex = [];   // índice de búsqueda

/* ── API pública ────────────────────────────────────────── */
export const Catalog = {

  /* Inicializar: cargar catálogo local y luego intentar actualizar */
  async init() {
    // 1. Intentar cargar de IndexedDB
    const cached = await DB.getCatalog();
    if (cached && cached.length > 0) {
      _index(cached);
    }

    // 2. Si no hay caché, cargar del bundle incluido en la app
    if (_allProducts.length === 0) {
      const bundled = await _fetchProducts(PRODUCTS_URL);
      if (bundled) {
        _index(bundled);
        const localVersion = await _getLocalVersion();
        await DB.setCatalog(bundled, localVersion || 'bundle');
      }
    }

    // 3. Intentar actualizar desde red (en background)
    _checkForUpdates().catch(() => {/* silent */});

    return _products.length > 0;
  },

  /* Todos los productos visibles en catálogo (active) */
  getProducts() { return _products; },

  /* Todos incluyendo discontinued (para historial) */
  getAllProducts() { return _allProducts; },

  /* Producto por ref (busca en todos) */
  getById(ref) {
    return _allProducts.find(p => p.ref === ref || p.id === ref) || null;
  },

  /* Búsqueda instantánea */
  search(query) {
    if (!query || query.trim().length === 0) return _products;
    const terms = query.toLowerCase().trim().split(/\s+/);
    return _searchIndex
      .filter(entry => terms.every(t => entry.text.includes(t)))
      .map(entry => entry.product)
      .filter(p => p.status === 'active' || !p.status);
  },

  /* Filtrar por criterios (todo dinámico, sin listas hardcodeadas) */
  filter({ brands = [], lines = [], formats = [], badges = [], showDiscontinued = false } = {}) {
    let list = showDiscontinued
      ? _allProducts.filter(p => p.status !== 'draft' && p.status !== 'hidden')
      : _products;

    if (brands.length)  list = list.filter(p => brands.includes(p.brand));
    if (lines.length)   list = list.filter(p => lines.includes(p.line));
    if (formats.length) list = list.filter(p => formats.includes(p.format));
    if (badges.length)  list = list.filter(p =>
      badges.some(b => (p.badges || []).includes(b))
    );
    return list;
  },

  /* Filtros disponibles derivados del catálogo actual */
  getFilters() { return _filters; },

  /* Estadísticas */
  getStats() {
    return {
      total:         _allProducts.filter(p => p.status !== 'draft').length,
      active:        _products.length,
      discontinued:  _allProducts.filter(p => p.status === 'discontinued').length,
      brands:        _filters.brands?.length || 0,
    };
  },
};

/* ── Indexar productos ──────────────────────────────────── */
function _index(rawProducts) {
  // Normalizar: si no tiene status, asumir active
  const normalized = rawProducts.map(p => ({
    ...p,
    status: p.status || 'active',
  }));

  _allProducts = normalized;

  // Productos visibles en catálogo público
  _products = normalized.filter(p =>
    p.status === 'active' || !p.status
  );

  // Construir filtros dinámicamente (sin hardcodear nada)
  _filters = _buildFilters(_products);

  // Construir índice de búsqueda
  _searchIndex = _allProducts.map(p => ({
    product: p,
    text: [
      p.name, p.brand, p.line, p.ref, p.ean13,
      p.presentation, p.format,
      ...(p.badges || []),
      p.main_ingredients, p.properties, p.indications,
    ].filter(Boolean).join(' ').toLowerCase()
  }));
}

function _buildFilters(products) {
  const set = key => [...new Set(products.map(p => p[key]).filter(Boolean))].sort();
  const badgeSet = [...new Set(products.flatMap(p => p.badges || []))];

  return {
    brands:  set('brand'),
    lines:   set('line'),
    formats: set('format'),
    badges:  badgeSet,
  };
}

/* ── Comprobar versión y actualizar ─────────────────────── */
async function _checkForUpdates() {
  if (!navigator.onLine) return;

  try {
    const remoteVersion = await _fetchVersion();
    if (!remoteVersion || remoteVersion === 'offline') return;

    const localVersion = await DB.getCatalogVersion();
    if (remoteVersion === localVersion) return;

    // Hay versión nueva: descargar catálogo
    const fresh = await _fetchProducts(`${PRODUCTS_URL}?v=${remoteVersion}`);
    if (!fresh || fresh.length === 0) return;

    await DB.setCatalog(fresh, remoteVersion);
    _index(fresh);

    Toast.show('Catálogo actualizado ✓', 'info');

    /* Notificar al SW para actualizar su caché */
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_PRODUCTS',
        url: `${PRODUCTS_URL}?v=${remoteVersion}`,
        version: remoteVersion,
      });
    }

    /* Disparar evento para que las vistas se refresquen */
    window.dispatchEvent(new CustomEvent('catalog:updated'));

  } catch { /* Sin conexión o error de red: continuar offline */ }
}

async function _fetchVersion() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VERSION_TIMEOUT_MS);
  try {
    const res = await fetch(`${VERSION_URL}?_=${Date.now()}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return data.version || null;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

async function _getLocalVersion() {
  try {
    const res = await fetch(VERSION_URL, { cache: 'force-cache' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.version || null;
  } catch { return null; }
}

async function _fetchProducts(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    /* El JSON puede tener { metadata, products: [...] } o ser directamente un array */
    const arr = Array.isArray(data) ? data : (data.products || []);
    return arr.length > 0 ? arr : null;
  } catch { return null; }
}
