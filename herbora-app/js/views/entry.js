/* =============================================================
   Herbora Sales App — Vista: Pantalla de entrada
   ============================================================= */

import { Store }  from '../data/store.js';
import { Router } from '../router/router.js';
import { showNavbar } from '../components/navbar.js';

export function renderEntry() {
  const screen = document.getElementById('screen-entry');
  showNavbar(false);

  screen.innerHTML = `
    <div class="entry-hero">
      <div class="entry-logo">herbora</div>
      <p class="entry-tagline">Catálogo comercial<br>Desde 1981</p>
    </div>
    <div class="entry-actions">
      <p class="entry-actions-title">¿Cómo quieres acceder?</p>
      <button class="btn btn-secondary btn-full btn-lg" id="btn-commercial">
        Soy comercial
      </button>
      <button class="btn btn-outline btn-full btn-lg" id="btn-consumer">
        Soy cliente / consumidor
      </button>
      <p class="entry-version">Herbora Sales App · v1.0</p>
    </div>
  `;

  screen.querySelector('#btn-commercial').addEventListener('click', () => {
    Router.push('/auth');
  });

  screen.querySelector('#btn-consumer').addEventListener('click', async () => {
    await Store.setUserMode('consumer');
    Router.push('/');
  });
}
