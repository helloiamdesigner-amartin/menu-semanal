/* =============================================================
   Herbora Sales App — Product Sheet
   Ficha completa de producto con acordeón y acciones
   ============================================================= */

import { Store }   from '../data/store.js';
import { Router }  from '../router/router.js';
import { Image }   from '../utils/image.js';
import { Share }   from '../utils/share.js';
import { Toast }   from './toast.js';
import { badgesHtml } from './badge.js';

export function renderProductSheet(product, container) {
  if (!product || !container) return;

  const isFav        = Store.isFavorite(product.ref);
  const isInOrder    = Store.isInOrder(product.ref);
  const qty          = Store.getItemQty(product.ref);
  const isCommercial = Store.isCommercial();
  const isDiscontinued = product.status === 'discontinued';

  /* Secciones de acordeón: solo las que tienen contenido */
  const sections = [
    { key: 'properties',       label: 'Propiedades',           value: product.properties },
    { key: 'indications',      label: 'Indicaciones',          value: product.indications },
    { key: 'main_ingredients', label: 'Ingredientes principales', value: product.main_ingredients },
    { key: 'usage',            label: 'Modo de uso',           value: product.usage },
    { key: 'benefits',         label: 'Beneficios',            value: product.benefits },
    { key: 'warnings',         label: 'Advertencias',          value: product.warnings },
    { key: 'other_ingredients',label: 'Otros ingredientes',    value: product.other_ingredients },
  ].filter(s => s.value && s.value.trim().length > 3);

  container.innerHTML = `
    <!-- Imagen -->
    <div class="product-screen-header">
      <div class="product-image-wrap">
        <img alt="${product.name}" style="width:100%;height:100%;object-fit:contain;padding:24px;">
        <div class="product-image-actions">
          <button class="btn-icon btn-icon-ghost" id="btn-back" aria-label="Volver">
            <span style="font-size:20px;line-height:1;">←</span>
          </button>
          <div style="display:flex;gap:8px;">
            <button class="btn-icon btn-icon-ghost" id="btn-fav" aria-label="Favorito">
              <span style="font-size:18px;">${isFav ? '♥' : '♡'}</span>
            </button>
            <button class="btn-icon btn-icon-ghost" id="btn-share-product" aria-label="Compartir">
              <span style="font-size:16px;">↗</span>
            </button>
          </div>
        </div>
        <div class="product-image-badge-row">
          ${badgesHtml(product, 3)}
          ${isDiscontinued ? '<span class="badge badge-discontinued">Descatalogado</span>' : ''}
        </div>
      </div>
    </div>

    <!-- Info principal -->
    <div class="product-info">
      <div class="product-brand-line">${[product.brand, product.line].filter(Boolean).join(' · ')}</div>
      <h1 class="product-name">${product.name}</h1>

      <!-- Pills: REF, EAN, Formato -->
      <div class="product-pills-row">
        <span class="pill-info">${product.ref}</span>
        ${product.ean13 ? `<span class="pill-info">${product.ean13}</span>` : ''}
        ${product.format ? `<span class="pill-info">${product.format}</span>` : ''}
        ${product.presentation ? `<span class="pill-info">${product.presentation}</span>` : ''}
        ${product.dosage && product.dosage.length ? `<span class="pill-info">${product.dosage[0]}</span>` : ''}
      </div>

      <!-- Acciones secundarias -->
      <div class="product-quick-actions">
        <button class="btn btn-outline btn-sm" id="btn-compare">⊞ Comparar</button>
        <button class="btn btn-outline btn-sm" id="btn-presentation">⛶ Presentación</button>
      </div>

      <!-- Acordeón secciones -->
      ${sections.map((s, i) => `
        <div class="accordion-item${i === 0 ? ' open' : ''}" data-key="${s.key}">
          <div class="accordion-header">
            <span>${s.label}</span>
            <span class="accordion-icon">∨</span>
          </div>
          <div class="accordion-body">${escHtml(s.value)}</div>
        </div>
      `).join('')}

      ${sections.length === 0 ? `
        <div class="card" style="text-align:center;color:var(--color-text-hint);padding:24px;">
          Información técnica no disponible para este producto.
        </div>
      ` : ''}
    </div>

    <!-- CTA sticky añadir al pedido -->
    ${!isDiscontinued ? `
    <div class="product-add-section no-print">
      <div class="qty-control">
        <button class="qty-btn minus" id="btn-dec">−</button>
        <input class="qty-input" id="qty-input" type="number" min="1" value="${isInOrder ? qty : 1}">
        <button class="qty-btn plus" id="btn-inc">+</button>
      </div>
      <button class="btn btn-primary" style="flex:1;" id="btn-add-order">
        ${isInOrder ? `✓ En pedido (${qty})` : '+ Añadir al pedido'}
      </button>
    </div>
    ` : `
    <div class="product-add-section no-print">
      <div class="consumer-notice" style="width:100%;text-align:center;">
        Este producto ha sido descatalogado y no está disponible para nuevos pedidos.
      </div>
    </div>
    `}
  `;

  /* Imagen */
  Image.setSrc(container.querySelector('img'), product);

  /* Volver */
  container.querySelector('#btn-back')?.addEventListener('click', () => Router.back());

  /* Favorito */
  container.querySelector('#btn-fav')?.addEventListener('click', async e => {
    const btn = e.currentTarget;
    const isNow = await Store.toggleFavorite(product.ref);
    btn.querySelector('span').textContent = isNow ? '♥' : '♡';
    Toast.show(isNow ? 'Añadido a favoritos' : 'Eliminado de favoritos');
  });

  /* Compartir producto */
  container.querySelector('#btn-share-product')?.addEventListener('click', () => {
    Share.shareProduct(product);
  });

  /* Comparador */
  container.querySelector('#btn-compare')?.addEventListener('click', async () => {
    await Store.addToCompare(product.ref);
    Toast.show('Añadido al comparador');
  });

  /* Modo presentación */
  container.querySelector('#btn-presentation')?.addEventListener('click', () => {
    Router.push(`/presentacion/${product.ref}`);
  });

  /* Acordeón */
  container.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      item.classList.toggle('open');
    });
  });

  /* Controles cantidad + añadir */
  const qtyInput = container.querySelector('#qty-input');
  if (qtyInput && !isDiscontinued) {
    container.querySelector('#btn-dec')?.addEventListener('click', () => {
      qtyInput.value = Math.max(1, parseInt(qtyInput.value, 10) - 1);
    });

    container.querySelector('#btn-inc')?.addEventListener('click', () => {
      qtyInput.value = parseInt(qtyInput.value, 10) + 1;
    });

    container.querySelector('#btn-add-order')?.addEventListener('click', async btn => {
      const qty = Math.max(1, parseInt(qtyInput.value, 10));
      if (Store.isInOrder(product.ref)) {
        await Store.updateQuantity(product.ref, Store.getItemQty(product.ref) + qty);
      } else {
        await Store.addToOrder(product, qty);
      }
      const addBtn = container.querySelector('#btn-add-order');
      if (addBtn) addBtn.textContent = `✓ En pedido (${Store.getItemQty(product.ref)})`;
      Toast.show(`${product.name} añadido al pedido`, 'success');
    });
  }
}

function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}
