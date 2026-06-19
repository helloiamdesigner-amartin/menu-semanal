/* =========================================================
   CASITA — Menu Module
   Menú quincenal: acceso, overrides, consumo
   ========================================================= */

const Menu = (() => {
  const { keys } = Store;

  /* ── Datos base ──────────────────────────────────────────── */
  function getBaseMenu() {
    return window.CasitaData?.menu || { days: [] };
  }

  function getRecipes() {
    return window.CasitaData?.recipes || [];
  }

  function findRecipe(id) {
    return getRecipes().find(r => r.id === id) || null;
  }

  /* ── Overrides (cambios manuales del usuario) ───────────── */
  function getOverrides() {
    return Store.get(keys.MENU_OVERRIDES) || [];
  }

  function findOverride(date, mealType) {
    return getOverrides().find(o => o.date === date && o.meal_type === mealType) || null;
  }

  /* ── Menú activo (base + overrides) ─────────────────────── */
  function getActiveMenu() {
    const base      = getBaseMenu();
    const overrides = getOverrides();

    const days = base.days.map(day => {
      const dayClone = { ...day };

      ['breakfast', 'lunch', 'dinner'].forEach(meal => {
        const override = overrides.find(o => o.date === day.date && o.meal_type === meal);
        if (override) {
          dayClone[meal] = {
            ...dayClone[meal],
            recipe_id:   override.recipe_id,
            recipe_name: override.recipe_name,
            image:       override.image || dayClone[meal].image,
            is_override: true,
          };
        }
      });

      return dayClone;
    });

    return { ...base, days };
  }

  function getDayMenu(date) {
    return getActiveMenu().days.find(d => d.date === date) || null;
  }

  function getTodayMeals() {
    return getDayMenu(Utils.today());
  }

  function getWeekMeals(weekStartDate) {
    const active = getActiveMenu();
    const weekDates = Utils.getWeekDays(weekStartDate);
    return active.days.filter(d => weekDates.includes(d.date));
  }

  function getUpcomingDays(count = 15) {
    const active  = getActiveMenu();
    const today   = Utils.today();
    return active.days
      .filter(d => d.date >= today)
      .slice(0, count);
  }

  /* ── Featured recipe del día ─────────────────────────────── */
  function getTodayFeatured() {
    const today = getTodayMeals();
    if (!today) return null;

    // La comida featured es la que tiene is_featured=true, o en su defecto lunch
    const featured = today.lunch?.is_featured
      ? today.lunch
      : today.lunch || today.dinner;

    if (!featured?.recipe_id) return null;
    const recipe = findRecipe(featured.recipe_id);
    return { ...featured, recipe };
  }

  /* ── Override manual ─────────────────────────────────────── */
  function overrideDay(date, mealType, newRecipeId) {
    const overrides = getOverrides();
    const recipe    = findRecipe(newRecipeId);
    if (!recipe) return false;

    // Guardar la receta que se sustituye (para historial)
    const currentMeal = getDayMenu(date)?.[mealType];
    if (currentMeal?.recipe_id) {
      Ratings.addConsumed(
        currentMeal.recipe_id,
        currentMeal.recipe_name,
        date,
        mealType,
        false
      );
    }

    // Eliminar override existente para esta combinación
    const filtered = overrides.filter(o => !(o.date === date && o.meal_type === mealType));
    filtered.push({
      date,
      meal_type:    mealType,
      recipe_id:    newRecipeId,
      recipe_name:  recipe.name,
      image:        recipe.image,
      replaced_at:  new Date().toISOString(),
      replaced_recipe_id: currentMeal?.recipe_id || null,
    });

    Store.set(keys.MENU_OVERRIDES, filtered);
    return true;
  }

  function removeOverride(date, mealType) {
    const overrides = getOverrides().filter(
      o => !(o.date === date && o.meal_type === mealType)
    );
    Store.set(keys.MENU_OVERRIDES, overrides);
  }

  /* ── Registrar consumo del día ───────────────────────────── */
  function markTodayConsumed() {
    const today   = Utils.today();
    const dayMenu = getTodayMeals();
    if (!dayMenu) return;

    ['breakfast', 'lunch', 'dinner'].forEach(meal => {
      const mealData = dayMenu[meal];
      if (!mealData?.recipe_id) return;
      Ratings.addConsumed(
        mealData.recipe_id,
        mealData.recipe_name,
        today,
        meal,
        mealData.is_override || false
      );
    });
  }

  /* ── Info de receta para un día/comida ───────────────────── */
  function getRecipeForMeal(date, mealType) {
    const day = getDayMenu(date);
    if (!day) return null;
    const meal = day[mealType];
    if (!meal?.recipe_id) return null;
    return findRecipe(meal.recipe_id);
  }

  /* ── Batch cooking del plan ──────────────────────────────── */
  function getBatchPlan() {
    return window.CasitaData?.batchCooking || null;
  }

  /* ── Semana especial ─────────────────────────────────────── */
  function getSpecialWeekTheme() {
    return window.CasitaData?.meta?.special_week_theme || null;
  }

  function getSpecialRecipe() {
    const theme = getSpecialWeekTheme();
    if (!theme) return null;
    const active = getActiveMenu();
    const specialDay = active.days.find(d => d.lunch?.special_type === theme);
    if (!specialDay?.lunch?.recipe_id) return null;
    return findRecipe(specialDay.lunch.recipe_id);
  }

  /* ── Período de la quincena ──────────────────────────────── */
  function getQuincenalPeriod() {
    const meta = window.CasitaData?.meta;
    if (!meta) return null;
    return {
      id:    meta.quincenal_id,
      start: meta.period_start,
      end:   meta.period_end,
      label: `${Utils.formatDate(meta.period_start, { day: 'numeric', month: 'long' })} – ${Utils.formatDate(meta.period_end, { day: 'numeric', month: 'long' })}`,
    };
  }

  /* ── Guardar historial del menú al cambiar de quincena ───── */
  function archiveCurrentMenu() {
    const active     = getActiveMenu();
    const history    = Store.get(keys.MENU_HISTORY) || [];
    const quincenalId = Store.get(keys.APP_QUINCENAL_ID);

    history.push({
      quincenal_id: quincenalId,
      archived_at:  new Date().toISOString(),
      menu:         active,
    });

    // Guardar últimas 3 quincenas
    Store.set(keys.MENU_HISTORY, history.slice(-3));
    Store.set(keys.MENU_OVERRIDES, []);
  }

  return {
    getBaseMenu, getActiveMenu, getDayMenu, getTodayMeals,
    getWeekMeals, getUpcomingDays, getTodayFeatured,
    overrideDay, removeOverride,
    markTodayConsumed, getRecipeForMeal,
    getBatchPlan, getSpecialWeekTheme, getSpecialRecipe,
    getQuincenalPeriod, archiveCurrentMenu,
    findRecipe,
  };
})();

window.Menu = Menu;
