/* =============================================================
   Herbora Sales App — Vista: Dashboard
   ============================================================= */

import { Store }   from '../data/store.js';
import { Catalog } from '../data/catalog.js';
import { Router }  from '../router/router.js';
import { showNavbar } from '../components/navbar.js';
import { formatDateShort, previewProducts } from '../utils/format.js';
import { DB } from '../data/db.js';

export async function renderDashboard() {
  const screen = document.getElementById('screen-dashboard');
  showNavbar(true);

  const isCommercial = Store.isCommercial();
  const stats        = Catalog.getStats();
  const filters      = Catalog.getFilters();
  const order        = Store.getOrder();
  const recentOrders = (await DB.getOrders()).slice(0, 1);
  const lastOrder    = recentOrders[0];
  const modeLabel    = isCommercial ? 'Modo comercial' : 'Catálogo Herbora';

  screen.innerHTML = `
    <div class="dashboard-header">
      <div class="dashboard-header__app">herbora</div>
      <div class="dashboard-header__mode">${modeLabel}</div>
      <div class="dashboard-header__stats">${stats.active} productos · ${stats.brands} marcas</div>
    </div>

    <div class="dashboard-body">

      <!-- Acceso rápido -->
      <div>
        <div class="section-label">Acceso rápido</div>
        <div class="quick-grid">
          <div class="quick-card" id="qc-catalog">
            <div class="quick-card__icon">⊞</div>
            <div class="quick-card__title">Catálogo</div>
            <div class="quick-card__sub">${stats.active} productos</div>
          </div>
          <div class="quick-card accent" id="qc-order">
            <div class="quick-card__icon">◎</div>
            <div class="quick-card__title">${isCommercial ? 'Pedido rápido' : 'Mi pedido'}</div>
            <div class="quick-card__sub">${order.length > 0 ? `${order.length} referencias` : 'Vacío'}</div>
          </div>
          <div class="quick-card" id="qc-favorites">
            <div class="quick-card__icon">♡</div>
            <div class="quick-card__title">Favoritos</div>
            <div class="quick-card__sub">${Store.getFavorites().size} guardados</div>
          </div>
          ${isCommercial ? `
          <div class="quick-card" id="qc-history">
            <div class="quick-card__icon">📋</div>
            <div class="quick-card__title">Historial</div>
            <div class="quick-card__sub">Mis pedidos</div>
          </div>` : `
          <div class="quick-card" id="qc-compare">
            <div class="quick-card__icon">⚖️</div>
            <div class="quick-card__title">Comparador</div>
            <div class="quick-card__sub">Hasta 3 productos</div>
          </div>`}
        </div>
      </div>

      <!-- Marcas (generadas dinámicamente del catálogo) -->
      <div>
        <div class="section-label">Explorar por marca</div>
        <div class="brands-scroll" id="brands-row"></div>
      </div>

      <!-- Último pedido -->
      ${lastOrder ? `
      <div>
        <div class="section-label">Último pedido</div>
        <div class="last-order-card" id="last-order">
          <div>
            <div style="font-size:14px;font-weight:600;color:var(--color-text);">${formatDateShort(lastOrder.createdAt)}</div>
            <div style="font-size:12px;color:var(--color-text-sec);margin-top:2px;">${lastOrder.items?.length || 0} referencias · ${previewProducts(lastOrder.items)}</div>
          </div>
          <span style="color:var(--color-primary);font-size:14px;">Ver →</span>
        </div>
      </div>` : ''}

    </div>
  `;

  /* Quick cards */
  screen.querySelector('#qc-catalog')?.addEventListener('click',   () => Router.push('/catalogo'));
  screen.querySelector('#qc-order')?.addEventListener('click',     () => Router.push('/pedido'));
  screen.querySelector('#qc-favorites')?.addEventListener('click', () => Router.push('/favoritos'));
  screen.querySelector('#qc-history')?.addEventListener('click',   () => Router.push('/historial'));
  screen.querySelector('#qc-compare')?.addEventListener('click',   () => Router.push('/comparador'));
  screen.querySelector('#last-order')?.addEventListener('click', () => {
    if (lastOrder) Router.push(`/historial/${lastOrder.id}`);
  });

  /* Marcas: generadas dinámicamente del catálogo, sin hardcodear */
  const brandsRow = screen.querySelector('#brands-row');
  if (brandsRow && filters.brands) {
    filters.brands.forEach(brand => {
      const chip = document.createElement('button');
      chip.className = 'brand-chip';
      chip.textContent = brand;
      chip.addEventListener('click', () => Router.push(`/catalogo?brand=${encodeURIComponent(brand)}`));
      brandsRow.appendChild(chip);
    });
  }
}
