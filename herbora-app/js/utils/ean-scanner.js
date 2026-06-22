/* =============================================================
   Herbora Sales App — EAN Scanner (preparado, no activo)
   Se activa cuando BarcodeDetector API esté disponible
   o cuando se integre una librería como ZXing/QuaggaJS.
   ============================================================= */

export const EanScanner = {

  /* ¿Soporta el dispositivo escaneo nativo? */
  isSupported() {
    return typeof BarcodeDetector !== 'undefined';
  },

  /* Buscar producto por EAN en el catálogo */
  findByEan(ean, products) {
    if (!ean || !products) return null;
    const clean = String(ean).replace(/^0+/, '');
    return products.find(p =>
      p.ean13 === ean ||
      p.ean13 === clean ||
      String(p.ean13).replace(/^0+/, '') === clean
    ) || null;
  },

  /* Iniciar escaneo (implementación pendiente) */
  async startScan(onDetect) {
    if (!this.isSupported()) {
      console.info('[EanScanner] BarcodeDetector no disponible en este dispositivo');
      return false;
    }

    /* Implementación futura:
    const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128'] });
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    // ... loop de detección
    */

    console.info('[EanScanner] Listo para integrar en una futura versión');
    return false;
  },

  stopScan() {
    /* Implementación futura */
  },
};
