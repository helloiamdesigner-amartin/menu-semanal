/* =============================================================
   Herbora Sales App — Product Card
   Vista grid y vista lista. Dinámico, sin hardcodear nada.
   ============================================================= */

import { Router }   from '../router/router.js';
import { Store }    from '../data/store.js';
import { Image }    from '../utils/image.js';
import { badgesHtml } from './badge.js';
import { Toast }    from './toast.js';

/* ── TARJETA GRID ────────────────────────────────────────── */
export function createProductCard(product, opts = {}) {
  const { showAddBtn = true } = opts;

  const card = document.createElement('div');
  card.className = 'product-card stagger-item';
  card.dataset.ref = product.ref;

  const isFav     = Store.isFavorite(product.ref);
  const isInOrder = Store.isInOrder(product.ref);
  const qty       = Store.getItemQty(product.ref);
  const badgesHtmlStr = badgesHtml(product, 2);
  const isDiscontinued = product.status === 'discontinued';

  card.innerHTML = `
    <div class="product-card__image-wrap">
      <img class="product-card__image" alt="${product.name}" loading="lazy" decoding="async">
      ${badgesHtmlStr ? `<div class="product-card__badges">${badgesHtmlStr}</div>` : ''}
      ${isDiscontinued ? `<div class="product-card__badges"><span class="badge badge-discontinued">Descatalogado</span></div>` : ''}
      <button class="product-card__fav${isFav ? ' active' : ''}" data-ref="${product.ref}" aria-label="Favorito">
        ${isFav ? '♥' : '♡'}
      </button>
    </div>
    <div class="product-card__info">
      <div class="product-card__brand">${[product.brand, product.line].filter(Boolean).join(' · ')}</div>
      <div class="product-card__name">${product.name}</div>
      <div class="product-card__meta">${product.ref}${product.presentation ? ' · ' + product.presentation : ''}</div>
      ${showAddBtn && !isDiscontinued ? `
        <div class="product-card__actions">
          ${isInOrder
            ? `<div class="qty-control" style="flex:1">
                <button class="qty-btn minus" data-ref="${product.ref}" data-action="dec">−</button>
                <input class="qty-input" type="number" min="1" value="${qty}" data-ref="${product.ref}">
                <button class="qty-btn plus" data-ref="${product.ref}" data-action="inc">+</button>
              </div>`
            : `<button class="btn btn-primary btn-sm" style="flex:1;font-size:12px;" data-ref="${product.ref}" data-action="add">
                + Añadir
              </button>`
          }
        </div>` : ''}
    </div>
  `;

  /* Imagen con fallback */
  Image.setSrc(card.querySelector('img'), product);

  /* Click en la tarjeta → ficha de producto */
  card.addEventListener('click', e => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    Router.push(`/producto/${product.ref}`);
  });

  /* Favorito */
  card.querySelector('.product-card__fav')?.addEventListener('click', async e => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const isNow = await Store.toggleFavorite(product.ref);
    btn.classList.toggle('active', isNow);
    btn.textContent = isNow ? '♥' : '♡';
    btn.classList.add('fav-pop');
    btn.addEventListener('animationend', () => btn.classList.remove('fav-pop'), { once: true });
    Toast.show(isNow ? 'Añadido a favoritos' : 'Eliminado de favoritos');
  });

  /* Añadir al pedido */
  card.querySelector('[data-action="add"]')?.addEventListener('click', async e => {
    e.stopPropagation();
    await Store.addToOrder(product, 1);
    Toast.show(`${product.name} añadido al pedido`, 'success');
    _refreshCardActions(card, product);
  });

  /* Incrementar */
  card.querySelector('[data-action="inc"]')?.addEventListener('click', async e => {
    e.stopPropagation();
    const newQty = Store.getItemQty(product.ref) + 1;
    await Store.updateQuantity(product.ref, newQty);
    _refreshCardActions(card, product);
  });

  /* Decrementar */
  card.querySelector('[data-action="dec"]')?.addEventListener('click', async e => {
    e.stopPropagation();
    const newQty = Store.getItemQty(product.ref) - 1;
    if (newQty <= 0) {
      await Store.removeFromOrder(product.ref);
    } else {
      await Store.updateQuantity(product.ref, newQty);
    }
    _refreshCardActions(card, product);
  });

  /* Cambio manual en input qty */
  card.querySelector('.qty-input')?.addEventListener('change', async e => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val <= 0) {
      await Store.removeFromOrder(product.ref);
    } else {
      await Store.updateQuantity(product.ref, val);
    }
    _refreshCardActions(card, product);
  });

  return card;
}

