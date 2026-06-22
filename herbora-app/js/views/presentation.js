/* =============================================================
   Herbora Sales App — Vista: Modo presentación
   Pantalla completa para mostrar un producto en una tablet
   a un cliente / en una visita comercial.
   ============================================================= */

import { Catalog } from '../data/catalog.js';
import { Store }   from '../data/store.js';
import { Router }  from '../router/router.js';
import { Image }   from '../utils/image.js';
import { Toast }   from '../components/toast.js';
import { showNavbar } from '../components/navbar.js';
import { badgesHtml } from '../components/badge.js';

/* Secciones a mostrar en modo presentación */
const PRES_SECTIONS = [
  { key: 'properties',       label: 'Propiedades' },
  { key: 'indications',      label: 'Indicaciones' },
  { key: 'main_ingredients', label: 'Ingredientes principales' },
  { key: 'usage',            label: 'Modo de uso' },
];

export function renderPresentation(route) {
  const ref    = route?.params?.ref || '';
  const screen = document.getElementById('screen-presentation');
  showNavbar(false);

  const product = Catalog.getById(ref);

  if (!product) {
    screen.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100dvh;flex-direction:column;gap:16px;">
        <p style="color:var(--color-text-sec);">Producto no encontrado</p>
        <button class="btn btn-outline" id="btn-back">Volver</button>
      </div>`;
    screen.querySelector('#btn-back')?.addEventListener('click', () => Router.back());
    return;
  }

  /* Filtrar secciones con contenido */
  const sections = PRES_SECTIONS.filter(s =>
    product[s.key] && String(product[s.key]).trim().length > 3
  );

  const isInOrder = Store.isInOrder(product.ref);

  screen.innerHTML = `
    <div class="presentation-layout">

      <!-- Área de imagen -->
      <div class="presentation-image-area">
        <div class="presentation-controls">
          <button class="btn-icon btn-icon-ghost" id="btn-exit" aria-label="Salir">✕</button>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-primary btn-sm" id="btn-add-pres">
              ${isInOrder ? `✓ En pedido (${Store.getItemQty(product.ref)})` : '+ Añadir al pedido'}
            </button>
          </div>
        </div>
        <img id="pres-img" alt="${product.name}" style="max-height:55dvh;max-width:90%;object-fit:contain;">
        <div style="position:absolute;bottom:16px;left:16px;display:flex;flex-wrap:wrap;gap:4px;">
          ${badgesHtml(product, 3)}
        </div>
      </div>

      <!-- Info del producto -->
      <div class="presentation-info">
        <div style="font-size:11px;font-weight:700;color:var(--color-text-sec);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
          ${[product.brand, product.line].filter(Boolean).join(' · ')}
        </div>
        <h2 style="font-size:22px;font-weight:700;color:var(--color-text);line-height:1.2;margin-bottom:12px;">${product.name}</h2>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">
          <span class="pill-info">${product.ref}</span>
          ${product.presentation ? `<span class="pill-info">${product.presentation}</span>` : ''}
          ${product.format ? `<span class="pill-info">${product.format}</span>` : ''}
          ${product.dosage?.length ? `<span class="pill-info">${product.dosage[0]}</span>` : ''}
        </div>

        <!-- Secciones con navegación -->
        <div id="pres-sections">
          ${sections.map((s, i) => `
            <div class="pres-section${i === 0 ? '' : ''}" style="display:${i === 0 ? 'block' : 'none'};" data-idx="${i}">
              <div style="font-size:12px;font-weight:700;color:var(--color-primary);text-transform:uppercase;letter-spacing:0.4px;margin-bottom:8px;">${s.label}</div>
              <p style="font-size:14px;color:var(--color-text-sec);line-height:1.6;">${escHtml(product[s.key])}</p>
            </div>
          `).join('')}
        </div>

        ${sections.length > 1 ? `
        <!-- Navegación entre secciones -->
        <div class="presentation-nav">
          <button class="btn-icon btn-icon-ghost" id="pres-prev" aria-label="Anterior">←</button>
          <div class="presentation-dots" id="pres-dots">
            ${sections.map((_, i) => `<div class="presentation-dot${i === 0 ? ' active' : ''}" data-dot="${i}"></div>`).join('')}
          </div>
          <button class="btn-icon btn-icon-secondary" id="pres-next" aria-label="Siguiente">→</button>
        </div>` : ''}
      </div>

    </div>
  `;

  /* Imagen */
  Image.setSrc(screen.querySelector('#pres-img'), product);

  /* Salir */
  screen.querySelector('#btn-exit')?.addEventListener('click', () => {
    showNavbar(true);
    Router.back();
  });

  /* Añadir al pedido */
  screen.querySelector('#btn-add-pres')?.addEventListener('click', async () => {
    await Store.addToOrder(product, 1);
    const btn = screen.querySelector('#btn-add-pres');
    if (btn) btn.textContent = `✓ En pedido (${Store.getItemQty(product.ref)})`;
    Toast.success(`${product.name} añadido al pedido`);
  });

  /* Navegación secciones */
  if (sections.length > 1) {
    let _current = 0;

    function _showSection(idx) {
      screen.querySelectorAll('[data-idx]').forEach(el => {
        el.style.display = parseInt(el.dataset.idx) === idx ? 'block' : 'none';
      });
      screen.querySelectorAll('[data-dot]').forEach(dot => {
        dot.classList.toggle('active', parseInt(dot.dataset.dot) === idx);
      });
      _current = idx;
    }

    screen.querySelector('#pres-next')?.addEventListener('click', () => {
      _showSection((_current + 1) % sections.length);
    });

    screen.querySelector('#pres-prev')?.addEventListener('click', () => {
      _showSection((_current - 1 + sections.length) % sections.length);
    });

    /* Swipe táctil */
    let _touchX = 0;
    screen.addEventListener('touchstart', e => { _touchX = e.touches[0].clientX; }, { passive: true });
    screen.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - _touchX;
      if (Math.abs(dx) > 50) {
        dx < 0
          ? _showSection((_current + 1) % sections.length)
          : _showSection((_current - 1 + sections.length) % sections.length);
      }
    }, { passive: true });
  }
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}
