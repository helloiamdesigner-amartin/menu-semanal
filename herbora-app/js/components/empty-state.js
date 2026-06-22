/* =============================================================
   Herbora Sales App — Empty states
   ============================================================= */

export function emptyState({ icon = '📦', title, text, action } = {}) {
  const div = document.createElement('div');
  div.className = 'empty-state';

  const actionHtml = action
    ? `<button class="btn btn-secondary" id="empty-action">${action.label}</button>`
    : '';

  div.innerHTML = `
    <div class="empty-state__icon">${icon}</div>
    <div class="empty-state__title">${title || ''}</div>
    ${text ? `<p class="empty-state__text">${text}</p>` : ''}
    ${actionHtml}
  `;

  if (action) {
    div.querySelector('#empty-action')?.addEventListener('click', action.handler);
  }

  return div;
}

/* Estados predefinidos reutilizables */
export const EmptyStates = {
  noProducts(onExplore) {
    return emptyState({
      icon: '🔍',
      title: 'Sin resultados',
      text: 'Prueba con otros términos o elimina algún filtro.',
      action: onExplore ? { label: 'Ver todo el catálogo', handler: onExplore } : null,
    });
  },

  emptyOrder(onExplore) {
    return emptyState({
      icon: '🛒',
      title: 'Tu pedido está vacío',
      text: 'Añade productos desde el catálogo.',
      action: onExplore ? { label: 'Explorar catálogo', handler: onExplore } : null,
    });
  },

  noFavorites(onExplore) {
    return emptyState({
      icon: '♡',
      title: 'Sin favoritos',
      text: 'Marca productos como favoritos para acceder rápidamente.',
      action: onExplore ? { label: 'Explorar catálogo', handler: onExplore } : null,
    });
  },

  noHistory() {
    return emptyState({
      icon: '📋',
      title: 'Sin historial',
      text: 'Aquí aparecerán tus pedidos guardados.',
    });
  },

  offline() {
    return emptyState({
      icon: '📡',
      title: 'Sin conexión',
      text: 'Conecta a internet para cargar el catálogo por primera vez.',
    });
  },

  compareEmpty() {
    return emptyState({
      icon: '⚖️',
      title: 'Comparador vacío',
      text: 'Añade hasta 3 productos para comparar sus características.',
    });
  },
};
