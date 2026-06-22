/* =============================================================
   Herbora Sales App — Order Item
   Ítem dentro del resumen de pedido con controles +/−
   ============================================================= */

import { Store } from '../data/store.js';

export function createOrderItem(item, onUpdate) {
  const el = document.createElement('div');
  el.className = 'order-item';
  el.dataset.ref = item.ref;

  const isDiscontinued = item.status === 'discontinued';

  el.innerHTML = `
    <div class="order-item__info">
      <div class="order-item__ref">${item.ref}</div>
      <div class="order-item__name">
        ${item.name}
        ${isDiscontinued ? '<span class="order-item__discontinued">Descatalogado</span>' : ''}
      </div>
      <div class="order-item__sub">${item.presentation || ''}</div>
    </div>
    <div class="qty-control">
      <button class="qty-btn minus" aria-label="Reducir cantidad">−</button>
      <input class="qty-input" type="number" min="1" value="${item.quantity}" aria-label="Cantidad">
      <button class="qty-btn plus" aria-label="Aumentar cantidad">+</button>
    </div>
    <button class="order-item__remove" aria-label="Eliminar producto">✕</button>
  `;

  const input = el.querySelector('.qty-input');

  el.querySelector('.qty-btn.minus').addEventListener('click', async () => {
    const newQty = parseInt(input.value, 10) - 1;
    if (newQty <= 0) {
      await Store.removeFromOrder(item.ref);
      el.remove();
    } else {
      input.value = newQty;
      await Store.updateQuantity(item.ref, newQty);
    }
    onUpdate?.();
  });

  el.querySelector('.qty-btn.plus').addEventListener('click', async () => {
    const newQty = parseInt(input.value, 10) + 1;
    input.value = newQty;
    await Store.updateQuantity(item.ref, newQty);
    onUpdate?.();
  });

  input.addEventListener('change', async () => {
    const val = parseInt(input.value, 10);
    if (isNaN(val) || val <= 0) {
      await Store.removeFromOrder(item.ref);
      el.remove();
    } else {
      input.value = val;
      await Store.updateQuantity(item.ref, val);
    }
    onUpdate?.();
  });

  el.querySelector('.order-item__remove').addEventListener('click', async () => {
    await Store.removeFromOrder(item.ref);
    el.style.animation = 'slideOut 0.2s ease forwards';
    setTimeout(() => el.remove(), 200);
    onUpdate?.();
  });

  return el;
}
