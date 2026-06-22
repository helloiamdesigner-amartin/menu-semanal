/* =========================================================
   CASITA — Utils
   Helpers de fechas, formateo, DOM, generación de IDs
   ========================================================= */

const Utils = (() => {

  /* ── Fechas ──────────────────────────────────────────────── */
  function today() {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  }

  function todayDate() {
    return new Date();
  }

  function parseDate(str) {
    // Parsear YYYY-MM-DD sin timezone issues
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function formatDate(dateStr, options = {}) {
    const date = parseDate(dateStr);
    const defaults = { weekday: 'long', day: 'numeric', month: 'long' };
    return date.toLocaleDateString('es-ES', { ...defaults, ...options });
  }

  function formatDateShort(dateStr) {
    const date = parseDate(dateStr);
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
  }

  function dayOfWeek(dateStr) {
    return parseDate(dateStr).getDay(); // 0=dom, 1=lun, ..., 6=sab
  }

  function isSaturday(dateStr) {
    return dayOfWeek(dateStr) === 6;
  }

  function isToday(dateStr) {
    return dateStr === today();
  }

  function daysBetween(dateStr1, dateStr2) {
    const d1 = parseDate(dateStr1);
    const d2 = parseDate(dateStr2);
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  }

  function daysAgo(dateStr) {
    return daysBetween(dateStr, today());
  }

  function addDays(dateStr, n) {
    const date = parseDate(dateStr);
    date.setDate(date.getDate() + n);
    return date.toISOString().split('T')[0];
  }

  function getWeekDays(startDateStr) {
    // Retorna array de 7 fechas desde el lunes de la semana que contiene startDate
    const start = parseDate(startDateStr);
    const dow = start.getDay(); // 0=dom
    const monday = new Date(start);
    const offset = dow === 0 ? -6 : 1 - dow;
    monday.setDate(monday.getDate() + offset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }

  function DAY_NAMES_SHORT() {
    return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  }

  function DAY_NAMES_SHORT_FROM_MONDAY() {
    return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  }

  /* ── Tiempo ──────────────────────────────────────────────── */
  function greetingTime() {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  }

  function formatMinutes(min) {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  function currentSeason() {
    const m = new Date().getMonth() + 1; // 1-12
    if (m >= 3 && m <= 5)  return 'primavera';
    if (m >= 6 && m <= 8)  return 'verano';
    if (m >= 9 && m <= 11) return 'otono';
    return 'invierno';
  }

  /* ── Agua ────────────────────────────────────────────────── */
  function formatLiters(ml) {
    if (ml >= 1000) return `${(ml / 1000).toFixed(1).replace('.', ',')} L`;
    return `${ml} ml`;
  }

  function mlToLiters(ml) {
    return (ml / 1000).toFixed(1);
  }

  /* ── IDs ─────────────────────────────────────────────────── */
  function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function slugify(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /* ── DOM ─────────────────────────────────────────────────── */
  function el(id) { return document.getElementById(id); }

  function qs(selector, parent = document) {
    return parent.querySelector(selector);
  }

  function qsa(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
  }

  function html(strings, ...values) {
    return strings.reduce((result, str, i) =>
      result + str + (values[i] !== undefined ? escapeHtml(String(values[i])) : ''), '');
  }

  function rawHtml(str) { return str; } // Para casos donde el HTML ya está sanitizado

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setInner(id, content) {
    const elem = typeof id === 'string' ? document.getElementById(id) : id;
    if (elem) elem.innerHTML = content;
  }

  function show(id) {
    const elem = typeof id === 'string' ? document.getElementById(id) : id;
    if (elem) elem.style.display = '';
  }

  function hide(id) {
    const elem = typeof id === 'string' ? document.getElementById(id) : id;
    if (elem) elem.style.display = 'none';
  }

  function toggle(id, visible) {
    const elem = typeof id === 'string' ? document.getElementById(id) : id;
    if (elem) elem.style.display = visible ? '' : 'none';
  }

  function addClass(id, cls) {
    const elem = typeof id === 'string' ? document.getElementById(id) : id;
    if (elem) elem.classList.add(cls);
  }

  function removeClass(id, cls) {
    const elem = typeof id === 'string' ? document.getElementById(id) : id;
    if (elem) elem.classList.remove(cls);
  }

  function toggleClass(elem, cls, condition) {
    if (condition) elem.classList.add(cls);
    else elem.classList.remove(cls);
  }

  /* ── Imágenes ────────────────────────────────────────────── */
  function imgWithFallback(src, fallback = 'assets/images/meals/placeholder.jpg') {
    return src || fallback;
  }

  function lazyImg(src, alt = '', cls = '', fallback = 'assets/images/meals/placeholder.jpg') {
    return `<img src="${src || fallback}" alt="${escapeHtml(alt)}" class="${cls}" 
      onerror="this.src='${fallback}';this.onerror=null"
      loading="lazy">`;
  }

  /* ── Estrellas ───────────────────────────────────────────── */
  function renderStars(score, total = 5) {
    return Array.from({ length: total }, (_, i) => {
      const filled = i < score;
      return `<span class="star ${filled ? '' : 'empty'}" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      </span>`;
    }).join('');
  }

  /* ── WhatsApp ────────────────────────────────────────────── */
  function openWhatsApp(text) {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }

  /* ── Vibración háptica (iOS PWA) ─────────────────────────── */
  function haptic(type = 'light') {
    if (!navigator.vibrate) return;
    const patterns = { light: [10], medium: [15], heavy: [25], success: [10, 50, 10] };
    navigator.vibrate(patterns[type] || patterns.light);
  }

  /* ── Debounce ───────────────────────────────────────────────── */
  function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  /* ── Números ────────────────────────────────────────────────── */
  function pct(value, total) {
    if (!total) return 0;
    return Math.min(100, Math.round((value / total) * 100));
  }

  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  return {
    today, todayDate, parseDate, formatDate, formatDateShort,
    dayOfWeek, isSaturday, isToday, daysBetween, daysAgo, addDays,
    getWeekDays, DAY_NAMES_SHORT, DAY_NAMES_SHORT_FROM_MONDAY,
    greetingTime, formatMinutes, currentSeason,
    formatLiters, mlToLiters,
    generateId, slugify,
    el, qs, qsa, html, rawHtml, escapeHtml, setInner, show, hide, toggle,
    addClass, removeClass, toggleClass,
    imgWithFallback, lazyImg, renderStars,
    openWhatsApp, haptic, debounce, pct, clamp
  };
})();

window.Utils = Utils;
