/* =============================================================
   Herbora Sales App — Vista: Pedido
   Pedido actual, compartición, guardado en historial.
   Comportamiento diferenciado comercial / consumidor.
   ============================================================= */

import { Store }   from '../data/store.js';
import { DB }      from '../data/db.js';
import { Catalog } from '../data/catalog.js';
import { Router }  from '../router/router.js';
import { Share }   from '../utils/share.js';
import { Modal }   from '../components/modal.js';
import { Toast }   from '../components/toast.js';
import { showNavbar } from '../components/navbar.js';
import { createOrderItem } from '../components/order-item.js';
import { EmptyStates } from '../components/empty-state.js';
import { formatDate, calcOrderTotals } from '../utils/format.js';
import { createProductCard } from '../components/product-card.js';

export function renderOrder() {
  const screen = document.getElementById('screen-order');
  showNavbar(true);
  _buildOrder(screen);
}

function _buildOrder(screen) {
  const isCommercial = Store.isCommercial();
  const items        = Store.getOrder();
  const totals       = calcOrderTotals(items);
  const title        = isCommercial ? 'Pedido rápido' : 'Mi pedido';
  const modeText     = isCommercial ? 'Modo comercial' : 'Cliente / consumidor';

  screen.innerHTML = `
    <!-- Header -->
    <div class="order-header">
      <div class="order-header__title">${title}</div>
      <div class="order-header__date">${formatDate()}</div>
      <span class="order-mode-label">${modeText}</span>
    </div>

    <!-- Buscador para añadir productos rápido -->
    <div class="order-add-search" style="padding:12px 16px 0;">
      <div class="search-wrap" id="order-search-wrap">
        <span class="search-icon">+</span>
        <input class="input" type="search" id="order-search"
          placeholder="Añadir producto por nombre o REF…"
          autocomplete="off" inputmode="search">
        <div class="search-clear" id="order-search-clear">✕</div>
      </div>
      <div id="order-search-results" style="display:none;background:white;border:1px solid var(--color-border);border-radius:var(--radius-md);margin-top:4px;max-height:220px;overflow-y:auto;"></div>
    </div>

    <!-- Cuerpo del pedido -->
    <div class="order-body">

      ${items.length === 0 ? '' : `
      <!-- Nombre del pedido (opcional) -->
      <div>
        <input class="input" id="order-name" placeholder="${isCommercial ? 'Nombre del pedido (opcional)' : 'Nombre o empresa (opcional)'}" style="font-size:13px;">
      </div>

      <!-- Lista de ítems -->
      <div id="order-items-list" class="order-items"></div>

      <!-- Totales -->
      <div class="order-totals" id="order-totals">
        <div>
          <div class="order-totals__label">Referencias</div>
          <div class="order-totals__val" id="total-refs">${totals.refs}</div>
        </div>
        <div>
          <div class="order-totals__label">Total unidades</div>
          <div class="order-totals__val" id="total-units">${totals.units}</div>
        </div>
      </div>

      <!-- Notas -->
      <div>
        <textarea class="textarea" id="order-notes" placeholder="Observaciones (opcional)…"></textarea>
      </div>

      <!-- Aviso consumidor -->
      ${!isCommercial ? `
      <div class="consumer-notice">
        ℹ Este resumen no incluye precios ni condiciones comerciales.
        Por favor, contacta con tu comercial Herbora para confirmar disponibilidad y condiciones.
      </div>` : ''}
      `}

    </div>

    <!-- Compartir -->
    ${items.length > 0 ? `
    <div class="order-share-section">
      <div class="share-label">${isCommercial ? 'Compartir resumen' : 'Enviar al comercial'}</div>
      <div class="share-grid">
        <button class="btn btn-whatsapp btn-sm" id="btn-whatsapp">WhatsApp</button>
        <button class="btn btn-outline btn-sm" id="btn-email">Email</button>
        <button class="btn btn-ghost btn-sm" id="btn-clipboard">Copiar texto</button>
        <button class="btn btn-ghost btn-sm" id="btn-pdf">PDF</button>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button class="btn btn-secondary btn-full" id="btn-save-order">
          💾 ${isCommercial ? 'Guardar en historial' : 'Guardar resumen'}
        </button>
        <button class="btn btn-ghost btn-sm" id="btn-clear-order" style="flex-shrink:0;">🗑</button>
      </div>
    </div>
    ` : ''}
  `;

  /* Vacío */
  if (items.length === 0) {
    const body = screen.querySelector('.order-body');
    body?.appendChild(EmptyStates.emptyOrder(() => Router.push('/catalogo')));
  } else {
    /* Renderizar ítems */
    const listEl = screen.querySelector('#order-items-list');
    items.forEach(item => {
      const itemEl = createOrderItem(item, () => _updateTotals(screen));
      listEl.appendChild(itemEl);
    });
  }

  /* Buscador de productos para añadir */
  _initOrderSearch(screen);

  /* Acciones de compartición */
  const getOpts = () => ({
    mode:  isCommercial ? 'commercial' : 'consumer',
    name:  screen.querySelector('#order-name')?.value || '',
    notes: screen.querySelector('#order-notes')?.value || '',
  });

  screen.querySelector('#btn-whatsapp')?.addEventListener('click', () =>
    Share.whatsapp(Store.getOrder(), getOpts()));

  screen.querySelector('#btn-email')?.addEventListener('click', () =>
    Share.email(Store.getOrder(), getOpts()));

  screen.querySelector('#btn-clipboard')?.addEventListener('click', () =>
    Share.clipboard(Store.getOrder(), getOpts()));

  screen.querySelector('#btn-pdf')?.addEventListener('click', () =>
    Share.pdf(Store.getOrder(), getOpts()));

  /* Guardar en historial */
  screen.querySelector('#btn-save-order')?.addEventListener('click', async () => {
    const opts = getOpts();
    const order = {
      mode:  opts.mode,
      label: isCommercial ? 'Pedido' : 'Enviado al comercial',
      name:  opts.name,
      notes: opts.notes,
      items: Store.getOrder().map(i => ({ ...i })), // copia estática
      totalRefs:  Store.getOrderRefs(),
      totalUnits: Store.getOrderCount(),
    };
    await DB.saveOrder(order);
    Toast.success('Pedido guardado en historial');
  });

  /* Vaciar pedido */
  screen.querySelector('#btn-clear-order')?.addEventListener('click', () => {
    Modal.confirm('¿Vaciar el pedido actual?', async () => {
      await Store.clearOrder();
      _buildOrder(screen);
    });
  });
}

