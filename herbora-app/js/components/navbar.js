/* =============================================================
   Herbora Sales App — Navbar (navegación inferior)
   ============================================================= */

import { Router }  from '../router/router.js';
import { Store }   from '../data/store.js';

const TABS = [
  { id: 'inicio',    label: 'Inicio',    icon: '⌂',  route: '/' },
  { id: 'catalogo',  label: 'Catálogo',  icon: '⊞',  route: '/catalogo' },
  { id: 'pedido',    label: 'Pedido',    icon: '◎',  route: '/pedido',    isCenter: true },
  { id: 'favoritos', label: 'Favoritos', icon: '♡',  route: '/favoritos' },
  { id: 'mas',       label: 'Más',       icon: '···', route: '/mas' },
];

export function initNavbar() {
  const nav = document.getElementById('app-navbar');
  if (!nav) return;

  /* Construir tabs */
  nav.innerHTML = TABS.map(tab => {
    if (tab.isCenter) {
      return `
        <div class="nav-item nav-order" data-route="${tab.route}" data-id="${tab.id}" role="button" tabindex="0">
          <div class="nav-icon-wrap">
            <span class="nav-icon">${tab.icon}</span>
          </div>
          <span class="nav-badge" id="nav-order-badge" style="display:none">0</span>
          <span class="nav-label">${tab.label}</span>
        </div>`;
    }
    return `
      <div class="nav-item" data-route="${tab.route}" data-id="${tab.id}" role="button" tabindex="0">
        <span class="nav-icon">${tab.icon}</span>
        <span class="nav-label">${tab.label}</span>
      </div>`;
  }).join('');

  /* Click en tabs */
  nav.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      Router.push(item.dataset.route);
    });
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        Router.push(item.dataset.route);
      }
    });
  });

  /* Actualizar tab activo cuando cambia la ruta */
  Router.afterEach(route => {
    nav.querySelectorAll('.nav-item').forEach(item => {
      const active = _isActiveRoute(route.path, item.dataset.route);
      item.classList.toggle('active', active);
    });
  });

  /* Actualizar badge del pedido */
  Store.on('order', () => _updateOrderBadge());
  _updateOrderBadge();
}

function _updateOrderBadge() {
  const badge = document.getElementById('nav-order-badge');
  if (!badge) return;
  const count = Store.getOrderCount();
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
}

function _isActiveRoute(currentPath, tabRoute) {
  if (tabRoute === '/') return currentPath === '/';
  return currentPath.startsWith(tabRoute);
}

/* Mostrar/ocultar navbar (oculto en entry y auth) */
export function showNavbar(visible) {
  const nav = document.getElementById('app-navbar');
  if (nav) nav.style.display = visible ? '' : 'none';
}
