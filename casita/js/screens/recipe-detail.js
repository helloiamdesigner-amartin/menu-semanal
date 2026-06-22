/* =========================================================
   CASITA — Screen: Recipe Detail (Bottom Sheet)
   Detalle completo de una receta con tabs
   ========================================================= */

const ScreenRecipeDetail = (() => {

  let _currentRecipeId = null;
  let _activeTab       = 'ingredientes';

  function render(params = {}) {
    const recipeId = params.recipe_id;
    if (!recipeId) return;

    _currentRecipeId = recipeId;
    _activeTab       = 'ingredientes';

    const recipe  = Menu.findRecipe(recipeId);
    const sheet   = Utils.el('sheet-recipe-detail');
    if (!sheet || !recipe) return;

    const isFav   = Ratings.isFavorite(recipeId);
    const avgScore = Ratings.getAverageScore(recipeId);
    const consumed = Ratings.getConsumedCount(recipeId);

    sheet.innerHTML = `
      <div class="sheet-handle"></div>

      <!-- Foto -->
      <div class="recipe-detail-photo-wrap" style="position:relative;">
        <img class="recipe-detail-photo"
          src="${Utils.imgWithFallback(recipe.image)}" alt="${recipe.name}"
          onerror="this.src='assets/images/meals/placeholder.jpg'"
          style="width:100%;height:220px;object-fit:cover;">
        <button class="hero-heart heart-btn ${isFav ? 'is-fav' : ''}"
          id="detail-fav-btn" data-recipe="${recipeId}"
          style="position:absolute;top:12px;right:12px;"
          aria-label="Favorito">
          <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      <!-- Body scrollable -->
      <div class="sheet-scroll">
        <!-- Título y meta -->
        <div style="padding:var(--sp-lg) 0 var(--sp-md);">
          <h2>${recipe.name}</h2>
          <div style="display:flex;gap:var(--sp-md);margin-top:8px;flex-wrap:wrap;align-items:center;">
            <span style="font-size:13px;color:var(--c-text-muted);">⏱ ${recipe.time_minutes} min</span>
            <span style="font-size:13px;color:var(--c-text-muted);">👥 ${recipe.servings} raciones</span>
            <span style="font-size:13px;color:var(--c-text-muted);">${_difficultyIcon(recipe.difficulty)} ${recipe.difficulty}</span>
            ${avgScore ? `
              <div style="display:flex;align-items:center;gap:4px;">
                <span class="star"><svg viewBox="0 0 24 24" fill="var(--c-secondary)" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span>
                <span style="font-size:13px;font-weight:600;">${avgScore}</span>
              </div>
            ` : ''}
          </div>

          <!-- Tags -->
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;">
            ${(recipe.tags || []).map(t => `<span class="badge badge-muted">${t}</span>`).join('')}
          </div>

          <!-- Airfryer tip -->
          ${recipe.cooking_device === 'airfryer' ? `
            <div class="airfryer-card" style="margin-top:var(--sp-md);">
              <div class="airfryer-card-icon">✈️</div>
              <div class="airfryer-card-content">
                <div class="airfryer-card-title">Airfryer — ${recipe.airfryer_temp}°C · ${recipe.airfryer_time} min</div>
                ${recipe.airfryer_tip ? `<div class="airfryer-card-tip">${recipe.airfryer_tip}</div>` : ''}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Tabs: Ingredientes / Pasos / Info -->
        <div class="recipe-detail-tabs">
          <button class="recipe-detail-tab active" data-tab="ingredientes">Ingredientes</button>
          <button class="recipe-detail-tab" data-tab="pasos">Pasos</button>
          <button class="recipe-detail-tab" data-tab="info">Información</button>
        </div>

        <!-- Tab: Ingredientes -->
        <div id="detail-tab-ingredientes" class="detail-tab-content">
          ${recipe.ingredients.map(ing => `
            <div class="ingredient-row">
              <span style="font-size:var(--text-body);color:var(--c-text-primary);">${ing.name}</span>
              <span style="font-size:var(--text-body-sm);color:var(--c-text-muted);font-weight:600;">
                ${ing.quantity} ${ing.unit}
              </span>
            </div>
          `).join('')}
        </div>

        <!-- Tab: Pasos -->
        <div id="detail-tab-pasos" class="detail-tab-content" style="display:none;">
          ${recipe.steps.map(step => `
            <div class="step-row">
              <div class="step-number">${step.order}</div>
              <div>
                <p style="color:var(--c-text-primary);font-size:var(--text-body);">${step.text}</p>
                ${step.tip ? `<p style="font-size:var(--text-body-sm);color:var(--c-primary);margin-top:4px;">💡 ${step.tip}</p>` : ''}
                ${step.duration_minutes ? `<p style="font-size:var(--text-caption);color:var(--c-text-muted);margin-top:4px;">⏱ ${step.duration_minutes} min</p>` : ''}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Tab: Info -->
        <div id="detail-tab-info" class="detail-tab-content" style="display:none;">
          ${recipe.nutrition ? `
            <div style="background:var(--c-surface);border-radius:var(--r-md);padding:var(--sp-md);margin-bottom:var(--sp-md);">
              <div style="font-weight:600;margin-bottom:10px;">Información nutricional (por ración)</div>
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center;">
                ${[
                  ['Calorías', recipe.nutrition.calories, 'kcal'],
                  ['Proteína', recipe.nutrition.protein, 'g'],
                  ['Hidratos', recipe.nutrition.carbs, 'g'],
                  ['Grasa', recipe.nutrition.fat, 'g'],
                ].map(([label, val, unit]) => `
                  <div>
                    <div style="font-size:18px;font-weight:700;color:var(--c-primary);">${val}</div>
                    <div style="font-size:10px;color:var(--c-text-muted);">${unit}</div>
                    <div style="font-size:10px;color:var(--c-text-muted);margin-top:2px;">${label}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${recipe.batch_compatible ? `<span class="badge badge-success">🍳 Apto batch</span>` : ''}
            ${recipe.freezable ? `<span class="badge badge-info">❄️ Congelable ${recipe.freezer_duration_weeks}s</span>` : ''}
          </div>
          ${consumed > 0 ? `
            <p style="margin-top:var(--sp-md);font-size:var(--text-body-sm);color:var(--c-text-muted);">
              Has preparado esta receta ${consumed} veces
            </p>
          ` : ''}
        </div>

        <!-- Valoración -->
        <div style="margin-top:var(--sp-lg);padding-top:var(--sp-md);border-top:1px solid var(--c-border);">
          <div style="font-weight:600;margin-bottom:10px;">Tu valoración</div>
          <div class="rating-row" id="detail-rating-row">
            ${[1,2,3,4,5].map(n => `
              <button class="rating-star ${avgScore && n <= Math.round(avgScore) ? 'filled' : ''}"
                data-score="${n}" aria-label="${n} estrella${n > 1 ? 's' : ''}">
                <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Acciones sticky -->
      <div class="recipe-detail-actions">
        <button class="btn btn-ghost" style="flex:1;" onclick="ScreenRecipeDetail.addToShopping()">
          🛒 A la compra
        </button>
        <button class="btn btn-primary" style="flex:1;" onclick="ScreenRecipeDetail.markConsumedToday()">
          ✓ Cocinado hoy
        </button>
      </div>
    `;

    _bindEvents(sheet);
  }

  function _difficultyIcon(d) {
    return { 'fácil': '🟢', 'medio': '🟡', 'difícil': '🔴' }[d] || '';
  }

  function _bindEvents(sheet) {
    // Tabs
    sheet.querySelectorAll('.recipe-detail-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        sheet.querySelectorAll('.recipe-detail-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        sheet.querySelectorAll('.detail-tab-content').forEach(c => c.style.display = 'none');
        const content = sheet.querySelector(`#detail-tab-${tabName}`);
        if (content) content.style.display = '';
      });
    });

    // Favorito
    sheet.querySelector('#detail-fav-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      const recipeId = e.currentTarget.dataset.recipe;
      const isFav    = Ratings.toggleFavorite(recipeId);
      e.currentTarget.classList.toggle('is-fav', isFav);
      e.currentTarget.classList.add('animating');
      setTimeout(() => e.currentTarget.classList.remove('animating'), 400);
      Notifications.toastSuccess(isFav ? '❤️ Añadida a favoritas' : 'Eliminada de favoritas');
      Utils.haptic('medium');
    });

    // Valoración
    sheet.querySelectorAll('.rating-star').forEach(star => {
      star.addEventListener('click', () => {
        const score = parseInt(star.dataset.score);
        Ratings.rate(_currentRecipeId, score);
        sheet.querySelectorAll('.rating-star').forEach((s, i) => {
          s.classList.toggle('filled', i < score);
        });
        Notifications.toastSuccess(`Valoración guardada: ${score} ⭐`);
        Utils.haptic('medium');
      });
    });
  }

  function addToShopping() {
    const recipe = Menu.findRecipe(_currentRecipeId);
    if (!recipe) return;
    recipe.ingredients.forEach(ing => {
      Shopping.addManualItem(ing.name, ing.quantity, ing.unit);
    });
    Notifications.toastSuccess('Ingredientes añadidos a la lista ✓');
    Router.closeSheet();
  }

  function markConsumedToday() {
    const recipe = Menu.findRecipe(_currentRecipeId);
    if (!recipe) return;
    Ratings.addConsumed(_currentRecipeId, recipe.name, Utils.today(), 'lunch', true);
    Notifications.toastSuccess('¡Receta marcada como cocinada! ✓');
    Utils.haptic('success');
    Router.closeSheet();
  }

  function teardown() {
    _currentRecipeId = null;
  }

  return { render, teardown, addToShopping, markConsumedToday };
})();

window.ScreenRecipeDetail = ScreenRecipeDetail;
