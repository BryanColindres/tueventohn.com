// ============================================================================
// TUBODA BACKEND — módulo compartido de conexión a Supabase
// Este archivo es IDÉNTICO en todas las plantillas (se copia, no se enlaza,
// para que cada plantilla siga siendo 100% independiente y pueda vivir en su
// propio repo si algún día se separan).
//
// Responsabilidad única: hablar con Supabase. Las plantillas nunca hacen
// fetch() directo a Supabase — todo pasa por window.TuBodaBackend.
// ============================================================================

const SUPABASE_URL = "https://npfgugnoycokhtljbwkw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Ij3gofHHYKTHps92RKXKwQ_5Hya3_GW";

// Cloudinary es compartido por toda la plataforma (una sola cuenta de TuBoda,
// no una por cliente). Pega aquí los datos reales cuando los tengas.
const CLOUDINARY_CLOUD_NAME = "di6hpumct";
const CLOUDINARY_UPLOAD_PRESET = "boda_jissel_daniel";

async function _rpc(nombreFuncion, parametros) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nombreFuncion}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(parametros)
  });
  if (!res.ok) {
    const texto = await res.text();
    throw new Error(`Error en ${nombreFuncion}: ${res.status} ${texto}`);
  }
  return res.json();
}

async function _select(tabla, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}?${query}`, {
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  if (!res.ok) return [];
  return res.json();
}

async function _insert(tabla, filas) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Prefer": "return=representation"
    },
    body: JSON.stringify(filas)
  });
  if (!res.ok) {
    const texto = await res.text();
    throw new Error(`Error insertando en ${tabla}: ${res.status} ${texto}`);
  }
  return res.json();
}

/**
 * Carga el CONFIG completo de un evento publicado.
 * - Si la URL trae ?evento=slug, carga ese evento real desde Supabase.
 * - Si no trae parámetro y la plantilla tiene un config-demo.js cargado,
 *   usa ese CONFIG de muestra (sirve para el catálogo y para revisar diseño
 *   antes de tener datos reales).
 */
async function cargarConfig() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("evento");
  const idInvitado = params.get("id");

  if (!slug) {
    if (window.CONFIG_DEMO) return window.CONFIG_DEMO;
    console.warn("No se especificó ?evento= y no hay CONFIG_DEMO disponible.");
    return null;
  }

  try {
    const data = await _rpc("get_event_config", { p_slug: slug });
    if (!data) {
      mostrarErrorCarga("Esta invitación no existe o todavía no ha sido publicada.");
      return null;
    }

    // Si la invitación tiene RSVP Premium y la URL trae un identificador de
    // invitado, se resuelve su nombre para personalizar el banner y (si
    // corresponde) la pantalla de mensaje personalizado.
    data.invitado = null;
    if (data.modules && data.modules.rsvp_premium && idInvitado) {
      const invitado = await obtenerInvitado(slug, idInvitado);
      if (invitado) data.invitado = { nombre: invitado.nombre, identificador: idInvitado };
    }

    return data;
  } catch (err) {
    console.error(err);
    mostrarErrorCarga("No se pudo cargar la invitación. Intenta de nuevo en unos minutos.");
    return null;
  }
}

function mostrarErrorCarga(mensaje) {
  document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
      text-align:center;padding:2rem;font-family:sans-serif;background:#111;color:#eee">
      <div>
        <p style="font-size:1.1rem;margin-bottom:.5rem">${mensaje}</p>
        <p style="opacity:.6;font-size:.85rem">Si crees que esto es un error, contacta a quienes te enviaron el link.</p>
      </div>
    </div>`;
}

// ---------------- LIBRO DE FIRMAS ----------------
// Siempre entra como "pendiente" (lo fuerza un trigger en la base de datos).
// cargarFirmas() solo puede ver las aprobadas — lo filtra la base de datos.
async function enviarFirma(eventoId, nombre, mensaje, invitadoId) {
  await _insert("firmas", [{ evento_id: eventoId, nombre, mensaje, invitado_id: invitadoId || null }]);
}

async function cargarFirmas(eventoId) {
  return _select("firmas", `evento_id=eq.${eventoId}&order=fecha.desc&select=nombre,mensaje`);
}

