/* ═══════════════════════════════════════════════════════════
   MESA · App Logic
   Vanilla JS · No frameworks · LocalStorage persistence
   ═══════════════════════════════════════════════════════════ */

let DATA = null;

/* ── State ─────────────────────────────────────────────────── */
const State = {
  screen: 'hoy',
  weekIdx: 0,
  dayIdx: null,
  shopWeek: 0,
  prepWeek: 0,
  shopChecks: {},
  prepChecks: {},
  mealDone: {},
  ratings: {},
  waterHome: 2,
  recipeFilter: 'all',
  recipeSearch: '',
};

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem('mesa-state') || '{}');
    Object.assign(State, s);
  } catch(e) {}
  State.screen = 'hoy';
  State.dayIdx = todayIdx();
}

function saveState() {
  try {
    const { screen, ...rest } = State;
    localStorage.setItem('mesa-state', JSON.stringify(rest));
  } catch(e) {}
}

/* ── Utils ──────────────────────────────────────────────────── */
function todayIdx() {
  return (new Date().getDay() + 6) % 7;
}

function todayDate() {
  return new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' });
}

function showToast(msg, dur = 2400) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), dur);
}

function img(name) {
  return `img/${name}.jpg`;
}

function tagHtml(tipo, extras = []) {
  const map = {
    pescado:     { cls: 'tag-pescado',    label: '🐟 Pescado' },
    legumbres:   { cls: 'tag-legumbres',  label: '🌱 Legumbres' },
    vegetariano: { cls: 'tag-vegetariano',label: '🥬 Vegetal' },
    carne:       { cls: 'tag-carne',      label: '🥩 Carne' },
    especial:    { cls: 'tag-especial',   label: '✨ Especial' },
    facil:       { cls: 'tag-facil',      label: '⚡ Rápida' },
  };
  const t = map[tipo] || { cls: 'tag-facil', label: tipo };
  let html = `<span class="tag ${t.cls}">${t.label}</span>`;
  if (extras.includes('airfryer')) html += `<span class="tag tag-airfryer">🔥 Airfryer</span>`;
  return html;
}

function starsHtml(n, cls = 'fav-star') {
  return Array.from({length:5}, (_,i) =>
    `<span class="${cls}${i < n ? ' on' : ''}">${i < n ? '★' : '☆'}</span>`
  ).join('');
}

function typeDotClass(tipo) {
  if (tipo === 'pescado') return 'pescado';
  if (tipo === 'vegetariano' || tipo === 'legumbres') return 'vegetariano';
  if (tipo === 'especial') return 'especial';
  return 'carne';
}

function allMeals() {
  if (!DATA) return [];
  return DATA.semanas.flatMap(s =>
    s.dias.flatMap(d => [
      { ...d.comida, key: `${d.id}-comida`, dia: d.dia, semana: s.label, dayId: d.id },
      { ...d.cena,   key: `${d.id}-cena`,   dia: d.dia, semana: s.label, dayId: d.id }
    ])
  );
}

/* ── Navigation ────────────────────────────────────────────── */
function navigate(screen) {
  State.screen = screen;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const sc = document.getElementById('screen-' + screen);
  const nb = document.querySelector(`.nav-btn[data-screen="${screen}"]`);
  if (sc) { sc.classList.remove('active'); void sc.offsetWidth; sc.classList.add('active'); }
  if (nb) nb.classList.add('active');
  render(screen);
}

function render(screen) {
  switch(screen) {
    case 'hoy':      renderHoy();      break;
    case 'menu':     renderMenu();     break;
    case 'compra':   renderCompra();   break;
    case 'recetas':  renderRecetas();  break;
    case 'prepara':  renderPrepara();  break;
    case 'congelador': renderCongelador(); break;
    case 'favoritos': renderFavoritos(); break;
    case 'hogar':    renderHogar();    break;
  }
}

/* ══════════════════════════════════════════════════════════════
   SCREEN 1 — HOY
   ══════════════════════════════════════════════════════════════ */
