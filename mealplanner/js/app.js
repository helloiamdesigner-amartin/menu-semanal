/* ── State ─────────────────────────────────────────────── */
const S = {
  screen: 'today',
  weekDay: 0,
  shopChecks: {},
  prepChecks: {},
  mealDone: {},
  ratings: {},
  waterHome: 2,
  sheetMeal: null,
  sheetDayId: null,
  sheetSlot: null,
};

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem('menu-state') || '{}');
    Object.assign(S, saved);
    S.screen = 'today';
  } catch(e) {}
}
function save() {
  try {
    const { screen, sheetMeal, ...rest } = S;
    localStorage.setItem('menu-state', JSON.stringify(rest));
  } catch(e) {}
}

/* ── Utils ─────────────────────────────────────────────── */
function today() {
  const d = new Date();
  return (d.getDay() + 6) % 7;
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}
function tagHTML(tags) {
  const map = {
    pescado: '🐟 Pescado', legumbres: '🌱 Legumbres', vegetariano: '🥬 Vegetal',
    carne: '🥩 Carne', especial: '🎉 Especial', rapida: '⚡ Rápida',
    airfryer: '🔥 Airfryer', 'sin cocinar': '✨ Sin cocinar'
  };
  return (tags || []).map(t => `<span class="tag tag-${t.replace(' ','-')}">${map[t]||t}</span>`).join('');
}
function starsHTML(n, cls='star') {
  return Array.from({length:5}, (_,i) => `<span class="${cls}${i<n?' on':''}">${i<n?'★':'☆'}</span>`).join('');
}
function tagColorClass(tags) {
  if (!tags || !tags.length) return '';
  if (tags.includes('pescado')) return 'fish';
  if (tags.includes('especial')) return 'special';
  if (tags.includes('carne')) return 'meat';
  if (tags.includes('vegetariano') || tags.includes('legumbres')) return 'veg';
  return '';
}

/* ── Navigation ─────────────────────────────────────────── */
function navigate(screen) {
  S.screen = screen;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('screen-' + screen).classList.add('active');
  const navEl = document.querySelector(`.nav-item[data-screen="${screen}"]`);
  if (navEl) navEl.classList.add('active');
  renderScreen(screen);
}

/* ── TODAY ──────────────────────────────────────────────── */
function renderToday() {
  const idx = today();
  const day = WEEK_DATA.days[idx];
  const el = document.getElementById('screen-today');

  const dayNames = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  const todayName = dayNames[idx];

  // Freezer alert
  const fAlert = WEEK_DATA.freezer.tomorrow.length
    ? `<div class="card mt-12"><div class="tip-card"><div class="tip-icon">🧊</div><div class="tip-content"><div class="tip-label">Sacar del congelador mañana</div><div class="tip-text">${WEEK_DATA.freezer.tomorrow.map(f=>`${f.item} · ${f.for}`).join('<br>')}</div></div></div></div>` : '';

  const mealBlock = (slot, emoji, label) => {
    const meal = day[slot];
    const key = `${day.id}-${slot}`;
    const isDone = S.mealDone[key];
    const rating = S.ratings[key] ?? meal.rating;
    return `
      <div class="meal-block">
        <div class="meal-eyebrow">${emoji} ${label}</div>
        <div class="meal-name">${meal.name}</div>
        <div class="meal-meta">
          <span class="meal-time">⏱ ${meal.time} min</span>
          ${tagHTML(meal.tags)}
        </div>
        <div class="meal-actions">
          <button class="btn-primary" onclick="openSheet('${day.id}','${slot}')">Ver receta</button>
          <button class="btn-done${isDone?' is-done':''}" onclick="toggleDone('${key}',this)">
            ${isDone ? '✓ Hecha' : 'Marcar hecha'}
          </button>
        </div>
      </div>`;
  };

  el.innerHTML = `
    <div class="topbar">
      <div>
        <div class="topbar-title">${WEEK_DATA.meta.week.split('–')[0].trim()}… ✦</div>
        <div class="topbar-sub">${WEEK_DATA.meta.week}</div>
      </div>
      <span class="today-date-pill">${todayName}</span>
    </div>
    <div class="card">
      ${mealBlock('lunch','🍽','Comida')}
      ${mealBlock('dinner','🌙','Cena')}
    </div>
    ${fAlert}
    <div class="section-title">Preparación del domingo</div>
    <div class="card">
      ${WEEK_DATA.prepSunday.slice(0,3).map((p,i) => {
        const done = S.prepChecks[i];
        return `<div class="tip-card" style="cursor:pointer" onclick="togglePrep(${i},this)">
          <div class="tip-icon">${done?'✅':'📋'}</div>
          <div class="tip-content">
            <div class="tip-label">Adelantar</div>
            <div class="tip-text" style="${done?'text-decoration:line-through;color:var(--text-tertiary)':''}">
              ${p.task}
            </div>
          </div>
        </div>`;
      }).join('<div style="height:0.5px;background:var(--border);margin:0 18px"></div>')}
    </div>`;
}

