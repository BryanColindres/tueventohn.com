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
const CLOUDINARY_CLOUD_NAME = "PEGAR_CLOUD_NAME";
const CLOUDINARY_UPLOAD_PRESET = "PEGAR_UPLOAD_PRESET";

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
// Siempre entra como "pendiente" (lo fuerza un trigger en la base de datos,
// sin importar qué se mande aquí). cargarFirmas() solo puede ver las
// aprobadas — el filtro lo hace la política de seguridad de la base de datos,
// no este archivo, así que no hay que tocar nada aquí para que funcione.
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

// ---------------- RSVP PREMIUM: validar link de invitado ----------------
async function validarInvitado(slug, identificador) {
  try {
    return await _rpc("validar_identificador_invitado", { p_slug: slug, p_identificador: identificador });
  } catch (err) {
    console.error(err);
    return false;
  }
}

// ---------------- APERTURA ----------------
// Se llama una sola vez al cargar la invitación (si la URL trae ?id=).
// No crea filas: actualiza primera_apertura_en / ultima_apertura_en / veces_abierto
// de la fila que ya existe. Falla en silencio (nunca debe romper la invitación).
async function marcarApertura(identificador) {
  if (!identificador) return;
  try {
    await _rpc("portal_marcar_apertura", { p_identificador: identificador });
  } catch (err) {
    console.warn("No se pudo registrar la apertura:", err);
  }
}

// ---------------- RSVP CON NOMBRES REALES (individual o familiar) ----------------
// Nadie escribe su nombre: el link (?id=) ya identifica a la persona o a toda
// la familia. Devuelve [{invitado_id, nombre, estado}, ...] — un solo elemento
// si es link individual, varios si es link familiar.
async function cargarPersonasParaRSVP(identificador) {
  try {
    return await _rpc("invitacion_personas_para_rsvp", { p_identificador: identificador });
  } catch (err) {
    console.error(err);
    return [];
  }
}

// decisiones: [{invitado_id, asiste: true|false}, ...]
async function confirmarAsistencia(identificador, decisiones, mensaje) {
  return _rpc("invitacion_confirmar_asistencia", {
    p_identificador: identificador,
    p_decisiones: decisiones,
    p_mensaje: mensaje || null
  });
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
  marcarApertura,
  cargarPersonasParaRSVP,
  confirmarAsistencia
};