function renderHoy() {
  if (!DATA) return;
  const el = document.getElementById('screen-hoy');
  const s = DATA.semanas[0];
  const dayI = State.dayIdx ?? todayIdx();
  const dia = s.dias[Math.min(dayI, s.dias.length - 1)];
  const comida = dia.comida;
  const cena = dia.cena;
  const pendientes = countShopPending();
  const freezerHoy = DATA.congelador.filter(c => c.urgente);

  const freezerAlert = freezerHoy.length
    ? `<div class="quick-tile" onclick="navigate('congelador')" style="grid-column:1/-1;display:flex;align-items:center;gap:12px;background:var(--sage-xlight);border-color:var(--sage-mid,#9DB89F)">
        <span style="font-size:24px">❄️</span>
        <div>
          <div class="qt-label">Congelador</div>
          <div class="qt-value" style="font-size:14px">${freezerHoy[0].accion}</div>
          <div class="qt-sub">${freezerHoy[0].para}</div>
        </div>
       </div>`
    : '';

  el.innerHTML = `
    <div class="topbar">
      <div class="topbar-inner">
        <div>
          <div class="topbar-title">Mesa</div>
          <div class="topbar-subtitle">${todayDate()}</div>
        </div>
        <div class="topbar-badge">${dia.dia}</div>
      </div>
    </div>

    <div class="today-hero">
      <img class="today-hero-img" src="${img(comida.imagen)}" alt="${comida.nombre}">
      <div class="today-hero-overlay"></div>
      <div class="today-hero-content">
        <div class="today-hero-eyebrow">🍽 Comida</div>
        <div class="today-hero-title">${comida.nombre.replace(/^[🍕🌮🍔🍣]/u,'').trim()}</div>
      </div>
    </div>

    <div style="padding:0 16px 8px">
      <div class="card">
        ${mealBlockHtml(dia, 'comida', '🍽', 'Comida de hoy')}
        ${mealBlockHtml(dia, 'cena', '🌙', 'Cena de hoy')}
      </div>
    </div>

    <div class="quick-tiles">
      <div class="quick-tile" onclick="navigate('compra')">
        <div class="qt-label">Compra pendiente</div>
        <div class="qt-value">${pendientes}</div>
        <div class="qt-sub">artículos por marcar</div>
      </div>
      <div class="quick-tile" onclick="navigate('prepara')">
        <div class="qt-label">Preparación domingo</div>
        <div class="qt-value">${DATA.batch_cooking.length}</div>
        <div class="qt-sub">tareas de batch cooking</div>
      </div>
      ${freezerAlert}
    </div>`;
}

function mealBlockHtml(dia, slot, emoji, label) {
  const meal = dia[slot];
  const key = `${dia.id}-${slot}`;
  const rating = State.ratings[key] ?? meal.rating ?? 0;
  const isDone = State.mealDone[key];
  return `
    <div class="meal-block">
      <div class="meal-eyebrow">${emoji} ${label}</div>
      <div class="meal-name">${meal.nombre}</div>
      <div class="meal-desc">${meal.descripcion}</div>
      <div class="meal-meta">
        <span class="meal-time">⏱ ${meal.tiempo} min</span>
        ${tagHtml(meal.tipo, meal.airfryer ? ['airfryer'] : [])}
      </div>
      <div class="meal-actions">
        <button class="btn-primary" onclick="openSheet('${dia.id}','${slot}')">Ver receta</button>
        <button class="btn-done${isDone?' is-done':''}" onclick="toggleDone('${key}',this)">
          ${isDone ? '✓ Hecha' : 'Marcar hecha'}
        </button>
      </div>
    </div>`;
}

function toggleDone(key, btn) {
  State.mealDone[key] = !State.mealDone[key];
  saveState();
  const done = State.mealDone[key];
  btn.className = `btn-done${done?' is-done':''}`;
  btn.textContent = done ? '✓ Hecha' : 'Marcar hecha';
  if (done) showToast('¡Apuntado! 🎉');
}

function countShopPending() {
  if (!DATA) return 0;
  const week = DATA.compra[`semana${State.shopWeek + 1}`];
  let total = 0, checked = 0;
  Object.values(week).forEach(section => {
    section.forEach((_,ii) => {
      const si = Object.keys(week).indexOf(Object.keys(week).find(k => week[k] === section));
    });
  });
  // Simpler count
  let idx = 0;
  Object.values(week).forEach(section => {
    section.forEach((item, ii) => {
      total++;
      if (State.shopChecks[`${State.shopWeek}-s${idx}-${ii}`]) checked++;
    });
    idx++;
  });
  return total - checked;
}