function _refreshCardActions(card, product) {
  const isInOrder = Store.isInOrder(product.ref);
  const qty = Store.getItemQty(product.ref);
  const actionsEl = card.querySelector('.product-card__actions');
  if (!actionsEl) return;

  actionsEl.innerHTML = isInOrder
    ? `<div class="qty-control" style="flex:1">
        <button class="qty-btn minus" data-action="dec">−</button>
        <input class="qty-input" type="number" min="1" value="${qty}">
        <button class="qty-btn plus" data-action="inc">+</button>
      </div>`
    : `<button class="btn btn-primary btn-sm" style="flex:1;font-size:12px;" data-action="add">+ Añadir</button>`;

  /* Re-bind events */
  actionsEl.querySelector('[data-action="add"]')?.addEventListener('click', async e => {
    e.stopPropagation();
    await Store.addToOrder(product, 1);
    _refreshCardActions(card, product);
  });
  actionsEl.querySelector('[data-action="inc"]')?.addEventListener('click', async e => {
    e.stopPropagation();
    await Store.updateQuantity(product.ref, Store.getItemQty(product.ref) + 1);
    _refreshCardActions(card, product);
  });
  actionsEl.querySelector('[data-action="dec"]')?.addEventListener('click', async e => {
    e.stopPropagation();
    const newQty = Store.getItemQty(product.ref) - 1;
    newQty <= 0
      ? await Store.removeFromOrder(product.ref)
      : await Store.updateQuantity(product.ref, newQty);
    _refreshCardActions(card, product);
  });
  actionsEl.querySelector('.qty-input')?.addEventListener('change', async e => {
    const val = parseInt(e.target.value, 10);
    isNaN(val) || val <= 0
      ? await Store.removeFromOrder(product.ref)
      : await Store.updateQuantity(product.ref, val);
    _refreshCardActions(card, product);
  });
}

/* ── ÍTEM LISTA ──────────────────────────────────────────── */
export function createProductListItem(product) {
  const item = document.createElement('div');
  item.className = 'product-list-item stagger-item';
  item.dataset.ref = product.ref;

  const isDiscontinued = product.status === 'discontinued';

  item.innerHTML = `
    <img class="product-list-item__image" alt="${product.name}" loading="lazy">
    <div class="product-list-item__content">
      <div class="product-list-item__name">${product.name}${isDiscontinued ? ' <span class="order-item__discontinued">Descatalogado</span>' : ''}</div>
      <div class="product-list-item__sub">${[product.brand, product.line].filter(Boolean).join(' · ')}</div>
      <div class="product-list-item__ref">${product.ref} · ${product.presentation || ''}</div>
    </div>
    <span style="color:var(--color-text-hint);font-size:18px;">›</span>
  `;

  Image.setSrc(item.querySelector('img'), product);

  item.addEventListener('click', () => Router.push(`/producto/${product.ref}`));
  return item;
}

/* ── SKELETON CARDS ─────────────────────────────────────── */
export function createSkeletonCards(count = 6) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const div = document.createElement('div');
    div.className = 'skeleton-card skeleton';
    frag.appendChild(div);
  }
  return frag;
}
