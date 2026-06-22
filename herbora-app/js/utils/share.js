/* =============================================================
   Herbora Sales App — Compartición
   WhatsApp, email, clipboard, PDF (print)
   ============================================================= */

import { buildOrderText, buildEmailSubject } from './format.js';
import { Toast } from '../components/toast.js';

export const Share = {

  /* ── Construir objeto de pedido completo ─────────────── */
  buildOrderPayload(orderItems, { name = '', notes = '', mode = 'commercial' } = {}) {
    return { items: orderItems, name, notes, mode };
  },

  /* ── WhatsApp ─────────────────────────────────────────── */
  whatsapp(orderItems, opts = {}) {
    const order  = this.buildOrderPayload(orderItems, opts);
    const text   = buildOrderText(order, opts.mode);
    const url    = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  /* ── Email ────────────────────────────────────────────── */
  email(orderItems, opts = {}) {
    const order   = this.buildOrderPayload(orderItems, opts);
    const subject = buildEmailSubject(opts.mode);
    const body    = buildOrderText(order, opts.mode);
    const url     = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  },

  /* ── Copiar al portapapeles ──────────────────────────── */
  async clipboard(orderItems, opts = {}) {
    const order = this.buildOrderPayload(orderItems, opts);
    const text  = buildOrderText(order, opts.mode);
    try {
      await navigator.clipboard.writeText(text);
      Toast.show('Texto copiado al portapapeles', 'success');
      return true;
    } catch {
      /* Fallback para Safari/iOS */
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity  = '0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) Toast.show('Texto copiado', 'success');
      else    Toast.show('No se pudo copiar. Copia el texto manualmente.', 'error');
      return ok;
    }
  },

  /* ── PDF (print) ──────────────────────────────────────── */
  pdf(orderItems, opts = {}) {
    /* Inyectar contenido de impresión temporal */
    const order = this.buildOrderPayload(orderItems, opts);
    const text  = buildOrderText(order, opts.mode);
    const lines = text.split('\n');

    const printDiv = document.createElement('div');
    printDiv.id = 'print-order';
    printDiv.style.cssText = 'display:none;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto;';
    printDiv.innerHTML = `
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:24px;font-weight:700;color:#0E6270;">herbora</div>
        <div style="font-size:12px;color:#7A7A7A;">herbora.es</div>
      </div>
      <hr style="border:none;border-top:1px solid #E8E6E1;margin:16px 0;">
      ${lines.map(l => l
        ? `<p style="margin:4px 0;font-size:13px;color:#4A4A4A;">${escapeHtml(l)}</p>`
        : '<br>'
      ).join('')}
      <hr style="border:none;border-top:1px solid #E8E6E1;margin:16px 0;">
      <p style="font-size:11px;color:#B0B0B0;text-align:center;">Herbora Sales App · ${new Date().toLocaleDateString('es-ES')}</p>
    `;

    document.body.appendChild(printDiv);

    /* CSS de impresión */
    const style = document.createElement('style');
    style.id = 'print-style-temp';
    style.textContent = `
      @media print {
        body > *:not(#print-order) { display: none !important; }
        #print-order { display: block !important; }
      }
    `;
    document.head.appendChild(style);

    window.print();

    /* Limpiar después de imprimir */
    window.addEventListener('afterprint', () => {
      printDiv.remove();
      style.remove();
    }, { once: true });
  },

  /* ── Web Share API (nativa) ──────────────────────────── */
  async native(orderItems, opts = {}) {
    if (!navigator.share) return false;
    const order   = this.buildOrderPayload(orderItems, opts);
    const text    = buildOrderText(order, opts.mode);
    const subject = buildEmailSubject(opts.mode);
    try {
      await navigator.share({ title: subject, text });
      return true;
    } catch (e) {
      if (e.name !== 'AbortError') throw e;
      return false;
    }
  },

  /* ── Compartir producto individual ───────────────────── */
  shareProduct(product) {
    const url  = `${window.location.origin}${window.location.pathname}#/producto/${product.ref}`;
    const text = `${product.name} — ${product.brand}\nVer en catálogo Herbora:\n${url}`;

    if (navigator.share) {
      navigator.share({ title: product.name, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() =>
        Toast.show('Enlace copiado', 'success')
      ).catch(() => {});
    }
  },
};

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
