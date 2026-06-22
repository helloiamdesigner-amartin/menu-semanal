/* =============================================================
   Herbora Sales App — Badges de catálogo
   TOP CONSUMO, TOP VOLUMEN, TOP FACTURACIÓN,
   BEST MARGEN, HERBORA SELECTION
   ============================================================= */

const BADGE_CLASSES = {
  'TOP CONSUMO':       'badge-top-consumo',
  'TOP VOLUMEN':       'badge-top-volumen',
  'TOP FACTURACIÓN':   'badge-top-factura',
  'BEST MARGEN':       'badge-best-margen',
  'HERBORA SELECTION': 'badge-herbora-sel',
};

/* Crear un elemento badge */
export function createBadge(label, extraClass = '') {
  const span = document.createElement('span');
  span.className = `badge ${BADGE_CLASSES[label] || ''} ${extraClass}`.trim();
  span.textContent = label;
  return span;
}

/* Crear todos los badges de un producto */
export function createBadges(product, maxVisible = 2) {
  const badges = (product.badges || []).slice(0, maxVisible);
  const frag = document.createDocumentFragment();
  badges.forEach(b => frag.appendChild(createBadge(b)));
  return frag;
}

/* HTML string de badges (para innerHTML) */
export function badgesHtml(product, maxVisible = 2) {
  return (product.badges || [])
    .slice(0, maxVisible)
    .map(b => `<span class="badge ${BADGE_CLASSES[b] || ''}">${b}</span>`)
    .join('');
}

/* Badge de descatalogado */
export function discontinuedBadge() {
  const span = document.createElement('span');
  span.className = 'badge badge-discontinued';
  span.textContent = 'Descatalogado';
  return span;
}
