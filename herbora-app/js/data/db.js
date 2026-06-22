/* =============================================================
   Herbora Sales App — IndexedDB
   Abstracción para favoritos, historial de pedidos y estado
   ============================================================= */

const DB_NAME    = 'HerboraDB';
const DB_VERSION = 1;

let _db = null;

export const DB = {
  /* ── INICIALIZAR ────────────────────────────────────────── */
  async init() {
    if (_db) return _db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = e => {
        const db = e.target.result;
        /* Favoritos: clave = ref del producto */
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'ref' });
        }
        /* Pedidos históricos */
        if (!db.objectStoreNames.contains('orders')) {
          const os = db.createObjectStore('orders', { keyPath: 'id' });
          os.createIndex('createdAt', 'createdAt', { unique: false });
        }
        /* Estado de la app (pares clave-valor) */
        if (!db.objectStoreNames.contains('app_state')) {
          db.createObjectStore('app_state', { keyPath: 'key' });
        }
        /* Caché del catálogo (productos normalizados) */
        if (!db.objectStoreNames.contains('catalog_cache')) {
          db.createObjectStore('catalog_cache', { keyPath: 'key' });
        }
      };

      req.onsuccess  = e => { _db = e.target.result; resolve(_db); };
      req.onerror    = e => reject(e.target.error);
    });
  },

  /* ── OPERACIONES GENÉRICAS ──────────────────────────────── */
  async get(store, key) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  },

  async getAll(store) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = () => reject(req.error);
    });
  },

  async put(store, value) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).put(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  },

  async delete(store, key) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).delete(key);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  },

  /* ── ESTADO DE APP ──────────────────────────────────────── */
  async getState(key) {
    const row = await this.get('app_state', key);
    return row ? row.value : null;
  },

  async setState(key, value) {
    await this.put('app_state', { key, value });
  },

  /* ── FAVORITOS ──────────────────────────────────────────── */
  async getFavorites() {
    const rows = await this.getAll('favorites');
    return new Set(rows.map(r => r.ref));
  },

  async toggleFavorite(ref) {
    const existing = await this.get('favorites', ref);
    if (existing) {
      await this.delete('favorites', ref);
      return false; // ya no es favorito
    } else {
      await this.put('favorites', { ref, addedAt: new Date().toISOString() });
      return true; // ahora es favorito
    }
  },

  async isFavorite(ref) {
    const row = await this.get('favorites', ref);
    return !!row;
  },

  /* ── HISTORIAL DE PEDIDOS ───────────────────────────────── */
  async saveOrder(order) {
    const id = `order_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    const record = { ...order, id, createdAt: new Date().toISOString() };
    await this.put('orders', record);
    return id;
  },

  async getOrders() {
    const all = await this.getAll('orders');
    return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getOrder(id) {
    return this.get('orders', id);
  },

  async deleteOrder(id) {
    await this.delete('orders', id);
  },

  async duplicateOrder(id) {
    const original = await this.getOrder(id);
    if (!original) throw new Error('Pedido no encontrado');
    const newOrder = {
      ...original,
      id: undefined,
      name: `Copia de ${original.name || original.createdAt.slice(0,10)}`,
    };
    return this.saveOrder(newOrder);
  },

  /* ── CACHÉ DEL CATÁLOGO ─────────────────────────────────── */
  async getCatalog() {
    const row = await this.get('catalog_cache', 'products');
    return row ? row.data : null;
  },

  async setCatalog(products, version) {
    await this.put('catalog_cache', {
      key: 'products',
      data: products,
      version,
      cachedAt: new Date().toISOString()
    });
  },

  async getCatalogVersion() {
    const row = await this.get('catalog_cache', 'products');
    return row ? row.version : null;
  },

  /* ── VISTOS RECIENTEMENTE ───────────────────────────────── */
  async addRecentlyViewed(ref, maxItems = 20) {
    let recent = (await this.getState('recentlyViewed')) || [];
    recent = [ref, ...recent.filter(r => r !== ref)].slice(0, maxItems);
    await this.setState('recentlyViewed', recent);
    return recent;
  },

  async getRecentlyViewed() {
    return (await this.getState('recentlyViewed')) || [];
  },

  /* ── PEDIDO ACTUAL (persiste entre sesiones) ─────────────── */
  async getCurrentOrder() {
    return (await this.getState('currentOrder')) || [];
  },

  async setCurrentOrder(items) {
    await this.setState('currentOrder', items);
  },

  /* ── LISTA COMPARADOR ───────────────────────────────────── */
  async getCompareList() {
    return (await this.getState('compareList')) || [];
  },

  async setCompareList(refs) {
    await this.setState('compareList', refs);
  },
};