/* ══════════════════════════════════════════════════════════════
   SCREEN 2 — MENÚ
   ══════════════════════════════════════════════════════════════ */
function renderMenu() {
  if (!DATA) return;
  const el = document.getElementById('screen-menu');
  const wk = DATA.semanas[State.weekIdx];
  const dayI = State.dayIdx ?? 0;

  const weekTabs = DATA.semanas.map((s,i) =>
    `<button class="week-tab${i===State.weekIdx?' active':''}" onclick="setWeek(${i})">${s.label} · ${s.rango}</button>`
  ).join('');

  const dayPills = wk.dias.map((d,i) => {
    const isToday = State.weekIdx === 0 && i === todayIdx();
    const isSel = i === dayI;
    return `<button class="day-pill${isToday?' today':''}${isSel&&!isToday?' selected':''}" onclick="setDay(${i})">
      <span class="dp-lbl">${d.dia_corto}</span>
      <span class="dp-num">${d.fecha.slice(8)}</span>
      <div class="day-dots">
        <div class="day-dot ${typeDotClass(d.comida.tipo)}"></div>
        <div class="day-dot ${typeDotClass(d.cena.tipo)}"></div>
      </div>
    </button>`;
  }).join('');

  const dia = wk.dias[Math.min(dayI, wk.dias.length - 1)];

  const mealRow = (slot, emoji, label) => {
    const m = dia[slot];
    const key = `${dia.id}-${slot}`;
    const rating = State.ratings[key] ?? m.rating ?? 0;
    return `
      <div class="day-meal-row" onclick="openSheet('${dia.id}','${slot}','${State.weekIdx}')">
        <img class="dmr-img" src="${img(m.imagen)}" alt="${m.nombre}">
        <div class="dmr-body">
          <div class="dmr-eyebrow">${emoji} ${label}</div>
          <div class="dmr-name">${m.nombre}</div>
          <div class="dmr-meta">
            <span class="meal-time">⏱ ${m.tiempo} min</span>
            ${tagHtml(m.tipo, m.airfryer ? ['airfryer'] : [])}
          </div>
        </div>
        <span class="dmr-arrow">›</span>
      </div>`;
  };

  el.innerHTML = `
    <div class="topbar">
      <div class="topbar-inner">
        <div>
          <div class="topbar-title">Menú</div>
          <div class="topbar-subtitle">${DATA.app.periodo}</div>
        </div>
      </div>
    </div>
    <div class="week-picker">${weekTabs}</div>
    <div class="day-strip"><div class="day-pills">${dayPills}</div></div>
    <div style="padding:0 16px">
      <div class="day-detail-card">
        ${mealRow('comida','🍽','Comida')}
        ${mealRow('cena','🌙','Cena')}
      </div>
    </div>`;
}

function setWeek(i) { State.weekIdx = i; State.dayIdx = 0; saveState(); renderMenu(); }
function setDay(i)  { State.dayIdx = i; saveState(); renderMenu(); }

/* ══════════════════════════════════════════════════════════════
   SCREEN 3 — COMPRA
   ══════════════════════════════════════════════════════════════ */