function toggleDone(key, btn) {
  S.mealDone[key] = !S.mealDone[key];
  save();
  btn.className = `btn-done${S.mealDone[key]?' is-done':''}`;
  btn.textContent = S.mealDone[key] ? '✓ Hecha' : 'Marcar hecha';
  if (S.mealDone[key]) showToast('¡Apuntado! 🎉');
}

function togglePrep(i, el) {
  S.prepChecks[i] = !S.prepChecks[i];
  save();
  const icon = el.querySelector('.tip-icon');
  const text = el.querySelector('.tip-text');
  icon.textContent = S.prepChecks[i] ? '✅' : '📋';
  text.style.textDecoration = S.prepChecks[i] ? 'line-through' : '';
  text.style.color = S.prepChecks[i] ? 'var(--text-tertiary)' : '';
}

/* ── WEEK ───────────────────────────────────────────────── */
function renderWeek() {
  const el = document.getElementById('screen-week');
  const todayIdx = today();
  const selIdx = S.weekDay ?? todayIdx;
  const day = WEEK_DATA.days[selIdx];

  const strip = WEEK_DATA.days.map((d, i) => {
    const lMeal = d.lunch; const dMeal = d.dinner;
    const d1class = tagColorClass(lMeal.tags);
    const d2class = tagColorClass(dMeal.tags);
    const isTod = i === todayIdx;
    const isSel = i === selIdx && !isTod;
    return `<button class="day-pill${isTod?' today':''}${isSel?' selected':''}" onclick="selectDay(${i})">
      <span class="dp-label">${d.label.slice(0,3)}</span>
      <span class="dp-num">${d.date.split(' ')[0]}</span>
      <div class="day-dots">
        <div class="day-dot ${d1class}"></div>
        <div class="day-dot ${d2class}"></div>
      </div>
    </button>`;
  }).join('');

  const mealRow = (slot, emoji, label) => {
    const meal = day[slot];
    const rating = S.ratings[`${day.id}-${slot}`] ?? meal.rating;
    return `<div class="day-meal-row" onclick="openSheet('${day.id}','${slot}')">
      <div class="dmr-icon">${emoji}</div>
      <div class="dmr-content">
        <div class="dmr-label">${label}</div>
        <div class="dmr-name">${meal.name}</div>
        <div class="dmr-meta">
          <span class="meal-time">⏱ ${meal.time} min</span>
          ${tagHTML(meal.tags.slice(0,2))}
        </div>
      </div>
      <div class="dmr-arrow">›</div>
    </div>`;
  };

  el.innerHTML = `
    <div class="topbar">
      <div>
        <div class="topbar-title">Semana</div>
        <div class="topbar-sub">${WEEK_DATA.meta.week}</div>
      </div>
    </div>
    <div class="week-scroll">
      <div class="week-strip">${strip}</div>
    </div>
    <div class="day-detail mt-12">
      <div class="card">
        ${mealRow('lunch','🍽','Comida')}
        ${mealRow('dinner','🌙','Cena')}
      </div>
    </div>`;
}

function selectDay(i) {
  S.weekDay = i;
  renderWeek();
}

