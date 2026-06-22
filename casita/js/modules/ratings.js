/* =========================================================
   CASITA — Ratings Module
   Valoraciones, historial de consumo, favoritos
   ========================================================= */

const Ratings = (() => {
  const { keys } = Store;

  /* ── Valoraciones ───────────────────────────────────────── */
  function getAll() {
    return Store.get(keys.RATINGS) || [];
  }

  function getForRecipe(recipeId) {
    return getAll().filter(r => r.recipe_id === recipeId);
  }

  function getAverageScore(recipeId) {
    const ratings = getForRecipe(recipeId);
    if (!ratings.length) return null;
    const sum = ratings.reduce((acc, r) => acc + r.score, 0);
    return (sum / ratings.length).toFixed(1);
  }

  function rate(recipeId, score, notes = null, userId = null) {
    const activeUser = userId || Store.get(keys.APP_ACTIVE_USER) || 'both';
    const quincenalId = Store.get(keys.APP_QUINCENAL_ID);

    const ratings = getAll();
    const newRating = {
      id: Utils.generateId('rating'),
      recipe_id: recipeId,
      user_id: activeUser,
      score,
      rated_at: new Date().toISOString(),
      notes,
      quincenal_id: quincenalId,
    };

    ratings.push(newRating);
    Store.set(keys.RATINGS, ratings);

    /* Si score ≤ 2, añadir a never_repeat automáticamente */
    if (score <= 2) {
      addToNeverRepeat(recipeId);
    }

    /* Invalidar perfil de aprendizaje */
    Store.remove(keys.LEARNING_PROFILE);

    return newRating;
  }

  function getRecentlyRated(count = 10) {
    return getAll()
      .sort((a, b) => new Date(b.rated_at) - new Date(a.rated_at))
      .slice(0, count);
  }

  function getHistory(filters = {}) {
    let ratings = getAll();
    if (filters.minScore) ratings = ratings.filter(r => r.score >= filters.minScore);
    if (filters.maxScore) ratings = ratings.filter(r => r.score <= filters.maxScore);
    if (filters.userId)   ratings = ratings.filter(r => r.user_id === filters.userId);
    if (filters.since)    ratings = ratings.filter(r => r.rated_at >= filters.since);
    return ratings.sort((a, b) => new Date(b.rated_at) - new Date(a.rated_at));
  }

  function exportHistoryCSV() {
    const ratings = getAll();
    const header = 'recipe_id,recipe_name,score,user_id,rated_at,notes';
    const rows = ratings.map(r => {
      const recipe = (window.CasitaData?.recipes || []).find(rec => rec.id === r.recipe_id);
      return [
        r.recipe_id,
        `"${recipe?.name || r.recipe_id}"`,
        r.score,
        r.user_id,
        r.rated_at,
        `"${r.notes || ''}"`,
      ].join(',');
    });
    return [header, ...rows].join('\n');
  }

  /* ── Never Repeat ───────────────────────────────────────── */
  function getNeverRepeat() {
    return Store.get(keys.NEVER_REPEAT) || [];
  }

  function addToNeverRepeat(recipeId) {
    const list = getNeverRepeat();
    if (!list.includes(recipeId)) {
      list.push(recipeId);
      Store.set(keys.NEVER_REPEAT, list);
    }
  }

  function removeFromNeverRepeat(recipeId) {
    const list = getNeverRepeat().filter(id => id !== recipeId);
    Store.set(keys.NEVER_REPEAT, list);
  }

  function toggleNeverRepeat(recipeId) {
    const list = getNeverRepeat();
    if (list.includes(recipeId)) {
      removeFromNeverRepeat(recipeId);
      return false; // ya no está bloqueada
    } else {
      addToNeverRepeat(recipeId);
      return true;  // ahora está bloqueada
    }
  }

  function isNeverRepeat(recipeId) {
    return getNeverRepeat().includes(recipeId);
  }

  /* ── Favoritos ──────────────────────────────────────────── */
  function getFavorites() {
    return Store.get(keys.FAVORITES) || [];
  }

  function isFavorite(recipeId) {
    return getFavorites().includes(recipeId);
  }

  function toggleFavorite(recipeId) {
    const favs = getFavorites();
    const idx = favs.indexOf(recipeId);
    if (idx >= 0) {
      favs.splice(idx, 1);
      Store.set(keys.FAVORITES, favs);
      return false; // eliminado de favoritos
    } else {
      favs.push(recipeId);
      Store.set(keys.FAVORITES, favs);
      return true; // añadido a favoritos
    }
  }

  /* ── Historial de consumo ───────────────────────────────── */
  function getConsumedHistory() {
    return Store.get(keys.CONSUMED_HISTORY) || [];
  }

  function addConsumed(recipeId, recipeName, date, mealType, wasOverride = false) {
    const history = getConsumedHistory();
    const quincenalId = Store.get(keys.APP_QUINCENAL_ID);

    // No duplicar si ya está registrado (misma receta, mismo día, mismo tipo)
    const exists = history.some(h =>
      h.recipe_id === recipeId &&
      h.consumed_date === date &&
      h.meal_type === mealType
    );
    if (exists) return;

    history.push({
      id: Utils.generateId('consumed'),
      recipe_id: recipeId,
      recipe_name: recipeName,
      consumed_date: date,
      meal_type: mealType,
      quincenal_id: quincenalId,
      was_override: wasOverride,
    });

    Store.set(keys.CONSUMED_HISTORY, history);

    /* Si la receta se consume por segunda vez, sugerir valoración */
    const timesConsumed = history.filter(h => h.recipe_id === recipeId).length;
    return { timesConsumed, shouldPromptRating: timesConsumed === 2 };
  }

  function getConsumedInLastDays(days) {
    const cutoff = Utils.addDays(Utils.today(), -days);
    return getConsumedHistory()
      .filter(h => h.consumed_date >= cutoff)
      .map(h => h.recipe_id);
  }

  function getConsumedCount(recipeId) {
    return getConsumedHistory().filter(h => h.recipe_id === recipeId).length;
  }

  /* ── Historial de valoraciones por receta (UI display) ─── */
  function getRecipeHistoryForDisplay(recipeId) {
    const history = getConsumedHistory()
      .filter(h => h.recipe_id === recipeId)
      .sort((a, b) => new Date(b.consumed_date) - new Date(a.consumed_date))
      .slice(0, 5);

    const ratings = getForRecipe(recipeId);

    return history.map(h => ({
      ...h,
      rating: ratings.find(r =>
        r.rated_at.startsWith(h.consumed_date) ||
        Utils.daysBetween(h.consumed_date, r.rated_at.split('T')[0]) <= 1
      ) || null,
      daysAgo: Utils.daysAgo(h.consumed_date),
    }));
  }

  return {
    getAll, getForRecipe, getAverageScore, rate, getRecentlyRated,
    getHistory, exportHistoryCSV,
    getNeverRepeat, addToNeverRepeat, removeFromNeverRepeat,
    toggleNeverRepeat, isNeverRepeat,
    getFavorites, isFavorite, toggleFavorite,
    getConsumedHistory, addConsumed, getConsumedInLastDays,
    getConsumedCount, getRecipeHistoryForDisplay,
  };
})();

window.Ratings = Ratings;