// ---------------- GALERÍA ----------------
async function subirFotoGaleria(eventoId, archivo, subidoPor) {
  if (CLOUDINARY_CLOUD_NAME.startsWith("PEGAR_")) {
    throw new Error("Cloudinary no está configurado todavía (ver shared/js/backend.js).");
  }
  const formData = new FormData();
  formData.append("file", archivo);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", `tuboda/${eventoId}`);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error("No se pudo subir la foto a Cloudinary.");

  await _insert("galeria", [{ evento_id: eventoId, imagen_url: data.secure_url, subido_por: subidoPor || null }]);
  return data.secure_url;
}

async function cargarGaleria(eventoId) {
  return _select("galeria", `evento_id=eq.${eventoId}&order=orden.asc&select=imagen_url`);
}

// ---------------- PEDIR CANCIÓN ----------------
async function enviarCancion(eventoId, nombre, cancion) {
  await _insert("canciones", [{ evento_id: eventoId, nombre, cancion }]);
}

async function cargarCanciones(eventoId) {
  return _select("canciones", `evento_id=eq.${eventoId}&order=fecha.desc&select=nombre,cancion`);
}

// ---------------- RSVP PREMIUM: validar y obtener nombre de invitado ----------------
async function validarInvitado(slug, identificador) {
  try {
    return await _rpc("validar_identificador_invitado", { p_slug: slug, p_identificador: identificador });
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function obtenerInvitado(slug, identificador) {
  try {
    const data = await _rpc("obtener_invitado", { p_slug: slug, p_identificador: identificador });
    if (!data || data.error) return null;
    return data;
  } catch (err) {
    console.error(err);
    return null;
  }
}

// ---------------- MÓDULOS NO COMPRADOS: bloqueados con invitación a comprar ----------------
function mostrarBloqueado(seccion, nombreModulo, mensaje){
  if (!seccion) return;
  const whatsapp = (window.CONFIG_DEMO && window.CONFIG_DEMO.whatsapp && window.CONFIG_DEMO.whatsapp.novio) || "50431626792";
  const texto = encodeURIComponent(`Hola, quiero agregar el módulo de ${nombreModulo} a mi invitación`);
  seccion.style.display = '';
  seccion.classList.add('seccion-bloqueada');
  seccion.innerHTML = `
    <div class="bloqueado-card">
      <svg class="bloqueado-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>
      <h3>${nombreModulo}</h3>
      <p>${mensaje}</p>
      <a href="https://wa.me/${whatsapp}?text=${texto}" target="_blank" class="bloqueado-btn">Quiero agregar esto</a>
    </div>`;
}

// ---------------- LIMPIAR DIVISORES HUÉRFANOS ----------------
// Si una sección vecina de un divisor decorativo (el "+" de Elegante, los
// azulejos/rosario de Colonial, etc.) queda oculta porque ese módulo no fue
// comprado, el divisor se queda solo, flotando sin nada que separar.
// Esto oculta cualquier elemento con class="divisor" que tenga un vecino
// oculto — se llama al final, después de que todos los pintarX() ya
// decidieron qué mostrar y qué ocultar.
function limpiarDivisoresHuerfanos(){
  document.querySelectorAll('.divisor').forEach(div => {
    const anterior = div.previousElementSibling;
    const siguiente = div.nextElementSibling;
    const anteriorOculto = !anterior || getComputedStyle(anterior).display === 'none';
    const siguienteOculto = !siguiente || getComputedStyle(siguiente).display === 'none';
    div.style.display = (anteriorOculto || siguienteOculto) ? 'none' : '';
  });
}

// ---------------- ICONOS DEL ITINERARIO (los 10 más comunes) ----------------
const ICONOS_ITINERARIO = {
  ceremonia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="15" r="4"/><circle cx="16" cy="15" r="4"/><path d="M12 6l-2 5M12 6l2 5"/></svg>',
  recepcion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 3v6a5 5 0 0010 0V3M12 13v8M8 21h8"/></svg>',
  coctel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 4h14l-7 8v8M9 20h6"/><circle cx="17" cy="4" r="1" fill="currentColor" stroke="none"/></svg>',
  cena: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3v7a2 2 0 002 2v9M6 3v9M9 3v7M18 3c-2 0-3 2-3 5v2h3v9"/></svg>',
  baile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="5" r="2"/><path d="M9 7v6l-3 7M9 13l4 2 3 6M9 13l5-2 2-5"/></svg>',
  fiesta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20L15 9M17 3l1 3 3 1-3 1-1 3-1-3-3-1 3-1zM5 13l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>',
  brindis: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3l1 8a3 3 0 003 3 3 3 0 003-3l1-8M10 14v7M7 21h6M4 5l3-1M20 5l-3-1"/></svg>',
  pastel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 21v-7a2 2 0 012-2h12a2 2 0 012 2v7M4 21h16M11 12V8M11 4v1M8 12c0-2 1-3 3-4 2 1 3 2 3 4"/></svg>',
  ramo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="7" r="2"/><circle cx="14" cy="6" r="2"/><circle cx="16" cy="10" r="2"/><circle cx="10" cy="11" r="2"/><path d="M11 12l-4 9"/></svg>',
  salida: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 12h13M11 6l6 6-6 6M16 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3"/></svg>'
};

const NOMBRES_ICONOS_ITINERARIO = {
  ceremonia: 'Ceremonia', recepcion: 'Recepción', coctel: 'Cóctel', cena: 'Cena',
  baile: 'Primer baile', fiesta: 'Fiesta', brindis: 'Brindis', pastel: 'Pastel',
  ramo: 'Lanzamiento del ramo', salida: 'Salida de los novios'
};

function iconoTimelineHtml(slugIcono){
  if (!slugIcono || !ICONOS_ITINERARIO[slugIcono]) return '';
  return `<span class="icono-itinerario">${ICONOS_ITINERARIO[slugIcono]}</span>`;
}

// ---------------- APERTURA ----------------
// Se llama una sola vez al cargar la invitación (si la URL trae ?id=).
// No crea filas: actualiza primera_apertura_en / ultima_apertura_en / veces_abierto.
// Falla en silencio (nunca debe romper la invitación).
async function marcarApertura(identificador) {
  if (!identificador) return;
  try {
    await _rpc("portal_marcar_apertura", { p_identificador: identificador });
  } catch (err) {
    console.warn("No se pudo registrar la apertura:", err);
  }
}

// ---------------- RSVP CON NOMBRES REALES (individual o familiar) ----------------
async function cargarPersonasParaRSVP(identificador) {
  try {
    return await _rpc("invitacion_personas_para_rsvp", { p_identificador: identificador });
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function confirmarAsistencia(identificador, decisiones, mensaje) {
  return _rpc("invitacion_confirmar_asistencia", {
    p_identificador: identificador,
    p_decisiones: decisiones,
    p_mensaje: mensaje || null
  });
}

// ---------------- PLAYLIST: normalizar cualquier link a su versión embebida ----------------
// El cliente pega el link que le da Spotify/YouTube al compartir (con montón
// de parámetros de tracking, o el link normal de la app) — esto lo convierte
// siempre al formato que sí se puede incrustar, sin pedirle que lo edite.
function normalizarPlaylistUrl(url) {
  if (!url) return null;
  url = url.trim();

  // Spotify: playlist, álbum o show — funciona con o sin parámetros extra,
  // y si ya viene en formato /embed/ lo deja igual.
  let m = url.match(/open\.spotify\.com\/(?:embed\/)?(playlist|album|show)\/([a-zA-Z0-9]+)/);
  if (m) return `https://open.spotify.com/embed/${m[1]}/${m[2]}`;

  // YouTube: playlist completa (?list=...)
  m = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (m) return `https://www.youtube.com/embed/videoseries?list=${m[1]}`;

  // YouTube: un solo video (youtu.be/ID o watch?v=ID)
  m = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;

  // No se reconoce el formato: se deja tal cual (se mostrará como link para abrir).
  return url;
}

window.TuBodaBackend = {
  cargarConfig,
  enviarFirma,
  cargarFirmas,
  subirFotoGaleria,
  cargarGaleria,
  enviarCancion,
  cargarCanciones,
  validarInvitado,
  obtenerInvitado,
  mostrarBloqueado,
  limpiarDivisoresHuerfanos,
  ICONOS_ITINERARIO,
  NOMBRES_ICONOS_ITINERARIO,
  iconoTimelineHtml,
  marcarApertura,
  cargarPersonasParaRSVP,
  confirmarAsistencia,
  normalizarPlaylistUrl
};
