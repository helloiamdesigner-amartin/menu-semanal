/* =============================================================
   Herbora Sales App — Vista: Ficha de producto
   ============================================================= */

import { Catalog } from '../data/catalog.js';
import { Store }   from '../data/store.js';
import { showNavbar } from '../components/navbar.js';
import { renderProductSheet } from '../components/product-sheet.js';
import { EmptyStates } from '../components/empty-state.js';
import { Router } from '../router/router.js';

export function renderProduct(route) {
  const ref    = route?.params?.ref || '';
  const screen = document.getElementById('screen-product');
  showNavbar(true);

  /* Registrar visita reciente */
  if (ref) Store.addRecentlyViewed(ref);

  /* Buscar en catálogo (incluyendo discontinued y hidden para acceso directo) */
  const product = Catalog.getById(ref);

  if (!product || product.status === 'draft') {
    screen.innerHTML = '';
    screen.appendChild(EmptyStates.noProducts(() => Router.push('/catalogo')));
    return;
  }

  renderProductSheet(product, screen);
}