function renderCompra() {
  if (!DATA) return;
  const el = document.getElementById('screen-compra');
  const wk = State.shopWeek;
  const week = DATA.compra[`semana${wk+1}`];
  const sections = Object.entries(week);

  const sectionIcons = {
    fruta_verdura:'🥦', carniceria:'🥩', pescaderia:'🐟',
    lacteos:'🥛', conservas:'🥫', cereales:'🍝',
    panaderia:'🥖', agua:'💧', otros:'🛒'
  };
  const sectionNames = {
    fruta_verdura:'Fruta y verdura', carniceria:'Carnicería', pescaderia:'Pescadería',
    lacteos:'Lácteos y huevos', conservas:'Conservas', cereales:'Pasta y arroz',
    panaderia:'Panadería', agua:'Agua', otros:'Otros'
  };

  let total = 0, checked = 0;
  sections.forEach(([sKey, items], si) => {
    items.forEach((_, ii) => {
      total++;
      if (State.shopChecks[`${wk}-${si}-${ii}`]) checked++;
    });
  });
  const pct = total ? Math.round(checked/total*100) : 0;

  const itemsHtml = sections.map(([sKey, items], si) => {
    const rows = items.map((item, ii) => {
      const key = `${wk}-${si}-${ii}`;
      const ck = State.shopChecks[key];
      return `<div class="shop-item${ck?' checked':''}" onclick="toggleShop('${key}',this)">
        <div class="shop-check"></div>
        <span class="shop-name">${item.nombre}</span>
        <span class="shop-qty">${item.cantidad}</span>
      </div>`;
    }).join('');
    return `<div class="shop-section-head">
      <span class="ssh-icon">${sectionIcons[sKey]||'📦'}</span>
      ${sectionNames[sKey]||sKey}
    </div>${rows}`;
  }).join('');

  el.innerHTML = `
    <div class="topbar">
      <div class="topbar-inner">
        <div>
          <div class="topbar-title">Compra</div>
          <div class="topbar-subtitle">Mercadona · ${checked} de ${total} marcados</div>
        </div>
      </div>
    </div>
    <div class="shop-progress">
      <div class="shop-progress-bar">
        <div class="shop-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="shop-progress-text">
        <span>${pct}% completado</span>
        <span>${total-checked} pendientes</span>
      </div>
    </div>
    <div class="shop-week-tabs px-lg">
      ${DATA.semanas.map((s,i)=>
        `<button class="shop-week-tab${i===wk?' active':''}" onclick="setShopWeek(${i})">${s.label}</button>`
      ).join('')}
    </div>
    <div class="card" style="margin:0 16px">
      ${itemsHtml}
    </div>
    <div class="shop-actions">
      <button class="btn-primary sage" onclick="markAllShop()" style="flex:1">Marcar todo comprado</button>
      <button class="btn-secondary" onclick="resetShop()">Reiniciar</button>
    </div>`;
}

function toggleShop(key, el) {
  State.shopChecks[key] = !State.shopChecks[key];
  saveState();
  el.classList.toggle('checked', State.shopChecks[key]);
  if (State.shopChecks[key]) {
    el.querySelector('.shop-check').style.transform = 'scale(1.2)';
    setTimeout(() => el.querySelector('.shop-check').style.transform = '', 200);
  }
  updateShopProgress();
}

function updateShopProgress() {
  const wk = State.shopWeek;
  const week = DATA.compra[`semana${wk+1}`];
  const sections = Object.entries(week);
  let total = 0, checked = 0;
  sections.forEach(([, items], si) => {
    items.forEach((_,ii) => {
      total++;
      if (State.shopChecks[`${wk}-${si}-${ii}`]) checked++;
    });
  });
  const pct = total ? Math.round(checked/total*100) : 0;
  const fill = document.querySelector('.shop-progress-fill');
  const texts = document.querySelectorAll('.shop-progress-text span');
  const sub = document.querySelector('#screen-compra .topbar-subtitle');
  if (fill) fill.style.width = pct+'%';
  if (texts[0]) texts[0].textContent = pct+'% completado';
  if (texts[1]) texts[1].textContent = (total-checked)+' pendientes';
  if (sub) sub.textContent = `Mercadona · ${checked} de ${total} marcados`;
  if (checked === total && total > 0) showToast('¡Lista completa! 🛒✓');
}

function setShopWeek(i) { State.shopWeek = i; saveState(); renderCompra(); }

function markAllShop() {
  const wk = State.shopWeek;
  const week = DATA.compra[`semana${wk+1}`];
  Object.entries(week).forEach(([, items], si) => {
    items.forEach((_,ii) => { State.shopChecks[`${wk}-${si}-${ii}`] = true; });
  });
  saveState();
  renderCompra();
  showToast('¡Todo marcado como comprado! 🎉');
}

function resetShop() {
  const wk = State.shopWeek;
  const week = DATA.compra[`semana${wk+1}`];
  Object.entries(week).forEach(([, items], si) => {
    items.forEach((_,ii) => { delete State.shopChecks[`${wk}-${si}-${ii}`]; });
  });
  saveState();
  renderCompra();
  showToast('Lista reiniciada');
}

/* ══════════════════════════════════════════════════════════════
   SCREEN 4 — RECETAS
   ══════════════════════════════════════════════════════════════ */