/* ── SHOPPING ───────────────────────────────────────────── */
function renderShopping() {
  const el = document.getElementById('screen-shopping');
  const allItems = WEEK_DATA.shopping.flatMap((s,si) => s.items.map((_,ii) => `${si}-${ii}`));
  const checkedCount = allItems.filter(k => S.shopChecks[k]).length;
  const total = allItems.length;
  const pct = total ? Math.round(checkedCount / total * 100) : 0;

  const sections = WEEK_DATA.shopping.map((sec, si) => {
    const items = sec.items.map((item, ii) => {
      const key = `${si}-${ii}`;
      const checked = S.shopChecks[key];
      return `<div class="shop-item${checked?' checked':''}" onclick="toggleShop('${key}',this)">
        <div class="shop-check"></div>
        <span class="shop-name">${item.name}</span>
        <span class="shop-qty">${item.qty}</span>
      </div>`;
    }).join('');
    return `<div class="shop-section-head">${sec.icon} ${sec.section}</div>${items}`;
  }).join('');

  el.innerHTML = `
    <div class="topbar">
      <div class="shop-header" style="flex:1">
        <div>
          <div class="topbar-title">Compra</div>
          <div class="topbar-sub">Mercadona · Esta semana</div>
        </div>
        <button class="btn-mark-all" onclick="markAllShop()">Marcar todo</button>
      </div>
    </div>
    <div class="shop-progress-wrap">
      <div class="shop-progress-bar"><div class="shop-progress-fill" style="width:${pct}%"></div></div>
      <div class="shop-count">${checkedCount} de ${total} artículos comprados</div>
    </div>
    <div class="card mt-12">${sections}</div>`;
}

function toggleShop(key, el) {
  S.shopChecks[key] = !S.shopChecks[key];
  save();
  el.classList.toggle('checked', S.shopChecks[key]);
  updateShopProgress();
}

function updateShopProgress() {
  const allItems = WEEK_DATA.shopping.flatMap((s,si) => s.items.map((_,ii) => `${si}-${ii}`));
  const checked = allItems.filter(k => S.shopChecks[k]).length;
  const total = allItems.length;
  const pct = total ? Math.round(checked/total*100) : 0;
  const fill = document.querySelector('.shop-progress-fill');
  const count = document.querySelector('.shop-count');
  if (fill) fill.style.width = pct + '%';
  if (count) count.textContent = `${checked} de ${total} artículos comprados`;
  if (checked === total && total > 0) showToast('¡Lista completa! 🛒');
}

function markAllShop() {
  WEEK_DATA.shopping.forEach((sec,si) => sec.items.forEach((_,ii) => { S.shopChecks[`${si}-${ii}`] = true; }));
  save();
  renderShopping();
  showToast('¡Todo marcado! 🛒');
}

