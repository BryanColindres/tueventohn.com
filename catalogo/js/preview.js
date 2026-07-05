// ============================================================================
// PREVIEW.JS — motor de vista previa "viva" para las tarjetas del catálogo.
//
// Cada tarjeta tiene UN iframe con la plantilla real (misma URL que se abre
// al hacer clic — no hay video, gif ni captura). Mientras el teléfono esté
// ~40% visible en el viewport, este motor mueve el scroll REAL del documento
// dentro del iframe con requestAnimationFrame, de forma suave, hacia abajo,
// pausa, y regresa arriba — en loop. Al salir del viewport se detiene por
// completo (no sigue consumiendo CPU en segundo plano).
//
// Como el iframe carga una página del mismo origen (mismo dominio en GitHub
// Pages), se puede leer/mover su scroll directamente vía contentDocument —
// no hace falta postMessage.
// ============================================================================

const TuBodaPreview = (() => {

  const VELOCIDAD_PX_SEG = 26;   // qué tan rápido "lee" la página
  const PAUSA_MS = 1800;         // pausa arriba y abajo antes de invertir
  const UMBRAL_VISIBLE = 0.4;    // 40% del teléfono dentro del viewport

  class VistaPrevia {
    constructor(contenedor){
      this.contenedor = contenedor;
      this.iframe = contenedor.querySelector('iframe');
      this.url = contenedor.dataset.url;

      this.cargado = false;
      this.activo = false;
      this.direccion = 1;      // 1 = bajando, -1 = subiendo
      this.enPausa = false;
      this.pausaHasta = 0;
      this.ultimoTs = null;
      this.rafId = null;

      this.iframe.addEventListener('load', () => { this.cargado = true; });

      // Todo el teléfono es el enlace — un overlay transparente captura el
      // click incluso sobre el iframe (el iframe, si no, se roba el evento).
      const overlay = contenedor.querySelector('.telefono-click');
      overlay.addEventListener('click', () => {
        window.open(this.url, '_blank', 'noopener');
      });
    }

    iniciar(){
      if (this.activo) return;
      this.activo = true;
      this.ultimoTs = null;
      this.rafId = requestAnimationFrame((ts) => this._tick(ts));
    }

    detener(){
      this.activo = false;
      if (this.rafId !== null) cancelAnimationFrame(this.rafId);
      this.rafId = null;
      this.ultimoTs = null;
    }

    _obtenerScroller(){
      let doc;
      try { doc = this.iframe.contentDocument; } catch (err) { return null; }
      if (!doc) return null;
      return doc.scrollingElement || doc.documentElement || doc.body;
    }

    _tick(ts){
      if (!this.activo) return;

      if (!this.cargado) {
        this.rafId = requestAnimationFrame((t) => this._tick(t));
        return;
      }

      const scroller = this._obtenerScroller();
      if (!scroller) {
        this.rafId = requestAnimationFrame((t) => this._tick(t));
        return;
      }

      if (this.enPausa) {
        if (ts >= this.pausaHasta) this.enPausa = false;
        this.ultimoTs = ts;
        this.rafId = requestAnimationFrame((t) => this._tick(t));
        return;
      }

      if (this.ultimoTs === null) this.ultimoTs = ts;
      const deltaSeg = Math.min((ts - this.ultimoTs) / 1000, 0.1); // clamp por si la pestaña estuvo en background
      this.ultimoTs = ts;

      const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);

      // si la página cargó pero aún no tiene altura real (imágenes pesando),
      // seguimos esperando sin fallar
      if (maxScroll <= 0) {
        this.rafId = requestAnimationFrame((t) => this._tick(t));
        return;
      }

      let nuevo = scroller.scrollTop + this.direccion * VELOCIDAD_PX_SEG * deltaSeg;

      if (nuevo >= maxScroll) {
        nuevo = maxScroll;
        this.direccion = -1;
        this.enPausa = true;
        this.pausaHasta = ts + PAUSA_MS;
      } else if (nuevo <= 0) {
        nuevo = 0;
        this.direccion = 1;
        this.enPausa = true;
        this.pausaHasta = ts + PAUSA_MS;
      }

      scroller.scrollTop = nuevo;
      this.rafId = requestAnimationFrame((t) => this._tick(t));
    }
  }

  function iniciarTodas(){
    const contenedores = document.querySelectorAll('.telefono-wrap');
    const instancias = new Map();

    contenedores.forEach(c => instancias.set(c, new VistaPrevia(c)));

    const observerAparicion = new IntersectionObserver((entradas) => {
      entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('visto');
          observerAparicion.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.05 });

    const observerReproduccion = new IntersectionObserver((entradas) => {
      entradas.forEach(entrada => {
        const instancia = instancias.get(entrada.target);
        if (!instancia) return;
        if (entrada.isIntersecting) instancia.iniciar();
        else instancia.detener();
      });
    }, { threshold: UMBRAL_VISIBLE });

    contenedores.forEach(c => {
      observerAparicion.observe(c);
      observerReproduccion.observe(c);
    });
  }

  return { iniciarTodas };
})();
