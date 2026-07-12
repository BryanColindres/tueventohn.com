// ============================================================================
// TUBODA TEXTOS — módulo compartido de palabras/etiquetas editables
// Este archivo es IDÉNTICO en todas las plantillas (se copia, no se enlaza,
// igual que backend.js).
//
// LA IDEA: cada plantilla trae sus textos por defecto escritos directo en el
// HTML (para que nunca se vea "roto" si algo falla). Este módulo busca todo
// elemento marcado con data-texto="clave" y, SOLO SI el evento tiene un valor
// distinto guardado para esa clave en config.textos, se lo reemplaza. Si no
// hay override, el HTML se queda tal cual está escrito.
//
// Así, todas las plantillas comparten las mismas claves y el mismo
// comportamiento (un solo "config" de textos), pero cada cliente puede pedir
// que algo diga distinto (ej. "Confirma" en vez de "Confirmar Asistencia")
// sin que nadie tenga que tocar código: ese override vive en config.textos,
// que en un evento real viene de Supabase (tabla event_textos, ver backend).
// ============================================================================

// Valores por defecto — sirven de referencia y de documentación de qué claves
// existen. Las plantillas NO necesitan traer estos valores en su HTML idénticos
// a esto; esto es solo lo que se usa si config.textos no trae nada para esa clave
// y el HTML tampoco tiene texto propio (caso raro, red de seguridad).
const TEXTOS_POR_DEFECTO = {
  tituloHistoria: "Nuestra Historia",
  tituloItinerario: "Itinerario",
  tituloDetalles: "Detalles del Evento",
  tituloUbicacion: "Ubicación",
  tituloCountdown: "Faltan...",
  tituloRSVP: "Confirmar Asistencia",
  botonRSVPEntrada: "Confirmar asistencia",
  botonRSVP: "Enviar Confirmación",
  mensajeRSVPGracias: "Gracias por confirmar tu asistencia. ¡Te esperamos con mucho cariño!",
  preguntaAsiste: "¿Asistirás?",
  opcionSiAsiste: "Sí, ahí estaré",
  opcionNoAsiste: "No podré asistir",
  tituloRegalos: "Mesa de Regalos",
  tituloPlaylist: "Nuestra Playlist",
  tituloLibroFirmas: "Libro de Firmas",
  introLibroFirmas: "Deja un mensaje para los novios. Los mensajes aprobados aparecerán aquí para que todos los lean.",
  placeholderNombreFirma: "Tu nombre",
  placeholderMensajeFirma: "Escribe tu mensaje para los novios...",
  botonPublicarFirma: "Publicar Mensaje",
  etiquetaEnRevision: "En revisión",
  botonComoLlegar: "Cómo Llegar",
  botonAgregarCalendario: "Agregar al Calendario",
  botonVerMesaRegalos: "Ver Mesa de Regalos"
};

/**
 * Aplica los textos del evento sobre cualquier elemento marcado con
 * data-texto="clave" que exista en el HTML de la plantilla que sea.
 * Se llama una sola vez, justo después de cargar el config.
 */
function aplicarTextos(config) {
  const overrides = (config && config.textos) || {};

  document.querySelectorAll("[data-texto]").forEach((el) => {
    const clave = el.getAttribute("data-texto");
    const valor = overrides[clave];
    if (valor) {
      // Inputs/textarea usan placeholder; el resto usa el texto visible.
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.setAttribute("placeholder", valor);
      } else {
        el.textContent = valor;
      }
    }
    // Si no hay override, no se toca nada: se queda el texto que ya
    // trae el HTML de la plantilla (su valor por defecto real).
  });
}

window.TuBodaTextos = {
  DEFAULTS: TEXTOS_POR_DEFECTO,
  aplicar: aplicarTextos
};
