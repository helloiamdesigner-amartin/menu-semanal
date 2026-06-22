/* =========================================================
   CASITA — Water Module
   Tracker diario y quincenal de consumo de agua
   ========================================================= */

const Water = (() => {
  const { keys } = Store;

  /* ── Config (desde CasitaData) ─────────────────────────── */
  function getConfig() {
    const cfg = window.CasitaData?.config?.water;
    return {
      dailyGoalMl:   (cfg?.daily_goal_liters  || 5) * 1000,
      biweeklyGoalL: cfg?.biweekly_goal_liters || 70,
      bottles:       cfg?.biweekly_bottles     || 14,
      bottleMl:      (cfg?.bottle_size_liters  || 5) * 1000,
    };
  }

  /* ── Log diario ─────────────────────────────────────────── */
  function getDailyLog() {
    return Store.get(keys.WATER_DAILY_LOG) || [];
  }

  function saveDailyLog(log) {
    Store.set(keys.WATER_DAILY_LOG, log);
  }

  function getTodayEntry() {
    const log = getDailyLog();
    const today = Utils.today();
    return log.find(e => e.date === today) || null;
  }

  function getTodayTotal() {
    return getTodayEntry()?.amount_ml || 0;
  }

  /* ── Añadir consumo ─────────────────────────────────────── */
  function addEntry(amountMl) {
    const today = Utils.today();
    const log = getDailyLog();
    const idx = log.findIndex(e => e.date === today);
    const { dailyGoalMl } = getConfig();
    const now = new Date().toISOString();

    if (idx >= 0) {
      log[idx].amount_ml += amountMl;
      log[idx].entries.push({ time: now, amount_ml: amountMl });
      log[idx].goal_reached = log[idx].amount_ml >= dailyGoalMl;
    } else {
      log.push({
        date: today,
        amount_ml: amountMl,
        entries: [{ time: now, amount_ml: amountMl }],
        goal_reached: amountMl >= dailyGoalMl,
      });
    }

    saveDailyLog(log);
    _updateBiweeklyBottles(amountMl);

    const wasJustReached = !getTodayEntry()?.goal_reached &&
      (getTodayTotal() >= dailyGoalMl);

    return {
      newTotal: getTodayTotal(),
      goalReached: log.find(e => e.date === today)?.goal_reached || false,
      justReached: wasJustReached,
    };
  }

  function addBottle() {
    const { bottleMl } = getConfig();
    return addEntry(bottleMl);
  }

  /* ── Progreso ───────────────────────────────────────────── */
  function getTodayProgress() {
    const { dailyGoalMl } = getConfig();
    const current = getTodayTotal();
    return {
      current_ml: current,
      goal_ml: dailyGoalMl,
      current_l: (current / 1000).toFixed(1),
      goal_l: (dailyGoalMl / 1000).toFixed(1),
      percentage: Utils.pct(current, dailyGoalMl),
      reached: current >= dailyGoalMl,
    };
  }

  /* ── Quincena ───────────────────────────────────────────── */
  function getBiweeklyLog() {
    return Store.get(keys.WATER_BIWEEKLY) || [];
  }

  function getCurrentBiweeklySession() {
    const id = Store.get(keys.APP_QUINCENAL_ID);
    const sessions = getBiweeklyLog();
    return sessions.find(s => s.quincenal_id === id) || {
      quincenal_id: id,
      bottles_consumed: 0,
      ml_consumed: 0,
      updated_at: new Date().toISOString(),
    };
  }

  function _updateBiweeklyBottles(addedMl) {
    const id = Store.get(keys.APP_QUINCENAL_ID);
    const sessions = getBiweeklyLog();
    const idx = sessions.findIndex(s => s.quincenal_id === id);
    const { bottleMl } = getConfig();

    if (idx >= 0) {
      sessions[idx].ml_consumed = (sessions[idx].ml_consumed || 0) + addedMl;
      sessions[idx].bottles_consumed = Math.floor(sessions[idx].ml_consumed / bottleMl);
      sessions[idx].updated_at = new Date().toISOString();
    } else {
      sessions.push({
        quincenal_id: id,
        ml_consumed: addedMl,
        bottles_consumed: Math.floor(addedMl / bottleMl),
        updated_at: new Date().toISOString(),
      });
    }
    Store.set(keys.WATER_BIWEEKLY, sessions);
  }

  function getBiweeklyProgress() {
    const { biweeklyGoalL, bottles, bottleMl } = getConfig();
    const session = getCurrentBiweeklySession();
    const mlConsumed = session.ml_consumed || 0;
    const litersConsumed = mlConsumed / 1000;
    const bottlesConsumed = Math.floor(mlConsumed / bottleMl);

    return {
      liters: litersConsumed.toFixed(1),
      goal_liters: biweeklyGoalL,
      bottles: bottlesConsumed,
      goal_bottles: bottles,
      bottles_remaining: Math.max(0, bottles - bottlesConsumed),
      percentage: Utils.pct(litersConsumed, biweeklyGoalL),
      reached: litersConsumed >= biweeklyGoalL,
    };
  }

  /* ── Historial ──────────────────────────────────────────── */
  function getHistory(days = 7) {
    const log = getDailyLog();
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = Utils.addDays(Utils.today(), -i);
      const entry = log.find(e => e.date === date);
      result.push({
        date,
        amount_ml: entry?.amount_ml || 0,
        goal_reached: entry?.goal_reached || false,
      });
    }
    return result;
  }

  function getDailyAverage() {
    const history = getHistory(14);
    const withData = history.filter(h => h.amount_ml > 0);
    if (!withData.length) return 0;
    const total = withData.reduce((sum, h) => sum + h.amount_ml, 0);
    return (total / withData.length / 1000).toFixed(1);
  }

  /* ── Reset diario (llamado a medianoche) ─────────────────── */
  function checkDayReset() {
    // El historial diario se acumula, no se borra.
    // Esta función puede limpiar entradas muy antiguas (>90 días)
    const log = getDailyLog();
    const cutoff = Utils.addDays(Utils.today(), -90);
    const trimmed = log.filter(e => e.date >= cutoff);
    if (trimmed.length < log.length) saveDailyLog(trimmed);
  }

  return {
    getConfig, getTodayTotal, getTodayProgress, addEntry, addBottle,
    getBiweeklyProgress, getHistory, getDailyAverage, checkDayReset,
  };
})();

window.Water = Water;
