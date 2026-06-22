/* =========================================================
   CASITA — Batch Module
   Batch cooking: planificación y ejecución del sábado
   ========================================================= */

const Batch = (() => {
  const { keys } = Store;

  function getPlan() {
    return window.CasitaData?.batchCooking || null;
  }

  /* ── Sesión activa ───────────────────────────────────────── */
  function getCurrentProgress() {
    return Store.get(keys.BATCH_PROGRESS) || null;
  }

  function isSessionActive() {
    const prog = getCurrentProgress();
    return !!prog?.started_at;
  }

  function startSession() {
    const plan = getPlan();
    if (!plan) return false;

    Store.set(keys.BATCH_PROGRESS, {
      quincenal_id:    Store.get(keys.APP_QUINCENAL_ID),
      started_at:      new Date().toISOString(),
      completed_tasks: [],
      frozen_items:    [],
    });
    return true;
  }

  function completeTask(taskId) {
    const prog = getCurrentProgress();
    if (!prog) return;

    if (!prog.completed_tasks.includes(taskId)) {
      prog.completed_tasks.push(taskId);
    }
    Store.set(keys.BATCH_PROGRESS, prog);
    Utils.haptic('medium');

    // ¿Enviar al congelador?
    const plan = getPlan();
    const task = plan?.tasks?.find(t => t.id === taskId);
    if (task?.freeze_result) {
      const item = Freezer.addFromBatch(task);
      prog.frozen_items.push(item.id);
      Store.set(keys.BATCH_PROGRESS, prog);
    }

    return getProgressPct();
  }

  function uncompleteTask(taskId) {
    const prog = getCurrentProgress();
    if (!prog) return;
    prog.completed_tasks = prog.completed_tasks.filter(id => id !== taskId);
    Store.set(keys.BATCH_PROGRESS, prog);
  }

  function getProgressPct() {
    const plan = getPlan();
    const prog = getCurrentProgress();
    if (!plan?.tasks?.length || !prog) return 0;
    return Utils.pct(prog.completed_tasks.length, plan.tasks.length);
  }

  function getCompletedTaskIds() {
    return getCurrentProgress()?.completed_tasks || [];
  }

  function endSession() {
    const prog = getCurrentProgress();
    if (!prog) return;

    const sessions = Store.get(keys.BATCH_SESSIONS) || [];
    sessions.push({
      ...prog,
      ended_at: new Date().toISOString(),
      pct:      getProgressPct(),
    });
    Store.set(keys.BATCH_SESSIONS, sessions.slice(-6)); // últimas 6 sesiones
    Store.set(keys.BATCH_PROGRESS, null);
  }

  /* ── Stats de la sesión ──────────────────────────────────── */
  function getSessionStats() {
    const plan  = getPlan();
    const prog  = getCurrentProgress();
    if (!plan) return null;

    const completedIds = prog?.completed_tasks || [];
    const totalTime    = (plan.tasks || []).reduce((s, t) => s + t.duration_minutes, 0);
    const doneTime     = (plan.tasks || [])
      .filter(t => completedIds.includes(t.id))
      .reduce((s, t) => s + t.duration_minutes, 0);

    return {
      total_tasks:     plan.tasks?.length || 0,
      completed_tasks: completedIds.length,
      total_minutes:   totalTime,
      done_minutes:    doneTime,
      pct:             getProgressPct(),
      is_active:       isSessionActive(),
    };
  }

  return {
    getPlan, getCurrentProgress, isSessionActive,
    startSession, completeTask, uncompleteTask, endSession,
    getProgressPct, getCompletedTaskIds, getSessionStats,
  };
})();

window.Batch = Batch;
