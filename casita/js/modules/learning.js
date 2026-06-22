/* =========================================================
   CASITA — Learning Module
   Motor de aprendizaje: ratings → perfil → generación menú
   ========================================================= */

const Learning = (() => {
  const { keys } = Store;

  const MIN_DAYS_BETWEEN_SAME_RECIPE    = 21; // 3 semanas
  const MIN_DAYS_BETWEEN_SUBCATEGORY    = 4;
  const MIN_DAYS_BETWEEN_SAME_CATEGORY  = 4;  // máx 2/semana → ~3-4 días mín
  const MAX_SAME_CATEGORY_PER_WEEK      = 2;
  const NOVELTY_MIN_PER_QUINCENAL       = 2;
  const NOVELTY_MAX_PER_QUINCENAL       = 4;
  const NEVER_REPEAT_THRESHOLD          = 2;  // score ≤ este valor → never repeat

  /* ── Compute ─────────────────────────────────────────────── */
  function compute() {
    const allRatings    = Ratings.getAll();
    const consumed      = Ratings.getConsumedHistory();
    const neverRepeat   = Ratings.getNeverRepeat();
    const recipes       = window.CasitaData?.recipes || [];

    /* 1. Calcular medias por categoría */
    const categoryScores = {};
    const subcategoryScores = {};
    const tagScores = {};
    const recipeScores = {};

    allRatings.forEach(r => {
      const recipe = recipes.find(rec => rec.id === r.recipe_id);
      if (!recipe) return;

      // Por receta
      if (!recipeScores[r.recipe_id]) recipeScores[r.recipe_id] = [];
      recipeScores[r.recipe_id].push(r.score);

      // Por categoría
      if (recipe.category) {
        if (!categoryScores[recipe.category]) categoryScores[recipe.category] = [];
        categoryScores[recipe.category].push(r.score);
      }

      // Por subcategoría
      if (recipe.subcategory) {
        if (!subcategoryScores[recipe.subcategory]) subcategoryScores[recipe.subcategory] = [];
        subcategoryScores[recipe.subcategory].push(r.score);
      }

      // Por tags
      (recipe.tags || []).forEach(tag => {
        if (!tagScores[tag]) tagScores[tag] = [];
        tagScores[tag].push(r.score);
      });
    });

    const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    const categoryAvg     = Object.fromEntries(Object.entries(categoryScores).map(([k, v]) => [k, avg(v)]));
    const subcategoryAvg  = Object.fromEntries(Object.entries(subcategoryScores).map(([k, v]) => [k, avg(v)]));
    const tagAvg          = Object.fromEntries(Object.entries(tagScores).map(([k, v]) => [k, avg(v)]));
    const recipeAvg       = Object.fromEntries(Object.entries(recipeScores).map(([k, v]) => [k, avg(v)]));

    /* 2. Clasificar categorías */
    const topRatedCategories  = Object.entries(categoryAvg).filter(([, v]) => v >= 4.0).map(([k]) => k);
    const avoidedCategories   = Object.entries(categoryAvg).filter(([, v]) => v < 2.5).map(([k]) => k);
    const preferredTags       = Object.entries(tagAvg).filter(([, v]) => v >= 4.0).map(([k]) => k);
    const dislikedTags        = Object.entries(tagAvg).filter(([, v]) => v < 2.5).map(([k]) => k);

    /* 3. Recetas top */
    const topRatedRecipes = Object.entries(recipeAvg)
      .filter(([, v]) => v >= 4.5)
      .map(([k]) => k);

    /* 4. Recetas recientes (últimas 3 semanas) */
    const recentRecipes = Ratings.getConsumedInLastDays(MIN_DAYS_BETWEEN_SAME_RECIPE);

    /* 5. Novelty threshold: cuantas más valoraciones, más aventureros */
    const totalRatings = allRatings.length;
    const noveltyThreshold = totalRatings < 10 ? 0.2
      : totalRatings < 30 ? 0.3
      : 0.4;

    /* 6. Cooking device preferences */
    const deviceRatings = {};
    allRatings.forEach(r => {
      const recipe = recipes.find(rec => rec.id === r.recipe_id);
      if (!recipe?.cooking_device) return;
      if (!deviceRatings[recipe.cooking_device]) deviceRatings[recipe.cooking_device] = [];
      deviceRatings[recipe.cooking_device].push(r.score);
    });
    const preferredDevices = Object.entries(deviceRatings)
      .filter(([, v]) => avg(v) >= 3.5)
      .map(([k]) => k);

    const profile = {
      computed_at: new Date().toISOString(),
      top_rated_categories: topRatedCategories,
      avoided_categories: avoidedCategories,
      top_rated_recipes: topRatedRecipes,
      never_repeat: neverRepeat,
      recent_recipes: [...new Set(recentRecipes)],
      preferred_cooking_devices: preferredDevices,
      preferred_tags: preferredTags,
      disliked_tags: dislikedTags,
      novelty_threshold: noveltyThreshold,
      category_averages: categoryAvg,
      recipe_averages: recipeAvg,
      total_ratings: totalRatings,
    };

    Store.set(keys.LEARNING_PROFILE, profile);
    Store.set(keys.LEARNING_COMPUTED, new Date().toISOString());

    return profile;
  }

  function getProfile() {
    const cached  = Store.get(keys.LEARNING_PROFILE);
    const lastComputed = Store.get(keys.LEARNING_COMPUTED);

    // Recalcular si no hay perfil o tiene más de 24h
    if (!cached || !lastComputed) return compute();
    const ageHours = (Date.now() - new Date(lastComputed)) / 3600000;
    if (ageHours > 24) return compute();

    return cached;
  }

  /* ── Score de una receta para generación ─────────────────── */
  function scoreRecipe(recipe) {
    if (!recipe) return 0;

    const profile = getProfile();

    /* Bloqueada permanentemente */
    if (profile.never_repeat.includes(recipe.id)) return 0;

    let score = 50; // base

    /* Valoración propia (peso mayor) */
    const ownRating = profile.recipe_averages?.[recipe.id];
    if (ownRating !== undefined) {
      score += (ownRating - 3) * 15; // ±30 puntos
    }

    /* Categoría preferida */
    if (profile.top_rated_categories.includes(recipe.category)) score += 12;
    if (profile.avoided_categories.includes(recipe.category)) score -= 20;

    /* Tags */
    const recipeTags = recipe.tags || [];
    const goodTags = recipeTags.filter(t => profile.preferred_tags.includes(t)).length;
    const badTags  = recipeTags.filter(t => profile.disliked_tags.includes(t)).length;
    score += goodTags * 5 - badTags * 10;

    /* Cooking device */
    if (profile.preferred_cooking_devices.includes(recipe.cooking_device)) score += 8;

    /* Reciente (penalización) */
    if (profile.recent_recipes.includes(recipe.id)) score -= 40;

    /* Temporada */
    const season = Utils.currentSeason();
    if (recipe.season?.includes(season)) score += 8;

    return Utils.clamp(score, 0, 100);
  }

  /* ── Construir constraints para generación de menú ──────── */
  function buildMenuConstraints() {
    const profile = getProfile();
    const quincenalId = Store.get(keys.APP_QUINCENAL_ID);
    const specialTheme = window.CasitaData?.meta?.special_week_theme || null;

    return {
      recipes_to_avoid: [...profile.never_repeat, ...profile.recent_recipes],
      preferred_categories: profile.top_rated_categories,
      avoided_categories: profile.avoided_categories,
      preferred_tags: profile.preferred_tags,
      disliked_tags: profile.disliked_tags,
      balance_targets: {
        pollo:    0.20, // ~3 recetas de 15
        pescado:  0.20,
        legumbre: 0.25,
        verdura:  0.15,
        huevo:    0.10,
        especial: 0.10,
      },
      novelty_slots: Math.round(
        15 * profile.novelty_threshold * 0.5
      ), // 1-3 recetas nuevas por quincena
      special_meal_type: specialTheme,
      preferred_devices: profile.preferred_cooking_devices,
      min_days_same_recipe: MIN_DAYS_BETWEEN_SAME_RECIPE,
      min_days_same_subcategory: MIN_DAYS_BETWEEN_SUBCATEGORY,
    };
  }

  /* ── Novedades controladas ───────────────────────────────── */
  function getNoveltyRecipes(count = 2) {
    const recipes  = window.CasitaData?.recipes || [];
    const consumed = new Set(Ratings.getConsumedHistory().map(h => h.recipe_id));
    const neverRepeat = new Set(Ratings.getNeverRepeat());

    return recipes
      .filter(r => !consumed.has(r.id) && !neverRepeat.has(r.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
  }

  /* ── Verificar si una receta puede usarse en una fecha ───── */
  function canUseRecipe(recipeId, targetDate) {
    const constraints = buildMenuConstraints();
    if (constraints.recipes_to_avoid.includes(recipeId)) return false;

    const history = Ratings.getConsumedHistory()
      .filter(h => h.recipe_id === recipeId)
      .sort((a, b) => new Date(b.consumed_date) - new Date(a.consumed_date));

    if (!history.length) return true;

    const lastConsumed = history[0].consumed_date;
    const daysSince = Utils.daysBetween(lastConsumed, targetDate);
    return daysSince >= MIN_DAYS_BETWEEN_SAME_RECIPE;
  }

  /* ── Insights para mostrar en UI ─────────────────────────── */
  function getInsights() {
    const profile = getProfile();
    const recipes = window.CasitaData?.recipes || [];

    const topRecipes = profile.top_rated_recipes
      .map(id => recipes.find(r => r.id === id))
      .filter(Boolean)
      .slice(0, 3);

    const insights = [];

    if (profile.top_rated_categories.includes('legumbre')) {
      insights.push({ type: 'preference', text: 'Os encantan las legumbres 🫘' });
    }
    if (profile.preferred_tags.includes('airfryer')) {
      insights.push({ type: 'device', text: 'Sois fans del airfryer ✨' });
    }
    if (profile.total_ratings >= 5) {
      insights.push({ type: 'stats', text: `${profile.total_ratings} recetas valoradas` });
    }

    return { topRecipes, insights, totalRatings: profile.total_ratings };
  }

  return { compute, getProfile, scoreRecipe, buildMenuConstraints, getNoveltyRecipes, canUseRecipe, getInsights };
})();

window.Learning = Learning;
