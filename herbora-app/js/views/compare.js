/* =============================================================
   Herbora Sales App — Vista: Comparador
   Hasta 3 productos en paralelo. Generado dinámicamente.
   ============================================================= */

import { Store }   from '../data/store.js';
import { Catalog } from '../data/catalog.js';
import { Router }  from '../router/router.js';
import { Image }   from '../utils/image.js';
import { Modal }   from '../components/modal.js';
import { Toast }   from '../components/toast.js';
import { showNavbar } from '../components/navbar.js';
import { EmptyStates } from '../components/empty-state.js';

/* Campos a comparar: dinámicos, sin hardcodear */
const COMPARE_FIELDS = [
  { key: 'brand',             label: 'Marca' },
  { key: 'line',              label: 'Línea' },
  { key: 'presentation',      label: 'Presentación' },
  { key: 'format',            label: 'Formato' },
  { key: 'dosage',            label: 'Dosificación', render: v => Array.isArray(v) ? v.join(', ') : v },
  { key: 'main_ingredients',  label: 'Ingredientes principales' },
  { key: 'properties',        label: 'Propiedades' },
  { key: 'indications',       label: 'Indicaciones' },
  { key: 'usage',             label: 'Modo de uso' },
  { key: 'warnings',          label: 'Advertencias' },
];

export async function renderCompare() {
  const screen = document.getElementById('screen-compare');
  showNavbar(true);

  const refs     = Store.getCompareList();
  const products = refs.map(r => Catalog.getById(r)).filter(Boolean);

  screen.innerHTML = `
    <div class="screen-header">
      <h1>Comparador</h1>
      <div class="subtitle">Hasta 3 productos</div>
    </div>
    <div id="compare-body" style="overflow-x:auto;"></div>
  `;

  if (products.length === 0) {
    screen.querySelector('#compare-body').appendChild(EmptyStates.compareEmpty());
    return;
  }

  const body = screen.querySelector('#compare-body');

  /* Cabecera con imágenes + nombre */
  const header = document.createElement('div');
  header.className = 'compare-header-row';
  header.innerHTML = `<div style="font-size:12px;font-weight:600;color:var(--color-text-hint);display:flex;align-items:center;">Campo</div>`;

  products.forEach(p => {
    const col = document.createElement('div');
    col.className = 'compare-product-col';

    const img = document.createElement('img');
    img.className = 'compare-product-img';
    img.alt = p.name;
    Image.setSrc(img, p);

    const nameEl = document.createElement('div');
    nameEl.className = 'compare-product-name';
    nameEl.textContent = p.name;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'compare-remove';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', async () => {
      await Store.removeFromCompare(p.ref);
      renderCompare();
    });

    const link = document.createElement('button');
    link.style.cssText = 'background:none;border:none;cursor:pointer;font-size:11px;color:var(--color-primary);';
    link.textContent = 'Ver ficha →';
    link.addEventListener('click', () => Router.push(`/producto/${p.ref}`));

    col.appendChild(img);
    col.appendChild(nameEl);
    col.appendChild(link);
    col.appendChild(removeBtn);
    header.appendChild(col);
  });

  /* Columnas vacías para completar hasta 3 */
  for (let i = products.length; i < 3; i++) {
    const placeholder = document.createElement('div');
    placeholder.className = 'compare-placeholder';
    placeholder.innerHTML = `<span style="font-size:28px;opacity:0.3;">+</span><span style="font-size:12px;color:var(--color-text-hint);">Añadir producto</span>`;
    placeholder.addEventListener('click', () => Router.push('/catalogo'));
    header.appendChild(placeholder);
  }

  body.appendChild(header);

  /* Filas de comparación: solo las que tienen algún valor */
  COMPARE_FIELDS.forEach(field => {
    const hasValue = products.some(p => {
      const v = p[field.key];
      return v && (Array.isArray(v) ? v.length > 0 : String(v).trim().length > 0);
    });
    if (!hasValue) return;

    const row = document.createElement('div');
    row.className = 'compare-row';
    row.innerHTML = `<div class="compare-row-label">${field.label}</div>`;

    products.forEach(p => {
      const rawVal = p[field.key] || '—';
      const val    = field.render ? field.render(rawVal) : rawVal;
      const cell   = document.createElement('div');
      cell.className = 'compare-row-val';
      cell.textContent = val;
      row.appendChild(cell);
    });

    /* Columnas vacías */
    for (let i = products.length; i < 3; i++) {
      const empty = document.createElement('div');
      empty.className = 'compare-row-val';
      empty.style.color = 'var(--color-text-hint)';
      empty.textContent = '—';
      row.appendChild(empty);
    }

    body.appendChild(row);
  });

  /* Botón añadir al pedido (todos a la vez) */
  if (products.length > 0) {
    const addAll = document.createElement('div');
    addAll.style.cssText = 'padding:16px;display:flex;gap:8px;flex-wrap:wrap;';
    products.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary btn-sm';
      btn.textContent = `+ ${p.name.split(' ')[0]}`;
      btn.addEventListener('click', async () => {
        await Store.addToOrder(p, 1);
        Toast.success(`${p.name} añadido al pedido`);
      });
      addAll.appendChild(btn);
    });
    body.appendChild(addAll);
  }

  /* Limpiar comparador */
  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn btn-ghost btn-sm no-print';
  clearBtn.style.cssText = 'margin:0 16px 24px;';
  clearBtn.textContent = 'Limpiar comparador';
  clearBtn.addEventListener('click', async () => {
    await Store.clearCompare();
    renderCompare();
  });
  body.appendChild(clearBtn);
}
