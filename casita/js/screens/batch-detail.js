/* =========================================================
   CASITA — Screen: Batch Detail (Bottom Sheet)
   Plan de batch cooking del sábado
   ========================================================= */

const ScreenBatchDetail = (() => {

  function render() {
    const plan  = Batch.getPlan();
    const sheet = Utils.el('sheet-batch-detail');
    if (!sheet) return;

    if (!plan) {
      sheet.innerHTML = `<div class="sheet-handle"></div>
        <div class="empty-state"><div class="empty-state-icon">🍳</div>
          <div class="empty-state-title">Sin plan de batch</div>
          <div class="empty-state-desc">El plan del sábado se cargará con el menú quincenal</div>
        </div>`;
      return;
    }

    const stats       = Batch.getSessionStats();
    const completedIds = Batch.getCompletedTaskIds();

    sheet.innerHTML = `
      <div class="sheet-handle"></div>
      <div class="sheet-scroll">
        <div style="padding:var(--sp-lg) 0 var(--sp-md);">
          <h2>Batch cooking</h2>
          <p style="margin-top:4px;">Sábado · ${Utils.formatMinutes(plan.estimated_total_minutes)} estimado</p>
        </div>

        ${stats?.is_active ? `
          <div style="margin-bottom:var(--sp-md);">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="font-size:13px;font-weight:600;">Progreso</span>
              <span style="font-size:13px;color:var(--c-primary);">${stats.completed_tasks}/${stats.total_tasks} tareas</span>
            </div>
            <div class="progress-bar">
              <div class="progress-bar-fill" style="width:${stats.pct}%"></div>
            </div>
          </div>
        ` : ''}

        <div id="batch-tasks">
          ${(plan.tasks || []).map(task => _renderTask(task, completedIds.includes(task.id))).join('')}
        </div>

        ${!stats?.is_active ? `
          <button class="btn btn-primary btn-full" style="margin-top:var(--sp-lg);"
            onclick="ScreenBatchDetail.startSession()">
            🍳 Comenzar batch cooking
          </button>
        ` : `
          <button class="btn btn-ghost btn-full" style="margin-top:var(--sp-lg);"
            onclick="ScreenBatchDetail.endSession()">
            Terminar sesión
          </button>
        `}
      </div>
    `;

    _bindEvents(sheet);
  }

  function _renderTask(task, completed) {
    return `
      <div class="list-row ${completed ? 'opacity-60' : ''}" data-task="${task.id}"
        style="${completed ? 'opacity:0.6;background:var(--c-surface);' : ''}">
        <div style="width:28px;height:28px;border-radius:50%;border:2px solid ${completed ? 'var(--c-primary)' : 'var(--c-border)'};
          background:${completed ? 'var(--c-primary)' : 'transparent'};
          display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          ${completed ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <polyline points="20,6 9,17 4,12"/>
          </svg>` : ''}
        </div>
        <div class="list-row-content">
          <div class="list-row-title">${task.recipe_name}</div>
          <div class="list-row-subtitle">
            ${Utils.formatMinutes(task.duration_minutes)} · ${task.result_portions} ${task.result_unit}
            ${task.freeze_result ? ' · ❄️ Al congelador' : ''}
          </div>
          ${task.notes ? `<div style="font-size:11px;color:var(--c-text-muted);margin-top:2px;">${task.notes}</div>` : ''}
        </div>
        <div class="list-row-chevron">
          <svg viewBox="0 0 24 24"><polyline points="9,18 15,12 9,6"/></svg>
        </div>
      </div>
    `;
  }

  function _bindEvents(sheet) {
    sheet.querySelectorAll('[data-task]').forEach(row => {
      row.addEventListener('click', () => {
        const taskId    = row.dataset.task;
        const completed = Batch.getCompletedTaskIds().includes(taskId);

        if (!Batch.isSessionActive()) {
          Batch.startSession();
        }

        if (completed) {
          Batch.uncompleteTask(taskId);
        } else {
          Batch.completeTask(taskId);
          const task = Batch.getPlan()?.tasks?.find(t => t.id === taskId);
          if (task?.freeze_result) {
            Notifications.toastSuccess(`❄️ "${task.recipe_name}" enviado al congelador`);
          } else {
            Notifications.toastSuccess('Tarea completada ✓');
          }
        }

        render(); // Re-renderizar
      });
    });
  }

  function startSession() {
    Batch.startSession();
    Notifications.toastSuccess('¡Sesión de batch cooking iniciada! 🍳');
    render();
  }

  function endSession() {
    Batch.endSession();
    Notifications.toastSuccess('¡Batch cooking completado! ✓');
    Router.closeSheet();
  }

  function teardown() {}

  return { render, teardown, startSession, endSession };
})();

window.ScreenBatchDetail = ScreenBatchDetail;


/* =========================================================
   CASITA — Screen: Onboarding
   Configuración inicial de la app
   ========================================================= */

const ScreenOnboarding = (() => {

  let _step = 0;
  const STEPS = ['bienvenida', 'usuario', 'listo'];

  function render() {
    const container = Utils.el('screen-onboarding');
    if (!container) return;
    _renderStep(container);
  }

  function _renderStep(container) {
    switch (_step) {
      case 0: _renderWelcome(container); break;
      case 1: _renderUserSetup(container); break;
      case 2: _renderReady(container); break;
    }
  }

  function _renderWelcome(container) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:var(--sp-xl);text-align:center;gap:var(--sp-lg);">
        <div style="font-size:72px;">🏠</div>
        <div>
          <h1 style="font-size:36px;margin-bottom:8px;">Casita</h1>
          <p style="font-size:16px;color:var(--c-text-muted);line-height:1.5;">
            Tu planificador de menús quincenal y gestor del hogar
          </p>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--sp-sm);width:100%;max-width:300px;margin-top:var(--sp-md);">
          <div style="display:flex;align-items:center;gap:var(--sp-md);padding:var(--sp-md);background:var(--c-primary-ghost);border-radius:var(--r-md);">
            <span style="font-size:24px;">🍽️</span>
            <div style="text-align:left;">
              <div style="font-weight:600;font-size:14px;">Menú quincenal</div>
              <div style="font-size:12px;color:var(--c-text-muted);">Planifica 15 días de comidas</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:var(--sp-md);padding:var(--sp-md);background:var(--c-info-pale);border-radius:var(--r-md);">
            <span style="font-size:24px;">💧</span>
            <div style="text-align:left;">
              <div style="font-weight:600;font-size:14px;">Control de agua</div>
              <div style="font-size:12px;color:var(--c-text-muted);">Objetivo diario y quincenal</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:var(--sp-md);padding:var(--sp-md);background:var(--c-surface);border-radius:var(--r-md);">
            <span style="font-size:24px;">🛒</span>
            <div style="text-align:left;">
              <div style="font-weight:600;font-size:14px;">Lista de Mercadona</div>
              <div style="font-size:12px;color:var(--c-text-muted);">Generada automáticamente</div>
            </div>
          </div>
        </div>
        <button class="btn btn-primary" style="width:100%;max-width:300px;margin-top:var(--sp-md);"
          onclick="ScreenOnboarding.nextStep()">
          Empezar →
        </button>
      </div>
    `;
  }

  function _renderUserSetup(container) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:var(--sp-xl);text-align:center;gap:var(--sp-lg);">
        <div style="font-size:48px;">👤</div>
        <div>
          <h2>¿Quién cocina hoy?</h2>
          <p style="color:var(--c-text-muted);margin-top:8px;">Personaliza la experiencia</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--sp-sm);width:100%;max-width:300px;">
          <button class="btn btn-secondary btn-full" onclick="ScreenOnboarding.selectUser('alba')">
            👩 Alba
          </button>
          <button class="btn btn-secondary btn-full" onclick="ScreenOnboarding.selectUser('sergi')">
            👨 Sergi
          </button>
          <button class="btn btn-ghost btn-full" onclick="ScreenOnboarding.selectUser('both')">
            👫 Los dos
          </button>
        </div>
      </div>
    `;
  }

  function _renderReady(container) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:var(--sp-xl);text-align:center;gap:var(--sp-lg);">
        <div style="font-size:72px;">🎉</div>
        <div>
          <h2>¡Todo listo!</h2>
          <p style="color:var(--c-text-muted);margin-top:8px;">Tu menú quincenal está esperando</p>
        </div>
        <button class="btn btn-primary" style="width:100%;max-width:300px;margin-top:var(--sp-md);"
          onclick="ScreenOnboarding.finish()">
          Ir a Casita 🏠
        </button>
      </div>
    `;
  }

  function nextStep() {
    _step++;
    const container = Utils.el('screen-onboarding');
    if (container) _renderStep(container);
  }

  function selectUser(userId) {
    Store.set(Store.keys.APP_ACTIVE_USER, userId);
    Pantry.initDefaults();
    nextStep();
  }

  function finish() {
    Store.set(Store.keys.APP_ONBOARDING, true);
    Router.navigate('home', {}, { replace: true });
  }

  function teardown() { _step = 0; }

  return { render, teardown, nextStep, selectUser, finish };
})();

window.ScreenOnboarding = ScreenOnboarding;
