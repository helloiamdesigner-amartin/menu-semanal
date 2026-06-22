/* =============================================================
   Herbora Sales App — Toast (notificaciones)
   ============================================================= */

let _container = null;

function _getContainer() {
  if (!_container) {
    _container = document.getElementById('toast-container');
    if (!_container) {
      _container = document.createElement('div');
      _container.id = 'toast-container';
      document.body.appendChild(_container);
    }
  }
  return _container;
}

export const Toast = {
  show(message, type = 'default', duration = 3000) {
    const container = _getContainer();
    const toast = document.createElement('div');
    toast.className = `toast${type !== 'default' ? ` ${type}` : ''}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.2s ease';
      setTimeout(() => toast.remove(), 220);
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg)   { this.show(msg, 'error'); },
  info(msg)    { this.show(msg, 'info'); },
};