/* ── PREP ───────────────────────────────────────────────── */
function renderPrep() {
  const el = document.getElementById('screen-prep');
  const done = WEEK_DATA.prepSunday.filter((_,i) => S.prepChecks[i]).length;

  const items = WEEK_DATA.prepSunday.map((p, i) => {
    const checked = S.prepChecks[i];
    return `<div class="prep-item${checked?' done':''}" onclick="togglePrepItem(${i},this)">
      <div class="prep-check"></div>
      <div class="prep-content">
        <div class="prep-task">${p.task}</div>
        <div class="prep-detail">${p.detail}</div>
      </div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="topbar">
      <div>
        <div class="topbar-title">Preparación</div>
        <div class="topbar-sub">Domingo · ${done}/${WEEK_DATA.prepSunday.length} listas</div>
      </div>
    </div>
    <div class="card">${items}</div>
    <div class="section-title">Ingredientes compartidos</div>
    <div class="card">
      ${[
        {icon:'🍅', tip:'Sofrito doble el domingo → sirve para lentejas, pasta, arroz y berenjenas'},
        {icon:'🧀', tip:'Mozzarella → pasta, berenjenas y pizza'},
        {icon:'🥔', tip:'Patata → merluza, dorada y lentejas'},
        {icon:'🫑', tip:'Pimiento rojo → merluza, arroz y berenjenas'},
      ].map(t => `<div class="tip-card"><div class="tip-icon">${t.icon}</div><div class="tip-content"><div class="tip-text">${t.tip}</div></div></div>`)
       .join('<div style="height:0.5px;background:var(--border);margin:0 18px"></div>')}
    </div>`;
}

function togglePrepItem(i, el) {
  S.prepChecks[i] = !S.prepChecks[i];
  save();
  el.classList.toggle('done', S.prepChecks[i]);
}

/* ── FREEZER ────────────────────────────────────────────── */
function renderFreezer() {
  const el = document.getElementById('screen-freezer');
  const todayItems = WEEK_DATA.freezer.today;
  const tmrItems = WEEK_DATA.freezer.tomorrow;

  el.innerHTML = `
    <div class="topbar">
      <div>
        <div class="topbar-title">Congelador</div>
        <div class="topbar-sub">Qué descongelar y cuándo</div>
      </div>
    </div>
    <div class="card">
      <div class="freezer-block">
        <div class="freezer-label">❄️ Sacar hoy</div>
        ${todayItems.length
          ? todayItems.map(f=>`<div class="freezer-item"><div class="freezer-dot"></div><div class="freezer-item-name">${f.item}</div><div class="freezer-item-for">${f.for}</div></div>`).join('')
          : '<div class="freezer-empty">Nada que sacar hoy</div>'}
      </div>
      <div class="freezer-block">
        <div class="freezer-label">🕐 Sacar mañana</div>
        ${tmrItems.length
          ? tmrItems.map(f=>`<div class="freezer-item"><div class="freezer-dot" style="background:#85B7EB"></div><div class="freezer-item-name">${f.item}</div><div class="freezer-item-for">${f.for}</div></div>`).join('')
          : '<div class="freezer-empty">Nada que sacar mañana</div>'}
      </div>
    </div>
    <div class="section-title">Consejo</div>
    <div class="card">
      <div class="tip-card">
        <div class="tip-icon">💡</div>
        <div class="tip-content">
          <div class="tip-label">Descongelación segura</div>
          <div class="tip-text">Pasa el pescado a la nevera la noche anterior. Nunca a temperatura ambiente.</div>
        </div>
      </div>
    </div>`;
}

/* ── WATER ──────────────────────────────────────────────── */
function renderWater() {
  const el = document.getElementById('screen-water');
  const w = WEEK_DATA.water;
  const needed = w.bottlesNeeded - S.waterHome;
  const home = Math.min(S.waterHome, w.bottlesNeeded);

  const bottles = Array.from({length: w.bottlesNeeded}, (_, i) => {
    const isHome = i < home;
    return `<div class="bottle ${isHome?'home':'buy'}" onclick="toggleBottle(${i})">
      <div class="bottle-label">${i+1}</div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="topbar">
      <div>
        <div class="topbar-title">Agua</div>
        <div class="topbar-sub">Objetivo semanal · ${w.weeklyLitres} litros</div>
      </div>
    </div>
    <div class="card">
      <div class="water-visual">
        <div class="water-big">${w.bottlesNeeded} <span>garrafas</span></div>
        <div class="water-stat">de ${w.bottleSize} L · objetivo semanal</div>
        <div class="water-bottles">${bottles}</div>
        <div class="water-legend">
          <div class="legend-item"><div class="legend-dot" style="background:var(--sage-light);border:1.5px solid var(--sage)"></div> En casa (${home})</div>
          <div class="legend-item"><div class="legend-dot" style="border:1.5px solid var(--beige-dark)"></div> Comprar (${Math.max(0,needed)})</div>
        </div>
      </div>
    </div>
    <div class="section-title">Ajustar garrafas en casa</div>
    <div class="card">
      <div style="padding:16px 18px;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:15px;color:var(--text-primary)">Garrafas disponibles en casa</span>
        <div style="display:flex;align-items:center;gap:12px">
          <button onclick="adjustWater(-1)" style="width:36px;height:36px;border-radius:50%;background:var(--beige-mid);font-size:20px;display:flex;align-items:center;justify-content:center;color:var(--text-primary)">−</button>
          <span style="font-size:18px;font-weight:600;min-width:24px;text-align:center">${home}</span>
          <button onclick="adjustWater(1)" style="width:36px;height:36px;border-radius:50%;background:var(--sage-light);font-size:20px;display:flex;align-items:center;justify-content:center;color:var(--sage)">+</button>
        </div>
      </div>
    </div>
    <div class="section-title">Esta semana necesitas comprar</div>
    <div class="card">
      <div style="padding:16px 18px;text-align:center">
        <div style="font-size:40px;font-weight:700;color:${needed>0?'var(--text-primary)':'var(--sage)'};letter-spacing:-1px">${Math.max(0,needed)}</div>
        <div style="font-size:14px;color:var(--text-secondary);margin-top:4px">${needed>0?'garrafas por comprar':'¡Tienes suficiente agua! 💧'}</div>
      </div>
    </div>`;
}

function toggleBottle(i) {
  S.waterHome = i < S.waterHome ? i : i + 1;
  save();
  renderWater();
}

function adjustWater(d) {
  S.waterHome = Math.max(0, Math.min(WEEK_DATA.water.bottlesNeeded, (S.waterHome||0) + d));
  save();
  renderWater();
}

/* ── FAVORITES ──────────────────────────────────────────── */
function renderFavorites() {
  const el = document.getElementById('screen-favorites');
  const allMeals = WEEK_DATA.days.flatMap(d => [
    { ...d.lunch, key: `${d.id}-lunch`, day: d.label },
    { ...d.dinner, key: `${d.id}-dinner`, day: d.label }
  ]);

  const rated = allMeals.map(m => ({
    ...m,
    currentRating: S.ratings[m.key] ?? m.rating
  })).sort((a,b) => b.currentRating - a.currentRating);

  el.innerHTML = `
    <div class="topbar">
      <div>
        <div class="topbar-title">Favoritos</div>
        <div class="topbar-sub">Valoraciones de la semana</div>
      </div>
    </div>
    <div class="card">
      ${rated.map(m => `
        <div class="fav-item">
          <div class="fav-content">
            <div class="fav-name">${m.name}</div>
            <div class="fav-tag">${m.day} · ${tagHTML(m.tags.slice(0,1))}</div>
          </div>
          <div class="fav-stars">
            <div class="stars">${starsHTML(m.currentRating)}</div>
          </div>
        </div>`).join('')}
    </div>`;
}

/* ── RECIPE SHEET ───────────────────────────────────────── */
function openSheet(dayId, slot) {
  const day = WEEK_DATA.days.find(d => d.id === dayId);
  const meal = day[slot];
  S.sheetDayId = dayId;
  S.sheetSlot = slot;
  const key = `${dayId}-${slot}`;
  const rating = S.ratings[key] ?? meal.rating;

  const backdrop = document.getElementById('sheet-backdrop');
  const sheet = document.getElementById('sheet');

  const slotLabel = slot === 'lunch' ? '🍽 Comida' : '🌙 Cena';

  sheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-close"><button class="btn-close" onclick="closeSheet()" aria-label="Cerrar">✕</button></div>
    <div class="sheet-header">
      <div class="sheet-eyebrow">${slotLabel} · ${day.label}</div>
      <div class="sheet-title">${meal.name}</div>
      <div class="sheet-meta">
        <span class="meal-time">⏱ ${meal.time} min</span>
        ${tagHTML(meal.tags)}
        ${meal.prepAhead ? '<span class="tag tag-rapida">📅 Adelantable</span>' : ''}
      </div>
    </div>
    <div class="sheet-divider"></div>
    <div class="sheet-section">
      <div class="sheet-section-title">Ingredientes para 2 personas</div>
      ${meal.ingredients.map(ing => `<div class="ing-item"><div class="ing-dot"></div>${ing}</div>`).join('')}
    </div>
    <div class="sheet-divider" style="margin-top:16px"></div>
    <div class="sheet-section">
      <div class="sheet-section-title">Preparación</div>
      ${meal.steps.map((s,i) => `<div class="step-item"><div class="step-num">${i+1}</div><div class="step-text">${s}</div></div>`).join('')}
    </div>
    <div class="sheet-divider" style="margin-top:16px"></div>
    <div class="sheet-rating">
      <span class="sheet-rating-label">Valoración</span>
      <div class="rate-stars" id="rate-stars">
        ${Array.from({length:5},(_,i)=>`<span class="rate-star${i<rating?' on':''}" onclick="setRating('${key}',${i+1})">${i<rating?'★':'☆'}</span>`).join('')}
      </div>
    </div>`;

  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSheet() {
  document.getElementById('sheet-backdrop').classList.remove('open');
  document.body.style.overflow = '';
}

function setRating(key, val) {
  S.ratings[key] = val;
  save();
  const stars = document.querySelectorAll('.rate-star');
  stars.forEach((s,i) => {
    s.classList.toggle('on', i < val);
    s.textContent = i < val ? '★' : '☆';
  });
  showToast(`Valoración guardada ${'★'.repeat(val)}`);
}

/* ── Render router ──────────────────────────────────────── */
function renderScreen(name) {
  switch(name) {
    case 'today': renderToday(); break;
    case 'week': renderWeek(); break;
    case 'shopping': renderShopping(); break;
    case 'prep': renderPrep(); break;
    case 'freezer': renderFreezer(); break;
    case 'water': renderWater(); break;
    case 'favorites': renderFavorites(); break;
  }
}

/* ── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  load();
  S.weekDay = today();
  navigate('today');

  document.getElementById('sheet-backdrop').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeSheet();
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});
