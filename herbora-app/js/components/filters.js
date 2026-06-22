/* =============================================================
   Herbora Sales App — Filtros dinámicos
   Todo se genera desde el catálogo. Sin hardcodear nada.
   ============================================================= */

import { Modal } from './modal.js';

/* Estado de filtros activos */
let _active = { brands: [], lines: [], formats: [], badges: [] };
let _onChange = null;

export const Filters = {

  /* Inicializar y vincular callback */
  init(onChange) {
    _onChange = onChange;
    _active = { brands: [], lines: [], formats: [], badges: [] };
  },

  /* Obtener filtros activos */
  getActive() { return { ..._active }; },

  /* ¿Hay algún filtro activo? */
  hasActive() {
    return Object.values(_active).some(v => v.length > 0);
  },

  /* Total de filtros activos */
  countActive() {
    return Object.values(_active).reduce((s, v) => s + v.length, 0);
  },

  /* Limpiar todos */
  clear() {
    _active = { brands: [], lines: [], formats: [], badges: [] };
    _onChange?.(_active);
  },

  /* Renderizar chips de filtro en una fila horizontal (marcas) */
  renderBrandChips(container, brands, selectedBrands = []) {
    container.innerHTML = '';
    const chips = document.createDocumentFragment();

    /* Chip "Todas" */
    const allChip = _makeChip('Todas', selectedBrands.length === 0, () => {
      _active.brands = [];
      _onChange?.(_active);
      this.renderBrandChips(container, brands, []);
    });
    chips.appendChild(allChip);

    brands.forEach(brand => {
      const isActive = selectedBrands.includes(brand);
      const chip = _makeChip(brand, isActive, () => {
        if (isActive) {
          _active.brands = _active.brands.filter(b => b !== brand);
        } else {
          _active.brands = [..._active.brands, brand];
        }
        _onChange?.(_active);
        this.renderBrandChips(container, brands, _active.brands);
      });
      chips.appendChild(chip);
    });

    container.appendChild(chips);
  },

  /* Abrir panel completo de filtros (modal bottom sheet) */
  openPanel(catalogFilters) {
    const { brands, lines, formats, badges } = catalogFilters;

    const content = `
      <div class="filter-panel-body">
        ${_filterSection('Marca', 'brands', brands, _active.brands)}
        ${_filterSection('Línea', 'lines', lines, _active.lines)}
        ${_filterSection('Formato', 'formats', formats, _active.formats)}
        ${badges.length ? _filterSection('Distinción', 'badges', badges, _active.badges) : ''}
      </div>
    `;

    const overlay = Modal.show({
      title: 'Filtrar productos',
      content,
      actions: [
        {
          id: 'clear',
          label: `Limpiar${this.countActive() > 0 ? ` (${this.countActive()})` : ''}`,
          class: 'btn-ghost',
          handler: () => this.clear(),
        },
        {
          id: 'apply',
          label: 'Ver resultados',
          class: 'btn-secondary',
          handler: () => _onChange?.(_active),
        },
      ],
    });

    /* Bind de chips dentro del panel */
    overlay.querySelectorAll('.chip[data-group]').forEach(chip => {
      chip.addEventListener('click', () => {
        const group  = chip.dataset.group;
        const value  = chip.dataset.value;
        const active = _active[group] || [];

        if (active.includes(value)) {
          _active[group] = active.filter(v => v !== value);
        } else {
          _active[group] = [...active, value];
        }

        chip.classList.toggle('active', _active[group].includes(value));

        /* Actualizar contador en botón limpiar */
        const clearBtn = overlay.querySelector('[data-action="clear"]');
        if (clearBtn) {
          const count = this.countActive();
          clearBtn.textContent = count > 0 ? `Limpiar (${count})` : 'Limpiar';
        }
      });
    });
  },
};

/* ── Helpers internos ───────────────────────────────────── */

function _makeChip(label, active, onClick) {
  const chip = document.createElement('div');
  chip.className = `chip${active ? ' active' : ''}`;
  chip.textContent = label;
  chip.addEventListener('click', onClick);
  return chip;
}

function _filterSection(title, group, items, activeItems) {
  if (!items || items.length === 0) return '';
  return `
    <div>
      <div class="filter-section-title">${title}</div>
      <div class="filter-chips-wrap">
        ${items.map(item => {
          const isActive = activeItems.includes(item);
          return `<div class="chip${isActive ? ' active' : ''}" data-group="${group}" data-value="${escAttr(item)}">${escHtml(item)}</div>`;
        }).join('')}
      </div>
    </div>
  `;
}

function escAttr(s) { return String(s).replace(/"/g, '&quot;'); }
function escHtml(s) { return String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
