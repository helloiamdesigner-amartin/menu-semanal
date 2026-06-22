/* =============================================================
   Herbora Sales App — Vista: Favoritos
   ============================================================= */

import { Store }   from '../data/store.js';
import { Catalog } from '../data/catalog.js';
import { Router }  from '../router/router.js';
import { showNavbar } from '../components/navbar.js';
import { createProductCard } from '../components/product-card.js';
import { EmptyStates } from '../components/empty-state.js';

export function renderFavorites() {
  const screen = document.getElementById('screen-favorites');
  showNavbar(true);

  const favRefs  = Store.getFavorites();
  const products = [...favRefs]
    .map(ref => Catalog.getById(ref))
    .filter(Boolean);

  screen.innerHTML = `
    <div class="screen-header">
      <h1>Favoritos</h1>
      <div class="subtitle">${products.length} producto${products.length !== 1 ? 's' : ''} guardado${products.length !== 1 ? 's' : ''}</div>
    </div>
    <div id="fav-grid" class="favorites-grid"></div>
  `;

  const grid = screen.querySelector('#fav-grid');

  if (products.length === 0) {
    grid.style.display = 'block';
    grid.appendChild(EmptyStates.noFavorites(() => Router.push('/catalogo')));
    return;
  }

  products.forEach(p => {
    grid.appendChild(createProductCard(p));
  });

  /* Refrescar si cambian los favoritos */
  const unsub = Store.on('favorites', () => {
    unsub();
    renderFavorites();
  });
}
