/* =============================================================
   Herbora Sales App — Gestión de imágenes
   Carga con fallback a placeholder, lazy loading
   ============================================================= */

const PLACEHOLDER = './assets/images/placeholder-product.svg';

export const Image = {

  /* Obtener URL de imagen de un producto */
  getUrl(product) {
    if (!product) return PLACEHOLDER;
    if (product.image && typeof product.image === 'string') return product.image;
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    return PLACEHOLDER;
  },

  /* Crear elemento <img> con lazy loading y fallback */
  create(product, opts = {}) {
    const img = document.createElement('img');
    img.alt     = product?.name || 'Producto Herbora';
    img.loading = 'lazy';
    img.decoding = 'async';
    if (opts.className) img.className = opts.className;
    if (opts.width)     img.width  = opts.width;
    if (opts.height)    img.height = opts.height;

    this.setSrc(img, product);
    return img;
  },

  /* Asignar src con fallback automático */
  setSrc(imgEl, product) {
    const src = this.getUrl(product);

    imgEl.onerror = () => {
      imgEl.src    = PLACEHOLDER;
      imgEl.onerror = null; // evitar bucle
    };

    imgEl.src = src;
  },

  /* Actualizar imagen en un elemento existente */
  update(imgEl, product) {
    this.setSrc(imgEl, product);
  },

  /* Precargar imagen (sin bloquear) */
  preload(product) {
    const src = this.getUrl(product);
    if (src === PLACEHOLDER) return;
    const tmp = new window.Image();
    tmp.src = src;
  },
};