function renderRecetas() {
  if (!DATA) return;
  const el = document.getElementById('screen-recetas');
  const filters = ['all','pescado','carne','legumbres','vegetariano','especial','airfryer','favorito'];
  const filterLabels = {
    all:'Todas', pescado:'🐟 Pescado', carne:'🥩 Carne',
    legumbres:'🌱 Legumbres', vegetariano:'🥬 Vegetal',
    especial:'✨ Especial', airfryer:'🔥 Airfryer', favorito:'⭐ Favoritos'
  };

  const filterHtml = filters.map(f =>
    `<button class="filter-btn${f===State.recipeFilter?' active':''}" onclick="setFilter('${f}')">${filterLabels[f]}</button>`
  ).join('');

  let meals = allMeals();
  const q = State.recipeSearch.toLowerCase();
  if (q) meals = meals.filter(m => m.nombre.toLowerCase().includes(q));
  if (State.recipeFilter === 'airfryer') meals = meals.filter(m => m.airfryer);
  else if (State.recipeFilter === 'favorito') meals = meals.filter(m => (State.ratings[m.key] ?? m.favorito_potencial ? 4 : 0) >= 4 || m.favorito);
  else if (State.recipeFilter !== 'all') meals = meals.filter(m => m.tipo === State.recipeFilter);

  const recipesHtml = meals.map(m =>
    `<div class="recipe-card" onclick="openSheetByKey('${m.key}')">
      <img class="recipe-card-img" src="${img(m.imagen)}" alt="${m.nombre}">
      <div class="recipe-card-body">
        <div class="recipe-card-name">${m.nombre}</div>
        <div class="recipe-card-meta">
          <span class="meal-time">⏱ ${m.tiempo} min</span>
          ${tagHtml(m.tipo, m.airfryer ? ['airfryer'] : [])}
        </div>
      </div>
    </div>`
  ).join('') || `<div style="padding:40px 16px;text-align:center;color:var(--text-3)">
    <div style="font-size:40px;margin-bottom:12px">🔍</div>
    <div style="font-size:16px;font-weight:500">Sin resultados</div>
  </div>`;

  el.innerHTML = `
    <div class="topbar">
      <div class="topbar-inner">
        <div>
          <div class="topbar-title">Recetas</div>
          <div class="topbar-subtitle">${meals.length} platos</div>
        </div>
      </div>
    </div>
    <div class="search-wrap">
      <div class="search-rel">
        <span class="search-icon">🔍</span>
        <input class="search-input" type="search" placeholder="Buscar receta..." value="${State.recipeSearch}"
          oninput="State.recipeSearch=this.value;renderRecetas()">
      </div>
      <div class="filter-strip">${filterHtml}</div>
    </div>
    <div class="recipe-grid">${recipesHtml}</div>
    <div style="height:16px"></div>`;
}

function setFilter(f) { State.recipeFilter = f; renderRecetas(); }

/* ══════════════════════════════════════════════════════════════
   SCREEN 5 — PREPARACIÓN
   ══════════════════════════════════════════════════════════════ */
