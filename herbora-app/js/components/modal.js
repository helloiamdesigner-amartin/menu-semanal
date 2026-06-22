/* =============================================================
   Herbora Sales App — Modal genérico
   ============================================================= */

export const Modal = {
  _overlay: null,

  /* Mostrar modal con contenido HTML */
  show({ title = '', content = '', actions = [], centered = false } = {}) {
    this.close(); // cerrar cualquier modal previo

    const overlay = document.createElement('div');
    overlay.className = `modal-overlay${centered ? ' top-center' : ''}`;

    const modal = document.createElement('div');
    modal.className = `modal${centered ? ' centered' : ''}`;

    const handle = centered ? '' : '<div class="modal-handle"></div>';
    const titleHtml = title ? `<div class="modal-title">${title}</div>` : '';
    const actionsHtml = actions.length
      ? `<div class="flex gap-3" style="margin-top:var(--space-5)">${
          actions.map(a =>
            `<button class="btn ${a.class || 'btn-ghost'} btn-full" data-action="${a.id}">${a.label}</button>`
          ).join('')
        }</div>`
      : '';

    modal.innerHTML = `${handle}${titleHtml}${content}${actionsHtml}`;

    /* Manejar acciones */
    actions.forEach(a => {
      modal.querySelector(`[data-action="${a.id}"]`)
        ?.addEventListener('click', () => { a.handler?.(); this.close(); });
    });

    overlay.appendChild(modal);
    overlay.addEventListener('click', e => {
      if (e.target === overlay) this.close();
    });

    document.body.appendChild(overlay);
    this._overlay = overlay;

    /* Prevenir scroll del body */
    document.body.style.overflow = 'hidden';
    return overlay;
  },

  /* Cerrar modal activo */
  close() {
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
      document.body.style.overflow = '';
    }
  },

  /* Diálogo de confirmación */
  confirm(message, onConfirm, onCancel) {
    this.show({
      centered: true,
      content: `<p style="color:var(--color-text-sec);margin-bottom:var(--space-2);">${message}</p>`,
      actions: [
        { id: 'cancel',  label: 'Cancelar', class: 'btn-ghost',   handler: onCancel },
        { id: 'confirm', label: 'Confirmar', class: 'btn-primary', handler: onConfirm },
      ],
    });
  },
};
