/* =============================================================
   Herbora Sales App — Vista: Más
   Ajustes, cambio de modo, comparador, info de la app
   ============================================================= */

import { Store }   from '../data/store.js';
import { Catalog } from '../data/catalog.js';
import { Router }  from '../router/router.js';
import { Modal }   from '../components/modal.js';
import { Toast }   from '../components/toast.js';
import { showNavbar } from '../components/navbar.js';
import { formatDateShort } from '../utils/format.js';
import { DB } from '../data/db.js';

export function renderMore() {
  const screen       = document.getElementById('screen-more');
  showNavbar(true);
  const isCommercial = Store.isCommercial();
  const stats        = Catalog.getStats();
  const compareCount = Store.getCompareList().length;

  screen.innerHTML = `
    <div class="screen-header">
      <h1>Más</h1>
    </div>

    <!-- Modo actual -->
    <div style="padding:16px;background:var(--color-primary-lt);border-bottom:1px solid var(--color-border);display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div style="font-size:12px;font-weight:600;color:var(--color-primary);text-transform:uppercase;letter-spacing:0.4px;">Modo actual</div>
        <div style="font-size:16px;font-weight:700;color:var(--color-text);">${isCommercial ? 'Comercial' : 'Consumidor / cliente profesional'}</div>
      </div>
      <button class="btn btn-outline btn-sm" id="btn-change-mode">Cambiar</button>
    </div>

    <!-- Opciones -->
    <div class="more-section">
      <div class="section-label">Herramientas</div>

      <div class="more-row" id="row-compare">
        <span class="more-row__icon">⚖️</span>
        <div class="more-row__text">
          <div class="more-row__title">Comparador</div>
          <div class="more-row__sub">${compareCount > 0 ? `${compareCount} producto${compareCount > 1 ? 's' : ''} seleccionado${compareCount > 1 ? 's' : ''}` : 'Hasta 3 productos en paralelo'}</div>
        </div>
        <span class="more-row__arrow">›</span>
      </div>

      <div class="more-row" id="row-history">
        <span class="more-row__icon">📋</span>
        <div class="more-row__text">
          <div class="more-row__title">Historial de pedidos</div>
          <div class="more-row__sub">Tus pedidos guardados</div>
        </div>
        <span class="more-row__arrow">›</span>
      </div>

      <div class="more-row" id="row-favorites">
        <span class="more-row__icon">♡</span>
        <div class="more-row__text">
          <div class="more-row__title">Favoritos</div>
          <div class="more-row__sub">${Store.getFavorites().size} producto${Store.getFavorites().size !== 1 ? 's' : ''} guardado${Store.getFavorites().size !== 1 ? 's' : ''}</div>
        </div>
        <span class="more-row__arrow">›</span>
      </div>
    </div>

    <div class="more-section">
      <div class="section-label">Catálogo</div>
      <div class="card" style="font-size:13px;color:var(--color-text-sec);display:flex;flex-direction:column;gap:4px;">
        <div>Productos activos: <strong>${stats.active}</strong></div>
        <div>Marcas: <strong>${stats.brands}</strong></div>
        <div>Versión: <strong id="catalog-version-text">—</strong></div>
      </div>
    </div>

    <div class="more-section">
      <div class="section-label">App</div>

      <div class="more-row" id="row-install">
        <span class="more-row__icon">📲</span>
        <div class="more-row__text">
          <div class="more-row__title">Instalar app</div>
          <div class="more-row__sub">Acceso desde el escritorio</div>
        </div>
        <span class="more-row__arrow">›</span>
      </div>

      <div class="more-row" id="row-logout">
        <span class="more-row__icon">🚪</span>
        <div class="more-row__text">
          <div class="more-row__title">Cerrar sesión</div>
          <div class="more-row__sub">Volver a la pantalla de inicio</div>
        </div>
        <span class="more-row__arrow">›</span>
      </div>
    </div>

    <div style="padding:16px;text-align:center;font-size:11px;color:var(--color-text-hint);">
      Herbora Sales App · v1.0<br>
      herbora.es · Desde 1981
    </div>
  `;

  /* Versión del catálogo en cache */
  DB.getCatalogVersion().then(v => {
    const el = screen.querySelector('#catalog-version-text');
    if (el) el.textContent = v || 'No disponible';
  });

  /* Cambiar modo */
  screen.querySelector('#btn-change-mode')?.addEventListener('click', () => {
    Modal.confirm(
      isCommercial
        ? 'Cambiar a modo consumidor. Necesitarás introducir la contraseña para volver al modo comercial.'
        : 'Cambiar a modo comercial. Se pedirá contraseña.',
      () => {
        if (isCommercial) {
          Store.setUserMode('consumer').then(() => Router.push('/entrada'));
        } else {
          Router.push('/auth');
        }
      }
    );
  });

  screen.querySelector('#row-compare')?.addEventListener('click',   () => Router.push('/comparador'));
  screen.querySelector('#row-history')?.addEventListener('click',   () => Router.push('/historial'));
  screen.querySelector('#row-favorites')?.addEventListener('click', () => Router.push('/favoritos'));

  /* Instalar PWA */
  screen.querySelector('#row-install')?.addEventListener('click', () => {
    if (window._pwaInstallPrompt) {
      window._pwaInstallPrompt.prompt();
    } else {
      Modal.show({
        centered: true,
        title: 'Instalar Herbora Sales App',
        content: `
          <p style="color:var(--color-text-sec);font-size:14px;line-height:1.6;margin-bottom:8px;">
            En iOS Safari: pulsa el botón <strong>Compartir</strong> → <strong>Añadir a pantalla de inicio</strong>
          </p>
          <p style="color:var(--color-text-sec);font-size:14px;line-height:1.6;">
            En Android Chrome: pulsa el menú <strong>⋮</strong> → <strong>Instalar app</strong>
          </p>`,
        actions: [{ id: 'close', label: 'Entendido', class: 'btn-secondary', handler: () => {} }],
      });
    }
  });

  /* Cerrar sesión */
  screen.querySelector('#row-logout')?.addEventListener('click', () => {
    Modal.confirm('¿Cerrar sesión? Se borrarán los datos locales.', async () => {
      await Store.setUserMode(null);
      Router.push('/entrada');
    });
  });
}