function renderPrepara() {
  if (!DATA) return;
  const el = document.getElementById('screen-prepara');
  const wk = State.prepWeek;
  const tasks = DATA.batch_cooking.filter(t => t.semana === wk + 1);
  const doneCount = tasks.filter((_, i) => State.prepChecks[`${wk}-${i}`]).length;
  const totalTime = tasks.reduce((acc,t) => acc + t.tiempo_min, 0);
  const savedTime = tasks.reduce((acc,t) => acc + t.ahorro_min, 0);

  const tasksHtml = tasks.map((t,i) => {
    const key = `${wk}-${i}`;
    const done = State.prepChecks[key];
    return `
      <div class="prep-item${done?' done':''}" onclick="togglePrep('${key}',this)">
        <div class="prep-check"></div>
        <div class="prep-body">
          <div class="prep-task">${t.tarea}</div>
          <div class="prep-detail">${t.detalle}</div>
          <div class="prep-chips">
            <span class="prep-chip">⏱ ${t.tiempo_min} min</span>
            <span class="prep-chip" style="background:var(--sage-light);color:var(--sage-dark)">💚 Ahorra ${t.ahorro_min} min</span>
          </div>
        </div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="topbar">
      <div class="topbar-inner">
        <div>
          <div class="topbar-title">Prepara</div>
          <div class="topbar-subtitle">Batch cooking del domingo</div>
        </div>
      </div>
    </div>
    <div class="prep-week-tabs px-lg">
      ${DATA.semanas.map((s,i) =>
        `<button class="prep-week-tab${i===wk?' active':''}" onclick="setPrepWeek(${i})">${s.label}</button>`
      ).join('')}
    </div>
    <div class="prep-total mx-16" style="margin:0 16px 12px">
      <div class="prep-total-icon">⏱</div>
      <div class="prep-total-text">
        <div class="prep-total-label">Inversión total</div>
        <div class="prep-total-value">${totalTime} min ahora · Ahorras ${savedTime} min en la semana</div>
      </div>
    </div>
    <div class="card" style="margin:0 16px">
      ${tasksHtml || '<div style="padding:32px;text-align:center;color:var(--text-3)">Sin tareas para esta semana</div>'}
    </div>
    <div style="padding:12px 16px">
      <div style="text-align:center;font-size:13px;color:var(--text-3)">${doneCount} de ${tasks.length} tareas completadas</div>
    </div>`;
}

function togglePrep(key, el) {
  State.prepChecks[key] = !State.prepChecks[key];
  saveState();
  el.classList.toggle('done', State.prepChecks[key]);
}

function setPrepWeek(i) { State.prepWeek = i; saveState(); renderPrepara(); }

/* ══════════════════════════════════════════════════════════════
   SCREEN 6 — CONGELADOR
   ══════════════════════════════════════════════════════════════ */
function renderCongelador() {
  if (!DATA) return;
  const el = document.getElementById('screen-congelador');
  const items = DATA.congelador;

  const timelineHtml = items.length ? items.map(c =>
    `<div class="freezer-item">
      <div class="freezer-dot-wrap">
        <div class="freezer-dot${c.urgente?' urgente':''}">❄️</div>
      </div>
      <div class="freezer-content">
        <div class="freezer-dia">${c.dia_corto}</div>
        <div class="freezer-accion">${c.accion}</div>
        <div class="freezer-para">${c.para}</div>
        ${c.urgente ? '<span class="freezer-badge">⚠️ No olvidar</span>' : ''}
      </div>
    </div>`
  ).join('') : `
    <div class="freezer-empty">
      <div class="freezer-empty-icon">❄️</div>
      <div class="freezer-empty-text">Nada que descongelar esta quincena</div>
    </div>`;

  el.innerHTML = `
    <div class="topbar">
      <div class="topbar-inner">
        <div>
          <div class="topbar-title">Congelador</div>
          <div class="topbar-subtitle">Qué descongelar y cuándo</div>
        </div>
      </div>
    </div>
    <div class="content">
      <div class="card" style="padding:16px">
        <div class="freezer-timeline">${timelineHtml}</div>
      </div>
    </div>
    <div class="content" style="padding-top:0">
      <div class="card" style="padding:16px 20px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:8px">Consejo</div>
        <div style="font-size:14px;color:var(--text-2);line-height:1.55">Descongelar siempre en la nevera, nunca a temperatura ambiente. El pescado necesita entre 8 y 12 horas.</div>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════════════════════
   SCREEN 7 — FAVORITOS
   ══════════════════════════════════════════════════════════════ */
function renderFavoritos() {
  if (!DATA) return;
  const el = document.getElementById('screen-favoritos');
  const meals = allMeals()
    .map(m => ({ ...m, currentRating: State.ratings[m.key] ?? (m.favorito ? 5 : m.favorito_potencial ? 4 : 3) }))
    .sort((a,b) => b.currentRating - a.currentRating);

  const favHtml = meals.map(m =>
    `<div class="fav-item" onclick="openSheetByKey('${m.key}')">
      <img class="fav-img" src="${img(m.imagen)}" alt="${m.nombre}">
      <div class="fav-body">
        <div class="fav-name">${m.nombre}</div>
        <div class="fav-meta">
          ${tagHtml(m.tipo, [])}
          <span style="font-size:12px;color:var(--text-3)">${m.dia}</span>
        </div>
      </div>
      <div class="fav-stars">${starsHtml(m.currentRating)}</div>
    </div>`
  ).join('');

  el.innerHTML = `
    <div class="topbar">
      <div class="topbar-inner">
        <div>
          <div class="topbar-title">Favoritos</div>
          <div class="topbar-subtitle">Valoraciones de la quincena</div>
        </div>
      </div>
    </div>
    <div class="card" style="margin:0 16px">${favHtml}</div>
    <div style="height:16px"></div>`;
}

/* ══════════════════════════════════════════════════════════════
   SCREEN 8 — HOGAR
   ══════════════════════════════════════════════════════════════ */
function renderHogar() {
  if (!DATA) return;
  const el = document.getElementById('screen-hogar');
  const w = DATA.agua;
  const home = Math.min(State.waterHome ?? 2, w.garrafas_5l_necesarias);
  const needed = Math.max(0, w.garrafas_semana - home);
  const st = DATA.estadisticas.total;

  const bottlesHtml = Array.from({length: w.garrafas_5l_necesarias}, (_,i) =>
    `<div class="water-bottle${i<home?' home':''}" onclick="toggleBottle(${i})">
      <div class="water-bottle-num">${i+1}</div>
    </div>`
  ).join('');

  el.innerHTML = `
    <div class="topbar">
      <div class="topbar-inner">
        <div>
          <div class="topbar-title">Hogar</div>
          <div class="topbar-subtitle">Agua · Estadísticas</div>
        </div>
      </div>
    </div>
    <div class="content">
      <div class="water-hero">
        <div class="wh-label">Agua quincenal</div>
        <div class="wh-big">${w.garrafas_5l_necesarias} <span>garrafas</span></div>
        <div class="wh-sub">${w.consumo_quincenal_litros} L · 5 L diarios entre los dos</div>
      </div>
      <div class="card">
        <div style="padding:16px 20px 8px">
          <div class="section-head" style="padding-top:0">Estado actual</div>
        </div>
        <div style="padding:0 20px">
          <div class="water-bottles-grid">${bottlesHtml}</div>
        </div>
        <div class="water-legend">
          <div class="wl-item">
            <div class="wl-dot" style="background:var(--sage-light);border:1.5px solid var(--sage)"></div>
            En casa (${home})
          </div>
          <div class="wl-item">
            <div class="wl-dot" style="border:1.5px solid var(--beige-dark)"></div>
            Comprar (${needed})
          </div>
        </div>
        <div class="divider"></div>
        <div class="water-adj">
          <span class="water-adj-label">Garrafas en casa</span>
          <div class="water-adj-ctrl">
            <button class="water-adj-btn minus" onclick="adjustWater(-1)">−</button>
            <span class="water-adj-val">${home}</span>
            <button class="water-adj-btn plus" onclick="adjustWater(1)">+</button>
          </div>
        </div>
      </div>
    </div>
    <div class="content" style="padding-top:0">
      <div class="section-head">Esta quincena</div>
      <div class="stats-grid">
        <div class="stat-tile"><div class="st-num">${st.pescado}</div><div class="st-label">🐟 Platos de pescado</div></div>
        <div class="stat-tile"><div class="st-num">${st.legumbres}</div><div class="st-label">🌱 Con legumbres</div></div>
        <div class="stat-tile"><div class="st-num">${st.airfryer}</div><div class="st-label">🔥 Con Airfryer</div></div>
        <div class="stat-tile"><div class="st-num">${st.vegetariano}</div><div class="st-label">🥬 Vegetarianos</div></div>
        <div class="stat-tile"><div class="st-num">${st.especiales}</div><div class="st-label">🎉 Especiales</div></div>
        <div class="stat-tile"><div class="st-num">${st.cenas_faciles}</div><div class="st-label">⚡ Cenas rápidas</div></div>
      </div>
    </div>`;
}

function toggleBottle(i) {
  State.waterHome = i < State.waterHome ? i : i + 1;
  saveState();
  renderHogar();
}

function adjustWater(d) {
  State.waterHome = Math.max(0, Math.min(DATA.agua.garrafas_5l_necesarias, (State.waterHome||0) + d));
  saveState();
  renderHogar();
}

/* ══════════════════════════════════════════════════════════════
   RECIPE SHEET
   ══════════════════════════════════════════════════════════════ */
function findMeal(dayId, slot, weekIdx) {
  const wkIdx = weekIdx !== undefined ? weekIdx : State.weekIdx;
  for (let wi = 0; wi < DATA.semanas.length; wi++) {
    const semana = DATA.semanas[wi];
    const dia = semana.dias.find(d => d.id === dayId);
    if (dia) return { meal: dia[slot], dia, slot };
  }
  return null;
}

function findMealByKey(key) {
  const parts = key.split('-');
  const slot = parts.pop();
  const dayId = parts.join('-');
  const result = findMeal(dayId, slot);
  if (result) return result;
  // fallback: search all weeks
  for (const semana of DATA.semanas) {
    for (const dia of semana.dias) {
      if (dia.id === dayId) return { meal: dia[slot], dia, slot };
    }
  }
  return null;
}

function openSheet(dayId, slot, weekIdx) {
  const found = findMeal(dayId, slot, weekIdx);
  if (!found) return;
  _openSheet(found.meal, found.dia, found.slot);
}

function openSheetByKey(key) {
  const found = findMealByKey(key);
  if (!found) return;
  _openSheet(found.meal, found.dia, found.slot);
}

function _openSheet(meal, dia, slot) {
  const key = `${dia.id}-${slot}`;
  const rating = State.ratings[key] ?? meal.rating ?? 0;
  const slotLabel = slot === 'comida' ? '🍽 Comida' : '🌙 Cena';

  const sheet = document.getElementById('sheet');
  sheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-hero">
      <img src="${img(meal.imagen)}" alt="${meal.nombre}" style="width:100%;height:100%;object-fit:cover">
      <div class="sheet-hero-overlay"></div>
      <button class="sheet-close" onclick="closeSheet()">✕</button>
    </div>
    <div class="sheet-body">
      <div class="sheet-eyebrow">${slotLabel} · ${dia.dia}</div>
      <div class="sheet-title">${meal.nombre}</div>
      <div class="sheet-desc">${meal.descripcion}</div>
      <div class="sheet-meta">
        <span class="meal-time">⏱ ${meal.tiempo} min</span>
        ${tagHtml(meal.tipo, meal.airfryer ? ['airfryer'] : [])}
        ${meal.prepAhead ? '<span class="tag tag-facil">📅 Adelantable</span>' : ''}
      </div>
      <div class="recipe-section">
        <div class="recipe-section-title">Ingredientes · 2 personas</div>
        ${meal.ingredientes.map(i =>
          `<div class="ing-item"><div class="ing-dot"></div>${i}</div>`
        ).join('')}
      </div>
      <div class="recipe-section" style="margin-top:20px">
        <div class="recipe-section-title">Preparación</div>
        ${meal.pasos.map((p,i) =>
          `<div class="step-item">
            <div class="step-num">${i+1}</div>
            <div class="step-text">${p}</div>
          </div>`
        ).join('')}
      </div>
      <div class="sheet-rating">
        <span class="rating-label">Tu valoración</span>
        <div class="rating-stars" id="rating-stars">
          ${Array.from({length:5},(_,i) =>
            `<span class="rating-star${i<rating?' on':''}" onclick="setRating('${key}',${i+1})">${i<rating?'★':'☆'}</span>`
          ).join('')}
        </div>
      </div>
    </div>`;

  const backdrop = document.getElementById('sheet-backdrop');
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSheet() {
  document.getElementById('sheet-backdrop').classList.remove('open');
  document.body.style.overflow = '';
}

function setRating(key, val) {
  State.ratings[key] = val;
  saveState();
  const stars = document.querySelectorAll('.rating-star');
  stars.forEach((s,i) => {
    s.classList.toggle('on', i < val);
    s.textContent = i < val ? '★' : '☆';
  });
  showToast(`Valoración guardada ${'★'.repeat(val)}`);
}

/* ══════════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════════ */
async function init() {
  try {
    const res = await fetch('data.json');
    DATA = await res.json();
  } catch(e) {
    console.error('Error cargando data.json', e);
    return;
  }

  loadState();

  document.getElementById('sheet-backdrop').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeSheet();
  });

  navigate('hoy');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(e => console.warn('SW:', e));
  }
}

document.addEventListener('DOMContentLoaded', init);