function _updateTotals(screen) {
  const items   = Store.getOrder();
  const totals  = calcOrderTotals(items);
  const refsEl  = screen.querySelector('#total-refs');
  const unitsEl = screen.querySelector('#total-units');
  if (refsEl)  refsEl.textContent  = totals.refs;
  if (unitsEl) unitsEl.textContent = totals.units;

  if (items.length === 0) {
    _buildOrder(screen); // Reconstruir para mostrar estado vacío
  }
}

let _searchTimer = null;

function _initOrderSearch(screen) {
  const input   = screen.querySelector('#order-search');
  const wrap    = screen.querySelector('#order-search-wrap');
  const clear   = screen.querySelector('#order-search-clear');
  const results = screen.querySelector('#order-search-results');
  if (!input || !results) return;

  input.addEventListener('input', e => {
    const q = e.target.value.trim();
    wrap.classList.toggle('has-value', !!q);
    clearTimeout(_searchTimer);
    if (!q) { results.style.display = 'none'; return; }
    _searchTimer = setTimeout(() => _showSearchResults(q, results, input, wrap, screen), 200);
  });

  clear?.addEventListener('click', () => {
    input.value = '';
    wrap.classList.remove('has-value');
    results.style.display = 'none';
  });

  /* Cerrar al hacer click fuera */
  document.addEventListener('click', e => {
    if (!wrap.contains(e.target)) results.style.display = 'none';
  }, { passive: true });
}

function _showSearchResults(query, resultsEl, input, wrap, screen) {
  const found = Catalog.search(query).slice(0, 8);
  if (found.length === 0) { resultsEl.style.display = 'none'; return; }

  resultsEl.innerHTML = found.map(p => `
    <div class="product-list-item" style="border:none;border-bottom:1px solid var(--color-border);border-radius:0;cursor:pointer;" data-ref="${p.ref}">
      <div class="product-list-item__content">
        <div class="product-list-item__name" style="font-size:13px;">${p.name}</div>
        <div class="product-list-item__ref">${p.ref} · ${p.brand}</div>
      </div>
      <button class="btn btn-primary btn-sm" style="font-size:11px;flex-shrink:0;" data-add="${p.ref}">+ Añadir</button>
    </div>
  `).join('');

  resultsEl.style.display = 'block';

  resultsEl.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const ref     = btn.dataset.add;
      const product = Catalog.getById(ref);
      if (!product) return;
      await Store.addToOrder(product, 1);
      Toast.success(`${product.name} añadido`);
      input.value = '';
      wrap.classList.remove('has-value');
      resultsEl.style.display = 'none';
      _buildOrder(screen); // Reconstruir el pedido
    });
  });
}
