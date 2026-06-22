/* =============================================================
   Herbora Sales App — Store (estado global reactivo)
   Sin framework externo. Sistema pub/sub simple.
   ============================================================= */

import { DB } from './db.js';

/* ── Estado inicial ─────────────────────────────────────── */
const _state = {
  userMode:       null,   // 'commercial' | 'consumer' | null
  currentOrder:   [],     // [{ ref, name, ean13, brand, line, presentation, quantity }]
  favorites:      new Set(),
  compareList:    [],     // hasta 3 refs
  recentlyViewed: [],     // últimas 20 refs visitadas
  isOnline:       navigator.onLine,
  catalogReady:   false,
};

/* ── Suscriptores ───────────────────────────────────────── */
const _listeners = {};

function _emit(event, data) {
  (_listeners[event] || []).forEach(fn => {
    try { fn(data); } catch { /* no propagar errores */ }
  });
}

/* ── API del Store ──────────────────────────────────────── */
export const Store = {

  /* ── Leer ────────────────────────────────────────────── */
  get(key) { return _state[key]; },
  getState() { return { ..._state }; },

  /* ── Suscribir ───────────────────────────────────────── */
  on(event, fn) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(fn);
    return () => { _listeners[event] = _listeners[event].filter(f => f !== fn); };
  },

  /* ── Inicializar desde persistencia ─────────────────── */
  async init() {
    _state.userMode       = await DB.getState('userMode');
    _state.currentOrder   = await DB.getCurrentOrder();
    _state.favorites      = await DB.getFavorites();
    _state.recentlyViewed = await DB.getRecentlyViewed();
    _state.compareList    = await DB.getCompareList();

    window.addEventListener('online',  () => { _state.isOnline = true;  _emit('online', true);  });
    window.addEventListener('offline', () => { _state.isOnline = false; _emit('online', false); });
  },

  /* ── Modo usuario ────────────────────────────────────── */
  async setUserMode(mode) {
    _state.userMode = mode;
    await DB.setState('userMode', mode);
    _emit('userMode', mode);
  },

  getUserMode() { return _state.userMode; },
  isCommercial() { return _state.userMode === 'commercial'; },

  /* ── Pedido actual ───────────────────────────────────── */
  getOrder() { return [..._state.currentOrder]; },

  getOrderCount() {
    return _state.currentOrder.reduce((sum, i) => sum + i.quantity, 0);
  },

  getOrderRefs() { return _state.currentOrder.length; },

  async addToOrder(product, qty = 1) {
    const existing = _state.currentOrder.find(i => i.ref === product.ref);
    if (existing) {
      existing.quantity += qty;
    } else {
      _state.currentOrder.push({
        ref:          product.ref,
        name:         product.name,
        ean13:        product.ean13,
        brand:        product.brand,
        line:         product.line,
        presentation: product.presentation,
        quantity:     qty,
      });
    }
    await DB.setCurrentOrder(_state.currentOrder);
    _emit('order', _state.currentOrder);
  },

  async updateQuantity(ref, qty) {
    const item = _state.currentOrder.find(i => i.ref === ref);
    if (!item) return;
    if (qty <= 0) {
      return this.removeFromOrder(ref);
    }
    item.quantity = qty;
    await DB.setCurrentOrder(_state.currentOrder);
    _emit('order', _state.currentOrder);
  },

  async removeFromOrder(ref) {
    _state.currentOrder = _state.currentOrder.filter(i => i.ref !== ref);
    await DB.setCurrentOrder(_state.currentOrder);
    _emit('order', _state.currentOrder);
  },

  async clearOrder() {
    _state.currentOrder = [];
    await DB.setCurrentOrder([]);
    _emit('order', []);
  },

  isInOrder(ref) {
    return _state.currentOrder.some(i => i.ref === ref);
  },

  getItemQty(ref) {
    const item = _state.currentOrder.find(i => i.ref === ref);
    return item ? item.quantity : 0;
  },

  /* ── Favoritos ───────────────────────────────────────── */
  async toggleFavorite(ref) {
    const isNow = await DB.toggleFavorite(ref);
    _state.favorites = await DB.getFavorites();
    _emit('favorites', _state.favorites);
    return isNow;
  },

  isFavorite(ref) { return _state.favorites.has(ref); },
  getFavorites() { return _state.favorites; },

  /* ── Recientemente vistos ────────────────────────────── */
  async addRecentlyViewed(ref) {
    _state.recentlyViewed = await DB.addRecentlyViewed(ref);
    _emit('recentlyViewed', _state.recentlyViewed);
  },

  getRecentlyViewed() { return [..._state.recentlyViewed]; },

  /* ── Comparador ──────────────────────────────────────── */
  async addToCompare(ref) {
    if (_state.compareList.includes(ref)) return;
    if (_state.compareList.length >= 3) {
      _state.compareList.shift(); // eliminar el primero si ya hay 3
    }
    _state.compareList.push(ref);
    await DB.setCompareList(_state.compareList);
    _emit('compare', _state.compareList);
  },

  async removeFromCompare(ref) {
    _state.compareList = _state.compareList.filter(r => r !== ref);
    await DB.setCompareList(_state.compareList);
    _emit('compare', _state.compareList);
  },

  async clearCompare() {
    _state.compareList = [];
    await DB.setCompareList([]);
    _emit('compare', []);
  },

  getCompareList() { return [..._state.compareList]; },
  isInCompare(ref) { return _state.compareList.includes(ref); },

  /* ── Online/offline ──────────────────────────────────── */
  isOnline() { return _state.isOnline; },
};
