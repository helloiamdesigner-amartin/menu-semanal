/* =============================================================
   Herbora Sales App — Utilidades de formateo
   Fechas, texto, generación de resumen de pedido
   ============================================================= */

/* ── Formatear fecha ────────────────────────────────────── */
export function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date instanceof Date ? date : new Date(date));
}

export function formatDateShort(date = new Date()) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date instanceof Date ? date : new Date(date));
}

/* ── Truncar texto ──────────────────────────────────────── */
export function truncate(text, maxLen = 60) {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen).trim() + '…' : text;
}

/* ── Normalizar texto para búsqueda ─────────────────────── */
export function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/* ── Unidades (singular/plural) ─────────────────────────── */
export function units(qty) {
  return qty === 1 ? '1 unidad' : `${qty} unidades`;
}

/* ── Generar texto del resumen de pedido ────────────────── */
export function buildOrderText(order, mode = 'commercial') {
  const isCommercial = mode === 'commercial';
  const lines = [];

  /* Encabezado */
  lines.push('Resumen de pedido Herbora');
  lines.push(`Fecha: ${formatDate()}`);
  if (order.name) lines.push(`Nombre: ${order.name}`);
  lines.push('');

  /* Productos */
  for (const item of order.items) {
    lines.push(`REF ${item.ref} | ${item.name} | ${units(item.quantity)}`);
  }

  /* Totales */
  const totalRefs  = order.items.length;
  const totalUnits = order.items.reduce((s, i) => s + i.quantity, 0);
  lines.push('');
  lines.push(`Total referencias: ${totalRefs}`);
  lines.push(`Total unidades: ${totalUnits}`);

  /* Observaciones */
  if (order.notes && order.notes.trim()) {
    lines.push('');
    lines.push(`Observaciones: ${order.notes.trim()}`);
  }

  /* Aviso modo consumidor */
  if (!isCommercial) {
    lines.push('');
    lines.push('Este resumen no incluye precios ni condiciones comerciales.');
    lines.push('Por favor, revisar disponibilidad y condiciones con el comercial Herbora.');
  }

  lines.push('');
  lines.push('Generado con Herbora Sales App');

  return lines.join('\n');
}

/* ── Asunto de email ────────────────────────────────────── */
export function buildEmailSubject(mode = 'commercial') {
  return 'Resumen de pedido Herbora';
}

/* ── Highlight de texto de búsqueda ─────────────────────── */
export function highlight(text, query) {
  if (!query || !text) return text || '';
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

/* ── Extraer texto de productos para historial preview ───── */
export function previewProducts(items, max = 3) {
  if (!items || items.length === 0) return '—';
  const names = items.slice(0, max).map(i => i.name);
  if (items.length > max) names.push(`+${items.length - max} más`);
  return names.join(', ');
}

/* ── Calcular totales de pedido ─────────────────────────── */
export function calcOrderTotals(items) {
  return {
    refs:  items.length,
    units: items.reduce((s, i) => s + (i.quantity || 0), 0),
  };
}
