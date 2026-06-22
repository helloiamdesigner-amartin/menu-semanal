/* =============================================================
   Herbora Sales App — Vista: Autenticación comercial
   ============================================================= */

import { Store }  from '../data/store.js';
import { Router } from '../router/router.js';
import { showNavbar } from '../components/navbar.js';

const COMMERCIAL_PASSWORD = 'Herbora1981';

export function renderAuth() {
  const screen = document.getElementById('screen-auth');
  showNavbar(false);

  screen.innerHTML = `
    <div class="auth-header">
      <div class="auth-icon-wrap">🔒</div>
      <h1 style="color:white;font-size:20px;font-weight:700;">Acceso comercial</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;">Introduce la contraseña</p>
    </div>
    <div class="auth-body">
      <button class="btn btn-ghost btn-sm" id="btn-back-entry" style="align-self:flex-start;">
        ← Volver
      </button>
      <div class="auth-password-wrap">
        <input
          class="input"
          type="password"
          id="auth-password"
          placeholder="Contraseña"
          autocomplete="current-password"
          style="text-align:center;letter-spacing:4px;font-size:18px;"
        >
        <button class="auth-toggle-pw" id="toggle-pw" type="button" aria-label="Ver contraseña">👁</button>
      </div>
      <div id="auth-error" style="display:none;"></div>
      <button class="btn btn-primary btn-full btn-lg" id="btn-enter">Entrar</button>
    </div>
  `;

  const input   = screen.querySelector('#auth-password');
  const errorEl = screen.querySelector('#auth-error');
  const btnEnter = screen.querySelector('#btn-enter');

  screen.querySelector('#btn-back-entry').addEventListener('click', () => Router.push('/entrada'));

  screen.querySelector('#toggle-pw').addEventListener('click', () => {
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  function tryLogin() {
    const val = input.value.trim();
    if (val === COMMERCIAL_PASSWORD) {
      errorEl.style.display = 'none';
      Store.setUserMode('commercial').then(() => Router.push('/'));
    } else {
      errorEl.className = 'auth-error';
      errorEl.textContent = 'Contraseña incorrecta. Inténtalo de nuevo.';
      errorEl.style.display = 'block';
      input.value = '';
      input.focus();
    }
  }

  btnEnter.addEventListener('click', tryLogin);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });

  setTimeout(() => input.focus(), 100);
}
