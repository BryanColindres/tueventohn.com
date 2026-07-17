// ============================================================================
// PORTAL DEL CLIENTE — acceso por código único (?codigo=XXXX), sin login.
// Todas las escrituras pasan por funciones RPC (SECURITY DEFINER) que validan
// el código dentro de Postgres.
// ============================================================================

const SUPABASE_URL = "https://npfgugnoycokhtljbwkw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Ij3gofHHYKTHps92RKXKwQ_5Hya3_GW";
const CLOUDINARY_CLOUD_NAME = "di6hpumct";
const CLOUDINARY_UPLOAD_PRESET = "boda_jissel_daniel";

let EVENTO_ID = null;

let CODIGO = null;
let historiaItems = [];
let timelineItems = [];
let mensajesItems = [];
let detallesItems = [];

async function rpc(nombre, parametros){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nombre}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify(parametros)
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Error en', nombre, data);
    alert('No se pudo guardar. Intenta de nuevo — si sigue fallando, avísale a Bryan.');
    return { error: 'error_supabase', detalle: data };
  }
  return data;
}

let LIMITE_GALERIA = null;

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  CODIGO = params.get('codigo');

  if (!CODIGO) { mostrarError(); return; }

  const datos = await rpc('portal_obtener_evento', { p_codigo: CODIGO });
  if (!datos || datos.error) { mostrarError(); return; }

  document.getElementById('portal-nombre-evento').textContent = datos.nombreEvento || 'Tu invitación';
  document.getElementById('portal-contenido').classList.remove('oculto');
  EVENTO_ID = datos.eventoId;

  document.getElementById('p-novio-a-nombre').value = datos.novioANombre || '';
  document.getElementById('p-novio-a-apellido').value = datos.novioAApellido || '';
  document.getElementById('p-novio-b-nombre').value = datos.novioBNombre || '';
  document.getElementById('p-novio-b-apellido').value = datos.novioBApellido || '';
  document.getElementById('p-whatsapp-a').value = datos.whatsappA || '';
  document.getElementById('p-whatsapp-b').value = datos.whatsappB || '';
  document.getElementById('p-fecha').value = datos.fecha || '';
  document.getElementById('p-hora').value = datos.hora || '';
  document.getElementById('p-fecha-limite').value = datos.fechaLimiteConfirmacion || '';
  document.getElementById('p-lugar-nombre').value = datos.lugarNombre || '';
  document.getElementById('p-lugar-direccion').value = datos.lugarDireccion || '';
  document.getElementById('p-lugar-maps').value = datos.lugarMapsUrl || '';
  document.getElementById('p-lugar-waze').value = datos.lugarWazeUrl || '';
  document.getElementById('p-lugar-foto').value = datos.lugarFotoUrl || '';
  document.getElementById('p-foto-hero').value = datos.fotoHeroUrl || '';
  document.getElementById('p-foto-footer').value = datos.fotoFooterUrl || '';
  document.getElementById('p-musica-url').value = datos.musicaUrl || '';
  document.getElementById('p-mensaje-tipo').value = datos.mensajePersonalizadoTipo || 'audio';
  document.getElementById('p-mensaje-url').value = datos.mensajePersonalizadoUrl || '';
  document.getElementById('p-video-interno-url').value = datos.videoInternoUrl || '';
  document.getElementById('p-video-interno-frase').value = datos.videoInternoFrase || '';
  document.getElementById('p-vestimenta-texto').value = datos.vestimentaTexto || '';
  document.getElementById('p-vestimenta-boton').value = datos.vestimentaBotonUrl || '';
  document.getElementById('p-regalos-texto').value = datos.regalosTexto || '';
  document.getElementById('p-regalos-cuenta').value = datos.regalosCuentaTexto || '';
  document.getElementById('p-firmas-foto').value = datos.firmasFotoUrl || '';
  document.getElementById('p-rsvp-foto').value = datos.rsvpFotoUrl || '';

  // La playlist se carga aparte (columna nueva, función propia) para no
  // tener que tocar portal_obtener_evento.
  const playlist = await rpc('portal_obtener_playlist', { p_codigo: CODIGO });
  document.getElementById('p-playlist-url').value = (playlist && playlist.cancionEmbedUrl) || '';

  // Igual la paleta de vestimenta y la foto B de portada.
  const extras = await rpc('portal_obtener_extras', { p_codigo: CODIGO });
  if (extras && extras.ok) {
    [1, 2, 3, 4].forEach(n => { document.getElementById(`p-paleta-incluir-${n}`).checked = false; });
    (extras.vestimentaPaleta || []).forEach((c, i) => {
      const n = i + 1;
      if (document.getElementById(`p-paleta-color-${n}`)) {
        document.getElementById(`p-paleta-incluir-${n}`).checked = true;
        document.getElementById(`p-paleta-color-${n}`).value = c.hex || '#000000';
        document.getElementById(`p-paleta-nombre-${n}`).value = c.nombre || '';
      }
    });
    if (extras.vestimentaColorEvitar) {
      document.getElementById('p-color-evitar-incluir').checked = true;
      document.getElementById('p-color-evitar').value = extras.vestimentaColorEvitar.hex || '#FFFFFF';
      document.getElementById('p-color-evitar-nombre').value = extras.vestimentaColorEvitar.nombre || '';
    }
    document.getElementById('p-foto-hero-b').value = extras.fotoHeroBUrl || '';
    document.getElementById('p-firmas-foto').value = extras.firmasFotoUrl || '';
    document.getElementById('p-rsvp-foto').value = extras.rsvpFotoUrl || '';
    document.getElementById('p-video-apertura-url').value = extras.videoAperturaUrl || '';
    document.getElementById('p-musica-url').value = extras.musicaUrl || '';
  }

  // Bendición, versículos y ceremonia/recepción — RPC aparte para no tocar
  // portal_obtener_evento ni portal_obtener_extras.
  try {
    const extra2 = await rpc('portal_obtener_extra', { p_codigo: CODIGO });
    if (extra2) {
      document.getElementById('p-bendicion-texto').value = extra2.bendicionTexto || '';
      document.getElementById('p-versiculo-historia').value = extra2.versiculoHistoria || '';
      document.getElementById('p-versiculo-cierre').value = extra2.versiculoCierre || '';
      document.getElementById('p-mismo-lugar').checked = extra2.mismoLugar !== false;
      document.getElementById('p-hora-recepcion').value = extra2.horaRecepcion || '';
      document.getElementById('p-lugar-recepcion-nombre').value = extra2.lugarRecepcionNombre || '';
      document.getElementById('p-lugar-recepcion-direccion').value = extra2.lugarRecepcionDireccion || '';
      document.getElementById('p-lugar-recepcion-maps').value = extra2.lugarRecepcionMapsUrl || '';
      document.getElementById('p-lugar-recepcion-waze').value = extra2.lugarRecepcionWazeUrl || '';
      LIMITE_GALERIA = extra2.limiteGaleria || null;
      toggleRecepcion();
    }
  } catch (err) {
    console.warn('portal_obtener_extra no disponible todavía (¿ya corriste el SQL?):', err);
  }

  // Pinta la galería ya con LIMITE_GALERIA definido, para que el contador
  // "x/N fotos" salga bien desde el primer render.
  if (extras && extras.ok) renderGaleriaPortal(extras.galeria || []);

  historiaItems = (datos.historia || []).map(h => ({ ...h, fotoGuardada: !!h.foto }));
  timelineItems = datos.timeline || [];
  mensajesItems = datos.mensajes || [];
  detallesItems = datos.detallesImportantes || [];
  pintarHistoria();
  pintarTimeline();
  pintarMensajes();
  pintarDetalles();

  aplicarBloqueosPorModulo(datos.modulosActivos || {});
  marcarTarjetasGuardadasAlCargar();

  actualizarProgreso();
  document.getElementById('progreso-wrap').classList.remove('oculto');
  activarAvisoDeCambios();

  // Vistas previas de todo lo que ya esté subido (fotos, audio, video).
  ['p-lugar-foto', 'p-foto-hero', 'p-foto-footer', 'p-foto-hero-b', 'p-firmas-foto', 'p-rsvp-foto']
    .forEach(id => refrescarPreview(id, 'image'));
  refrescarPreview('p-musica-url', 'audio');
  refrescarPreview('p-video-interno-url', 'video');
  refrescarPreview('p-video-apertura-url', 'video');
  refrescarPreview('p-mensaje-url', document.getElementById('p-mensaje-tipo').value === 'video' ? 'video' : 'audio');

  // Swatches de la paleta, ya con los colores cargados.
  [1, 2, 3, 4].forEach(n => actualizarSwatch(`p-paleta-color-${n}`, `p-paleta-swatch-${n}`));
  actualizarSwatch('p-color-evitar', 'p-color-evitar-swatch');
});

// ---------------- BLOQUEAR TARJETAS DE MÓDULOS NO COMPRADOS ----------------
const NOMBRES_MODULOS = {
  musica: 'Música de fondo',
  mensaje_personalizado: 'Mensaje para tus invitados',
  video_interno: 'Video dentro de la invitación',
  historia: 'Nuestra historia',
  timeline: 'Itinerario',
  detalles: 'Detalles importantes',
  vestimenta: 'Código de vestimenta',
  regalos: 'Mesa de regalos',
  firmas: 'Libro de firmas',
  video: 'Video de apertura',
  cancion: 'Playlist para la fiesta',
  galeria: 'Galería'
};

// Un mensaje distinto por módulo — vende el beneficio concreto, no el nombre técnico.
const MENSAJES_MODULOS = {
  musica: 'La música de fondo hace que tu invitación se sienta viva desde el primer segundo — muchos invitados la dejan sonando mientras leen todo.',
  mensaje_personalizado: 'Un mensaje que aparece con el nombre de cada invitado se siente como si le hubieran escrito a esa persona en particular — es de lo que más se acuerdan.',
  video_interno: 'Un video corto contando su historia adentro de la invitación es de las cosas que más comentan los invitados después de verla.',
  historia: 'Contar cómo se conocieron, aunque sea en pocas líneas, es lo que hace que la invitación se sienta como ustedes y no como una plantilla genérica.',
  timeline: 'El itinerario evita que te escriban preguntando la hora de la ceremonia o de la recepción — ya lo tienen todo ahí, sin preguntarte a ti.',
  detalles: 'Aquí avisas cosas como parqueo, edad mínima o clima esperado, sin tener que mandarlo por WhatsApp a cada invitado por separado.',
  vestimenta: 'El código de vestimenta es de las preguntas que más se repiten — ponerlo aquí te ahorra responderla uno por uno.',
  regalos: 'Poner la mesa de regalos aquí evita la incomodidad de que te pregunten directamente qué quieren de regalo.',
  firmas: 'La foto que subas aquí es la que ven tus invitados cuando dejan su mensaje en el libro de firmas — vale la pena que sea una que les guste a ambos.',
  video: 'El video de apertura es lo primero que ven tus invitados al abrir el link — es la primera impresión de toda la invitación.',
  cancion: 'Compartir tu playlist deja que tus invitados agreguen sus canciones favoritas antes de la fiesta — así ya sabes qué esperan escuchar.',
  galeria: 'Una galería con fotos de ustedes como pareja hace que la invitación se sienta mucho más personal antes de que confirmen asistencia.'
};

function aplicarBloqueosPorModulo(modulosActivos){
  const mapaTarjetas = {
    'tarjeta-musica': 'musica',
    'tarjeta-mensaje': 'mensaje_personalizado',
    'tarjeta-video-interno': 'video_interno',
    'tarjeta-historia': 'historia',
    'tarjeta-timeline': 'timeline',
    'tarjeta-detalles': 'detalles',
    'tarjeta-vestimenta': 'vestimenta',
    'tarjeta-regalos': 'regalos',
    'tarjeta-fotos-decorativas': 'firmas',
    'tarjeta-video-apertura': 'video',
    'tarjeta-playlist': 'cancion',
    'tarjeta-galeria': 'galeria'
  };

  Object.entries(mapaTarjetas).forEach(([idTarjeta, slugModulo]) => {
    if (modulosActivos[slugModulo] === true) return; // sí lo compró, se queda normal

    const tarjeta = document.getElementById(idTarjeta);
    if (!tarjeta) return;
    const titulo = tarjeta.querySelector('h2').outerHTML;
    const nombreBonito = NOMBRES_MODULOS[slugModulo];
    const mensaje = MENSAJES_MODULOS[slugModulo] || 'Este módulo no está incluido en tu paquete actual — escríbenos y te decimos cómo agregarlo.';

    tarjeta.classList.add('tarjeta-bloqueada');
    tarjeta.innerHTML = `
      ${titulo}
      <div class="bloqueo-mensaje">
        <p>${mensaje}</p>
        <a href="https://wa.me/50431626792?text=${encodeURIComponent('Hola, quiero agregar el módulo de ' + nombreBonito + ' a mi invitación')}" target="_blank" class="btn btn-dorado btn-chico">Quiero agregarlo</a>
      </div>
    `;
  });
}

// ---------------- BARRA DE PROGRESO (cuenta cuántas tarjetas ya tienen algo) ----------------
function actualizarProgreso(){
  const tarjetas = [...document.querySelectorAll('.tarjeta:not(.tarjeta-final):not(.tarjeta-bloqueada)')];
  let completas = 0;
  const pendientes = [];

  tarjetas.forEach(tarjeta => {
    const campos = tarjeta.querySelectorAll('input[type="text"], input[type="date"], input[type="time"], input[type="hidden"], input[type="color"]:checked, textarea');
    const tieneAlgo = [...campos].some(c => c.value && c.value.trim());
    const h2 = tarjeta.querySelector('h2');
    const titulo = h2 ? h2.textContent.trim() : '';
    if (tieneAlgo) {
      completas++;
    } else if (h2) {
      pendientes.push({ titulo, id: tarjeta.id });
    }
  });

  const total = tarjetas.length;
  const porcentaje = total ? Math.round((completas / total) * 100) : 0;
  document.getElementById('progreso-fill').style.width = porcentaje + '%';
  document.getElementById('progreso-texto').textContent = `${porcentaje}% completo`;

  const checklist = document.getElementById('progreso-checklist');
  if (!pendientes.length) {
    checklist.innerHTML = '<p class="checklist-completo">¡Ya completaste todas las secciones! 🎉</p>';
  } else {
    checklist.innerHTML = '<p class="checklist-titulo">Todavía te falta:</p>' + pendientes.map(p => `
      <button type="button" class="checklist-item" onclick="irATarjeta('${p.id}')">○ ${p.titulo}</button>
    `).join('');
  }
}

function toggleChecklist(){
  const el = document.getElementById('progreso-checklist');
  const btn = document.getElementById('progreso-toggle');
  el.classList.toggle('oculto');
  btn.textContent = el.classList.contains('oculto') ? 'Ver qué me falta ▾' : 'Ocultar ▴';
}

function irATarjeta(id){
  if (!id) return;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function mostrarError(){
  document.getElementById('portal-error').classList.remove('oculto');
  document.getElementById('portal-nombre-evento').textContent = 'Link no válido';
}

function mostrarOk(idBoton){
  const el = document.getElementById(idBoton);
  el.classList.remove('oculto');
  // Ya NO se oculta solo — se queda mientras no haya cambios sin guardar
  // (antes desaparecía a los 4 segundos y parecía que nunca se había guardado).

  const tarjeta = el.closest('.tarjeta');
  if (tarjeta) {
    tarjeta.classList.remove('tarjeta-sin-guardar');
    const aviso = tarjeta.querySelector('.aviso-sin-guardar');
    if (aviso) aviso.remove();
  }
  actualizarProgreso();
}

// Al abrir el portal, si una tarjeta ya tiene datos guardados, mostramos su
// "✓ Guardado" desde el inicio — antes solo aparecía justo después de tocar
// el botón, y al recargar la página parecía que nada se había guardado.
function marcarTarjetasGuardadasAlCargar(){
  document.querySelectorAll('.tarjeta:not(.tarjeta-final)').forEach(tarjeta => {
    const campos = tarjeta.querySelectorAll('input[type="text"], input[type="date"], input[type="time"], input[type="hidden"], textarea');
    const tieneAlgo = [...campos].some(c => c.value && c.value.trim());
    if (!tieneAlgo) return;
    const ok = tarjeta.querySelector('.mensaje-ok');
    if (ok) ok.classList.remove('oculto');
  });
}

function valor(id){ return document.getElementById(id).value; }

// ---------------- INDICADOR DE "CAMBIOS SIN GUARDAR" ----------------
// Se marca la tarjeta apenas alguien toca un campo que ya tenía datos
// cargados, y se quita en mostrarOk() cuando esa misma tarjeta se guarda.
function activarAvisoDeCambios(){
  document.querySelectorAll('.tarjeta').forEach(tarjeta => {
    tarjeta.addEventListener('input', () => marcarTarjetaSinGuardar(tarjeta));
    tarjeta.addEventListener('change', () => marcarTarjetaSinGuardar(tarjeta));
  });
}

function marcarTarjetaSinGuardar(tarjeta){
  if (tarjeta.classList.contains('tarjeta-sin-guardar')) return;
  tarjeta.classList.add('tarjeta-sin-guardar');
  const ok = tarjeta.querySelector('.mensaje-ok');
  if (ok) ok.classList.add('oculto');
  const h2 = tarjeta.querySelector('h2');
  if (h2 && !tarjeta.querySelector('.aviso-sin-guardar')) {
    const aviso = document.createElement('span');
    aviso.className = 'aviso-sin-guardar';
    aviso.textContent = 'Cambios sin guardar';
    h2.after(aviso);
  }
}

// ---------------- SUBIDA DE ARCHIVOS (foto/audio/video genérico) ----------------
async function subirArchivoCloudinary(archivo, tipoRecurso){
  if (CLOUDINARY_CLOUD_NAME.startsWith('PEGAR_')) { alert('Cloudinary no está configurado todavía.'); return null; }
  const formData = new FormData();
  formData.append('file', archivo);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  if (EVENTO_ID) formData.append('folder', `tuboda/${EVENTO_ID}`);
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${tipoRecurso}/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    if (data.error) {
      console.error('Error de Cloudinary:', data.error);
      alert(`No se pudo subir el archivo: ${data.error.message}`);
      return null;
    }
    return data.secure_url || null;
  } catch (err) {
    console.error(err);
    alert('No se pudo subir el archivo. Revisa tu conexión e intenta de nuevo.');
    return null;
  }
}

// ---------------- SELECTOR DE COLOR (círculo propio, no el nativo) ----------------
function actualizarSwatch(idColor, idSwatch){
  const hex = valor(idColor);
  const swatch = document.getElementById(idSwatch);
  if (swatch) swatch.style.background = hex;
}
// Un <input type="file"> nunca puede "recordar" lo que ya subiste (por
// seguridad del navegador) -- por eso, junto a cada uno, se muestra esto
// aparte, leyendo el link guardado.
function refrescarPreview(idCampo, tipo, reciente){
  const cont = document.getElementById(`preview-${idCampo}`);
  if (!cont) return;
  const url = valor(idCampo);
  if (!url) { cont.classList.add('oculto'); cont.innerHTML = ''; return; }
  cont.classList.remove('oculto');
  const etiqueta = reciente ? '✓ Subido — dale "Guardar" para confirmarlo' : '✓ Este es el que ya tienes guardado';
  if (tipo === 'image') {
    cont.innerHTML = `<img src="${url}" alt="" class="preview-img"><span class="preview-label">${etiqueta}</span>`;
  } else if (tipo === 'audio') {
    cont.innerHTML = `<audio controls src="${url}" class="preview-audio"></audio><span class="preview-label">${etiqueta}</span>`;
  } else if (tipo === 'video') {
    cont.innerHTML = `<video controls src="${url}" class="preview-video"></video><span class="preview-label">${etiqueta}</span>`;
  } else {
    cont.innerHTML = `<a href="${url}" target="_blank" class="preview-label">✓ Ver archivo actual</a>`;
  }
}

async function subirFotoSimple(e, idDestino){
  const archivo = e.target.files[0];
  if (!archivo) return;
  const esVideo = archivo.type.startsWith('video/');
  const url = await subirArchivoCloudinary(archivo, esVideo ? 'video' : 'image');
  if (url) {
    document.getElementById(idDestino).value = url;
    refrescarPreview(idDestino, esVideo ? 'video' : 'image', true);
  }
}

async function subirAudioSimple(e, idDestino){
  const archivo = e.target.files[0];
  if (!archivo) return;
  const url = await subirArchivoCloudinary(archivo, 'video'); // Cloudinary sube audio bajo el recurso "video"
  if (url) {
    document.getElementById(idDestino).value = url;
    refrescarPreview(idDestino, 'audio', true);
  }
}

async function subirMensajePersonalizado(e){
  const archivo = e.target.files[0];
  if (!archivo) return;
  const esVideo = archivo.type.startsWith('video/');
  const url = await subirArchivoCloudinary(archivo, 'video');
  if (url) {
    document.getElementById('p-mensaje-url').value = url;
    refrescarPreview('p-mensaje-url', esVideo ? 'video' : 'audio', true);
  }
}

// ---------------- GUARDAR CADA BLOQUE ----------------
async function guardarDatosPrincipales(){
  await rpc('portal_actualizar_evento', {
    p_codigo: CODIGO,
    p_novio_a_nombre: valor('p-novio-a-nombre'), p_novio_a_apellido: valor('p-novio-a-apellido'),
    p_novio_b_nombre: valor('p-novio-b-nombre'), p_novio_b_apellido: valor('p-novio-b-apellido'),
    p_whatsapp_a: valor('p-whatsapp-a'), p_whatsapp_b: valor('p-whatsapp-b'),
    p_fecha: valor('p-fecha') || null, p_hora: valor('p-hora') || null,
    p_fecha_limite_confirmacion: valor('p-fecha-limite') || null
  });
  mostrarOk('ok-datos');
}

async function guardarUbicacion(){
  await rpc('portal_actualizar_evento', {
    p_codigo: CODIGO,
    p_lugar_nombre: valor('p-lugar-nombre'), p_lugar_direccion: valor('p-lugar-direccion'),
    p_lugar_maps_url: valor('p-lugar-maps'), p_lugar_waze_url: valor('p-lugar-waze'),
    p_lugar_foto_url: valor('p-lugar-foto')
  });
  mostrarOk('ok-ubicacion');
}

async function guardarFotos(){
  await rpc('portal_actualizar_evento', {
    p_codigo: CODIGO,
    p_foto_hero_url: valor('p-foto-hero'), p_foto_footer_url: valor('p-foto-footer')
  });
  // El versículo de cierre va en la función nueva, junto con las demás
  // cosas opcionales, para no tocar portal_actualizar_evento.
  await rpc('portal_actualizar_extra', {
    p_codigo: CODIGO,
    p_versiculo_cierre: valor('p-versiculo-cierre')
  });
  mostrarOk('ok-fotos');
}

function toggleRecepcion(){
  const mismo = document.getElementById('p-mismo-lugar').checked;
  document.getElementById('bloque-recepcion').classList.toggle('oculto', mismo);
}

async function guardarBendicion(){
  await rpc('portal_actualizar_extra', {
    p_codigo: CODIGO,
    p_bendicion_texto: valor('p-bendicion-texto'),
    p_versiculo_historia: valor('p-versiculo-historia')
  });
  mostrarOk('ok-bendicion');
}

async function guardarRecepcion(){
  const mismo = document.getElementById('p-mismo-lugar').checked;
  await rpc('portal_actualizar_extra', {
    p_codigo: CODIGO,
    p_mismo_lugar: mismo,
    p_hora_recepcion: mismo ? null : (valor('p-hora-recepcion') || null),
    p_lugar_recepcion_nombre: valor('p-lugar-recepcion-nombre'),
    p_lugar_recepcion_direccion: valor('p-lugar-recepcion-direccion'),
    p_lugar_recepcion_maps_url: valor('p-lugar-recepcion-maps'),
    p_lugar_recepcion_waze_url: valor('p-lugar-recepcion-waze')
  });
  mostrarOk('ok-recepcion');
}

async function guardarMusica(){
  await rpc('portal_actualizar_musica', { p_codigo: CODIGO, p_url: valor('p-musica-url') });
  mostrarOk('ok-musica');
}

async function guardarMensajePersonalizado(){
  await rpc('portal_actualizar_evento', {
    p_codigo: CODIGO,
    p_mensaje_personalizado_tipo: valor('p-mensaje-tipo'),
    p_mensaje_personalizado_url: valor('p-mensaje-url')
  });
  mostrarOk('ok-mensaje');
}

async function guardarVideoInterno(){
  await rpc('portal_actualizar_evento', {
    p_codigo: CODIGO,
    p_video_interno_url: valor('p-video-interno-url'),
    p_video_interno_frase: valor('p-video-interno-frase')
  });
  mostrarOk('ok-video-interno');
}

async function guardarVestimenta(){
  await rpc('portal_actualizar_evento', {
    p_codigo: CODIGO,
    p_vestimenta_texto: valor('p-vestimenta-texto'),
    p_vestimenta_boton_url: valor('p-vestimenta-boton')
  });
  mostrarOk('ok-vestimenta');
}

async function guardarRegalos(){
  await rpc('portal_actualizar_evento', {
    p_codigo: CODIGO,
    p_regalos_texto: valor('p-regalos-texto'),
    p_regalos_cuenta_texto: valor('p-regalos-cuenta')
  });
  mostrarOk('ok-regalos');
}

async function guardarPlaylist(){
  await rpc('portal_actualizar_playlist', {
    p_codigo: CODIGO,
    p_cancion_embed_url: valor('p-playlist-url')
  });
  mostrarOk('ok-playlist');
}

function leerColorFila(prefijoColor, prefijoCheckbox, prefijoNombre){
  const casilla = document.getElementById(prefijoCheckbox);
  if (casilla && !casilla.checked) return null; // desmarcado: no se incluye
  const hex = valor(prefijoColor);
  const nombre = valor(prefijoNombre);
  return { hex, nombre: nombre || null };
}

async function guardarPaleta(){
  const paleta = [1, 2, 3, 4]
    .map(n => leerColorFila(`p-paleta-color-${n}`, `p-paleta-incluir-${n}`, `p-paleta-nombre-${n}`))
    .filter(Boolean);
  const colorEvitar = leerColorFila('p-color-evitar', 'p-color-evitar-incluir', 'p-color-evitar-nombre');

  await rpc('portal_actualizar_vestimenta_paleta', {
    p_codigo: CODIGO,
    p_paleta: paleta,
    p_color_evitar: colorEvitar
  });
  mostrarOk('ok-paleta');
}

async function guardarFotoHeroB(){
  await rpc('portal_actualizar_foto_hero_b', {
    p_codigo: CODIGO,
    p_url: valor('p-foto-hero-b')
  });
  mostrarOk('ok-foto-hero-b');
}

async function guardarFotosDecorativas(){
  await rpc('portal_actualizar_fotos_decorativas', {
    p_codigo: CODIGO,
    p_firmas_foto_url: valor('p-firmas-foto'),
    p_rsvp_foto_url: valor('p-rsvp-foto')
  });
  mostrarOk('ok-fotos-decorativas');
}

async function subirVideoApertura(e){
  const archivo = e.target.files[0];
  if (!archivo) return;
  const url = await subirArchivoCloudinary(archivo, 'video');
  if (url) {
    document.getElementById('p-video-apertura-url').value = url;
    refrescarPreview('p-video-apertura-url', 'video', true);
  }
}

async function guardarVideoApertura(){
  await rpc('portal_actualizar_video_apertura', { p_codigo: CODIGO, p_url: valor('p-video-apertura-url') });
  mostrarOk('ok-video-apertura');
}

// ---------------- GALERÍA ----------------
async function subirFotoGaleriaCliente(e){
  const archivos = [...e.target.files];
  if (!archivos.length) return;

  const tarjeta = document.getElementById('tarjeta-galeria');
  const espacioDisponible = LIMITE_GALERIA ? Math.max(0, LIMITE_GALERIA - galeriaCantidadActual) : archivos.length;

  if (LIMITE_GALERIA && archivos.length > espacioDisponible) {
    if (espacioDisponible === 0) {
      alert(`Tu paquete permite hasta ${LIMITE_GALERIA} fotos en la galería. Elimina alguna para subir otra, o escríbenos para ampliar el límite.`);
      e.target.value = '';
      return;
    }
    alert(`Solo te quedan ${espacioDisponible} espacio(s) disponibles — vamos a subir las primeras ${espacioDisponible} que elegiste.`);
  }

  const aSubir = archivos.slice(0, espacioDisponible);
  for (const archivo of aSubir) {
    const url = await subirArchivoCloudinary(archivo, 'image');
    if (!url) continue;
    await rpc('portal_agregar_foto_galeria', { p_codigo: CODIGO, p_url: url });
  }

  const extras = await rpc('portal_obtener_extras', { p_codigo: CODIGO });
  if (extras && extras.ok) renderGaleriaPortal(extras.galeria || []);

  // Cada foto ya se guardó sola en la base — esta tarjeta nunca tiene "cambios
  // sin guardar" pendientes, así que no lo dejamos marcado en amarillo.
  if (tarjeta) {
    tarjeta.classList.remove('tarjeta-sin-guardar');
    tarjeta.querySelector('.aviso-sin-guardar')?.remove();
  }

  e.target.value = '';
}

let galeriaCantidadActual = 0;

function renderGaleriaPortal(fotos){
  galeriaCantidadActual = fotos.length;
  const cont = document.getElementById('galeria-lista');
  const contador = document.getElementById('galeria-contador');
  const inputArchivo = document.getElementById('p-galeria-input');

  if (contador) {
    contador.textContent = LIMITE_GALERIA
      ? `${fotos.length} de ${LIMITE_GALERIA} fotos`
      : `${fotos.length} fotos`;
  }
  const enLimite = LIMITE_GALERIA && fotos.length >= LIMITE_GALERIA;
  if (inputArchivo) inputArchivo.disabled = !!enLimite;

  if (!fotos.length) { cont.innerHTML = '<p class="desc">Todavía no has agregado fotos.</p>'; return; }
  cont.innerHTML = fotos.map(f => `
    <div class="galeria-item-portal">
      <img src="${f.url}" alt="">
      <button type="button" class="galeria-eliminar" onclick="eliminarFotoGaleriaCliente('${f.id}')" title="Eliminar">✕</button>
    </div>
  `).join('') + (enLimite ? '<p class="desc" style="grid-column:1/-1;color:#B8862F">Llegaste al límite de fotos de tu paquete.</p>' : '');
}

async function eliminarFotoGaleriaCliente(id){
  const res = await rpc('portal_eliminar_foto_galeria', { p_codigo: CODIGO, p_id: id });
  if (res && res.ok) {
    const extras = await rpc('portal_obtener_extras', { p_codigo: CODIGO });
    if (extras && extras.ok) renderGaleriaPortal(extras.galeria || []);
  }
}

// ---------------- HISTORIA (repetidor) ----------------
function pintarHistoria(){
  document.getElementById('lista-historia').innerHTML = historiaItems.map((h, i) => `
    <div class="repetidor-item">
      <button class="quitar" onclick="quitarHistoria(${i})">✕</button>
      <div class="campo"><label>Título</label><input type="text" value="${h.titulo || ''}" oninput="historiaItems[${i}].titulo=this.value"></div>
      <div class="campo"><label>Texto</label><textarea oninput="historiaItems[${i}].texto=this.value">${h.texto || ''}</textarea></div>
      <div class="campo">
        <label>Foto</label>
        <input type="file" accept="image/*" onchange="subirFotoHistoria(event, ${i})">
        ${h.foto ? `<div class="archivo-actual"><img src="${h.foto}" alt="" class="preview-img"><span class="preview-label">${h.fotoGuardada ? '✓ Esta foto ya está guardada' : '✓ Subida — dale "Guardar" abajo para confirmarla'}</span></div>` : ''}
      </div>
    </div>`).join('');
}
function agregarHistoria(){ historiaItems.push({ titulo: '', texto: '', foto: '', fotoGuardada: false }); pintarHistoria(); }
function quitarHistoria(i){ historiaItems.splice(i, 1); pintarHistoria(); }
async function subirFotoHistoria(e, i){
  const archivo = e.target.files[0];
  if (!archivo) return;
  const url = await subirArchivoCloudinary(archivo, 'image');
  if (url) {
    historiaItems[i].foto = url;
    historiaItems[i].fotoGuardada = false; // recién subida, todavía no se guardó el bloque
    pintarHistoria(); // repinta para que se vea el preview y no parezca que se perdió
  }
}
async function guardarHistoria(){
  await rpc('portal_guardar_historia', { p_codigo: CODIGO, p_items: historiaItems });
  historiaItems.forEach(h => { h.fotoGuardada = !!h.foto; });
  pintarHistoria(); // para que las fotos ya digan "guardada" en vez de "dale Guardar"
  mostrarOk('ok-historia');
}

// Mismos SVG e íconos que se ven en la invitación real (shared/js/backend.js).
// Se duplican aquí (con otro nombre de variable) porque el portal no carga
// backend.js — evita choques de const (SUPABASE_URL, etc.) entre los dos módulos.
const ICONOS_ITINERARIO = {
  church: '<svg viewBox="0 0 278 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M1360 2610 l0 -80 -60 0 -60 0 0 -50 0 -50 60 0 60 0 0 -89 0 -88 -185 -164 -185 -164 0 -242 0 -243 -190 0 -190 0 0 -250 0 -250 -125 0 -125 0 0 -45 0 -45 40 0 40 0 0 -330 0 -330 -60 0 -60 0 0 -45 0 -45 1110 0 1110 0 0 45 0 45 -85 0 -85 0 0 330 0 330 40 0 40 0 0 45 0 45 -125 0 -125 0 0 250 0 250 -185 0 -185 0 0 239 0 240 -190 168 -190 168 0 88 0 87 65 0 65 0 0 50 0 50 -65 0 -65 0 0 80 0 80 -45 0 -45 0 0 -80z m176 -560 l118 -105 -121 -3 c-67 -1 -179 -1 -248 0 l-126 3 121 108 c67 59 126 107 130 105 5 -2 61 -50 126 -108z m204 -405 l0 -205 -40 0 -40 0 0 170 0 170 -255 0 -255 0 0 -170 0 -170 -35 0 -35 0 0 205 0 205 330 0 330 0 0 -205z m-170 -85 l0 -120 -165 0 -165 0 0 120 0 120 165 0 165 0 0 -120z m-357 -245 l-17 -35 -248 0 -248 0 0 35 0 35 265 0 265 0 -17 -35z m267 7 c37 -28 53 -82 37 -129 -17 -50 -57 -78 -114 -78 -39 0 -49 5 -79 37 -27 30 -34 46 -34 77 0 42 35 95 74 112 29 12 86 3 116 -19z m630 -7 l0 -35 -247 0 -248 1 -16 34 -16 35 263 0 264 0 0 -35z m-897 -170 l17 -35 -145 0 -145 0 0 -85 0 -85 -35 0 -35 0 0 85 0 85 -45 0 -45 0 0 -85 0 -85 -40 0 -40 0 0 120 0 120 248 0 248 0 17 -35z m897 -85 l0 -120 -35 0 -35 0 0 85 0 85 -50 0 -50 0 0 -85 0 -85 -35 0 -35 0 0 85 0 85 -144 0 -143 0 16 35 16 34 248 1 247 0 0 -120z m-330 -80 l0 -40 -370 0 -370 0 0 40 0 40 370 0 370 0 0 -40z m-750 -460 l0 -330 -40 0 -40 0 0 210 0 210 -170 0 -170 0 0 -210 0 -210 -35 0 -35 0 0 330 0 330 245 0 245 0 0 -330z m660 0 l0 -330 -55 0 -55 0 0 210 0 210 -170 0 -170 0 0 -210 0 -210 -60 0 -60 0 0 330 0 330 285 0 285 0 0 -330z m590 0 l0 -330 -40 0 -40 0 0 210 0 210 -170 0 -170 0 0 -210 0 -210 -35 0 -35 0 0 330 0 330 245 0 245 0 0 -330z m-1420 -165 l0 -165 -80 0 -80 0 0 165 0 165 80 0 80 0 0 -165z m630 0 l0 -165 -80 0 -80 0 0 165 0 165 80 0 80 0 0 -165z m620 0 l0 -165 -80 0 -80 0 0 165 0 165 80 0 80 0 0 -165z M1360 1565 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M740 730 l0 -50 45 0 45 0 0 50 0 50 -45 0 -45 0 0 -50z M1360 730 l0 -50 45 0 45 0 0 50 0 50 -45 0 -45 0 0 -50z M1990 730 l0 -50 45 0 45 0 0 50 0 50 -45 0 -45 0 0 -50z M150 145 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M2610 145 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z"/> </g></svg>',
  ceremony: '<svg viewBox="0 0 278 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M1280 2598 l-1 -93 -42 -19 c-92 -43 -184 -162 -203 -263 -6 -31 -9 -33 -50 -33 l-44 0 0 -130 0 -130 45 0 45 0 0 -200 0 -200 -65 0 -65 0 0 -130 0 -130 40 0 c37 0 40 -2 35 -22 -2 -13 -16 -108 -30 -213 -15 -104 -29 -198 -33 -208 -6 -16 -16 -13 -91 32 -46 28 -102 65 -125 82 -37 29 -41 36 -38 70 2 21 -3 52 -12 71 -48 100 -198 87 -236 -20 -13 -37 -13 -47 0 -84 10 -28 26 -50 47 -63 l32 -20 1 -352 0 -353 -105 0 -105 0 0 -45 0 -45 1130 0 1130 0 0 45 0 45 -105 0 -105 0 0 355 c0 347 0 355 21 365 29 16 59 70 59 108 0 76 -53 132 -127 132 -77 0 -142 -72 -130 -146 5 -28 0 -35 -43 -68 -51 -39 -201 -128 -207 -123 -4 5 -63 414 -63 438 0 15 7 19 35 19 l35 0 0 130 0 130 -60 0 -60 0 0 200 0 200 40 0 40 0 0 130 0 130 -44 0 c-42 0 -44 1 -50 38 -16 96 -108 217 -196 257 l-40 18 0 94 0 93 -130 0 -130 0 0 -92z m160 -33 c0 -33 -2 -35 -35 -35 -33 0 -35 2 -35 35 0 33 2 35 35 35 33 0 35 -2 35 -35z m-156 -192 c-21 -49 -44 -132 -44 -160 0 -21 -5 -23 -55 -23 -60 0 -64 5 -44 57 18 50 61 102 107 133 25 16 47 30 49 30 2 0 -4 -17 -13 -37z m191 -145 l6 -38 -76 0 c-74 0 -76 1 -70 23 4 12 9 31 12 42 2 11 16 49 31 84 l26 64 32 -69 c18 -38 35 -86 39 -106z m106 140 c39 -31 88 -104 104 -156 6 -22 5 -23 -51 -20 l-57 3 -14 69 c-8 38 -21 82 -29 97 -26 51 -13 52 47 7z m199 -303 l0 -35 -370 0 -370 0 0 35 0 35 370 0 370 0 0 -35z m-90 -335 l0 -200 -35 0 -35 0 0 125 0 125 -45 0 -45 0 0 -125 0 -125 -40 0 -40 0 0 125 0 125 -45 0 -45 0 0 -125 0 -125 -35 0 -35 0 0 125 0 125 -50 0 -50 0 0 -125 0 -125 -35 0 -35 0 0 200 0 200 285 0 285 0 0 -200z m130 -335 l0 -35 -415 0 -415 0 0 35 0 35 415 0 415 0 0 -35z m-76 -152 c20 -101 66 -467 59 -473 -6 -7 -108 -40 -120 -40 -2 0 1 9 7 19 17 33 11 100 -15 159 -58 130 -52 123 -150 164 -107 44 -134 46 -200 13 -27 -13 -58 -25 -67 -25 -29 0 -87 -59 -98 -98 -5 -21 -19 -55 -30 -77 -22 -44 -25 -80 -10 -121 6 -15 9 -28 7 -30 -2 -2 -31 6 -66 17 -47 16 -61 25 -57 38 2 9 19 121 37 249 l32 232 333 0 332 0 6 -27z m-1189 -199 c18 -18 16 -33 -7 -47 -35 -22 -66 21 -36 51 16 16 23 15 43 -4z m1750 0 c18 -18 16 -33 -7 -47 -35 -22 -66 21 -36 51 16 16 23 15 43 -4z m-853 -54 c8 -13 24 -20 43 -20 44 0 68 -21 68 -60 0 -21 9 -41 24 -56 29 -30 29 -45 -3 -83 -17 -21 -23 -37 -19 -51 9 -27 -38 -74 -65 -65 -14 4 -30 -2 -51 -19 -38 -32 -53 -32 -83 -3 -15 15 -35 24 -56 24 -39 0 -60 24 -60 69 0 19 -6 34 -15 38 -36 13 -35 78 1 99 8 4 14 23 14 42 0 42 22 65 63 65 20 0 39 8 50 20 10 12 29 20 47 20 19 0 34 -7 42 -20z m-785 -146 c43 -31 113 -74 155 -95 75 -38 77 -39 72 -71 -3 -18 -20 -134 -38 -258 l-32 -225 -122 -3 -122 -3 0 356 c0 195 2 355 4 355 3 0 40 -25 83 -56z m1573 -299 l0 -355 -125 0 -124 0 -6 33 c-12 67 -65 450 -65 467 0 13 26 33 83 63 45 25 114 68 152 96 38 28 73 51 77 51 5 0 8 -160 8 -355z m-1137 94 c38 -9 77 -25 87 -34 19 -17 17 -20 -40 -96 -33 -43 -60 -80 -60 -83 0 -3 59 -35 130 -71 129 -65 130 -65 139 -43 5 13 18 45 28 72 l20 49 28 -71 c16 -40 30 -72 31 -72 14 0 254 127 254 134 0 5 -25 43 -56 84 -44 58 -55 79 -47 91 8 13 201 77 208 69 4 -4 65 -440 65 -460 0 -17 -30 -18 -486 -18 l-486 0 5 33 c4 17 18 115 32 217 33 243 31 233 58 224 12 -4 53 -15 90 -25z m226 -103 c9 -11 6 -25 -11 -64 l-23 -51 -32 17 -32 17 36 48 c38 51 44 54 62 33z m219 -32 c19 -25 32 -47 30 -48 -1 -2 -17 -10 -33 -19 l-31 -15 -21 54 c-19 50 -20 55 -5 64 24 14 24 14 60 -36z M1338 924 c-61 -33 -79 -138 -33 -193 49 -57 127 -63 185 -14 91 76 39 224 -78 223 -26 -1 -59 -7 -74 -16z m92 -89 c18 -22 8 -50 -19 -50 -32 0 -49 28 -32 49 17 20 35 20 51 1z M110 145 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M2610 145 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z"/> </g></svg>',
  bride: '<svg viewBox="0 0 278 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M1300 2643 c-42 -7 -133 -45 -175 -74 -75 -51 -130 -126 -162 -221 -10 -29 -26 -64 -35 -78 -15 -24 -78 -235 -92 -310 -4 -19 -11 -102 -16 -185 -10 -175 -25 -239 -82 -355 -52 -108 -174 -234 -290 -301 -43 -24 -78 -48 -78 -54 0 -5 21 -23 46 -39 25 -16 75 -58 111 -94 53 -53 63 -69 57 -86 -4 -11 -9 -184 -11 -383 l-4 -363 836 0 836 0 -3 363 c-2 199 -7 369 -11 378 -5 11 2 28 25 56 28 34 62 63 180 154 21 15 19 17 -65 68 -156 94 -258 208 -316 352 -42 105 -50 147 -61 330 -11 190 -58 389 -111 475 -10 17 -19 38 -19 46 0 32 -71 155 -116 201 -54 54 -146 102 -224 117 -51 10 -170 11 -220 3z m252 -111 c27 -9 70 -33 95 -52 50 -39 119 -142 108 -160 -5 -8 -14 -2 -27 19 -11 18 -33 38 -49 46 -31 17 -96 20 -118 6 -9 -6 -29 1 -59 20 -58 37 -129 40 -182 8 -19 -12 -38 -26 -41 -31 -4 -7 -14 -6 -27 1 -53 28 -134 4 -166 -51 -28 -47 -38 -21 -12 30 47 91 140 159 246 182 60 12 172 4 232 -18z m-97 -207 c40 -39 32 -96 -16 -120 -31 -17 -53 -12 -86 18 -31 28 -29 68 3 101 33 33 68 33 99 1z m-237 -27 c30 -30 -1 -73 -36 -51 -23 14 -25 29 -7 47 20 19 27 20 43 4z m422 -3 c18 -21 3 -55 -25 -55 -15 0 -26 7 -30 20 -7 23 10 50 30 50 7 0 18 -7 25 -15z m-581 -89 c23 -28 -17 -68 -45 -45 -15 12 -19 41 -7 52 11 12 40 8 52 -7z m750 0 c14 -16 5 -42 -16 -50 -29 -11 -58 35 -36 57 11 12 40 8 52 -7z m-502 -73 c30 -23 46 -28 98 -28 52 0 67 4 99 28 34 26 40 28 66 17 17 -7 43 -10 59 -8 23 3 32 0 40 -19 19 -40 69 -64 131 -61 l54 3 18 -70 c11 -38 22 -124 25 -191 5 -106 3 -129 -16 -190 -46 -147 -50 -140 -51 82 l0 201 -97 5 c-119 7 -193 32 -269 94 -29 24 -56 44 -60 44 -3 0 -25 -17 -49 -38 -81 -71 -172 -102 -301 -102 l-64 0 0 -207 0 -208 -20 30 c-66 99 -75 296 -23 502 14 55 17 61 33 53 10 -6 38 -10 61 -10 35 0 47 6 83 42 29 30 48 41 66 39 14 -1 37 2 50 8 14 5 26 10 28 10 2 1 19 -11 39 -26z m157 -257 c63 -38 162 -66 232 -66 l46 0 -4 -172 c-4 -147 -8 -181 -27 -229 -42 -108 -134 -184 -253 -209 -48 -9 -68 -9 -120 5 -115 29 -196 102 -238 214 -17 43 -20 77 -20 221 l0 170 49 0 c61 0 160 30 226 69 28 17 51 30 51 30 1 1 27 -14 58 -33z m-508 -513 c29 -35 34 -49 34 -95 0 -29 5 -84 10 -122 6 -38 9 -70 7 -72 -2 -2 -56 -15 -121 -29 -125 -27 -166 -43 -206 -81 l-25 -23 -59 58 -58 59 53 40 c113 83 219 219 261 334 l21 59 24 -43 c14 -24 40 -62 59 -85z m994 104 c0 -25 68 -154 115 -215 43 -56 148 -155 192 -181 16 -9 11 -17 -39 -68 l-57 -57 -28 20 c-53 39 -93 54 -210 80 -64 14 -118 26 -119 27 -1 1 5 43 12 92 7 50 13 107 13 127 1 28 13 52 51 103 28 36 50 70 50 76 0 5 5 9 10 9 6 0 10 -6 10 -13z m-800 -323 c0 -33 -4 -43 -20 -47 -25 -6 -27 -4 -35 58 -3 28 -8 61 -11 74 -5 22 -3 22 30 -10 30 -28 36 -40 36 -75z m571 26 c-5 -40 -11 -74 -13 -76 -2 -2 -14 -1 -26 3 -18 4 -22 13 -22 45 0 32 7 46 33 71 17 18 33 31 35 31 2 -1 -1 -34 -7 -74z m-421 -55 c81 -22 160 -19 248 9 39 13 27 -35 -33 -131 -92 -146 -127 -146 -217 1 -32 52 -58 103 -58 115 0 12 1 21 3 21 1 0 27 -7 57 -15z m-87 -165 c38 -62 44 -80 27 -80 -6 0 -18 -16 -27 -36 -15 -31 -20 -34 -43 -27 -14 4 -54 8 -90 8 -82 -1 -160 -35 -218 -95 l-40 -42 -51 50 c-28 28 -60 53 -71 57 -24 8 -25 17 -6 54 18 35 70 74 116 89 28 9 216 52 227 52 1 0 8 -21 14 -46 7 -25 17 -48 24 -50 7 -3 29 2 50 10 29 13 36 20 30 33 -19 48 -23 72 -12 77 26 10 33 4 70 -54z m455 51 c11 -6 10 -16 -2 -50 l-14 -43 34 -14 c52 -22 60 -18 74 34 7 26 14 48 15 50 5 7 244 -52 270 -67 16 -9 45 -37 63 -61 l34 -44 -23 -15 c-13 -8 -48 -38 -76 -67 l-53 -51 -24 32 c-61 79 -198 130 -293 107 -41 -9 -49 -9 -58 5 -5 9 -20 28 -32 43 l-22 26 39 62 c41 64 46 68 68 53z m-293 -222 l36 -32 34 33 c36 35 56 35 75 0 10 -18 4 -28 -51 -86 l-63 -65 -53 53 c-61 61 -75 94 -48 115 26 18 30 17 70 -18z m-190 -82 c22 -11 82 -61 133 -110 l92 -91 98 96 c105 103 118 112 181 127 112 25 235 -71 248 -194 7 -71 -9 -115 -68 -179 -45 -50 -49 -58 -49 -105 l0 -51 -415 0 -415 0 0 53 c0 46 -4 57 -31 83 -91 86 -111 198 -52 289 66 103 173 134 278 82z m-462 -60 c41 -54 54 -89 59 -157 6 -74 31 -131 83 -189 24 -27 35 -48 35 -70 l0 -31 -120 0 -120 0 0 250 c0 246 0 251 20 240 10 -6 30 -25 43 -43z m1427 -197 l0 -250 -120 0 -120 0 0 28 c0 16 9 37 20 47 59 53 112 180 108 257 -1 29 7 50 36 93 32 46 59 73 74 75 1 0 2 -112 2 -250z M1161 1716 c-20 -23 -5 -65 24 -72 35 -9 57 12 53 50 -3 27 -7 31 -34 34 -19 2 -36 -3 -43 -12z M1574 1703 c-9 -35 7 -58 41 -58 34 0 50 23 41 58 -5 23 -12 27 -41 27 -29 0 -36 -4 -41 -27z M1240 1452 c0 -38 49 -105 93 -125 99 -47 218 12 242 121 l7 32 -50 0 c-45 0 -50 -3 -56 -25 -4 -14 -20 -32 -37 -41 -40 -20 -83 -5 -101 37 -11 25 -18 29 -55 29 -41 0 -43 -2 -43 -28z"/> </g></svg>',
  groom: '<svg viewBox="0 0 288 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M1253 2671 c-188 -58 -330 -207 -378 -399 -13 -51 -16 -113 -13 -340 l3 -277 27 -38 c30 -45 80 -81 123 -91 24 -6 34 -17 54 -62 13 -30 46 -78 72 -106 46 -49 49 -56 49 -104 0 -47 -2 -52 -20 -47 -15 4 -20 0 -20 -15 0 -17 -24 -26 -212 -72 -117 -29 -226 -60 -243 -68 -62 -31 -108 -77 -136 -137 l-29 -60 0 -377 0 -378 920 0 921 0 -3 378 c-3 361 -4 379 -24 423 -32 69 -86 123 -151 151 -32 14 -147 47 -255 74 -171 42 -198 51 -198 67 0 14 -5 18 -20 14 -18 -5 -20 0 -20 45 0 48 4 55 51 105 27 29 61 77 75 107 19 43 31 56 53 61 45 10 108 62 130 108 20 41 21 60 21 328 l0 284 -30 52 c-17 29 -47 64 -67 78 -21 14 -54 49 -74 78 -52 76 -155 158 -246 197 -69 29 -91 33 -188 36 -87 3 -123 0 -172 -15z m318 -108 c100 -42 177 -109 230 -200 15 -25 41 -52 60 -61 19 -9 44 -32 56 -51 21 -32 23 -45 23 -187 l0 -153 -32 14 -33 13 -3 86 -3 86 -44 0 c-44 0 -45 -1 -45 -33 0 -28 -6 -37 -37 -54 -69 -38 -80 -38 -92 0 -7 19 -27 52 -45 73 l-34 39 -59 -57 c-57 -54 -126 -94 -143 -83 -5 3 -11 18 -15 33 -7 32 -61 102 -78 102 -7 0 -25 -21 -42 -46 -29 -43 -79 -84 -104 -84 -7 0 -11 21 -11 55 l0 55 -45 0 -45 0 0 -85 c0 -73 -3 -86 -17 -91 -10 -3 -26 -10 -35 -15 -10 -5 -20 -9 -23 -9 -9 0 -5 257 5 311 54 281 356 451 611 342z m-1 -634 l0 -39 44 0 c24 0 72 9 106 19 l62 20 -4 -172 c-3 -168 -4 -174 -34 -237 -38 -79 -91 -134 -164 -169 -80 -38 -192 -37 -271 2 -66 32 -132 99 -162 165 -19 41 -22 69 -25 213 l-4 166 35 7 c19 4 53 20 75 36 22 16 43 26 46 23 3 -4 6 -21 6 -40 0 -31 2 -33 35 -33 61 0 132 20 186 54 30 18 57 31 62 29 4 -2 7 -22 7 -44z m-540 -200 l0 -111 -22 14 c-13 8 -31 32 -42 52 -16 32 -17 44 -7 76 9 31 50 80 67 80 2 0 4 -50 4 -111z m881 75 c19 -20 24 -37 24 -74 0 -37 -5 -54 -24 -74 -14 -14 -28 -26 -33 -26 -4 0 -8 45 -8 100 0 55 4 100 8 100 5 0 19 -12 33 -26z m-466 -574 c47 0 100 6 124 15 l41 14 0 -48 0 -48 -68 -26 c-85 -34 -100 -34 -189 0 l-73 28 0 47 0 47 41 -14 c24 -9 77 -15 124 -15z m-123 -250 l0 -64 -41 -18 -41 -17 0 99 0 99 41 -17 41 -18 0 -64z m567 54 c5 -4 -57 -386 -63 -392 -2 -2 -22 6 -45 18 l-41 20 0 199 0 199 73 -20 c39 -11 74 -22 76 -24z m-739 -162 l0 -199 -40 -18 c-22 -10 -42 -16 -43 -14 -5 6 -68 391 -65 395 5 5 112 32 131 33 16 1 17 -15 17 -197z m500 108 c0 -49 -3 -90 -7 -90 -4 0 -21 5 -38 11 -32 12 -32 13 -32 79 0 63 2 68 26 78 50 19 51 18 51 -78z m-170 0 c0 -29 -35 -44 -54 -24 -9 8 -16 19 -16 24 0 5 7 16 16 24 19 20 54 5 54 -24z m-570 24 c0 -9 59 -366 65 -391 4 -18 -2 -26 -37 -44 -24 -12 -44 -22 -46 -24 -1 -1 24 -81 57 -179 l60 -176 -195 0 -195 0 3 329 3 329 30 43 c17 23 42 51 56 61 36 27 199 70 199 52z m1130 -3 c19 -6 54 -15 78 -21 51 -13 106 -59 135 -114 21 -39 22 -54 25 -359 l3 -317 -195 0 c-108 0 -196 4 -196 9 0 4 25 81 55 170 30 89 55 166 55 171 0 5 -18 19 -40 30 -22 11 -40 26 -40 33 -1 43 66 407 75 407 5 0 26 -4 45 -9z m-560 -481 l0 -330 -35 0 -35 0 0 330 0 330 35 0 35 0 0 -330z m-160 -20 l0 -310 -40 0 -40 0 0 294 0 294 38 15 c20 9 38 16 40 16 1 1 2 -138 2 -309z m328 -14 l2 -296 -35 0 -35 0 0 310 0 309 33 -14 32 -13 3 -296z m-498 -107 c0 -190 0 -190 -22 -187 -18 3 -29 25 -70 148 -26 79 -48 148 -48 152 0 6 122 74 138 78 1 0 2 -86 2 -191z m686 -36 c-45 -137 -53 -153 -73 -153 l-23 0 0 190 0 190 74 -37 73 -36 -51 -154z M1198 1834 c-17 -36 0 -59 43 -59 30 0 34 3 37 28 7 57 -57 81 -80 31z M1622 1848 c-7 -7 -12 -21 -12 -33 0 -12 5 -26 12 -33 7 -7 21 -12 33 -12 12 0 26 5 33 12 7 7 12 21 12 33 0 12 -5 26 -12 33 -7 7 -21 12 -33 12 -12 0 -26 -5 -33 -12z M1283 1530 c7 -53 38 -94 93 -120 100 -49 219 12 239 123 l7 37 -46 0 c-39 0 -48 -4 -55 -22 -13 -34 -47 -60 -78 -60 -28 0 -73 41 -73 68 0 10 -13 14 -46 14 l-47 0 6 -40z"/> </g></svg>',
  priest: '<svg viewBox="0 0 308 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M1435 2683 c-224 -50 -401 -216 -455 -427 -17 -68 -20 -111 -20 -304 0 -208 2 -229 21 -269 24 -50 79 -99 129 -114 29 -9 39 -20 59 -64 12 -30 45 -77 72 -105 48 -50 49 -53 49 -113 l0 -62 -217 -54 c-309 -76 -361 -103 -414 -216 l-29 -60 0 -397 0 -398 920 0 921 0 -3 398 c-3 390 -3 398 -26 447 -27 59 -83 119 -132 144 -19 10 -142 45 -272 77 l-238 59 0 58 c0 57 2 61 49 113 27 30 62 79 76 109 20 41 34 57 54 62 40 10 90 47 119 90 l27 38 3 247 c2 202 0 258 -13 309 -54 208 -218 370 -430 424 -55 14 -203 19 -250 8z m259 -109 c160 -55 281 -181 327 -341 13 -48 19 -99 19 -175 l0 -107 -32 14 c-32 13 -33 15 -36 79 l-3 66 -44 0 c-43 0 -45 -2 -45 -28 0 -26 -5 -30 -78 -55 -44 -14 -109 -29 -145 -33 l-67 -7 0 51 0 52 -52 -22 c-93 -37 -201 -68 -260 -75 l-58 -6 0 62 0 61 -45 0 -45 0 0 -64 c0 -63 -1 -64 -32 -77 -18 -7 -37 -15 -42 -17 -14 -7 1 237 17 289 56 172 191 300 365 344 69 18 187 13 256 -11z m-194 -654 c0 -30 0 -30 58 -30 71 0 213 23 271 44 24 9 45 16 47 16 2 0 4 -55 4 -123 0 -207 -27 -295 -115 -376 -69 -63 -125 -86 -215 -86 -65 0 -84 4 -142 33 -73 36 -124 87 -160 161 -20 40 -23 65 -26 188 l-4 141 49 7 c58 7 160 31 194 44 36 15 39 13 39 -19z m-370 -151 l0 -111 -22 14 c-13 8 -31 32 -42 52 -16 32 -17 44 -7 76 9 31 50 80 67 80 2 0 4 -50 4 -111z m894 60 c22 -38 20 -80 -6 -119 -41 -61 -48 -52 -48 64 0 101 1 106 19 94 10 -6 26 -24 35 -39z m-478 -559 c39 0 92 6 118 14 l47 14 -3 -51 c-3 -49 -6 -53 -52 -89 -86 -64 -159 -58 -238 20 -32 30 -38 43 -38 79 l0 42 48 -14 c26 -8 79 -15 118 -15z m-284 -232 c5 -46 5 -47 -16 -36 -31 16 -108 80 -102 85 2 3 26 10 53 17 55 14 57 13 65 -66z m693 43 c-2 -4 -31 -26 -64 -50 l-61 -42 0 28 c0 15 3 44 6 64 l6 36 59 -15 c32 -8 57 -18 54 -21z m-502 -46 c55 -23 143 -19 203 9 28 13 55 29 58 35 12 20 26 12 26 -15 0 -14 -7 -50 -15 -79 -15 -50 -18 -53 -63 -66 -60 -18 -174 -18 -234 0 l-47 13 -15 69 c-23 100 -22 105 17 75 18 -14 50 -32 70 -41z m-367 -33 c35 -32 99 -78 143 -103 44 -24 81 -50 81 -57 0 -7 7 -27 16 -43 8 -17 14 -33 12 -35 -7 -6 -103 24 -163 52 -33 15 -82 44 -110 64 -53 40 -145 133 -145 148 0 7 54 25 93 31 5 0 38 -25 73 -57z m1049 42 c47 -11 47 -13 9 -60 -81 -98 -226 -184 -366 -218 l-26 -6 21 50 c19 45 29 55 92 89 38 22 102 66 140 99 39 33 77 59 85 57 8 -2 29 -7 45 -11z m-1235 -148 c113 -122 256 -195 470 -240 14 -3 33 -19 43 -35 10 -17 34 -51 52 -76 22 -28 35 -56 35 -75 0 -28 -2 -30 -40 -30 l-40 0 0 -45 0 -45 40 0 40 0 0 -80 0 -80 -205 0 -205 0 0 230 0 230 -45 0 -45 0 0 -230 0 -230 -140 0 -140 0 0 335 c0 370 1 379 63 443 l32 33 20 -28 c11 -15 40 -50 65 -77z m1452 14 c23 -44 23 -51 26 -382 l3 -338 -146 0 -145 0 0 230 0 230 -45 0 -45 0 0 -230 0 -230 -205 0 -205 0 0 80 0 80 45 0 45 0 0 45 0 45 -45 0 c-41 0 -45 2 -45 25 0 39 105 184 138 191 188 42 318 105 425 204 41 38 84 84 97 103 l24 35 27 -21 c15 -12 38 -42 51 -67z m-682 -97 c0 -1 -7 -18 -16 -37 -14 -29 -23 -35 -60 -41 -24 -3 -64 -3 -89 1 -40 5 -48 11 -64 43 l-19 36 124 0 c68 0 124 -1 124 -2z m-100 -182 c0 -5 -6 -14 -14 -20 -12 -10 -17 -8 -26 8 -9 19 -8 21 15 21 14 0 25 -4 25 -9z M1298 1834 c-17 -36 0 -59 43 -59 30 0 34 3 37 28 7 57 -57 81 -80 31z M1722 1848 c-7 -7 -12 -21 -12 -33 0 -12 5 -26 12 -33 7 -7 21 -12 33 -12 12 0 26 5 33 12 7 7 12 21 12 33 0 12 -5 26 -12 33 -7 7 -21 12 -33 12 -12 0 -26 -5 -33 -12z M1383 1571 c10 -79 78 -135 162 -135 83 0 156 58 170 138 l7 36 -46 0 c-35 0 -48 -4 -53 -17 -12 -34 -46 -63 -75 -63 -31 0 -78 39 -78 65 0 11 -11 15 -46 15 l-47 0 6 -39z"/> </g></svg>',
  wedding_dress: '<svg viewBox="0 0 278 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M1093 2677 c-66 -25 -117 -72 -153 -138 -30 -56 -34 -73 -35 -139 0 -83 23 -145 87 -228 l33 -44 3 -145 4 -144 -59 -62 c-116 -122 -223 -281 -300 -444 -24 -51 -43 -95 -43 -98 0 -3 16 -5 35 -5 l35 0 -59 -117 c-133 -267 -210 -482 -285 -805 -6 -26 -4 -27 102 -62 436 -145 962 -182 1457 -104 222 35 545 124 545 150 0 5 -14 65 -30 131 -59 237 -165 516 -277 730 l-40 77 34 0 c43 0 42 3 -36 155 -31 61 -57 114 -59 118 -2 4 8 5 22 1 15 -3 26 -2 26 4 0 6 -20 63 -45 129 -25 65 -45 121 -45 126 0 4 16 7 35 7 l35 0 0 170 0 170 -52 0 c-46 0 -65 -7 -143 -54 l-90 -54 -3 51 c-4 68 1 85 44 141 126 165 83 388 -91 471 -96 45 -204 32 -293 -36 -49 -37 -51 -37 -68 -18 -41 46 -106 72 -184 76 -43 1 -88 -3 -107 -10z m137 -84 c21 -4 57 -29 100 -70 37 -34 72 -63 77 -63 5 0 31 23 58 51 81 83 148 105 223 74 46 -20 79 -50 102 -95 41 -81 34 -144 -25 -227 -45 -62 -64 -106 -73 -165 l-7 -47 -47 29 c-37 23 -60 30 -98 30 -46 0 -50 -2 -50 -24 0 -21 -7 -26 -52 -36 -29 -7 -113 -15 -185 -17 l-133 -6 0 54 c0 57 -22 112 -81 201 -41 62 -51 109 -34 165 18 60 56 106 107 132 46 22 66 25 118 14z m450 -655 c0 -6 -84 -58 -94 -58 -3 0 -6 27 -6 61 l0 60 50 -28 c27 -15 50 -31 50 -35z m310 -4 l0 -66 -37 23 c-82 49 -81 44 -27 78 27 17 52 31 57 31 4 0 7 -30 7 -66z m-502 9 c-6 -31 -203 -83 -314 -83 l-54 0 0 35 0 35 83 1 c45 0 118 6 162 13 116 19 127 19 123 -1z m195 -202 l-25 -99 -36 -6 c-20 -3 -38 -4 -40 -2 -7 8 81 172 101 188 12 10 23 18 23 18 1 0 -9 -44 -23 -99z m233 -6 c19 -50 34 -93 34 -96 0 -3 -11 -4 -23 -2 -20 4 -26 16 -41 76 -9 40 -19 83 -23 96 -4 17 -2 22 7 19 7 -2 27 -44 46 -93z m-486 69 c0 -10 -143 -71 -205 -87 -33 -9 -91 -19 -129 -23 -65 -6 -68 -6 -58 12 28 53 51 61 177 67 96 5 161 16 213 36 1 1 2 -2 2 -5z m39 -175 c-33 -67 -59 -123 -56 -125 2 -2 76 11 164 28 l160 32 18 75 c10 42 20 80 23 86 3 5 15 -29 27 -75 l21 -85 40 -9 c39 -8 44 -14 106 -120 l66 -111 -31 -9 c-80 -22 -122 -42 -167 -83 -34 -30 -57 -43 -77 -43 -62 0 -196 -60 -232 -104 -23 -28 -87 -56 -126 -56 -43 0 -65 11 -125 60 -69 57 -167 100 -229 100 -13 0 -41 16 -63 36 -43 39 -130 84 -163 84 -53 1 -51 14 22 137 39 65 79 125 89 134 14 12 49 18 139 22 165 8 308 51 413 122 20 14 38 25 39 25 2 0 -24 -54 -58 -121z m-614 -430 c25 -12 60 -39 79 -60 26 -31 40 -39 68 -39 75 0 140 -29 263 -119 96 -71 202 -63 311 21 83 63 141 89 216 96 52 4 62 9 84 38 27 35 123 89 135 77 4 -5 37 -66 73 -138 l66 -130 -73 -6 c-84 -6 -148 -32 -204 -83 -29 -26 -50 -36 -74 -36 -67 -1 -136 -33 -254 -120 -22 -16 -64 -35 -93 -41 -45 -11 -61 -10 -107 5 -30 9 -75 32 -99 51 -98 74 -168 105 -242 105 -17 0 -42 13 -66 36 -62 55 -132 84 -206 84 -61 0 -63 1 -57 23 7 22 128 257 133 257 1 0 23 -10 47 -21z m-62 -365 c28 -10 61 -32 85 -58 37 -40 44 -43 105 -49 83 -8 121 -24 190 -80 146 -119 331 -116 477 8 58 49 96 64 177 72 61 6 68 9 112 53 54 54 107 73 195 68 l60 -3 38 -105 c34 -93 118 -371 118 -390 0 -10 -192 -65 -310 -89 -468 -96 -934 -86 -1385 29 -82 21 -160 42 -172 47 l-21 8 25 95 c25 99 50 176 103 323 l32 87 62 0 c34 0 83 -7 109 -16z"/> </g></svg>',
  bell: '<svg viewBox="0 0 278 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M224 2673 c-51 -29 -59 -37 -83 -71 -30 -42 -38 -125 -18 -173 25 -62 74 -105 212 -191 l134 -83 -60 -7 c-117 -13 -208 -79 -261 -186 -30 -60 -33 -76 -33 -152 0 -101 20 -154 86 -225 66 -72 126 -98 236 -103 l93 -4 6 -37 c11 -62 75 -203 122 -266 56 -76 108 -124 197 -182 251 -164 381 -322 467 -568 22 -62 23 -73 11 -95 -19 -35 -12 -124 13 -157 31 -41 67 -64 111 -70 78 -10 106 8 288 188 l170 168 65 -32 c124 -62 264 -36 355 65 84 94 99 230 37 341 l-30 54 164 164 c90 90 171 178 179 195 34 72 9 169 -54 211 -39 27 -130 31 -170 9 -22 -12 -32 -11 -85 9 -226 85 -431 255 -561 465 -47 75 -104 137 -179 193 -68 51 -189 110 -251 123 -63 13 -60 8 -60 96 -1 69 -5 93 -28 143 -97 208 -370 263 -536 107 -71 -66 -102 -140 -109 -253 -2 -49 -8 -89 -11 -89 -3 0 -37 70 -75 155 -37 85 -81 173 -96 194 -53 73 -175 104 -246 64z m126 -88 c40 -21 58 -50 133 -218 54 -122 62 -146 44 -134 -12 7 -71 45 -132 82 -128 79 -162 108 -181 152 -18 42 -2 88 40 114 37 23 58 24 96 4z m747 -14 c47 -23 100 -80 120 -129 8 -19 14 -58 14 -87 0 -63 -17 -109 -61 -159 -53 -59 -101 -79 -207 -84 -88 -4 -93 -3 -93 16 0 11 -3 27 -6 36 -5 14 5 16 72 16 96 0 149 22 190 76 25 32 29 47 29 99 0 52 -4 67 -29 99 -30 40 -94 76 -136 76 -42 0 -106 -36 -136 -76 -26 -34 -29 -46 -32 -130 l-4 -93 -40 21 -41 21 7 69 c8 83 23 122 66 172 74 84 190 107 287 57z m-66 -154 c25 -19 41 -56 34 -78 -13 -40 -46 -59 -102 -59 l-53 0 0 41 c0 65 32 108 80 108 14 0 32 -5 41 -12z m-298 -249 c47 -25 59 -66 31 -106 -35 -51 -101 -46 -130 9 -17 34 -6 69 28 93 27 19 42 20 71 4z m704 -33 c126 -50 223 -133 300 -253 l35 -54 -87 -88 c-86 -87 -88 -88 -144 -92 -95 -7 -165 -71 -177 -162 -6 -43 -7 -44 -48 -48 -23 -3 -59 -16 -79 -29 -48 -31 -91 -114 -85 -164 4 -32 -2 -40 -87 -124 l-90 -90 -50 32 c-157 100 -263 243 -296 399 l-11 48 55 53 55 52 7 -47 6 -48 159 0 c88 0 160 2 160 5 0 3 -47 100 -105 215 -58 116 -103 210 -100 210 3 0 100 -47 215 -105 115 -58 212 -105 215 -105 3 0 4 73 3 163 l-3 162 -51 3 -51 3 51 54 c47 49 54 53 86 48 19 -3 72 -20 117 -38z m-887 -107 c7 -18 15 -36 18 -40 2 -5 -35 -8 -83 -8 -70 0 -95 -4 -125 -21 -79 -44 -104 -152 -55 -235 50 -86 167 -108 244 -46 56 45 71 84 71 183 l0 87 35 -11 35 -10 0 -81 c-1 -128 -45 -205 -145 -252 -195 -92 -407 119 -318 316 42 92 138 149 253 150 53 0 56 -1 70 -32z m583 -44 l57 -6 0 -44 0 -44 -102 51 c-57 28 -105 54 -108 56 -3 3 18 3 45 -1 28 -3 76 -8 108 -12z m-603 -134 c0 -97 -76 -145 -135 -85 -32 31 -32 66 1 99 22 22 36 26 80 26 l54 0 0 -40z m379 -232 c1 -5 -19 -8 -43 -8 l-44 0 -7 88 c-3 48 -9 98 -11 112 -3 14 20 -22 50 -80 30 -58 55 -108 55 -112z m901 -3 c-41 -41 -77 -75 -80 -75 -3 0 -15 15 -27 33 l-21 32 71 73 72 72 30 -30 30 -30 -75 -75z m218 -56 c46 -36 129 -86 204 -123 l127 -62 -469 -469 c-392 -392 -470 -466 -476 -450 -45 126 -105 238 -179 334 l-53 69 102 101 101 101 178 0 177 0 0 177 0 178 102 102 c57 57 104 103 106 103 1 0 37 -27 80 -61z m-405 -39 l27 -30 0 -170 0 -170 -156 0 c-195 0 -222 10 -247 91 -8 25 23 78 54 95 15 7 55 14 89 14 l60 0 0 56 c0 133 97 197 173 114z m962 -155 c14 -13 25 -34 25 -47 0 -17 -144 -167 -542 -566 -299 -299 -553 -548 -566 -553 -40 -16 -92 26 -92 74 0 6 249 260 552 564 411 411 559 553 576 553 13 0 34 -11 47 -25z m-1350 -270 l30 -25 -74 -74 -74 -75 -32 27 -33 27 71 73 c40 39 74 72 77 72 3 -1 18 -12 35 -25z m1075 -359 c12 -44 7 -92 -12 -130 -9 -17 -12 -16 -39 10 l-29 28 -35 -34 -35 -34 26 -27 c32 -33 27 -43 -29 -57 -47 -12 -101 -3 -145 26 l-23 15 137 138 c126 126 140 137 155 123 9 -8 22 -35 29 -58z"/> </g></svg>',
  bow: '<svg viewBox="0 0 278 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M2172 2669 c-113 -56 -136 -212 -44 -304 l26 -26 -145 -145 c-79 -79 -146 -144 -149 -144 -3 0 -18 25 -34 56 -40 75 -130 156 -214 189 -110 44 -170 43 -562 -9 -190 -25 -362 -49 -382 -52 -36 -6 -38 -5 -38 23 0 46 -20 104 -54 158 -44 68 -124 110 -212 110 -174 0 -294 -169 -239 -336 35 -106 184 -216 344 -254 60 -14 97 -17 195 -12 67 4 139 10 161 13 l40 6 58 -388 58 -388 -153 -153 -153 -153 -125 0 -125 0 -158 -158 -157 -157 0 -58 0 -57 165 0 165 0 0 -165 0 -165 58 0 57 0 158 158 157 157 0 125 0 125 153 153 153 153 388 -58 388 -58 -6 -40 c-3 -22 -9 -94 -13 -161 -5 -98 -2 -135 12 -195 38 -160 148 -309 254 -344 167 -55 336 65 336 239 0 88 -42 168 -110 212 -54 34 -112 54 -158 54 -28 0 -29 2 -23 38 3 20 27 192 52 382 53 395 53 453 8 563 -35 85 -113 174 -188 213 -31 16 -56 31 -56 34 0 3 65 70 144 149 l145 145 26 -26 c92 -92 249 -69 304 44 20 41 21 60 21 286 l0 242 -242 0 c-228 0 -246 -1 -286 -21z m438 -251 c0 -161 -2 -187 -19 -214 -26 -43 -71 -60 -112 -44 -51 22 -69 62 -69 158 l0 82 -82 0 c-96 0 -136 18 -158 69 -16 41 1 86 44 112 27 17 53 19 214 19 l182 0 0 -182z m-2170 -8 c44 -22 88 -87 97 -144 l6 -36 -44 15 c-23 9 -57 26 -74 40 l-32 24 -34 -35 -34 -35 25 -20 c45 -35 115 -67 176 -80 53 -10 88 -8 372 31 173 23 316 40 318 37 3 -3 0 -34 -6 -70 -14 -77 30 -64 -354 -103 -311 -32 -337 -30 -472 36 -129 63 -198 156 -175 237 30 104 136 151 231 103z m1880 -127 c0 -23 -36 -64 -191 -219 -159 -159 -195 -190 -214 -186 -15 2 -25 13 -28 26 -2 16 39 64 187 214 156 157 196 192 218 192 24 0 28 -4 28 -27z m-934 -85 c-3 -18 -8 -52 -12 -75 -6 -41 -8 -43 -42 -43 l-35 0 7 53 c13 94 14 97 53 97 34 0 35 -1 29 -32z m217 -5 c26 -13 66 -42 87 -64 l40 -41 -63 -48 c-56 -44 -64 -47 -82 -34 -11 8 -42 26 -70 40 -27 15 -51 27 -52 28 -3 3 17 125 23 144 5 18 53 8 117 -25z m-160 -219 c59 -20 119 -79 142 -139 l18 -47 -269 -269 -270 -270 -52 347 c-29 191 -50 349 -48 351 5 5 331 40 387 42 25 0 66 -6 92 -15z m341 -15 c3 -17 6 -64 6 -104 l0 -73 100 -4 c54 -2 102 -7 106 -11 6 -6 -15 -41 -60 -99 -12 -16 -16 -16 -64 2 -31 12 -77 20 -112 20 l-60 0 0 60 c0 35 -8 81 -20 112 -11 28 -19 52 -17 53 1 1 24 18 51 38 27 20 52 37 56 37 4 0 10 -14 14 -31z m384 -308 c28 -39 59 -101 66 -138 7 -30 6 -32 -26 -38 -18 -3 -54 -9 -79 -14 l-46 -8 -27 51 c-14 28 -32 60 -40 71 -13 18 -11 25 31 82 l46 61 27 -20 c15 -11 37 -32 48 -47z m-530 -51 c23 0 -38 -65 -407 -434 -359 -359 -441 -436 -471 -444 l-38 -9 10 36 c8 29 94 121 441 469 378 378 432 429 435 407 3 -20 9 -25 30 -25z m248 -45 c49 -29 89 -84 105 -145 10 -38 8 -81 -9 -249 -12 -112 -23 -205 -25 -207 -2 -2 -160 19 -351 48 l-347 52 268 268 c296 297 274 282 359 233z m354 -209 c0 -32 -2 -34 -42 -40 -24 -4 -58 -9 -75 -12 -32 -6 -33 -5 -33 29 0 35 1 36 53 45 93 17 97 16 97 -22z m-20 -147 c0 -6 -19 -149 -41 -318 -38 -277 -40 -312 -30 -365 13 -61 45 -131 80 -176 l20 -25 35 34 35 34 -24 32 c-14 17 -31 51 -40 74 l-15 44 36 -6 c19 -3 55 -18 80 -32 128 -75 104 -255 -39 -296 -81 -23 -174 46 -237 175 -67 138 -68 158 -32 506 17 167 33 304 35 307 5 5 86 21 115 22 12 1 22 -4 22 -10z m-1592 -469 l-10 -40 -111 0 -111 0 39 40 39 40 82 0 82 0 -10 -40z m112 -304 l-40 -41 0 112 0 111 38 9 37 9 3 -80 3 -80 -41 -40z m-230 139 l-34 -35 -120 0 -120 0 34 35 34 35 120 0 120 0 -34 -35z m65 -304 l-35 -36 0 120 0 119 33 34 32 33 3 -117 3 -118 -36 -35z M1520 2105 l0 -45 50 0 50 0 0 45 0 45 -50 0 -50 0 0 -45z M2070 1565 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z"/> </g></svg>',
  hotel: '<svg viewBox="0 0 278 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M1276 2665 c-76 -31 -148 -101 -178 -172 l-22 -53 -227 0 -227 0 -30 -77 c-16 -43 -44 -117 -62 -165 l-33 -88 -68 0 -69 0 0 -130 0 -130 40 0 40 0 0 -285 0 -285 -40 0 -40 0 0 -130 0 -130 40 0 40 0 0 -224 0 -224 -47 -12 c-37 -9 -61 -25 -106 -71 -32 -32 -63 -59 -69 -59 -23 0 -72 -46 -89 -84 -39 -86 -9 -181 71 -223 l43 -23 1160 0 c1156 0 1161 0 1204 21 61 29 86 70 91 144 3 55 1 64 -28 104 -18 25 -48 50 -70 60 -21 9 -46 29 -55 44 -21 35 -94 83 -140 91 l-35 7 0 224 0 225 40 0 40 0 0 130 0 130 -40 0 -40 0 0 285 0 285 40 0 40 0 0 130 0 130 -68 0 -67 0 -61 163 -61 162 -230 3 -231 2 -7 27 c-20 82 -129 187 -220 212 -69 19 -163 13 -229 -14z m205 -80 c141 -48 207 -204 143 -333 -76 -152 -264 -186 -383 -70 -90 88 -102 203 -33 307 63 94 169 131 273 96z m-411 -265 c0 -44 38 -137 72 -176 l30 -34 -286 0 -285 0 28 78 c16 42 32 84 35 92 3 8 10 27 15 43 l11 27 190 0 190 0 0 -30z m1097 -89 c24 -63 42 -116 40 -118 -2 -2 -128 -2 -280 -1 l-276 3 33 50 c39 59 56 105 56 152 l0 33 192 -2 192 -3 43 -114z m193 -251 l0 -40 -955 0 -955 0 0 40 0 40 955 0 955 0 0 -40z m-1420 -335 l0 -205 -200 0 -200 0 0 205 0 205 200 0 200 0 0 -205z m170 -80 l0 -285 -35 0 -35 0 0 285 0 285 35 0 35 0 0 -285z m500 80 l0 -205 -205 0 -205 0 0 205 0 205 205 0 205 0 0 -205z m170 -80 l0 -285 -40 0 -40 0 0 285 0 285 40 0 40 0 0 -285z m500 80 l0 -205 -205 0 -205 0 0 205 0 205 205 0 205 0 0 -205z m-1340 -330 l0 -35 -200 0 -200 0 0 35 0 35 200 0 200 0 0 -35z m670 0 l0 -35 -205 0 -205 0 0 35 0 35 205 0 205 0 0 -35z m670 0 l0 -35 -205 0 -205 0 0 35 0 35 205 0 205 0 0 -35z m-1750 -170 c0 -34 -1 -35 -40 -35 -39 0 -40 1 -40 35 0 34 1 35 40 35 39 0 40 -1 40 -35z m160 0 c0 -33 -2 -35 -35 -35 -33 0 -35 2 -35 35 0 33 2 35 35 35 33 0 35 -2 35 -35z m170 0 c0 -33 -2 -35 -35 -35 -33 0 -35 2 -35 35 0 33 2 35 35 35 33 0 35 -2 35 -35z m170 0 c0 -34 -1 -35 -40 -35 -39 0 -40 1 -40 35 0 34 1 35 40 35 39 0 40 -1 40 -35z m160 0 c0 -33 -2 -35 -35 -35 -33 0 -35 2 -35 35 0 33 2 35 35 35 33 0 35 -2 35 -35z m170 0 c0 -33 -2 -35 -35 -35 -33 0 -35 2 -35 35 0 33 2 35 35 35 33 0 35 -2 35 -35z m170 0 c0 -34 -1 -35 -40 -35 -39 0 -40 1 -40 35 0 34 1 35 40 35 39 0 40 -1 40 -35z m160 0 c0 -33 -2 -35 -35 -35 -33 0 -35 2 -35 35 0 33 2 35 35 35 33 0 35 -2 35 -35z m170 0 c0 -33 -2 -35 -35 -35 -33 0 -35 2 -35 35 0 33 2 35 35 35 33 0 35 -2 35 -35z m170 0 c0 -34 -1 -35 -40 -35 -39 0 -40 1 -40 35 0 34 1 35 40 35 39 0 40 -1 40 -35z m160 0 c0 -33 -2 -35 -35 -35 -33 0 -35 2 -35 35 0 33 2 35 35 35 33 0 35 -2 35 -35z m170 0 c0 -33 -2 -35 -35 -35 -33 0 -35 2 -35 35 0 33 2 35 35 35 33 0 35 -2 35 -35z m-80 -360 c0 -221 -1 -235 -19 -245 -21 -11 -1657 -15 -1698 -4 l-23 6 0 239 0 239 870 0 870 0 0 -235z m-1753 -346 c12 -13 28 -37 35 -56 10 -28 17 -33 44 -33 41 0 84 -39 84 -78 0 -18 -10 -38 -26 -53 -25 -23 -31 -24 -201 -27 -194 -4 -224 2 -248 49 -27 52 16 109 82 109 24 0 33 5 33 16 0 31 36 77 74 94 45 21 85 14 123 -21z m1910 4 c19 -13 36 -38 41 -56 6 -24 15 -33 33 -35 75 -9 116 -60 88 -111 -25 -45 -51 -51 -231 -51 -92 0 -178 4 -192 10 -84 32 -63 137 31 150 31 4 38 10 45 37 5 18 23 43 41 57 53 40 89 40 144 -1z m-354 -48 l-35 -35 -644 0 c-513 0 -645 3 -651 13 -4 7 -21 23 -37 35 l-29 22 716 0 715 0 -35 -35z m-53 -142 c0 -10 3 -28 6 -40 l6 -23 -637 0 -636 0 6 23 c4 12 9 30 11 40 5 16 43 17 625 17 583 0 619 -1 619 -17z M1365 2506 c-24 -30 -53 -51 -90 -66 -30 -12 -55 -24 -55 -26 0 -2 13 -25 30 -52 19 -31 32 -69 36 -105 4 -31 10 -57 15 -57 4 0 31 5 59 11 38 8 64 8 101 -1 61 -15 69 -8 69 57 0 30 9 58 31 94 18 28 28 54 23 58 -5 5 -29 16 -55 25 -30 12 -56 32 -80 61 -18 24 -37 44 -41 45 -4 0 -23 -20 -43 -44z m63 -122 c12 -10 17 -25 14 -43 -3 -24 -7 -26 -37 -23 -42 5 -54 43 -21 66 26 19 23 19 44 0z M610 1650 l0 -130 130 0 130 0 0 130 0 130 -130 0 -130 0 0 -130z m170 -5 c0 -34 -1 -35 -40 -35 -39 0 -40 1 -40 35 0 34 1 35 40 35 39 0 40 -1 40 -35z M1360 1645 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M1940 1650 l0 -130 130 0 130 0 0 130 0 130 -130 0 -130 0 0 -130z m170 -5 c0 -33 -2 -35 -35 -35 -33 0 -35 2 -35 35 0 33 2 35 35 35 33 0 35 -2 35 -35z M690 770 l0 -170 175 0 175 0 0 170 0 170 -175 0 -175 0 0 -170z m250 0 l0 -80 -75 0 -75 0 0 80 0 80 75 0 75 0 0 -80z M1240 770 l0 -170 170 0 170 0 0 170 0 170 -170 0 -170 0 0 -170z m250 0 l0 -80 -80 0 -80 0 0 80 0 80 80 0 80 0 0 -80z M1780 770 l0 -170 170 0 170 0 0 170 0 170 -170 0 -170 0 0 -170z m250 0 l0 -80 -80 0 -80 0 0 80 0 80 80 0 80 0 0 -80z"/> </g></svg>',
  celebration: '<svg viewBox="0 0 280 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M1360 2645 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M1780 2669 c-43 -25 -78 -76 -86 -127 -13 -80 55 -172 139 -187 l37 -7 0 46 c0 35 -4 48 -17 53 -35 12 -63 46 -63 75 0 34 42 78 75 78 12 0 34 -11 49 -25 21 -20 26 -33 26 -73 0 -111 -57 -226 -164 -332 -36 -35 -66 -69 -66 -75 0 -6 14 -24 31 -41 l31 -29 84 88 c121 127 176 247 178 392 1 59 -3 76 -24 107 -51 75 -155 101 -230 57z M2491 2665 c-57 -49 -63 -127 -14 -185 75 -90 223 -40 223 76 0 25 -7 58 -15 74 -32 63 -138 81 -194 35z m110 -81 c17 -21 0 -49 -32 -49 -27 0 -37 28 -19 50 16 19 34 19 51 -1z M570 2525 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M1155 2561 c-145 -35 -172 -246 -40 -313 49 -25 128 -27 172 -4 47 24 49 35 14 69 -27 28 -34 30 -51 19 -51 -32 -130 7 -130 65 0 37 42 73 86 73 29 0 43 -7 71 -37 85 -94 123 -202 123 -355 l0 -98 45 0 45 0 0 118 c0 79 -5 136 -16 173 -40 137 -138 265 -220 288 -43 12 -55 12 -99 2z M2150 2525 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M2330 2385 l-44 -45 32 -32 32 -33 47 47 47 47 -29 31 c-16 16 -31 30 -35 30 -3 0 -26 -20 -50 -45z M2167 2222 l-87 -88 33 -32 33 -32 87 88 87 88 -33 32 -33 32 -87 -88z M2490 2185 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M501 2183 c-39 -8 -118 -94 -131 -144 -24 -88 9 -176 86 -236 34 -25 45 -28 114 -28 66 0 82 4 118 27 54 36 92 102 99 173 l6 55 -52 0 -51 0 0 -45 c0 -38 -6 -52 -34 -83 -30 -32 -40 -37 -79 -37 -149 0 -165 204 -18 231 89 17 310 -38 448 -112 46 -24 85 -44 87 -44 10 0 47 70 42 79 -10 15 -125 76 -199 105 -135 54 -327 79 -436 59z M1812 1867 l-192 -193 33 -32 33 -32 192 193 192 193 -33 32 -33 32 -192 -193z M2465 2024 c-131 -20 -232 -73 -342 -178 l-88 -84 29 -31 c17 -17 35 -31 41 -31 6 0 40 30 75 66 106 107 221 164 332 164 40 0 53 -5 73 -26 14 -15 25 -37 25 -49 0 -33 -44 -75 -78 -75 -29 0 -63 28 -75 63 -5 13 -18 17 -53 17 l-46 0 7 -37 c15 -84 107 -152 187 -139 86 14 148 85 148 171 0 116 -101 189 -235 169z M1240 1935 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M519 1108 c-401 -802 -411 -824 -406 -871 5 -57 30 -95 78 -119 72 -38 54 -45 929 392 451 225 820 413 820 418 0 4 -58 66 -130 137 l-130 129 30 19 c73 46 97 155 52 229 -33 53 -81 79 -157 85 l-63 6 -6 46 c-11 81 -67 140 -141 149 -65 7 -107 -4 -144 -39 l-34 -31 -136 136 c-75 75 -140 136 -144 136 -4 0 -192 -370 -418 -822z m421 17 l0 -595 -120 -60 -120 -60 0 420 0 420 45 90 45 90 40 0 40 0 0 50 c0 38 -4 50 -15 50 -11 0 -2 25 32 95 26 52 49 95 50 95 2 0 3 -268 3 -595z m250 238 l0 -183 45 0 45 0 0 -240 0 -240 -120 -60 -120 -60 0 557 0 557 75 -74 75 -74 0 -183z m225 252 c22 -22 25 -32 25 -105 l0 -80 102 0 c91 0 104 -2 125 -22 30 -28 30 -74 1 -105 -21 -22 -26 -23 -200 -23 l-178 0 0 155 c0 152 1 156 25 180 13 14 36 25 50 25 14 0 37 -11 50 -25z m25 -475 l0 -40 50 0 50 0 0 40 c0 22 3 40 7 40 4 0 20 -12 35 -27 28 -27 28 -27 28 -158 l0 -130 -115 -58 c-63 -31 -117 -57 -120 -57 -3 0 -5 97 -5 215 l0 215 35 0 c34 0 35 -1 35 -40z m-830 -428 l0 -347 -115 -58 c-63 -31 -117 -57 -120 -57 -3 0 -5 77 -5 170 l0 170 55 110 c52 104 57 110 86 110 l31 0 -4 54 c-2 45 3 65 31 125 19 39 36 71 38 71 2 0 3 -156 3 -348z m1134 279 l38 -39 -41 -21 -41 -21 0 60 c0 33 1 60 3 60 2 0 20 -18 41 -39z m-1473 -794 c-11 -11 -47 7 -60 32 -8 14 -1 37 27 96 l37 79 3 -99 c1 -54 -1 -102 -7 -108z M780 1275 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M780 1065 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M780 855 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M780 645 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M1110 980 l0 -50 45 0 45 0 0 50 0 50 -45 0 -45 0 0 -50z M1110 775 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M1440 935 l0 -45 50 0 50 0 0 45 0 45 -50 0 -50 0 0 -45z M440 645 l0 -45 50 0 50 0 0 45 0 45 -50 0 -50 0 0 -45z M440 435 l0 -45 50 0 50 0 0 45 0 45 -50 0 -50 0 0 -45z M1990 1435 l0 -45 98 0 c153 0 261 -38 355 -123 29 -27 37 -42 37 -70 0 -50 -28 -81 -75 -81 -62 0 -97 69 -63 124 11 17 9 24 -19 51 -34 35 -45 33 -69 -14 -23 -44 -21 -123 4 -172 55 -109 228 -114 293 -9 27 45 31 133 6 180 -23 44 -97 109 -164 142 -97 49 -155 62 -285 62 l-118 0 0 -45z M2610 1395 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M1900 1275 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M1983 1109 c-18 -12 -33 -23 -33 -25 0 -2 20 -41 44 -87 74 -138 129 -359 112 -448 -14 -78 -82 -120 -153 -96 -50 17 -78 58 -78 114 0 39 5 49 37 79 31 28 45 34 83 34 l45 0 0 51 0 52 -55 -6 c-71 -7 -137 -45 -173 -99 -23 -36 -27 -52 -27 -118 0 -69 3 -80 28 -114 16 -20 47 -49 70 -64 59 -39 155 -39 214 0 23 15 54 44 69 64 26 33 29 46 32 133 4 115 -20 240 -71 364 -37 89 -87 179 -102 184 -6 1 -25 -7 -42 -18z M2490 605 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z"/> </g></svg>',
  party: '<svg viewBox="0 0 280 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M110 2320 c0 -192 2 -350 5 -350 3 0 119 95 257 210 139 116 254 210 258 210 3 0 43 -112 88 -250 46 -137 87 -250 92 -250 4 0 79 98 166 218 86 119 161 221 165 226 4 5 64 -104 133 -243 69 -138 128 -251 131 -251 3 0 62 113 131 251 105 210 128 250 139 238 7 -8 81 -108 165 -224 83 -115 157 -210 163 -210 5 0 47 109 91 242 45 133 84 244 87 248 4 3 121 -90 260 -206 l254 -212 3 348 c1 192 1 350 -1 352 -2 1 -30 -6 -63 -17 -418 -145 -1156 -201 -1774 -135 -246 26 -524 81 -671 130 -40 14 -74 25 -76 25 -2 0 -3 -157 -3 -350z m150 205 c30 -9 106 -26 168 -40 63 -13 116 -26 119 -28 2 -3 -10 -15 -27 -27 l-32 -22 -144 53 c-83 31 -144 59 -144 66 0 7 1 13 3 13 1 0 27 -7 57 -15z m2350 2 c0 -12 -260 -118 -286 -117 -5 1 -22 11 -38 24 l-29 24 59 12 c32 6 109 24 169 39 61 16 113 29 118 30 4 0 7 -5 7 -12z m-1790 -106 l26 -6 -20 -114 -20 -114 -38 114 c-21 62 -38 117 -38 121 0 9 53 9 90 -1z m1227 -117 l-42 -126 -17 99 c-26 154 -29 148 64 152 l36 1 -41 -126z m-1731 65 l90 -33 -34 -30 -33 -29 -70 33 c-65 32 -69 36 -69 68 0 23 4 33 13 29 6 -2 53 -19 103 -38z m725 32 c25 -6 24 -7 -58 -120 -46 -62 -83 -110 -83 -106 0 5 10 59 21 122 l21 113 37 -1 c20 -1 48 -4 62 -8z m834 -23 c20 -113 33 -193 31 -195 -1 -2 -37 46 -80 105 -86 119 -86 119 6 121 34 1 38 -1 43 -31z m735 -1 c0 -30 -5 -35 -65 -65 -69 -34 -83 -33 -118 6 -17 18 -15 20 75 54 51 20 96 36 101 37 4 1 7 -14 7 -32z m-1073 -73 c-38 -78 -42 -83 -45 -55 -3 30 -5 31 -48 31 l-44 0 0 -50 0 -50 35 0 c19 0 35 -2 35 -5 0 -3 -14 -33 -31 -68 l-32 -61 -53 104 c-29 58 -53 108 -53 113 -1 4 15 7 34 7 35 0 35 0 35 45 l0 45 -45 0 c-42 0 -45 -2 -45 -27 l-1 -28 -19 35 c-11 19 -19 38 -20 43 0 4 76 7 170 7 l170 0 -43 -86z m-1290 -97 c-2 -6 -13 -17 -25 -25 -21 -14 -22 -13 -22 22 0 34 1 35 25 24 14 -6 24 -16 22 -21z m2363 -7 l0 -30 -26 17 c-25 16 -25 17 -8 30 27 20 34 16 34 -17z M1610 2072 c-34 -33 -40 -45 -40 -79 0 -34 6 -46 38 -75 l39 -35 -39 -35 c-22 -20 -38 -44 -38 -56 0 -20 5 -22 49 -22 43 0 55 5 85 34 31 28 36 40 36 78 0 37 -5 49 -35 78 l-35 34 35 32 c23 21 35 41 35 58 0 24 -3 26 -45 26 -38 0 -50 -6 -85 -38z M380 2017 c-233 -65 -341 -381 -218 -634 46 -94 163 -192 231 -193 9 0 17 -6 17 -13 0 -7 16 -37 35 -67 19 -30 35 -61 35 -70 0 -8 -17 -39 -37 -69 -34 -49 -38 -62 -38 -116 0 -54 4 -67 38 -116 20 -30 37 -61 37 -69 0 -9 -16 -40 -35 -70 -59 -91 -59 -149 0 -240 19 -30 35 -61 35 -70 0 -8 -15 -37 -34 -65 -19 -27 -38 -67 -41 -88 l-7 -37 46 0 c41 0 48 3 56 26 6 14 22 41 37 61 21 27 28 49 31 97 4 57 1 65 -32 115 -20 29 -36 65 -36 81 0 15 16 51 35 80 54 80 49 150 -19 244 -27 38 -23 71 15 124 26 36 34 58 37 104 4 52 1 64 -26 107 l-30 49 48 20 c104 43 185 155 215 297 18 87 18 113 0 200 -47 223 -222 361 -395 312z m149 -107 c212 -108 212 -502 0 -610 -134 -69 -288 50 -319 247 -24 146 53 319 163 367 46 21 112 19 156 -4z M380 1838 c-46 -31 -47 -42 -6 -73 30 -23 37 -25 55 -13 17 10 21 23 21 60 0 56 -16 62 -70 26z M284 1675 c-4 -14 -4 -59 -2 -100 7 -112 65 -203 141 -221 26 -6 27 -5 27 38 0 34 -6 50 -25 68 -35 33 -59 112 -52 171 7 54 6 54 -45 64 -34 7 -38 5 -44 -20z M2305 2021 c-92 -24 -168 -84 -214 -171 -45 -83 -61 -149 -61 -245 0 -185 81 -331 221 -397 l49 -23 -27 -40 c-23 -33 -28 -51 -28 -102 0 -54 4 -67 34 -110 43 -59 45 -99 9 -141 -60 -72 -61 -159 -3 -243 19 -28 35 -59 35 -68 0 -9 -17 -41 -37 -71 -34 -49 -38 -62 -38 -117 0 -53 4 -68 31 -106 18 -25 35 -54 39 -66 5 -17 14 -21 51 -21 41 0 44 2 44 25 0 28 -21 73 -53 117 -28 38 -24 70 14 123 31 43 34 54 34 115 0 61 -3 72 -34 115 -38 53 -42 85 -14 123 71 97 71 177 0 274 -27 36 -25 71 7 112 14 19 30 45 35 58 6 16 23 27 53 36 103 30 207 154 236 282 50 215 -39 442 -204 519 -49 23 -134 34 -179 22z m164 -124 c81 -54 141 -178 141 -292 0 -115 -60 -238 -142 -292 -34 -23 -53 -28 -103 -28 -50 0 -69 5 -103 28 -91 60 -149 191 -139 315 17 230 196 368 346 269z M2360 1815 c0 -37 4 -47 26 -61 25 -17 26 -16 56 14 27 27 30 33 18 47 -17 20 -64 45 -85 45 -11 0 -15 -11 -15 -45z M2461 1691 c-23 -6 -24 -10 -22 -71 2 -74 -14 -122 -53 -159 -20 -19 -26 -34 -26 -68 0 -48 11 -53 58 -29 80 42 132 169 116 287 -7 52 -15 57 -73 40z M900 1822 c-33 -32 -40 -45 -40 -77 0 -31 7 -45 38 -75 l39 -36 -39 -37 c-21 -20 -38 -46 -38 -57 0 -17 7 -20 46 -20 53 0 96 26 120 72 21 41 10 84 -34 123 l-35 33 28 18 c23 15 55 67 55 89 0 3 -22 5 -50 5 -43 0 -54 -4 -90 -38z M1820 1730 l0 -50 45 0 45 0 0 50 0 50 -45 0 -45 0 0 -50z M1153 1669 c-79 -39 -123 -112 -123 -201 1 -83 25 -120 183 -277 l145 -144 -14 -33 c-23 -54 -17 -111 17 -181 l31 -63 -31 -60 c-41 -79 -41 -131 0 -210 l31 -60 -31 -63 c-41 -83 -41 -131 0 -214 l31 -63 44 0 c38 0 44 3 44 22 0 12 -14 50 -31 86 l-32 64 32 62 c40 78 40 123 1 201 -16 33 -29 65 -29 70 0 6 13 37 29 70 39 78 39 123 -2 202 l-31 61 28 59 c21 42 68 98 171 203 131 134 144 151 159 205 20 68 11 130 -27 189 -63 96 -216 126 -312 61 -22 -15 -38 -20 -42 -13 -4 5 -25 19 -48 29 -56 26 -139 25 -193 -2z m150 -85 c18 -9 49 -32 69 -52 l37 -35 50 46 c57 54 100 66 154 43 66 -27 96 -111 63 -174 -8 -15 -72 -84 -143 -155 l-129 -127 -130 132 c-72 73 -136 148 -143 165 -19 46 -7 94 32 130 49 47 86 54 140 27z M1860 1282 c-34 -33 -40 -45 -40 -80 0 -32 6 -47 31 -71 17 -17 35 -31 41 -31 6 0 -7 -17 -30 -38 -24 -23 -42 -48 -42 -60 0 -20 5 -22 49 -22 43 0 55 5 85 34 31 29 36 40 36 79 0 39 -5 49 -36 77 l-36 31 36 34 c24 21 36 42 36 59 0 24 -3 26 -45 26 -38 0 -50 -6 -85 -38z M110 1065 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M650 1025 c0 -34 7 -55 25 -80 51 -66 123 -70 173 -9 l29 35 40 -41 c57 -56 73 -53 73 11 0 46 -4 55 -39 90 -56 56 -110 51 -161 -14 l-22 -28 -32 35 c-17 20 -43 38 -58 42 -27 6 -28 5 -28 -41z M2610 935 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M1650 645 c0 -38 6 -50 38 -85 34 -34 45 -40 82 -40 36 0 47 5 76 36 l33 37 34 -37 c19 -20 44 -36 56 -36 19 0 21 6 21 49 0 43 -5 55 -34 85 -28 30 -40 36 -76 36 -38 0 -48 -5 -82 -42 -21 -23 -38 -36 -38 -30 0 20 -61 72 -86 72 -22 0 -24 -4 -24 -45z M1084 628 c-45 -35 -53 -50 -54 -94 0 -36 5 -47 38 -76 l39 -35 -39 -32 c-25 -21 -38 -41 -38 -57 0 -22 4 -24 44 -24 29 0 52 7 72 22 45 35 53 50 54 94 0 36 -5 47 -38 75 l-37 34 37 36 c21 20 38 46 38 57 0 19 -6 22 -44 22 -29 0 -52 -7 -72 -22z M2566 446 c-30 -28 -36 -40 -36 -76 0 -36 6 -48 36 -77 l36 -34 -36 -35 c-22 -21 -36 -44 -36 -59 0 -23 4 -25 45 -25 38 0 50 6 85 38 34 34 40 45 40 82 0 36 -5 47 -36 76 l-37 33 37 34 c20 19 36 44 36 56 0 19 -6 21 -49 21 -43 0 -55 -5 -85 -34z M149 401 c-32 -31 -39 -46 -39 -77 0 -31 7 -44 39 -72 l38 -36 -38 -36 c-22 -21 -39 -46 -39 -58 0 -19 6 -22 46 -22 90 0 156 88 120 158 -9 18 -28 39 -41 48 -32 21 -31 25 5 49 24 16 50 59 50 81 0 2 -23 4 -51 4 -46 0 -55 -4 -90 -39z M2030 275 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M690 185 l0 -45 50 0 50 0 0 45 0 45 -50 0 -50 0 0 -45z"/> </g></svg>',
  balloon: '<svg viewBox="0 0 288 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M654 2671 c-101 -34 -176 -106 -226 -216 -18 -41 -22 -67 -22 -145 0 -140 30 -208 140 -317 45 -45 87 -90 93 -101 6 -12 11 -43 11 -71 l0 -51 38 0 38 0 -5 -41 -6 -40 -100 -2 c-87 -2 -108 -6 -162 -31 -184 -85 -265 -295 -190 -496 27 -72 55 -111 140 -191 l71 -67 4 -65 4 -66 46 -3 46 -3 14 -75 c8 -41 14 -120 14 -175 1 -86 -3 -114 -31 -200 -18 -55 -35 -126 -38 -157 l-6 -58 45 0 44 0 21 88 c12 48 31 123 42 167 25 95 27 198 6 315 -8 47 -15 88 -15 93 0 4 16 7 35 7 34 0 35 1 35 43 1 23 7 56 14 72 l13 30 6 -25 c15 -62 28 -179 39 -352 l12 -188 45 0 44 0 -6 163 c-4 89 -16 232 -28 318 l-22 156 43 58 c138 187 117 432 -49 563 l-46 37 8 63 9 62 44 0 44 0 0 51 c0 28 5 59 11 71 6 11 48 56 93 101 110 109 140 177 140 317 1 83 -3 102 -26 152 -15 32 -39 73 -53 92 -35 46 -119 102 -180 121 -66 20 -177 18 -241 -4z m216 -90 c174 -66 241 -241 160 -414 -21 -45 -52 -81 -133 -154 -45 -40 -77 -96 -77 -134 0 -15 -8 -19 -40 -19 -32 0 -40 4 -40 19 0 38 -32 94 -77 134 -81 73 -112 109 -133 154 -81 172 -14 346 157 413 62 25 120 25 183 1z m-136 -1011 c55 -28 107 -80 138 -140 18 -36 23 -60 22 -120 -1 -110 -31 -169 -138 -273 -71 -69 -86 -90 -96 -130 -12 -44 -14 -47 -46 -47 -28 0 -35 4 -40 28 -13 53 -38 88 -115 162 -88 86 -118 141 -126 235 -6 73 7 127 47 187 76 115 232 158 354 98z M717 2516 c-56 -20 -103 -60 -126 -109 -34 -69 -25 -185 18 -238 l18 -22 35 27 36 27 -20 48 c-28 64 -19 109 28 150 19 17 44 31 54 31 17 0 20 7 20 50 0 55 -3 57 -63 36z M707 2131 l-26 -39 22 -19 c39 -35 47 -36 83 -8 l36 27 -29 30 c-48 51 -58 52 -86 9z M556 1520 c-55 -17 -105 -61 -132 -117 -23 -45 -26 -63 -21 -112 5 -54 39 -141 55 -141 4 0 23 13 41 28 33 27 33 29 19 57 -25 50 -29 83 -14 118 17 41 60 77 92 77 22 0 24 4 24 50 0 54 -5 57 -64 40z M543 1135 c-29 -44 -29 -47 7 -73 38 -28 41 -28 76 9 l29 31 -40 34 c-22 18 -42 34 -45 34 -3 0 -15 -16 -27 -35z M1999 2676 c-73 -28 -116 -56 -160 -103 -106 -113 -133 -260 -76 -413 27 -72 55 -111 140 -191 l71 -67 4 -66 4 -66 43 0 c48 0 49 -1 60 -81 6 -45 5 -46 -34 -74 -50 -34 -84 -78 -119 -153 -23 -49 -27 -69 -26 -152 0 -80 4 -105 27 -159 15 -36 45 -86 66 -112 l40 -46 -19 -129 c-20 -140 -40 -364 -40 -456 l0 -58 48 0 49 0 6 168 c3 92 13 220 23 285 16 106 19 115 31 95 7 -13 12 -47 13 -75 l0 -53 35 0 c41 0 41 4 19 -128 -20 -119 -13 -222 21 -330 13 -42 29 -107 36 -144 l12 -68 49 0 49 0 -7 52 c-4 29 -20 96 -36 148 -43 140 -49 195 -33 308 26 177 20 162 70 162 l45 0 0 51 c0 28 5 59 11 71 6 11 48 56 93 101 110 109 140 177 140 317 0 78 -4 104 -22 145 -36 78 -71 123 -130 165 -72 52 -146 73 -244 68 l-76 -3 -6 29 c-11 51 -8 56 29 56 34 0 35 1 35 40 0 65 26 115 83 158 155 117 212 346 129 514 -38 78 -101 138 -182 177 -45 21 -72 26 -145 28 -57 2 -103 -2 -126 -11z m235 -106 c55 -28 107 -80 138 -140 18 -36 23 -60 22 -120 -1 -110 -31 -169 -138 -273 -71 -69 -86 -90 -96 -130 -12 -44 -14 -47 -46 -47 -28 0 -35 4 -40 28 -13 53 -38 88 -115 162 -88 86 -118 141 -126 235 -6 73 7 127 47 187 76 115 232 158 354 98z m136 -989 c174 -66 241 -241 160 -414 -21 -45 -52 -81 -133 -154 -45 -40 -77 -96 -77 -134 0 -15 -8 -19 -40 -19 -32 0 -40 4 -40 19 0 38 -32 94 -77 134 -81 73 -112 109 -133 154 -81 172 -14 346 157 413 62 25 120 25 183 1z M2110 2481 c0 -39 4 -51 15 -51 29 0 75 -30 90 -60 19 -36 19 -97 0 -130 -8 -14 -14 -29 -15 -35 0 -9 60 -55 72 -55 18 0 51 100 52 155 1 115 -65 195 -181 220 l-33 7 0 -51z M2117 2139 c-20 -17 -37 -35 -37 -40 0 -12 51 -58 66 -59 5 0 22 13 37 28 l27 28 -26 37 c-13 20 -26 37 -27 37 -1 0 -19 -14 -40 -31z M2280 1481 c0 -44 3 -51 20 -51 10 0 35 -14 54 -31 47 -41 56 -86 28 -150 l-20 -48 36 -27 35 -27 18 22 c48 59 51 192 6 260 -28 43 -92 85 -144 96 l-33 7 0 -51z M2279 1133 l-41 -37 33 -28 c18 -15 36 -28 40 -28 4 0 21 12 38 26 l30 25 -26 40 c-14 21 -27 39 -29 39 -2 0 -22 -17 -45 -37z M1325 2132 c-153 -54 -244 -177 -253 -339 -8 -145 54 -281 172 -377 54 -44 76 -86 76 -146 l0 -40 40 0 40 0 0 -60 c0 -60 0 -60 -29 -60 -16 0 -41 -4 -54 -9 -18 -7 -42 -3 -93 16 -44 16 -101 27 -156 30 l-88 6 0 -237 0 -236 43 0 c62 1 155 23 222 54 46 21 55 23 43 9 -25 -30 -254 -327 -262 -340 -6 -10 29 -13 161 -13 l169 0 21 58 22 57 0 -202 1 -203 45 0 45 0 1 208 0 207 23 -60 23 -60 166 -3 c92 -1 167 0 167 4 0 6 -149 201 -239 313 -27 34 -31 43 -16 37 86 -35 162 -57 223 -62 l72 -7 0 238 0 238 -87 -6 c-56 -3 -113 -14 -157 -30 -51 -19 -75 -23 -93 -16 -13 5 -38 9 -54 9 -29 0 -29 0 -29 60 l0 60 44 0 44 0 4 66 4 67 62 54 c33 30 76 75 95 101 151 207 89 486 -132 595 -54 26 -77 31 -150 34 -63 2 -100 -2 -136 -15z m183 -84 c174 -43 265 -219 202 -390 -20 -52 -38 -77 -106 -144 -81 -80 -105 -114 -118 -166 -5 -24 -12 -28 -40 -28 -31 0 -34 3 -47 48 -10 38 -28 62 -96 127 -93 92 -129 156 -139 251 -5 47 -1 71 16 118 36 94 96 151 195 182 51 16 75 17 133 2z m312 -1129 l0 -141 -32 7 c-18 4 -66 22 -106 41 l-74 34 23 31 c12 17 24 51 27 75 5 51 14 58 99 78 32 8 59 15 61 15 1 1 2 -62 2 -140z m-641 113 c52 -17 53 -18 55 -58 1 -22 12 -57 23 -77 l22 -36 -24 -15 c-27 -18 -106 -50 -147 -60 l-28 -6 0 135 c0 155 -5 149 99 117z m235 -51 c25 -27 32 -27 72 9 36 31 57 31 75 -1 8 -17 0 -30 -52 -85 l-63 -65 -58 58 c-60 60 -73 94 -41 112 20 11 40 2 67 -28z m-92 -406 l-35 -95 -39 0 c-36 0 -38 2 -26 18 22 31 132 172 134 172 1 0 -14 -43 -34 -95z m298 -10 l62 -80 -32 -3 c-18 -2 -36 0 -41 5 -4 4 -22 46 -39 93 -35 95 -35 95 50 -15z M1440 1935 c0 -36 3 -45 18 -45 31 0 83 -40 98 -76 16 -38 12 -78 -12 -126 -13 -26 -12 -28 19 -52 19 -15 37 -26 40 -26 15 0 49 86 54 136 12 118 -80 234 -186 234 -30 0 -31 -1 -31 -45z M1447 1592 l-37 -38 32 -31 31 -32 34 26 c18 14 33 29 33 34 0 12 -43 79 -50 79 -3 0 -23 -17 -43 -38z"/> </g></svg>',
  champagne: '<svg viewBox="0 0 278 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M1150 2645 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M2465 2676 c-16 -7 -82 -67 -146 -132 -123 -126 -136 -151 -123 -223 9 -46 87 -125 134 -134 72 -15 97 -1 223 122 66 64 125 128 133 143 18 35 18 101 0 136 -44 85 -141 123 -221 88z m116 -105 c16 -16 29 -38 29 -48 0 -24 -219 -243 -244 -243 -26 0 -76 49 -76 74 0 26 217 246 243 246 10 0 32 -13 48 -29z M1441 2552 c-48 -24 -73 -62 -79 -120 -5 -54 10 -92 52 -132 38 -35 135 -40 200 -11 37 16 255 141 275 158 10 7 -12 15 -120 44 -63 16 -142 40 -177 54 -74 30 -105 31 -151 7z m130 -101 c24 -10 53 -21 63 -25 19 -6 19 -7 0 -21 -30 -23 -113 -47 -138 -41 -12 3 -28 17 -35 32 -10 22 -9 31 4 50 19 29 47 30 106 5z M2030 2525 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M741 2455 c-63 -53 -63 -146 0 -199 25 -21 41 -26 89 -26 54 0 64 4 149 60 50 33 91 62 91 65 0 3 -41 32 -91 65 -85 56 -95 60 -149 60 -48 0 -64 -5 -89 -25z m131 -81 c31 -16 31 -17 12 -31 -54 -40 -126 -9 -82 35 16 16 33 15 70 -4z M1912 2267 c-48 -48 -52 -56 -52 -99 0 -26 5 -50 11 -53 24 -16 -109 -124 -234 -190 -113 -60 -235 -93 -387 -105 -69 -5 -147 -16 -173 -25 -79 -24 -161 -73 -214 -128 -50 -51 -700 -959 -735 -1027 -22 -42 -23 -89 -3 -138 21 -49 326 -356 381 -382 45 -22 89 -25 130 -10 43 17 974 679 1035 738 59 55 109 137 134 219 9 26 20 104 25 173 12 152 45 274 105 387 66 125 174 258 190 234 3 -6 27 -11 53 -11 44 0 52 4 100 53 47 48 52 57 52 97 0 45 -2 47 -138 183 -136 136 -138 137 -182 137 -42 0 -50 -5 -98 -53z m213 -157 l110 -110 -28 -27 -27 -28 -112 112 -112 112 24 26 c13 14 26 25 29 25 4 0 56 -49 116 -110z m-125 -125 l44 -45 -30 -32 c-54 -58 -120 -151 -161 -228 -40 -74 -103 -257 -103 -299 0 -21 -3 -21 -190 -21 l-190 0 0 190 c0 187 0 190 21 190 46 0 228 64 310 110 78 43 218 145 234 170 10 17 19 12 65 -35z m-720 -485 l0 -230 231 0 230 0 -3 -37 -3 -38 -267 -3 -268 -2 0 263 c0 145 3 267 7 270 3 4 21 7 40 7 l33 0 0 -230z m-170 -100 l0 -300 301 0 301 0 -7 -27 c-9 -39 -54 -111 -91 -149 -18 -18 -79 -65 -134 -105 l-102 -72 -310 310 -311 311 67 96 c37 52 87 115 110 138 41 41 136 98 163 98 10 0 13 -61 13 -300z m-110 -415 c181 -181 291 -298 285 -303 -19 -17 -327 -233 -338 -238 -7 -2 -122 106 -256 240 -184 184 -241 247 -235 258 23 38 239 338 244 338 3 0 138 -133 300 -295z m-378 -372 c126 -125 228 -231 228 -234 0 -9 -225 -168 -253 -178 -14 -6 -31 -5 -43 1 -30 16 -324 310 -340 341 -12 22 -12 32 -3 50 18 33 172 247 178 247 3 0 108 -102 233 -227z M737 1072 c-15 -15 -27 -32 -27 -38 0 -13 323 -334 336 -334 6 0 23 14 39 30 l29 31 -169 169 c-93 94 -172 170 -176 170 -3 0 -17 -13 -32 -28z M605 940 l-29 -31 172 -171 171 -172 31 29 c16 16 30 34 30 39 0 14 -322 336 -336 336 -6 0 -23 -14 -39 -30z M1129 2133 c-88 -54 -74 -194 23 -231 107 -41 207 59 166 166 -27 71 -125 105 -189 65z m89 -85 c30 -30 -1 -73 -36 -51 -23 14 -25 29 -7 47 20 19 27 20 43 4z M1490 2065 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M2400 2025 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M2386 1919 c-3 -8 -17 -61 -31 -118 -15 -57 -37 -131 -51 -164 -31 -77 -31 -133 -1 -178 63 -95 206 -88 258 13 26 52 21 127 -15 197 -52 103 -155 264 -160 250z m89 -333 c24 -78 -28 -129 -82 -81 -27 22 -27 25 -15 57 8 18 21 54 30 81 l16 47 19 -30 c10 -16 25 -50 32 -74z M2070 1525 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M2090 1299 c-53 -80 -60 -97 -60 -141 0 -91 46 -138 134 -138 85 0 139 77 117 166 -11 43 -108 203 -124 204 -4 0 -34 -41 -67 -91z m100 -144 c0 -44 -51 -59 -67 -19 -3 9 2 32 12 52 l17 37 19 -24 c10 -13 19 -33 19 -46z M2610 1185 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z"/> </g></svg>',
  wedding_cake: '<svg viewBox="0 0 288 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M1179 2667 c-24 -13 -57 -43 -74 -66 -27 -39 -30 -50 -30 -120 0 -69 3 -82 29 -120 16 -23 67 -69 113 -104 l84 -62 -183 -5 c-265 -7 -258 1 -258 -294 l0 -206 -81 0 c-90 0 -125 -14 -153 -60 -14 -24 -16 -66 -16 -294 l0 -266 -86 0 -87 0 6 -66 c11 -115 72 -204 171 -250 41 -19 68 -24 134 -24 l82 0 42 -85 42 -85 203 0 203 0 0 -99 0 -100 -283 -3 -284 -3 -41 -28 c-62 -40 -95 -96 -100 -168 l-4 -59 836 0 836 0 0 51 c0 85 -45 154 -125 190 -36 17 -70 19 -307 19 l-268 0 0 100 0 100 200 0 200 0 42 84 42 84 90 4 c72 2 101 8 139 28 91 46 147 134 155 243 l5 67 -87 0 -86 0 0 273 c0 231 -2 276 -16 295 -27 38 -67 52 -154 52 l-80 0 0 213 c0 294 7 287 -266 287 l-177 0 86 65 c100 75 131 113 148 178 22 81 -16 178 -90 228 -30 20 -48 24 -111 24 -68 0 -81 -3 -124 -31 l-48 -31 -56 33 c-71 43 -145 47 -213 11z m200 -116 c33 -23 64 -41 68 -41 4 0 39 21 77 45 76 49 106 55 150 26 55 -36 72 -106 40 -159 -17 -30 -252 -208 -270 -206 -13 2 -243 174 -262 197 -39 47 -17 142 41 171 45 23 86 14 156 -33z m549 -463 c8 -8 12 -49 12 -120 l0 -108 -495 0 -495 0 0 101 c0 55 5 109 10 120 10 18 26 19 483 19 355 0 476 -3 485 -12z m12 -358 l0 -40 -495 0 -495 0 0 40 0 40 495 0 495 0 0 -40z m238 -142 c8 -8 12 -49 12 -120 l0 -108 -745 0 -745 0 0 101 c0 55 5 109 10 120 10 19 29 19 733 19 549 0 726 -3 735 -12z m12 -418 l0 -100 -54 0 c-53 0 -54 0 -60 34 -4 19 -19 46 -33 61 -25 24 -33 26 -78 21 -61 -6 -59 -6 -120 0 -45 5 -53 3 -78 -21 -14 -15 -29 -42 -33 -61 l-6 -34 -284 0 c-280 0 -284 0 -284 21 0 27 -18 60 -44 81 -23 19 -87 24 -116 8 -13 -7 -21 -7 -25 0 -3 5 -27 10 -51 10 -57 0 -104 -40 -104 -89 l0 -31 -60 0 -60 0 0 100 0 100 745 0 745 0 0 -100z m-1165 -100 c23 22 35 29 35 19 0 -8 -16 -30 -35 -49 l-35 -34 -40 39 c-21 21 -37 42 -33 47 3 6 20 -5 39 -23 l34 -33 35 34z m850 0 l29 -30 33 32 c47 46 54 25 8 -22 l-39 -40 -38 37 c-21 20 -38 41 -38 45 0 16 17 8 45 -22z m-945 -145 l54 -55 56 55 56 55 349 0 349 0 56 -55 56 -55 54 55 54 55 169 0 168 0 -6 -22 c-12 -39 -60 -91 -105 -115 l-44 -23 -761 2 -760 3 -37 23 c-33 21 -98 103 -98 124 0 4 76 8 168 8 l168 0 54 -55z m1020 -200 c0 -2 -8 -20 -17 -40 l-17 -35 -468 0 -468 0 -20 40 -20 40 505 0 c278 0 505 -2 505 -5z m-470 -265 l0 -100 -35 0 -35 0 0 100 0 100 35 0 35 0 0 -100z m653 -212 c14 -10 31 -27 37 -38 11 -20 8 -20 -726 -20 l-737 0 24 26 c50 55 32 54 729 51 596 -2 648 -3 673 -19z M1110 1980 l0 -50 45 0 45 0 0 50 0 50 -45 0 -45 0 0 -50z M1400 1980 l0 -50 45 0 45 0 0 50 0 50 -45 0 -45 0 0 -50z M1690 1980 l0 -50 45 0 45 0 0 50 0 50 -45 0 -45 0 0 -50z M860 1480 l0 -50 45 0 45 0 0 50 0 50 -45 0 -45 0 0 -50z M1110 1480 l0 -50 45 0 45 0 0 50 0 50 -45 0 -45 0 0 -50z M1400 1480 l0 -50 45 0 45 0 0 50 0 50 -45 0 -45 0 0 -50z M1690 1480 l0 -50 45 0 45 0 0 50 0 50 -45 0 -45 0 0 -50z M1940 1480 l0 -50 45 0 45 0 0 50 0 50 -45 0 -45 0 0 -50z"/> </g></svg>',
  congratulation: '<svg viewBox="0 0 308 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M1080 2563 c1 -410 114 -827 311 -1144 21 -33 29 -58 29 -92 l0 -47 -93 0 -92 0 -85 -85 -85 -85 -237 0 c-194 0 -238 2 -238 14 0 7 -9 25 -21 40 -20 26 -22 26 -145 26 -122 0 -125 -1 -149 -26 l-25 -27 0 -358 c0 -241 4 -366 11 -382 17 -38 50 -47 168 -47 101 0 110 2 135 25 14 13 26 31 26 40 0 13 30 15 238 15 l238 0 59 -60 59 -60 118 0 118 0 0 -60 0 -60 -190 0 -190 0 0 -45 0 -45 505 0 505 0 0 45 0 45 -185 0 -185 0 0 60 0 60 146 0 146 0 40 40 c39 39 40 41 34 92 -4 29 -6 65 -6 81 1 39 1 132 0 165 0 15 2 46 6 69 4 28 1 52 -8 71 -13 24 -13 32 -1 47 32 45 2 152 -50 176 -20 9 -23 17 -22 69 0 44 -5 65 -21 86 -42 57 -67 68 -169 72 l-95 4 0 50 c0 39 8 63 39 116 109 189 189 393 236 602 41 184 55 312 55 501 l0 139 -465 0 -465 0 0 -127z m840 -40 c0 -84 -12 -215 -31 -330 -10 -64 -14 -73 -33 -73 -12 0 -86 23 -166 51 -130 46 -156 52 -250 56 -90 4 -114 2 -169 -16 -35 -12 -65 -20 -67 -18 -9 8 -24 199 -24 300 l0 107 370 0 370 0 0 -77z m-265 -441 c83 -28 159 -52 170 -54 16 -3 19 -11 17 -36 -6 -77 -153 -421 -225 -525 -18 -26 -23 -28 -75 -25 l-56 3 -58 105 c-84 152 -198 454 -198 527 0 8 17 21 38 30 110 47 190 42 387 -25z m-75 -767 c0 -33 -2 -35 -35 -35 -33 0 -35 2 -35 35 0 33 2 35 35 35 33 0 35 -2 35 -35z m266 -143 c6 -4 16 -17 22 -28 10 -18 8 -27 -9 -48 l-20 -26 -197 0 -197 0 -93 -93 -92 -93 35 -34 35 -34 45 44 45 44 0 -252 0 -252 -93 0 -93 0 -64 65 -64 65 -258 0 -258 0 0 245 0 245 263 0 262 0 80 80 80 80 280 0 c154 0 285 -4 291 -8z m-1346 -402 l0 -330 -80 0 -80 0 0 330 0 330 80 0 80 0 0 -330z m1084 182 c-3 -15 1 -44 8 -62 13 -30 13 -40 1 -69 -15 -35 -11 -95 8 -117 5 -6 2 -27 -8 -54 -16 -39 -16 -46 0 -88 12 -36 13 -49 4 -61 -8 -9 -13 -66 -15 -163 l-4 -148 -34 0 -34 0 0 395 0 395 40 0 c38 0 39 -1 34 -28z m354 12 c26 -18 27 -27 6 -48 -20 -20 -233 -23 -252 -4 -17 17 -15 45 6 57 29 17 214 14 240 -5z m6 -170 c21 -21 20 -30 -6 -48 -26 -19 -207 -23 -239 -6 -21 12 -25 40 -7 58 19 19 232 16 252 -4z m7 -170 c9 -11 10 -20 2 -32 -9 -14 -29 -17 -133 -17 -104 0 -124 3 -133 17 -8 12 -7 21 2 32 11 13 36 16 131 16 95 0 120 -3 131 -16z m-13 -160 c26 -18 27 -27 6 -48 -20 -20 -233 -23 -252 -4 -17 17 -15 45 6 57 29 17 214 14 240 -5z M1330 1980 l0 -50 50 0 50 0 0 50 0 50 -50 0 -50 0 0 -50z M1630 1855 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M1500 1605 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M2420 2643 l0 -47 -33 32 c-18 18 -38 32 -43 32 -6 0 -23 -14 -39 -30 l-29 -30 34 -35 34 -35 -47 0 -47 0 0 -50 0 -50 47 0 47 0 -34 -35 -34 -35 29 -30 c16 -16 33 -30 39 -30 5 0 25 14 43 32 l33 32 0 -47 0 -47 45 0 45 0 0 47 0 47 35 -34 35 -34 35 34 35 34 -32 33 -32 33 47 0 47 0 0 50 0 50 -47 0 -47 0 32 33 32 33 -35 34 -35 34 -35 -34 -35 -34 0 47 0 47 -45 0 -45 0 0 -47z m97 -105 c49 -46 16 -138 -51 -138 -38 0 -86 44 -86 79 0 14 12 38 27 53 33 34 77 37 110 6z M420 1893 l0 -47 -33 32 c-18 18 -38 32 -43 32 -6 0 -23 -14 -39 -30 l-29 -30 34 -35 34 -35 -47 0 -47 0 0 -50 0 -50 47 0 47 0 -34 -35 -34 -35 29 -30 c16 -16 33 -30 39 -30 5 0 25 14 43 32 l33 32 0 -47 0 -47 45 0 45 0 0 47 0 47 35 -34 35 -34 35 34 35 34 -32 33 -32 33 47 0 47 0 0 50 0 50 -47 0 -47 0 32 33 32 33 -35 34 -35 34 -35 -34 -35 -34 0 47 0 47 -45 0 -45 0 0 -47z m97 -105 c49 -46 16 -138 -51 -138 -38 0 -86 44 -86 79 0 14 12 38 27 53 33 34 77 37 110 6z M2580 1063 l0 -47 -35 34 -35 34 -30 -29 c-16 -16 -30 -33 -30 -39 0 -5 14 -25 32 -43 l32 -33 -47 0 -47 0 0 -45 0 -45 47 0 47 0 -34 -35 -34 -35 34 -35 34 -35 33 32 33 32 0 -47 0 -47 50 0 50 0 0 47 0 47 33 -32 33 -32 34 35 34 35 -34 35 -34 35 47 0 47 0 0 45 0 45 -47 0 -47 0 32 33 c18 18 32 38 32 43 0 6 -14 23 -30 39 l-30 29 -35 -34 -35 -34 0 47 0 47 -50 0 -50 0 0 -47z m102 -110 c54 -52 23 -133 -51 -133 -75 0 -107 77 -54 132 34 35 69 36 105 1z"/> </g></svg>',
  caring: '<svg viewBox="0 0 288 275" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,275.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M1972 2647 c-75 -28 -152 -126 -152 -195 0 -13 -9 -35 -20 -49 -12 -16 -20 -41 -20 -66 0 -30 -7 -48 -31 -75 -70 -80 -89 -151 -109 -404 -18 -241 -80 -487 -129 -512 -14 -8 -35 -23 -45 -35 l-19 -21 -33 30 c-33 28 -72 42 -251 91 -46 12 -83 26 -83 31 0 4 -11 8 -25 8 -22 0 -25 4 -25 38 0 26 10 51 35 86 19 27 35 55 35 62 0 7 16 20 35 29 43 21 80 57 93 93 18 46 52 276 52 349 0 86 -21 148 -67 202 -55 65 -117 91 -242 103 -128 11 -218 29 -330 65 l-85 26 -53 -57 c-91 -98 -143 -229 -143 -363 0 -35 12 -123 26 -195 29 -149 50 -189 114 -216 27 -12 41 -27 54 -58 9 -23 26 -50 37 -60 13 -12 19 -30 19 -61 0 -36 -3 -43 -20 -43 -11 0 -20 -4 -20 -8 0 -4 -66 -25 -146 -47 -163 -43 -195 -60 -239 -125 l-30 -45 -3 -368 -3 -367 443 0 443 0 24 -37 c31 -49 378 -357 394 -350 29 12 364 321 382 352 l20 35 443 0 442 0 0 360 c0 337 -1 363 -19 399 -19 37 -83 101 -101 101 -12 0 -43 87 -69 193 -28 114 -48 261 -57 412 -8 140 -26 202 -84 286 -22 32 -40 70 -40 84 0 14 -11 47 -25 73 -14 26 -25 56 -25 67 -1 60 -73 151 -142 179 -44 19 -158 20 -206 3z m173 -97 c27 -13 49 -34 64 -60 l22 -40 -30 0 c-16 0 -33 5 -37 11 -3 6 -22 18 -41 26 -44 18 -103 9 -135 -20 -22 -21 -68 -26 -68 -8 0 21 49 78 80 93 46 23 94 23 145 -2z m-46 -164 c9 -11 10 -20 1 -36 -13 -24 -38 -23 -53 1 -23 37 25 68 52 35z m-1421 -20 c92 -26 216 -46 285 -46 65 0 115 -18 157 -56 56 -51 74 -106 66 -201 -3 -43 -10 -81 -15 -86 -13 -13 -51 15 -51 39 0 20 -6 22 -83 26 -88 4 -129 21 -189 76 l-27 25 -36 -31 c-57 -50 -94 -65 -177 -70 -72 -4 -78 -6 -78 -27 0 -26 -47 -52 -63 -36 -15 15 -14 159 2 216 17 59 54 129 90 168 13 15 26 27 28 27 2 0 43 -11 91 -24z m1256 -28 c8 -14 7 -21 -6 -34 -30 -30 -75 9 -48 42 16 18 39 15 54 -8z m320 16 c24 -9 20 -51 -4 -59 -37 -12 -64 27 -38 53 14 14 20 14 42 6z m-94 -134 c26 -19 41 -21 98 -18 l67 3 33 -66 c40 -78 50 -159 28 -234 l-14 -50 -1 91 -1 91 -83 5 c-88 4 -129 21 -189 76 l-27 25 -36 -31 c-57 -50 -94 -65 -177 -70 l-78 -5 -1 -101 c0 -108 -9 -107 -29 4 -14 75 5 164 48 225 l28 40 65 -3 c57 -3 69 -1 93 20 37 32 130 31 176 -2z m-1288 -236 c28 -14 75 -28 104 -31 l54 -6 0 -101 c0 -152 -26 -219 -107 -274 -30 -21 -50 -27 -99 -27 -73 0 -128 31 -171 97 -26 39 -28 49 -31 173 l-3 132 55 6 c33 3 74 16 99 30 23 14 43 25 45 26 1 1 26 -11 54 -25z m1250 0 c28 -14 75 -28 104 -31 l54 -6 0 -101 c0 -152 -26 -219 -107 -274 -30 -21 -50 -27 -99 -27 -73 0 -128 31 -171 97 -26 39 -28 49 -31 173 l-3 132 55 6 c33 3 74 16 99 30 23 14 43 25 45 26 1 1 26 -11 54 -25z m-1592 -161 c0 -53 -1 -56 -16 -41 -20 19 -21 62 -4 83 7 8 14 15 16 15 2 0 4 -26 4 -57z m619 2 c0 -11 -6 -29 -14 -39 -14 -18 -15 -15 -15 39 0 54 1 57 15 39 8 -10 14 -28 14 -39z m655 -212 c10 -23 27 -50 37 -59 13 -12 19 -31 19 -63 l0 -46 -102 -27 c-56 -15 -103 -26 -104 -25 -1 1 11 54 27 117 16 63 32 138 35 166 l6 51 32 -36 c18 -20 40 -55 50 -78z m631 16 c9 -46 25 -117 36 -158 11 -40 18 -75 16 -77 -1 -2 -48 9 -102 24 l-100 27 -3 39 c-3 30 4 48 32 89 20 29 36 57 36 64 0 12 61 85 67 80 1 -2 10 -41 18 -88z m-1615 -179 c38 0 80 4 94 10 20 7 26 6 26 -3 0 -7 -27 -25 -60 -40 l-60 -28 -60 28 c-32 15 -59 34 -59 40 -1 9 6 10 25 3 14 -6 56 -10 94 -10z m1250 0 c38 0 80 4 94 10 23 8 26 7 26 -13 0 -14 -21 -44 -58 -80 l-58 -57 -62 63 c-67 67 -82 104 -36 87 14 -6 56 -10 94 -10z m-1354 -114 c18 -14 18 -15 -9 -25 -41 -16 -47 -14 -47 14 0 29 24 34 56 11z m264 -11 c0 -28 -8 -30 -45 -13 l-26 12 23 13 c35 19 48 16 48 -12z m982 -42 c56 -56 68 -73 68 -100 0 -32 1 -33 45 -33 l45 0 0 37 c0 32 8 46 62 100 34 35 68 63 76 63 7 0 83 -19 169 -42 119 -32 162 -49 184 -69 37 -34 36 -44 -2 -58 -17 -6 -57 -28 -89 -50 -56 -39 -58 -39 -64 -18 -3 12 -6 37 -6 55 0 31 -1 32 -45 32 l-45 0 0 -40 c0 -37 -2 -40 -27 -40 -48 0 -131 -27 -198 -64 l-66 -36 -37 25 c-48 32 -141 65 -204 72 l-48 6 0 38 0 39 -45 0 -45 0 0 -48 c0 -27 -3 -52 -6 -55 -4 -4 -21 5 -38 20 -17 14 -58 39 -91 53 l-59 28 34 34 c30 29 54 40 155 67 66 18 131 36 145 41 49 17 64 10 132 -57z m-1392 -18 c0 -61 1 -65 23 -65 22 0 26 -12 75 -222 29 -122 51 -223 49 -224 -1 -2 -31 33 -66 78 l-63 81 21 44 c11 24 21 47 21 52 0 4 -23 18 -50 31 -48 23 -51 26 -69 89 -45 154 -51 175 -48 177 4 5 72 22 90 23 14 1 17 -8 17 -64z m566 54 c24 -6 44 -14 44 -17 0 -3 -14 -57 -32 -119 l-32 -115 -50 -25 c-28 -14 -52 -27 -54 -28 -2 -2 8 -25 21 -51 l25 -48 -61 -79 c-34 -43 -65 -80 -68 -83 -4 -2 0 24 7 59 93 397 88 382 117 385 26 3 27 5 27 68 0 35 3 64 6 64 3 0 25 -5 50 -11z m-752 -91 c8 -29 25 -91 38 -137 19 -70 28 -87 51 -100 21 -12 26 -21 22 -36 -18 -57 -17 -60 77 -180 52 -66 106 -137 122 -157 l28 -38 -241 0 -242 0 3 304 c3 290 4 306 24 333 18 24 76 63 96 63 4 0 13 -24 22 -52z m963 25 c47 -31 53 -64 53 -298 0 -118 -2 -215 -4 -215 -3 0 -22 10 -43 23 -58 34 -152 31 -215 -6 -56 -32 -96 -86 -104 -139 l-7 -38 -54 0 -55 0 50 63 c208 264 203 256 187 287 -19 38 -20 37 13 54 25 13 32 29 68 156 37 136 40 141 63 135 12 -3 34 -13 48 -22z m-469 -19 c41 -19 53 -30 49 -43 -2 -10 -26 -111 -53 -225 -26 -113 -51 -203 -55 -199 -6 7 -100 401 -103 430 -1 11 74 58 98 62 5 0 34 -11 64 -25z m670 -168 c20 -13 47 -35 60 -48 21 -23 22 -29 12 -71 -7 -25 -10 -70 -8 -101 l3 -56 -44 -15 c-24 -8 -53 -22 -63 -32 -17 -16 -18 -10 -18 165 0 117 4 182 10 182 6 0 27 -11 48 -24z m1102 -231 l0 -255 -100 0 c-119 0 -117 -4 -63 114 30 66 38 95 41 158 2 43 -1 92 -7 109 -9 27 -8 36 6 52 19 22 102 77 115 77 4 0 8 -115 8 -255z m-742 163 c30 -11 78 -40 108 -64 29 -24 57 -44 62 -44 5 0 21 14 37 30 41 43 103 77 171 95 91 23 96 22 123 -37 40 -88 40 -135 -3 -225 -21 -43 -40 -99 -43 -125 l-6 -48 -242 0 -242 0 -13 43 c-20 68 -57 114 -112 139 -21 9 -30 24 -38 60 -14 55 -7 94 27 162 l24 48 47 -7 c25 -4 70 -16 100 -27z m-622 -308 c8 0 47 -31 87 -70 l74 -69 49 50 c88 90 144 110 212 75 56 -29 78 -106 48 -164 -13 -24 -284 -272 -307 -280 -14 -5 -291 245 -312 281 -25 44 -17 101 19 138 29 30 78 51 102 43 8 -2 20 -4 28 -4z"/> </g></svg>',
  gift: '<svg viewBox="0 0 308 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M1752 2674 c-63 -32 -93 -106 -77 -190 5 -31 31 -63 143 -176 74 -76 141 -138 147 -138 6 0 70 60 142 133 140 142 160 176 150 250 -6 47 -31 83 -77 115 -56 37 -159 26 -199 -22 -12 -14 -17 -12 -48 11 -45 34 -131 42 -181 17z m153 -125 l55 -51 56 51 c71 65 109 66 143 4 17 -33 -2 -62 -106 -166 l-89 -87 -102 103 c-110 112 -119 131 -77 172 35 36 60 31 120 -26z M431 2559 c-78 -23 -145 -90 -171 -173 -18 -56 -7 -147 23 -199 14 -23 117 -143 228 -266 l203 -223 25 28 c13 16 106 118 205 227 183 201 220 253 232 334 9 60 -19 145 -63 194 -56 62 -105 83 -188 83 -75 0 -122 -17 -184 -69 l-31 -27 -42 36 c-66 57 -157 77 -237 55z m138 -101 c12 -4 51 -35 85 -68 l62 -59 55 55 c64 66 97 85 149 86 112 1 191 -121 146 -225 -15 -34 -343 -400 -355 -395 -12 5 -315 340 -337 373 -46 66 -37 141 21 200 52 51 100 61 174 33z M1046 1956 c-60 -30 -111 -78 -139 -131 -28 -55 -36 -194 -13 -249 9 -21 16 -40 16 -42 0 -2 -47 -4 -105 -4 -110 0 -156 -12 -169 -45 -8 -22 -8 -238 0 -260 10 -25 58 -45 109 -45 l45 0 0 -540 0 -540 755 0 755 0 0 53 1 52 39 -45 40 -45 28 31 c15 17 106 118 202 223 96 106 186 210 199 233 32 52 41 166 18 221 -26 61 -65 104 -120 132 -96 47 -223 28 -304 -47 l-22 -20 -40 33 -41 32 0 114 0 113 45 0 c56 0 103 23 115 56 13 33 13 205 0 238 -16 43 -57 56 -174 56 l-106 0 18 43 c26 63 22 179 -7 237 -40 77 -68 107 -132 139 -53 26 -74 31 -136 31 -127 0 -218 -61 -293 -194 l-32 -56 -52 0 c-49 0 -53 2 -68 33 -9 17 -36 60 -61 93 -63 86 -139 124 -246 124 -59 -1 -87 -6 -125 -24z m208 -87 c51 -23 71 -44 118 -119 l35 -55 -27 -22 -27 -22 -41 64 c-22 35 -52 71 -66 80 -40 26 -96 29 -136 7 -76 -41 -89 -136 -31 -217 17 -24 31 -46 31 -49 0 -3 -18 -6 -39 -6 -32 0 -43 5 -59 28 -49 70 -54 145 -14 223 22 44 36 58 81 81 64 34 115 36 175 7z m737 7 c122 -51 167 -179 104 -295 -27 -49 -30 -51 -72 -51 -48 0 -48 0 -4 58 55 74 32 186 -44 218 -74 30 -131 6 -186 -78 -21 -33 -40 -64 -42 -71 -3 -8 -15 -3 -32 14 l-27 27 45 69 c36 57 54 75 98 97 59 29 110 33 160 12z m-788 -173 c8 -10 34 -53 57 -95 l42 -78 -34 0 c-20 0 -38 7 -45 18 -6 9 -30 43 -52 76 -33 47 -39 62 -30 77 12 24 41 24 62 2z m747 2 c16 -19 11 -29 -46 -109 -39 -54 -53 -66 -76 -66 -32 0 -34 9 -12 52 63 121 104 159 134 123z m-336 -85 c23 -11 51 -35 64 -52 l22 -33 -146 -3 c-81 -1 -149 0 -152 2 -9 10 47 73 80 89 44 22 83 21 132 -3z m-383 -262 l-40 -73 -236 -3 -235 -2 0 75 0 75 275 0 276 0 -40 -72z m239 69 c0 -2 -13 -42 -29 -89 -16 -47 -37 -134 -47 -194 -10 -60 -19 -111 -20 -112 -1 -2 -19 8 -40 22 l-38 25 -33 -20 c-37 -23 -37 -22 -22 53 19 95 74 215 132 290 17 20 31 27 60 27 20 1 37 0 37 -2z m251 -30 c65 -82 122 -212 135 -310 l7 -51 -35 22 -34 21 -37 -25 -37 -24 -5 22 c-2 13 -12 66 -21 118 -8 52 -28 132 -44 178 l-29 82 37 0 c30 0 42 -6 63 -33z m659 -42 l0 -75 -237 0 -238 1 -41 74 -42 75 279 0 279 0 0 -75z m-810 -62 c0 -7 -12 -13 -26 -13 -20 0 -25 4 -20 16 3 9 9 28 13 42 l6 27 13 -30 c7 -16 13 -36 14 -42z m-420 -150 c-12 -55 -33 -256 -29 -276 3 -14 19 -7 87 38 l82 55 0 -385 0 -385 -205 0 -205 0 0 495 0 495 139 0 139 0 -8 -37z m454 15 c3 -13 11 -84 18 -158 6 -74 13 -137 14 -139 2 -2 16 6 32 18 17 12 33 21 36 21 3 0 6 -160 6 -355 l0 -355 -165 0 -165 0 0 355 c0 195 3 355 8 355 4 0 18 -9 32 -20 44 -35 50 -27 50 65 0 46 5 118 11 160 l11 75 53 0 c46 0 53 -3 59 -22z m606 -473 l0 -495 -205 0 -205 0 0 385 0 385 85 -57 c47 -31 87 -54 90 -51 4 4 -19 230 -31 296 l-6 32 136 0 136 0 0 -495z m456 180 c45 -26 84 -90 84 -136 -1 -49 -39 -103 -189 -269 -84 -93 -160 -175 -168 -181 -11 -10 -21 -5 -53 26 l-40 39 0 240 0 240 40 -39 40 -39 58 56 c95 94 149 109 228 63z M2414 1850 c-30 -12 -71 -64 -79 -100 -13 -57 12 -99 128 -217 61 -62 116 -113 122 -113 13 0 229 218 244 247 15 29 14 92 -2 123 -18 35 -74 70 -114 70 -34 0 -106 -31 -118 -51 -5 -7 -14 -4 -29 10 -40 37 -104 51 -152 31z m121 -139 c21 -23 43 -41 49 -41 5 0 33 23 62 50 47 44 56 49 74 40 42 -23 35 -39 -51 -126 l-84 -84 -77 77 c-80 80 -95 112 -61 132 22 12 38 3 88 -48z M321 552 c-39 -21 -71 -73 -71 -115 0 -52 28 -92 142 -205 l114 -112 121 122 c127 129 145 160 129 224 -25 97 -141 134 -221 70 l-29 -24 -32 24 c-43 33 -110 40 -153 16z m134 -132 l49 -50 51 50 c55 54 87 63 105 29 10 -18 2 -30 -72 -105 l-83 -85 -83 85 c-74 75 -82 87 -72 105 18 35 52 25 105 -29z"/> </g></svg>',
  heart: '<svg viewBox="0 0 280 276" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,276.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M370 2647 c-67 -28 -79 -35 -117 -68 -115 -98 -168 -261 -129 -404 27 -104 50 -132 374 -457 174 -175 321 -318 327 -318 6 0 153 143 326 318 342 345 358 365 379 493 33 193 -87 387 -276 444 -65 20 -178 19 -240 -2 -55 -18 -139 -69 -167 -101 l-19 -21 -52 42 c-83 68 -145 91 -256 94 -81 3 -103 0 -150 -20z m208 -79 c59 -14 134 -62 192 -122 24 -25 49 -46 55 -46 6 0 37 27 69 59 82 83 151 116 241 116 87 -1 155 -29 213 -88 66 -69 87 -119 87 -212 0 -129 -7 -139 -329 -463 l-281 -282 -278 277 c-238 238 -282 287 -310 343 -26 52 -32 76 -31 125 2 130 93 252 218 291 52 16 95 17 154 2z M1156 2493 c-3 -8 -6 -29 -6 -47 0 -28 5 -34 36 -45 19 -7 37 -11 38 -9 56 77 56 81 -17 103 -40 12 -46 12 -51 -2z M1283 2379 c-18 -12 -33 -22 -33 -24 0 -1 7 -19 15 -38 30 -71 22 -82 -236 -342 -132 -133 -239 -245 -239 -251 0 -6 14 -23 30 -39 l31 -29 230 229 c127 127 242 250 257 275 22 36 27 57 27 110 0 67 -19 130 -39 130 -6 0 -26 -10 -43 -21z M1602 1999 c-105 -20 -217 -97 -268 -184 -74 -126 -72 -298 3 -418 14 -22 23 -40 21 -41 -2 -1 -21 -13 -43 -26 -22 -13 -57 -39 -77 -58 l-37 -35 -42 38 c-23 20 -71 51 -108 69 -60 28 -75 31 -166 31 -88 0 -107 -3 -158 -27 -80 -38 -128 -78 -172 -143 -47 -71 -65 -133 -65 -225 0 -165 17 -190 388 -563 l317 -317 318 317 c193 193 329 337 345 365 l27 48 53 -53 52 -52 306 305 c168 168 321 328 338 355 46 71 66 137 66 219 0 122 -41 217 -125 295 -152 140 -374 142 -542 4 l-43 -34 -42 34 c-71 56 -113 77 -185 92 -75 16 -98 17 -161 4z m203 -119 c27 -13 79 -52 117 -88 l68 -64 68 64 c96 90 146 113 247 113 93 0 143 -21 212 -87 59 -58 87 -126 88 -213 0 -119 -16 -141 -336 -461 l-279 -278 -40 39 c-36 35 -40 44 -40 90 0 98 -42 194 -117 268 -74 75 -170 117 -270 117 -44 0 -55 4 -76 29 -101 121 -96 293 11 404 37 39 71 61 127 84 47 20 163 10 220 -17z m-849 -604 c62 -16 121 -56 188 -125 l50 -51 60 58 c74 70 117 98 187 118 87 26 183 2 269 -66 46 -36 97 -133 106 -200 8 -56 -15 -136 -56 -199 -16 -25 -149 -165 -295 -311 l-265 -265 -283 285 c-308 310 -326 334 -334 444 -11 139 87 275 227 312 59 17 85 16 146 0z M2320 1812 c0 -17 -3 -37 -6 -46 -4 -10 5 -20 31 -30 21 -9 39 -16 40 -16 6 0 45 67 45 77 0 11 -36 28 -82 39 -26 6 -28 4 -28 -24z M2452 1717 c-24 -17 -31 -27 -26 -42 14 -48 16 -67 9 -102 -6 -33 -41 -72 -241 -273 -129 -130 -234 -240 -234 -246 0 -6 13 -22 28 -37 l28 -27 246 248 c223 224 247 252 263 300 11 34 15 68 11 91 -7 45 -33 111 -44 110 -4 0 -22 -10 -40 -22z M1530 1196 c0 -7 -3 -27 -6 -42 -5 -27 -2 -31 32 -43 37 -13 38 -13 61 15 31 39 29 53 -12 70 -43 18 -75 18 -75 0z M1656 1087 c-27 -22 -28 -25 -16 -58 8 -23 10 -50 6 -75 -7 -34 -38 -70 -247 -279 l-239 -241 35 -34 35 -34 221 219 c268 268 281 284 287 379 5 76 -15 146 -40 146 -7 0 -26 -10 -42 -23z"/> </g></svg>',
  diamond: '<svg viewBox="0 0 280 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M530 2645 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M527 2409 c-11 -125 -67 -189 -187 -212 l-60 -12 0 -42 c0 -42 1 -43 34 -43 77 0 153 -46 188 -113 13 -25 23 -69 26 -109 l5 -68 43 0 44 0 0 53 c0 28 5 69 11 90 21 78 114 147 197 147 l42 0 0 44 0 44 -54 6 c-119 15 -196 105 -196 229 l0 57 -44 0 -43 0 -6 -71z m89 -304 l-41 -40 -41 40 -41 40 39 41 40 41 42 -40 42 -41 -40 -41z M110 2145 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M940 2145 l0 -45 50 0 50 0 0 45 0 45 -50 0 -50 0 0 -45z M2070 2070 l0 -40 -40 0 -40 0 0 -50 0 -50 40 0 40 0 0 -40 0 -40 45 0 45 0 0 40 0 40 40 0 40 0 0 50 0 50 -40 0 -40 0 0 40 0 40 -45 0 -45 0 0 -40z m80 -90 c0 -39 -1 -40 -35 -40 -34 0 -35 1 -35 40 0 39 1 40 35 40 34 0 35 -1 35 -40z M740 1544 c-140 -233 -142 -236 -123 -257 69 -79 778 -823 787 -825 15 -4 801 828 801 848 0 9 -61 118 -135 243 l-135 226 -527 1 -527 0 -141 -236z m568 114 c-8 -13 -45 -74 -82 -136 -61 -101 -69 -111 -80 -95 -27 40 -146 241 -146 247 0 3 73 6 161 6 l161 0 -14 -22z m500 0 c-8 -13 -45 -74 -82 -136 -61 -101 -69 -111 -80 -95 -27 40 -146 241 -146 247 0 3 73 6 161 6 l161 0 -14 -22z m-818 -160 c40 -68 75 -126 77 -130 2 -5 -70 -8 -161 -8 l-165 0 81 135 c44 74 84 133 88 130 4 -2 40 -60 80 -127z m500 0 c40 -68 75 -126 77 -130 2 -5 -70 -8 -161 -8 l-165 0 81 135 c44 74 84 133 88 130 4 -2 40 -60 80 -127z m500 0 c40 -68 75 -126 77 -130 2 -5 -70 -8 -161 -8 l-165 0 81 135 c44 74 84 133 88 130 4 -2 40 -60 80 -127z m-810 -420 c34 -106 74 -233 91 -283 l29 -90 -38 40 c-21 22 -124 130 -227 240 -104 110 -207 219 -229 243 l-40 42 176 0 177 0 61 -192z m406 175 c-24 -84 -170 -541 -175 -551 -6 -10 -84 221 -177 526 l-13 42 185 0 c172 0 185 -1 180 -17z m443 0 c-27 -34 -502 -533 -505 -530 -2 1 36 125 83 275 l86 272 175 0 c164 0 174 -1 161 -17z M530 1685 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M2190 1105 l0 -45 50 0 50 0 0 45 0 45 -50 0 -50 0 0 -45z M2190 878 c-1 -133 -91 -228 -216 -228 -34 0 -34 -1 -34 -45 0 -44 0 -45 34 -45 125 0 215 -95 216 -227 l0 -63 50 0 50 0 0 63 c1 132 91 227 216 227 34 0 34 1 34 45 0 44 0 45 -34 45 -125 0 -215 95 -216 228 l0 62 -50 0 -50 0 0 -62z m96 -236 l41 -37 -43 -38 -44 -38 -44 38 -43 38 41 37 c22 20 43 37 46 37 3 0 24 -17 46 -37z M690 735 l0 -45 -40 0 -40 0 0 -45 0 -45 40 0 40 0 0 -40 0 -40 50 0 50 0 0 40 0 40 40 0 40 0 0 45 0 45 -40 0 -40 0 0 45 0 45 -50 0 -50 0 0 -45z m90 -90 c0 -34 -1 -35 -40 -35 -39 0 -40 1 -40 35 0 34 1 35 40 35 39 0 40 -1 40 -35z M1780 605 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M2610 605 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M2190 145 l0 -45 50 0 50 0 0 45 0 45 -50 0 -50 0 0 -45z"/> </g></svg>',
  earing: '<svg viewBox="0 0 278 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M652 2674 c-84 -43 -122 -110 -122 -213 l0 -71 45 0 45 0 0 58 c0 87 52 152 120 152 56 0 120 -65 120 -123 0 -15 -18 -83 -40 -151 -24 -74 -40 -142 -40 -172 0 -45 -3 -50 -32 -65 -121 -59 -127 -227 -12 -295 41 -24 44 -28 44 -70 0 -24 -3 -44 -6 -44 -4 0 -22 10 -42 22 -42 26 -156 36 -218 19 -67 -18 -128 -72 -165 -146 -29 -59 -31 -71 -27 -133 8 -109 28 -137 254 -363 182 -182 204 -207 204 -236 0 -18 -4 -33 -9 -33 -5 0 -23 -13 -39 -30 -58 -57 -48 -160 18 -198 25 -14 30 -23 30 -57 0 -34 -5 -44 -35 -68 -69 -55 -69 -149 1 -205 32 -26 34 -30 34 -89 l0 -63 45 0 45 0 0 65 c0 55 3 66 21 75 31 17 59 71 59 115 0 44 -28 98 -59 115 -32 16 -30 92 2 109 35 19 57 63 57 117 0 42 -4 51 -40 85 -68 65 -68 66 163 299 234 235 252 262 252 375 0 115 -57 204 -164 253 -46 21 -64 24 -131 20 -56 -3 -88 -11 -114 -26 -21 -12 -39 -22 -42 -22 -2 0 -4 20 -4 44 0 41 3 46 39 67 83 46 109 168 52 246 -16 22 -43 47 -60 54 -26 12 -31 19 -31 49 0 20 18 90 41 155 35 104 40 129 37 190 -4 81 -30 129 -95 173 -49 34 -150 42 -201 16z m226 -687 c61 -56 -23 -158 -93 -113 -47 31 -45 104 3 130 31 17 58 12 90 -17z m-210 -362 c44 -19 112 -82 112 -105 0 -9 -24 -48 -52 -88 l-53 -71 -118 -1 -118 0 -15 37 c-32 76 14 180 99 222 50 25 94 27 145 6z m474 -16 c69 -45 103 -123 85 -196 l-12 -48 -120 -3 -120 -3 -53 71 c-29 39 -52 80 -52 94 0 27 54 79 104 102 43 20 125 11 168 -17z m-285 -336 c-17 -24 -31 -43 -33 -43 -1 0 -16 19 -33 41 l-30 42 31 43 31 43 32 -42 32 -42 -30 -42z m-132 -77 c54 -72 56 -76 53 -130 l-3 -56 -130 130 -130 130 77 0 78 0 55 -74z m395 71 c0 -1 -56 -58 -125 -127 l-125 -125 0 56 c0 51 4 61 53 127 l52 71 73 1 c39 0 72 -1 72 -3z m-266 -570 c9 -15 7 -21 -9 -33 -10 -8 -24 -13 -29 -11 -17 6 -29 34 -23 51 9 22 46 17 61 -7z m0 -329 c8 -14 7 -21 -6 -34 -30 -30 -75 9 -48 42 16 18 39 15 54 -8z M1812 2669 c-77 -39 -121 -119 -122 -221 l0 -58 50 0 50 0 0 65 c0 60 3 68 34 103 30 32 40 37 79 37 59 0 98 -28 116 -85 13 -42 12 -47 -33 -184 -25 -78 -46 -159 -46 -181 0 -36 -4 -42 -39 -62 -109 -62 -103 -245 9 -295 27 -12 30 -17 30 -60 l0 -47 -52 24 c-73 34 -173 34 -243 1 -101 -48 -154 -135 -155 -251 0 -118 21 -149 251 -380 175 -177 199 -204 199 -232 0 -22 -6 -36 -21 -43 -29 -16 -59 -70 -59 -108 0 -41 21 -84 55 -110 20 -16 25 -29 25 -64 0 -37 -4 -47 -23 -55 -28 -13 -57 -69 -57 -108 0 -39 29 -95 57 -108 21 -9 23 -17 23 -79 l0 -68 50 0 50 0 0 68 c0 62 2 70 23 79 28 13 57 69 57 108 0 39 -29 95 -57 108 -19 8 -23 18 -23 55 0 35 5 48 25 64 34 26 55 69 55 110 0 38 -30 92 -59 108 -15 7 -21 21 -21 43 0 28 24 55 199 232 230 231 251 262 251 380 0 120 -66 219 -173 260 -65 25 -187 17 -239 -14 l-38 -23 0 49 c0 44 3 49 30 61 112 50 118 233 9 295 -35 20 -39 26 -39 61 0 22 18 96 41 165 35 107 40 135 36 184 -6 67 -36 120 -92 163 -51 38 -151 45 -213 13z m230 -678 c9 -9 20 -28 23 -43 6 -22 1 -33 -23 -58 -17 -16 -40 -30 -52 -30 -12 0 -35 14 -52 30 -24 25 -29 36 -23 58 17 67 80 89 127 43z m-204 -367 c53 -22 102 -72 102 -104 0 -17 -19 -52 -50 -94 l-51 -66 -119 0 -119 0 -12 39 c-21 69 -5 124 51 180 27 27 60 52 72 54 49 9 90 6 126 -9z m422 10 c19 -4 51 -26 80 -55 56 -56 71 -111 51 -180 l-12 -39 -119 0 -119 0 -51 66 c-60 80 -63 107 -17 152 55 53 113 70 187 56z m-235 -280 c30 -39 28 -50 -16 -103 l-19 -23 -19 23 c-44 53 -46 64 -16 103 15 20 31 36 35 36 4 0 20 -16 35 -36z m-135 -153 c49 -67 51 -72 48 -126 l-3 -55 -125 125 -125 125 77 0 76 0 52 -69z m280 -56 l-125 -125 -3 55 c-3 54 -1 59 48 126 l52 69 76 0 77 0 -125 -125z m-150 -444 c7 -15 6 -23 -6 -35 -8 -9 -19 -16 -24 -16 -5 0 -16 7 -24 16 -20 19 -5 54 24 54 11 0 24 -9 30 -19z m-1 -328 c12 -23 -4 -53 -29 -53 -25 0 -41 29 -29 52 12 23 45 23 58 1z"/> </g></svg>',
  pearl_necklace: '<svg viewBox="0 0 288 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M1373 2670 c-18 -11 -33 -23 -33 -27 0 -5 -4 -14 -9 -22 -8 -12 -15 -9 -41 12 -47 40 -117 38 -164 -3 -19 -17 -38 -44 -41 -60 -7 -30 -7 -30 -37 -14 -21 11 -46 15 -77 11 -60 -7 -111 -61 -111 -116 l0 -36 -49 3 c-94 7 -147 -48 -139 -140 l5 -48 -38 0 c-46 0 -93 -36 -108 -83 -11 -35 -2 -97 19 -122 10 -13 8 -15 -13 -15 -37 0 -95 -54 -103 -95 -8 -45 3 -88 30 -118 l22 -24 -28 -16 c-38 -22 -62 -80 -55 -132 4 -29 15 -49 42 -73 l35 -32 -21 -29 c-51 -70 -26 -167 51 -199 29 -12 38 -21 34 -32 -4 -8 -11 -31 -16 -51 -19 -71 43 -149 117 -149 30 0 30 0 30 -60 0 -54 3 -63 33 -92 29 -30 38 -33 92 -33 60 0 60 0 60 -30 0 -75 80 -137 150 -118 19 6 42 13 50 17 11 4 20 -5 32 -34 19 -45 68 -80 113 -80 l30 0 1 -73 c1 -90 24 -162 69 -214 24 -28 31 -43 24 -54 -5 -8 -9 -35 -9 -62 0 -40 5 -53 34 -85 32 -34 39 -37 89 -37 41 0 63 6 84 21 38 28 57 87 44 138 -9 35 -7 42 24 85 40 55 65 141 65 222 l0 56 42 6 c50 7 108 61 108 101 l0 23 40 -19 c53 -27 102 -18 147 27 26 26 33 41 33 73 l0 39 48 -5 c92 -8 147 45 140 139 l-3 49 36 0 c55 0 109 51 116 111 4 31 0 56 -10 76 -16 29 -16 29 18 42 84 30 114 135 58 201 -21 26 -24 33 -12 41 8 5 17 9 22 9 19 0 47 68 47 114 0 44 -4 53 -38 85 l-38 36 23 34 c27 40 30 98 8 141 -15 30 -61 60 -89 60 -13 0 -13 4 0 35 39 93 -15 185 -108 185 l-33 0 3 59 c4 56 2 60 -33 96 -36 35 -40 37 -96 33 l-59 -3 0 33 c0 47 -24 87 -64 106 -42 20 -76 20 -121 2 -31 -13 -35 -13 -35 0 0 28 -30 74 -60 89 -43 22 -101 19 -141 -8 l-34 -23 -36 38 c-32 34 -41 38 -85 38 -31 0 -61 -7 -81 -20z m97 -85 c18 -22 8 -50 -19 -50 -32 0 -49 28 -32 49 17 20 35 20 51 1z m-239 -31 c14 -13 16 -21 8 -35 -11 -22 -39 -25 -57 -7 -16 16 -15 23 4 42 19 20 23 20 45 0z m480 0 c17 -21 0 -49 -32 -49 -27 0 -37 28 -19 50 16 19 34 19 51 -1z m-306 -114 c40 -15 88 -5 125 26 l30 26 11 -24 c27 -59 108 -83 172 -50 l37 20 0 -24 c0 -14 15 -41 34 -62 32 -35 38 -37 93 -37 l58 1 2 -34 c3 -65 55 -114 122 -116 34 0 38 -3 30 -18 -33 -62 29 -168 99 -168 20 0 20 0 1 -37 -10 -21 -19 -49 -19 -63 0 -32 32 -84 64 -106 l26 -16 -24 -29 c-44 -52 -42 -132 4 -174 19 -17 19 -18 -13 -39 -20 -13 -38 -38 -46 -63 -15 -41 -14 -46 13 -132 0 -3 -13 -8 -31 -13 -58 -15 -98 -99 -76 -158 9 -25 8 -26 -22 -26 -55 0 -92 -22 -116 -70 -11 -25 -19 -53 -16 -63 4 -16 -1 -17 -43 -13 -31 3 -57 -1 -78 -12 -31 -16 -62 -61 -62 -91 0 -19 -9 -19 -34 0 -23 18 -88 20 -119 4 -12 -6 -31 -22 -42 -35 l-21 -24 -39 20 c-50 26 -105 25 -155 0 l-40 -20 -28 31 c-34 38 -102 50 -151 26 -30 -15 -30 -15 -41 18 -19 57 -53 80 -121 80 -55 0 -59 1 -59 23 0 36 -28 89 -57 107 -14 10 -42 18 -62 19 l-36 1 0 62 c0 51 -4 66 -24 87 -13 14 -39 30 -57 36 -31 11 -32 12 -18 38 30 59 12 131 -43 168 l-31 21 26 27 c37 36 39 119 3 166 -19 26 -21 34 -10 41 8 5 17 9 22 9 4 0 16 15 27 33 24 38 26 105 5 133 -19 25 -19 34 0 34 30 0 75 31 91 62 11 21 15 47 12 78 -4 42 -3 47 13 43 10 -3 38 4 62 16 49 24 83 81 75 125 -4 22 -3 24 13 16 29 -16 82 -11 117 10 30 18 41 35 55 82 5 15 9 15 51 0 41 -15 50 -15 88 -2 27 10 50 26 63 47 20 30 20 31 40 13 11 -10 33 -24 50 -30z m-385 -1 c0 -24 -27 -36 -48 -22 -23 14 -25 29 -7 47 21 20 55 5 55 -25z m920 1 c0 -25 -30 -41 -53 -29 -39 22 -4 79 35 58 10 -5 18 -18 18 -29z m-1122 -119 c8 -4 12 -19 10 -32 -4 -29 -45 -34 -61 -7 -19 30 19 60 51 39z m1306 -13 c8 -14 7 -21 -6 -34 -30 -30 -75 9 -48 42 16 18 39 15 54 -8z m-1440 -190 c8 -14 7 -21 -6 -34 -22 -22 -58 -10 -58 21 0 37 43 46 64 13z m1585 5 c12 -23 -4 -53 -29 -53 -25 0 -41 29 -29 52 12 23 45 23 58 1z m-1679 -224 c21 -39 -37 -71 -59 -32 -7 13 -5 23 6 35 21 24 40 23 53 -3z m1771 5 c17 -21 0 -49 -32 -49 -27 0 -37 28 -19 50 16 19 34 19 51 -1z m-1801 -243 c7 -15 6 -23 -6 -35 -8 -9 -19 -16 -24 -16 -5 0 -16 7 -24 16 -20 19 -5 54 24 54 11 0 24 -9 30 -19z m1831 3 c9 -11 10 -20 2 -32 -13 -22 -43 -22 -56 -1 -24 38 25 68 54 33z m-26 -266 c-9 -22 -35 -31 -51 -17 -19 16 -17 46 4 58 22 13 56 -17 47 -41z m-1775 26 c11 -13 10 -19 -8 -36 -17 -18 -23 -19 -36 -8 -16 13 -21 42 -9 53 11 12 40 7 53 -9z m89 -218 c14 -16 5 -42 -16 -50 -29 -11 -58 35 -36 57 11 12 40 8 52 -7z m1590 0 c23 -28 -17 -68 -45 -45 -15 12 -19 41 -7 52 11 12 40 8 52 -7z m-1441 -202 c2 -11 -3 -26 -11 -33 -29 -24 -70 17 -46 46 17 20 53 12 57 -13z m1298 4 c7 -22 -19 -52 -40 -45 -17 6 -29 34 -23 51 10 24 54 21 63 -6z m-1118 -130 c30 -30 -1 -73 -36 -51 -23 14 -25 29 -7 47 20 19 27 20 43 4z m922 -3 c18 -21 3 -55 -25 -55 -15 0 -26 7 -30 20 -7 23 10 50 30 50 7 0 18 -7 25 -15z m-697 -97 c14 -21 2 -48 -22 -48 -30 0 -43 31 -24 53 18 20 32 18 46 -5z m471 9 c28 -21 12 -59 -22 -55 -30 3 -41 30 -22 53 15 18 21 19 44 2z m-210 -47 c74 -66 93 -203 40 -299 -32 -59 -39 -67 -75 -76 -37 -9 -92 41 -113 102 -39 114 1 261 79 293 30 13 32 12 69 -20z m-14 -510 c0 -29 -35 -44 -54 -24 -9 8 -16 19 -16 24 0 5 7 16 16 24 19 20 54 5 54 -24z"/> </g></svg>',
  invitation: '<svg viewBox="0 0 278 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M287 2512 l-177 -177 0 -1118 0 -1117 1295 0 1295 0 0 1295 0 1295 -1118 0 -1117 0 -178 -178z m1073 -497 l0 -585 45 0 45 0 0 585 0 585 580 0 580 0 0 -1205 0 -1205 -580 0 -580 0 0 585 0 585 -45 0 -45 0 0 -585 0 -585 -580 0 -580 0 0 1040 0 1040 170 0 170 0 0 165 0 165 410 0 410 0 0 -585z m-920 425 l0 -80 -82 0 -83 0 80 80 c44 44 81 80 82 80 2 0 3 -36 3 -80z M1530 1400 l0 -1130 505 0 505 0 0 1130 0 1130 -505 0 -505 0 0 -1130z m910 -5 l0 -1035 -410 0 -410 0 0 1035 0 1035 410 0 410 0 0 -1035z M2055 2353 c-46 -13 -104 -64 -127 -112 -16 -34 -32 -53 -50 -60 -159 -58 -188 -274 -49 -375 39 -28 50 -31 120 -31 66 0 81 4 114 27 42 28 87 87 87 112 0 9 20 25 44 36 87 42 131 106 131 195 0 115 -82 204 -194 211 -31 1 -65 0 -76 -3z m99 -97 c79 -33 103 -130 47 -187 -30 -30 -51 -37 -51 -18 0 35 -88 121 -134 130 -17 4 -16 6 5 33 19 25 68 54 92 56 4 0 22 -6 41 -14z m-175 -273 c9 -7 31 -19 49 -28 28 -14 31 -19 21 -36 -14 -27 -68 -59 -100 -59 -32 0 -89 38 -107 70 -21 40 -8 101 28 133 l32 28 30 -48 c17 -26 38 -53 47 -60z M1690 1645 l0 -45 340 0 340 0 0 45 0 45 -340 0 -340 0 0 -45z M1690 1480 l0 -50 150 0 150 0 0 50 0 50 -150 0 -150 0 0 -50z M2070 1480 l0 -50 150 0 150 0 0 50 0 50 -150 0 -150 0 0 -50z M1690 1315 l0 -45 150 0 150 0 0 45 0 45 -150 0 -150 0 0 -45z M2070 1315 l0 -45 150 0 150 0 0 45 0 45 -150 0 -150 0 0 -45z M1690 1145 l0 -45 150 0 150 0 0 45 0 45 -150 0 -150 0 0 -45z M2070 1145 l0 -45 150 0 150 0 0 45 0 45 -150 0 -150 0 0 -45z M1690 980 l0 -50 340 0 340 0 0 50 0 50 -340 0 -340 0 0 -50z M1690 645 l0 -215 340 0 340 0 0 215 0 215 -340 0 -340 0 0 -215z m590 5 l0 -120 -245 0 -245 0 0 120 0 120 245 0 245 0 0 -120z M481 2179 c-52 -16 -134 -105 -150 -162 -18 -64 -9 -147 23 -200 13 -23 116 -133 228 -245 l203 -202 202 202 c231 232 253 264 253 368 0 156 -109 258 -265 248 -73 -5 -127 -29 -169 -77 l-19 -21 -26 23 c-56 51 -101 70 -175 73 -39 2 -86 -1 -105 -7z m147 -94 c20 -9 63 -41 94 -72 l57 -57 60 58 c92 87 141 102 218 65 77 -37 113 -129 78 -203 -8 -17 -92 -108 -185 -201 l-170 -170 -165 165 c-179 179 -212 225 -200 286 10 53 45 101 90 124 48 24 74 25 123 5z M280 1230 l0 -50 505 0 505 0 0 50 0 50 -505 0 -505 0 0 -50z M280 1065 l0 -45 505 0 505 0 0 45 0 45 -505 0 -505 0 0 -45z M280 810 l0 -130 130 0 130 0 0 130 0 130 -130 0 -130 0 0 -130z m160 5 c0 -33 -2 -35 -35 -35 -33 0 -35 2 -35 35 0 33 2 35 35 35 33 0 35 -2 35 -35z M610 895 l0 -45 340 0 340 0 0 45 0 45 -340 0 -340 0 0 -45z M610 730 l0 -50 340 0 340 0 0 50 0 50 -340 0 -340 0 0 -50z M280 565 l0 -45 505 0 505 0 0 45 0 45 -505 0 -505 0 0 -45z M280 395 l0 -45 505 0 505 0 0 45 0 45 -505 0 -505 0 0 -45z"/> </g></svg>',
  marriage_certificate: '<svg viewBox="0 0 278 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M320 1605 l0 -1085 624 -2 623 -3 -53 -179 c-30 -99 -54 -183 -54 -188 0 -4 52 18 115 49 l115 58 79 -79 79 -79 11 39 c5 21 24 96 42 167 44 179 54 176 104 -38 21 -91 41 -165 44 -165 3 0 41 35 83 77 l78 78 116 -58 c88 -44 114 -53 110 -40 -3 10 -32 108 -65 218 -33 110 -61 209 -63 220 -2 14 7 24 33 37 68 32 120 124 104 185 -4 16 2 34 17 56 19 26 23 45 23 107 0 62 -4 81 -23 107 -15 22 -21 40 -17 56 16 60 -38 157 -102 183 -20 9 -38 27 -49 49 -31 66 -118 114 -183 102 -15 -3 -36 2 -51 13 -14 9 -35 21 -47 24 l-23 7 0 585 0 584 -835 0 -835 0 0 -1085z m185 968 c-21 -34 -65 -72 -82 -73 -9 0 -13 16 -13 50 l0 50 56 0 56 0 -17 -27z m1204 -14 c17 -58 83 -125 142 -146 l49 -18 0 -435 0 -436 -35 -17 -35 -17 0 415 0 415 -38 0 c-90 0 -172 82 -172 172 l0 38 -465 0 -465 0 0 -41 c0 -89 -63 -158 -150 -167 l-50 -5 0 -712 0 -712 50 -5 c87 -9 150 -78 150 -167 l0 -41 404 0 c354 0 405 -2 417 -16 7 -8 29 -24 48 -34 36 -19 32 -19 -453 -17 l-489 2 -11 31 c-26 74 -103 147 -168 161 l-28 6 0 793 c0 708 2 794 15 794 26 0 89 36 122 70 31 32 45 55 63 103 l10 27 538 0 539 0 12 -41z m191 -9 c0 -27 -3 -50 -6 -50 -26 0 -94 68 -94 94 0 3 23 6 50 6 l50 0 0 -50z m-365 -142 c21 -71 108 -156 178 -173 l27 -7 -2 -376 -3 -375 -37 -13 c-33 -11 -38 -11 -38 2 0 12 -37 14 -235 14 l-235 0 0 -45 0 -45 210 0 210 0 -11 -24 c-6 -13 -22 -29 -36 -35 -16 -8 -164 -11 -468 -11 l-445 0 0 -45 0 -45 403 0 403 0 -2 -58 c-2 -39 -10 -71 -23 -93 -40 -66 -39 -138 2 -200 14 -22 21 -45 19 -66 l-3 -33 -332 0 -332 0 -19 47 c-25 59 -80 114 -139 139 l-47 19 0 620 0 620 47 19 c59 25 114 80 139 139 l19 47 372 0 372 0 6 -22z m476 -1007 c16 -16 29 -33 29 -38 0 -4 -42 -8 -94 -8 l-94 0 20 27 c40 57 93 64 139 19z m-196 -33 c14 -6 25 -14 25 -17 0 -3 -25 -17 -54 -29 -30 -13 -62 -32 -72 -43 -25 -27 -34 -24 -34 15 0 67 67 105 135 74z m379 -19 c17 -20 26 -43 26 -65 0 -32 2 -34 36 -34 26 0 43 -8 65 -29 33 -34 37 -67 12 -114 l-16 -32 -13 36 c-31 92 -121 187 -206 217 l-48 17 22 17 c13 10 39 18 60 18 28 0 42 -7 62 -31z m-134 -110 c181 -79 228 -311 92 -452 -100 -104 -239 -120 -358 -42 -169 110 -172 353 -6 467 85 58 178 67 272 27z m-390 3 c0 -5 -8 -16 -18 -25 -10 -10 -29 -41 -42 -70 -13 -28 -26 -54 -28 -57 -9 -12 -32 37 -32 70 0 39 13 61 45 78 24 13 75 16 75 4z m-95 -261 c0 -108 2 -105 -52 -57 -16 14 -23 31 -23 57 0 31 6 43 37 68 21 17 38 31 38 31 0 0 0 -45 0 -99z m796 60 c20 -20 29 -39 29 -61 0 -22 -9 -41 -29 -61 -16 -16 -33 -29 -38 -29 -4 0 -8 41 -8 90 0 50 4 90 8 90 5 0 22 -13 38 -29z m-36 -191 c23 -44 19 -78 -14 -111 -22 -21 -39 -29 -65 -29 -34 0 -36 -2 -36 -34 0 -50 -41 -96 -86 -96 -19 0 -46 8 -60 17 l-26 16 51 19 c86 32 186 139 206 221 9 34 11 34 30 -3z m-727 -34 c13 -30 32 -62 43 -72 26 -23 24 -34 -6 -34 -33 0 -81 25 -89 45 -14 38 0 115 22 115 4 0 18 -25 30 -54z m-1147 -129 c15 -12 34 -34 44 -49 l17 -28 -56 0 -56 0 0 50 c0 56 10 62 51 27z m1253 -6 c10 -11 42 -30 72 -43 29 -12 54 -26 54 -29 0 -11 -51 -29 -81 -29 -41 0 -79 42 -79 86 0 39 9 42 34 15z m326 -84 c0 -5 -13 -22 -29 -38 -45 -45 -99 -38 -139 18 l-20 28 94 0 c52 0 94 -4 94 -8z m-255 -114 c23 4 38 1 46 -9 11 -14 10 -26 -22 -148 l-10 -39 -45 44 -44 43 -45 -22 c-25 -12 -47 -22 -49 -22 -2 0 8 40 22 89 l26 88 44 -15 c24 -8 59 -12 77 -9z m476 -73 l27 -89 -50 25 -51 26 -43 -43 c-31 -30 -45 -38 -48 -28 -3 8 -14 49 -24 91 -23 89 -22 89 63 92 28 1 59 7 70 13 11 7 22 9 25 7 2 -3 16 -45 31 -94z M820 2230 l0 -130 335 0 335 0 0 130 0 130 -335 0 -335 0 0 -130z m580 0 l0 -40 -245 0 -245 0 0 40 0 40 245 0 245 0 0 -40z M650 1935 l0 -45 235 0 235 0 0 45 0 45 -235 0 -235 0 0 -45z M1190 1935 l0 -45 235 0 235 0 0 45 0 45 -235 0 -235 0 0 -45z M650 1775 l0 -45 505 0 505 0 0 45 0 45 -505 0 -505 0 0 -45z M650 1605 l0 -45 235 0 235 0 0 45 0 45 -235 0 -235 0 0 -45z M1190 1605 l0 -45 235 0 235 0 0 45 0 45 -235 0 -235 0 0 -45z M650 1435 l0 -45 235 0 235 0 0 45 0 45 -235 0 -235 0 0 -45z M1804 1135 c-43 -22 -64 -63 -64 -125 l0 -52 105 -106 104 -107 91 90 c103 101 120 127 120 182 0 82 -66 139 -149 129 -55 -7 -62 -7 -126 -1 -34 4 -60 0 -81 -10z m111 -106 l36 -32 35 34 c36 35 54 34 78 -4 9 -14 0 -28 -51 -79 l-63 -63 -60 60 c-64 63 -69 75 -44 99 21 22 28 20 69 -15z"/> </g></svg>',
  wedding_ring: '<svg viewBox="0 0 278 274" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,274.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M990 2585 l0 -65 45 0 45 0 0 65 0 65 -45 0 -45 0 0 -65z M790 2555 l-34 -35 44 -45 c24 -25 49 -45 55 -45 6 0 24 14 40 30 l29 31 -50 49 -50 50 -34 -35z M1187 2542 l-47 -48 35 -34 35 -34 48 47 47 47 -35 35 -36 35 -47 -48z M840 2382 c-60 -33 -93 -84 -98 -152 -5 -73 1 -100 33 -138 l25 -30 -33 -24 c-17 -13 -51 -36 -74 -52 -61 -41 -121 -138 -123 -198 0 -9 -10 -25 -23 -35 -39 -31 -116 -132 -146 -191 -61 -122 -76 -186 -76 -327 0 -109 4 -142 23 -205 73 -232 252 -411 482 -481 58 -18 100 -23 185 -23 l110 -1 27 -49 c102 -181 271 -308 478 -358 30 -7 104 -12 165 -12 126 1 218 26 339 90 94 50 219 176 269 271 68 129 82 190 82 348 0 158 -14 219 -82 348 -50 95 -175 221 -269 271 -121 64 -213 89 -340 90 l-111 1 -27 51 c-29 56 -141 194 -156 194 -6 0 -10 11 -10 24 0 62 -56 149 -128 197 -26 18 -57 41 -69 52 l-22 19 27 41 c23 34 27 51 27 106 0 56 -5 73 -29 108 -41 61 -98 86 -178 79 -77 -7 -95 -7 -178 -1 -52 5 -72 2 -100 -13z m161 -108 l28 -27 31 27 c17 14 43 29 57 32 38 10 91 -20 109 -61 21 -51 3 -83 -105 -190 l-91 -90 -86 85 c-47 47 -92 97 -100 112 -55 104 71 194 157 112z m-81 -333 c0 -3 -32 -14 -72 -23 -39 -10 -89 -26 -110 -37 -52 -26 -31 0 37 44 27 17 59 42 69 54 l19 21 29 -27 c15 -15 28 -29 28 -32z m306 28 c10 -12 35 -29 54 -39 19 -10 44 -27 54 -39 18 -20 17 -20 -40 3 -32 13 -78 27 -101 31 -24 4 -43 9 -43 13 0 8 42 52 50 52 4 0 15 -9 26 -21z m-3 -153 c136 -46 245 -129 323 -246 45 -66 45 -70 -2 -84 -18 -5 -27 2 -54 43 -17 28 -58 75 -91 105 -213 197 -548 189 -753 -18 -106 -108 -156 -230 -156 -383 0 -310 233 -543 543 -543 153 0 275 50 383 156 86 85 142 198 159 324 5 37 12 50 31 59 44 20 47 15 40 -50 -33 -321 -299 -564 -616 -563 -339 1 -613 275 -614 614 -1 301 214 553 524 613 66 13 206 0 283 -27z m-118 -140 c92 -21 171 -61 231 -118 50 -47 102 -115 93 -122 -2 -1 -20 -13 -39 -26 -189 -129 -301 -322 -317 -546 l-6 -84 -47 0 c-102 0 -223 54 -305 135 -116 117 -161 277 -118 429 50 178 189 303 373 336 64 11 68 11 135 -4z m820 -262 c104 -25 202 -81 286 -164 82 -82 123 -147 160 -255 34 -100 34 -260 0 -360 -37 -108 -78 -173 -160 -255 -156 -155 -372 -217 -571 -165 -148 38 -295 140 -372 259 -21 32 -38 62 -38 67 0 4 13 12 29 17 29 10 31 8 61 -37 187 -292 602 -336 848 -90 106 107 156 229 156 384 0 155 -50 277 -156 384 -213 213 -557 214 -768 3 -92 -92 -160 -233 -160 -332 0 -37 -10 -47 -64 -64 -43 -14 8 204 76 322 68 120 217 237 353 277 124 36 198 38 320 9z m-9 -170 c179 -52 317 -238 317 -429 -1 -271 -260 -493 -521 -445 -123 23 -252 110 -315 211 -16 26 -16 27 36 63 68 47 93 70 148 136 95 112 159 283 159 423 l0 70 61 -6 c33 -4 85 -14 115 -23z m-460 -160 c-18 -53 -66 -132 -97 -160 -22 -19 -22 -19 -15 6 20 67 111 217 125 204 2 -1 -4 -24 -13 -50z M530 2235 l0 -45 65 0 65 0 0 45 0 45 -65 0 -65 0 0 -45z M1400 2235 l0 -45 70 0 70 0 0 45 0 45 -70 0 -70 0 0 -45z"/> </g></svg>',
  anniversary: '<svg viewBox="0 0 308 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M846 2669 c-39 -31 -56 -71 -56 -134 l0 -55 -108 0 c-129 0 -174 -18 -226 -89 l-31 -43 -3 -999 -2 -999 343 0 343 0 37 -49 c202 -265 607 -265 805 0 l36 49 126 0 125 0 222 222 223 223 0 745 c0 514 -4 757 -11 785 -15 55 -44 92 -97 126 -44 28 -52 29 -159 29 l-113 0 0 61 c0 99 -45 149 -133 149 -79 0 -127 -58 -127 -155 l0 -55 -80 0 -80 0 0 68 c0 75 -13 103 -60 127 -58 30 -140 12 -174 -37 -11 -15 -16 -45 -16 -90 l0 -68 -80 0 -80 0 0 55 c0 97 -48 155 -127 155 -88 0 -133 -50 -133 -149 l0 -61 -80 0 -80 0 0 61 c0 69 -18 107 -60 133 -40 23 -111 21 -144 -5z m104 -88 c15 -28 13 -274 -2 -289 -18 -18 -46 -14 -58 7 -5 11 -10 73 -10 138 0 91 4 124 16 141 19 27 40 28 54 3z m414 -3 c12 -17 16 -50 16 -141 0 -65 -5 -127 -10 -138 -12 -21 -40 -25 -58 -7 -15 15 -17 261 -2 289 14 25 35 24 54 -3z m414 10 c8 -8 12 -56 12 -149 0 -112 -3 -139 -16 -150 -11 -9 -20 -10 -32 -2 -14 8 -17 32 -20 148 -3 136 3 165 32 165 7 0 17 -5 24 -12z m422 -7 c15 -28 13 -274 -2 -289 -18 -18 -46 -14 -58 7 -5 11 -10 73 -10 138 0 91 4 124 16 141 19 27 40 28 54 3z m-1410 -242 c0 -89 37 -140 112 -154 84 -16 148 48 148 148 l0 57 80 0 80 0 0 -57 c0 -100 64 -164 148 -148 75 14 112 65 112 154 l0 51 80 0 80 0 0 -64 c0 -54 4 -69 25 -95 53 -63 146 -63 199 0 22 26 26 40 26 95 l0 64 80 0 80 0 0 -51 c0 -89 37 -140 112 -154 84 -16 148 48 148 148 l0 57 96 0 c160 0 184 -27 184 -204 l0 -116 -225 0 -225 0 0 -45 0 -45 100 0 100 0 0 -560 0 -560 -80 0 -80 0 0 -85 0 -85 -63 0 -63 0 -13 53 c-30 119 -142 255 -257 311 -32 16 -61 30 -62 32 -2 1 37 60 87 130 50 70 91 132 91 139 0 6 -34 57 -76 113 l-76 102 -192 0 -192 0 -78 -105 c-43 -58 -76 -111 -73 -118 3 -6 46 -68 95 -136 l89 -124 -68 -33 c-121 -58 -211 -166 -255 -306 l-18 -58 -143 0 -143 0 0 645 0 645 645 0 645 0 0 45 0 45 -770 0 -770 0 0 114 c0 101 2 117 23 147 33 49 60 59 165 59 l92 0 0 -51z m-120 -1049 l0 -690 184 0 183 0 11 -62 c5 -35 13 -71 17 -80 7 -17 -10 -18 -274 -18 l-281 0 0 770 0 770 80 0 80 0 0 -690z m1910 130 l0 -560 -75 0 -75 0 0 560 0 560 75 0 75 0 0 -560z m-1003 33 l-27 -28 -27 28 -28 27 55 0 55 0 -28 -27z m-167 -28 l23 -25 -42 0 -42 0 18 25 c10 13 18 25 19 25 0 0 11 -11 24 -25z m320 -5 c10 -18 8 -20 -26 -20 -36 0 -37 0 -19 20 10 11 22 20 26 20 5 0 13 -9 19 -20z m-296 -132 c3 -13 15 -54 26 -92 11 -38 16 -65 12 -60 -11 11 -105 145 -116 162 -5 9 3 12 32 12 33 0 41 -4 46 -22z m123 -15 c-11 -34 -12 -35 -18 -12 -12 40 -10 49 10 49 17 0 18 -3 8 -37z m181 29 c-7 -17 -112 -162 -115 -159 -2 3 30 123 42 155 2 6 21 12 41 12 19 0 34 -4 32 -8z m-127 -292 c173 -32 308 -170 341 -348 21 -112 -28 -257 -118 -345 -83 -82 -225 -136 -319 -121 -182 28 -305 128 -360 293 -68 208 71 457 285 509 99 24 103 25 171 12z m899 -243 c0 -1 -56 -58 -125 -127 l-125 -125 0 128 0 127 125 0 c69 0 125 -1 125 -3z m-340 -247 l0 -80 -74 0 -73 0 13 52 c8 29 14 65 14 80 0 28 1 28 60 28 l60 0 0 -80z M830 1855 l0 -45 110 0 110 0 0 45 0 45 -110 0 -110 0 0 -45z M1130 1855 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M830 1685 l0 -45 110 0 110 0 0 45 0 45 -110 0 -110 0 0 -45z M1130 1685 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M2170 1145 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M2170 980 l0 -50 45 0 45 0 0 50 0 50 -45 0 -45 0 0 -50z M1415 916 c-220 -92 -275 -378 -106 -547 76 -77 145 -103 256 -97 128 7 227 70 285 184 22 43 25 62 25 149 0 87 -3 106 -25 149 -32 63 -94 124 -156 155 -75 38 -198 40 -279 7z m206 -81 c141 -48 207 -204 143 -333 -76 -152 -264 -186 -383 -70 -90 88 -102 203 -33 307 63 94 169 131 273 96z"/> </g></svg>',
  angel: '<svg viewBox="0 0 280 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M1224 2676 c-107 -25 -154 -61 -154 -118 0 -85 208 -143 428 -119 117 13 159 24 203 54 44 30 52 86 18 123 -45 48 -120 67 -284 70 -103 3 -169 -1 -211 -10z m366 -98 l45 -14 -40 -15 c-54 -19 -312 -19 -375 0 -42 13 -44 14 -21 23 79 29 303 33 391 6z M1313 2335 c-62 -31 -109 -95 -119 -162 -12 -84 0 -204 26 -251 13 -23 22 -44 19 -46 -2 -2 -67 34 -144 81 -77 47 -169 98 -205 115 -191 89 -418 10 -514 -180 -16 -32 -65 -234 -150 -623 -69 -316 -126 -579 -126 -583 0 -5 53 -7 118 -4 101 3 124 7 158 27 21 13 44 32 52 42 11 16 26 19 83 19 54 0 80 5 118 25 27 13 51 31 54 40 5 11 22 15 74 15 73 0 134 22 166 58 16 18 23 19 45 9 15 -6 31 -14 35 -17 4 -4 -51 -137 -124 -296 -72 -159 -138 -304 -145 -321 l-14 -33 58 -29 c51 -26 176 -68 257 -86 143 -32 402 -43 573 -24 178 19 399 81 460 128 l24 18 -145 318 c-80 175 -144 322 -141 326 2 4 18 10 34 14 22 5 37 1 62 -18 45 -33 91 -47 158 -47 45 0 61 -4 76 -21 36 -40 89 -59 162 -59 52 0 73 -4 83 -16 8 -9 32 -28 54 -42 36 -23 53 -26 158 -30 101 -4 117 -2 117 11 0 37 -243 1127 -262 1175 -25 63 -103 152 -164 188 -54 32 -134 54 -194 54 -90 0 -159 -27 -333 -131 -93 -56 -171 -98 -175 -95 -3 4 3 21 14 39 16 27 19 51 19 163 0 126 -1 132 -28 172 -63 95 -176 127 -274 77z m157 -94 c53 -37 75 -136 54 -240 -15 -72 -101 -118 -162 -87 -61 31 -72 58 -72 171 0 90 3 106 22 130 43 54 104 65 158 26z m-645 -243 c17 -6 95 -50 173 -97 l144 -85 -45 -14 -45 -14 -119 71 c-66 40 -136 74 -155 77 -33 6 -35 4 -42 -26 -10 -51 -8 -55 25 -67 17 -7 77 -39 133 -72 l102 -61 -8 -87 c-11 -126 -25 -194 -57 -272 -27 -66 -132 -244 -139 -236 -2 2 6 36 17 76 11 40 20 73 18 74 -18 10 -83 23 -88 17 -4 -4 -26 -77 -48 -162 -50 -188 -62 -215 -103 -240 -33 -20 -98 -28 -98 -12 0 5 29 132 65 283 35 150 61 277 57 281 -5 5 -26 9 -47 11 l-39 2 -71 -302 c-39 -166 -77 -309 -85 -318 -7 -9 -26 -23 -41 -31 -31 -16 -109 -19 -109 -5 0 40 224 1020 241 1054 68 136 230 205 364 155z m1383 -14 c59 -29 114 -81 144 -138 12 -23 66 -250 132 -550 l112 -511 -39 -3 c-53 -4 -87 11 -113 51 -14 20 -46 137 -90 325 l-68 294 -40 -7 c-23 -3 -44 -9 -47 -13 -3 -4 24 -133 61 -287 63 -268 65 -280 46 -283 -35 -6 -94 17 -114 46 -11 15 -41 106 -67 202 -26 96 -48 176 -49 177 -7 8 -86 -22 -86 -33 0 -8 9 -47 20 -86 23 -85 20 -82 -53 40 -91 151 -123 257 -129 421 l-3 84 95 58 c52 32 110 63 128 69 30 11 32 15 32 56 0 40 -2 44 -25 44 -33 0 -62 -14 -190 -91 l-110 -65 -38 16 c-28 13 -35 19 -25 27 18 14 226 137 265 157 82 41 164 41 251 0z m-718 -189 c0 -17 18 -26 108 -56 98 -32 108 -38 124 -69 12 -23 18 -58 18 -105 0 -130 51 -279 143 -422 l47 -72 -48 -28 c-43 -26 -122 -56 -122 -47 0 2 -13 50 -29 106 -36 123 -58 255 -67 401 l-7 107 -45 0 -45 0 6 -127 c13 -270 59 -443 204 -766 l84 -188 -18 -37 c-25 -51 -56 -65 -102 -45 -20 8 -41 17 -47 19 -6 3 -17 -9 -24 -26 -26 -62 -79 -77 -128 -35 -37 31 -46 31 -66 0 -34 -52 -99 -51 -141 2 l-21 25 -38 -26 c-21 -14 -49 -26 -62 -26 -21 0 -54 31 -79 75 -10 16 -13 16 -48 -2 -21 -12 -47 -18 -62 -15 -33 6 -65 47 -65 82 0 15 30 92 66 171 88 193 119 273 153 404 40 149 61 292 61 414 l0 101 -45 0 -45 0 0 -77 c0 -79 -31 -313 -49 -368 -5 -16 -19 -62 -30 -102 l-21 -72 -39 14 c-48 17 -121 57 -121 67 0 4 23 43 51 87 85 135 139 311 139 456 0 69 20 86 146 128 75 26 100 38 102 53 2 17 12 19 82 19 74 0 80 -2 80 -20z m-656 -832 c-19 -14 -82 -28 -90 -21 -2 3 1 20 7 39 6 19 13 40 15 47 3 9 17 3 45 -20 37 -29 39 -33 23 -45z m1220 50 c3 -16 8 -38 12 -50 5 -19 2 -23 -15 -23 -12 0 -38 7 -58 15 l-36 15 39 35 c21 19 42 34 45 35 4 0 9 -12 13 -27z m-110 -666 l25 -56 -80 -26 c-285 -90 -659 -92 -944 -6 -104 31 -103 31 -75 90 13 28 25 51 27 51 3 0 20 -12 38 -26 25 -19 51 -27 96 -31 43 -4 74 -14 98 -31 32 -21 44 -23 107 -20 48 3 80 1 95 -8 31 -17 117 -17 149 1 18 9 45 12 92 8 59 -5 72 -3 110 19 26 15 66 27 102 31 45 4 67 13 95 35 20 16 37 29 38 28 1 -1 14 -27 27 -59z"/> </g></svg>',
  cupid: '<svg viewBox="0 0 308 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M1295 2675 c-22 -8 -57 -17 -79 -20 -31 -5 -54 -22 -121 -88 -82 -82 -109 -128 -104 -179 1 -13 -6 -40 -15 -60 -9 -22 -16 -64 -16 -103 0 -46 -6 -78 -20 -105 -44 -85 -10 -170 75 -186 27 -5 51 -21 84 -55 l47 -48 -67 -57 c-37 -30 -70 -56 -73 -57 -2 -1 -45 31 -95 72 -75 62 -89 77 -81 92 19 34 12 114 -12 149 -39 57 -72 75 -137 75 -45 0 -66 -6 -97 -26 l-40 -26 -29 23 c-63 50 -170 41 -223 -20 -36 -41 -46 -82 -37 -144 6 -43 17 -57 148 -189 l141 -143 42 41 c39 38 45 41 61 28 10 -8 75 -64 144 -125 128 -113 175 -140 229 -132 28 4 29 3 50 -80 11 -47 40 -128 64 -181 43 -94 44 -99 55 -261 16 -217 26 -272 62 -330 37 -60 75 -91 196 -159 51 -29 96 -58 101 -64 5 -7 24 -49 42 -95 46 -116 94 -146 169 -107 35 17 46 45 66 160 34 201 22 229 -140 338 -86 58 -109 77 -100 85 2 3 126 -44 275 -104 l270 -108 0 -83 c0 -76 2 -86 25 -108 32 -33 94 -34 129 -2 25 21 128 246 141 307 8 35 -10 97 -36 125 -10 11 -117 69 -237 129 l-219 109 -6 81 c-5 91 -33 180 -74 240 -34 49 -131 122 -184 137 -28 9 -39 18 -39 31 0 17 5 19 33 13 30 -7 60 -20 212 -98 107 -54 247 -71 350 -43 124 34 199 86 229 158 13 31 23 39 58 48 24 5 76 26 116 46 91 45 123 88 130 172 4 45 11 64 34 91 37 43 48 71 48 129 0 92 -70 171 -158 180 -68 6 -114 -12 -159 -61 -20 -23 -44 -41 -51 -39 -8 2 -40 21 -71 42 -103 70 -197 100 -315 100 -95 0 -181 -21 -262 -64 l-62 -32 6 40 c2 23 11 53 18 68 18 35 18 97 0 145 -7 21 -19 60 -25 88 -10 42 -24 61 -95 131 -68 67 -91 84 -122 89 -22 3 -59 12 -84 20 -55 18 -112 18 -165 0z m128 -95 c17 -13 38 -19 66 -18 44 1 77 -19 92 -60 5 -12 19 -26 31 -31 41 -16 61 -46 56 -88 -4 -30 0 -44 19 -67 27 -32 25 -66 -5 -99 -11 -12 -15 -32 -13 -61 2 -37 -2 -47 -25 -65 -15 -11 -33 -21 -40 -21 -8 0 -20 -15 -27 -32 -18 -43 -35 -56 -77 -60 -26 -2 -36 -8 -38 -23 -3 -19 -9 -20 -70 -17 -47 3 -80 -1 -106 -12 -21 -9 -47 -16 -56 -16 -27 0 -81 49 -96 87 -13 31 -17 33 -64 33 -27 0 -52 4 -55 10 -3 5 3 27 15 49 14 28 20 60 20 106 0 77 18 118 60 140 38 20 76 19 126 -4 48 -22 80 -59 96 -112 9 -33 15 -39 39 -39 40 0 57 -33 29 -57 -14 -13 -20 -30 -20 -60 0 -39 2 -43 25 -43 36 0 93 55 101 97 11 56 -11 109 -56 139 -22 15 -42 34 -45 44 -10 31 -77 91 -130 116 -35 17 -68 24 -108 24 -60 0 -69 12 -21 30 13 5 28 20 33 32 15 41 48 61 92 60 28 -1 49 5 66 18 14 11 33 20 43 20 10 0 29 -9 43 -20z m749 -491 c54 -12 128 -47 209 -100 59 -39 136 -59 227 -59 l72 0 0 50 0 50 -42 1 -43 0 32 16 c27 14 36 14 63 3 32 -13 60 -54 60 -89 0 -55 -122 -129 -229 -138 -86 -8 -153 11 -296 82 -108 54 -142 66 -198 72 l-67 6 0 -45 0 -45 51 -7 c28 -4 77 -20 108 -35 166 -85 203 -101 243 -111 64 -14 198 -12 253 5 27 8 50 13 51 12 1 -1 -4 -17 -12 -35 -11 -26 -28 -40 -86 -67 -137 -65 -243 -57 -412 34 -101 54 -157 75 -228 86 l-48 7 0 -50 0 -50 53 -7 c28 -3 77 -19 107 -36 125 -66 204 -99 264 -110 58 -11 63 -14 53 -30 -18 -29 -115 -76 -184 -89 -81 -16 -165 -1 -259 47 -38 19 -91 46 -117 59 -27 14 -74 31 -105 38 l-57 13 -5 104 c-3 57 -9 110 -14 118 -12 18 171 201 245 245 98 58 206 77 311 55z m-1681 -125 c24 -24 48 -44 54 -44 6 0 27 16 46 36 49 52 83 68 112 53 64 -35 63 -109 -3 -109 -31 0 -85 -32 -99 -58 -6 -11 -13 -38 -17 -61 -12 -78 -25 -75 -134 34 -54 54 -101 106 -103 116 -11 40 42 93 83 82 9 -3 37 -25 61 -49z m976 -151 c67 -54 73 -76 73 -275 l0 -177 42 -12 c168 -45 248 -156 248 -344 l0 -95 233 -116 c241 -121 267 -136 267 -163 0 -9 -23 -72 -52 -141 l-53 -125 -3 95 -3 95 -287 114 c-305 121 -380 155 -452 204 -127 87 -230 218 -288 367 -20 51 -52 170 -52 196 0 6 61 57 135 113 74 56 135 105 135 109 0 4 -13 22 -28 40 l-27 33 -160 -120 c-113 -85 -168 -121 -188 -121 -19 0 -49 19 -105 67 -233 201 -243 213 -207 243 22 19 43 6 180 -109 66 -55 125 -101 130 -101 6 1 71 53 145 117 74 64 149 122 165 130 45 20 110 10 152 -24z m-69 -998 l71 -50 18 -74 17 -74 112 -74 c76 -51 116 -84 124 -103 9 -23 8 -50 -6 -134 -9 -58 -20 -106 -25 -106 -4 0 -24 43 -45 95 l-37 95 -111 62 c-190 107 -208 134 -226 328 -13 150 -14 146 14 113 13 -15 55 -51 94 -78z"/> </g></svg>',
  floral: '<svg viewBox="0 0 278 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M110 2535 c0 -187 16 -279 68 -387 l38 -78 -46 -45 -45 -46 65 -62 c36 -35 84 -72 107 -82 l40 -20 -28 -70 c-35 -84 -36 -119 -8 -182 39 -88 47 -98 85 -117 102 -50 138 -59 182 -46 18 5 32 8 32 7 0 -1 -7 -20 -15 -42 -8 -22 -14 -61 -15 -87 l0 -48 93 0 c50 0 109 5 130 11 40 11 85 -4 516 -164 l54 -20 -74 -23 c-41 -13 -102 -40 -137 -61 -71 -44 -182 -138 -182 -156 0 -7 117 -129 261 -272 l260 -260 62 66 c34 36 78 94 97 128 19 34 40 68 45 77 8 11 21 -47 49 -220 l39 -236 328 0 c183 0 329 4 329 9 0 5 -85 148 -189 317 -104 170 -188 310 -186 312 2 2 143 -83 315 -187 171 -105 313 -191 316 -191 2 0 4 148 4 329 l0 329 -27 6 c-16 3 -113 20 -218 37 -104 16 -197 33 -205 35 -9 3 15 22 62 50 78 45 198 147 198 168 0 6 -117 128 -260 271 l-259 259 -32 -29 c-81 -77 -160 -202 -193 -308 l-21 -67 -101 279 -102 279 19 54 c10 29 18 72 19 96 l0 42 -93 0 c-50 0 -106 -4 -123 -9 l-31 -9 19 36 c23 46 23 85 -1 131 -11 20 -22 48 -25 62 -8 35 -51 76 -89 85 -18 3 -41 13 -52 20 -25 18 -115 18 -140 1 -41 -28 -61 -26 -79 8 -10 18 -46 61 -82 96 l-64 63 -43 -42 -43 -42 -76 35 c-118 54 -179 65 -375 65 l-173 0 0 -155z m373 49 c88 -20 197 -71 190 -89 -5 -14 -58 -4 -77 15 -18 18 -98 11 -165 -16 -63 -24 -111 -64 -111 -92 0 -7 -9 -30 -20 -52 -27 -52 -26 -111 2 -160 18 -31 20 -42 10 -52 -16 -16 -34 8 -66 94 -32 86 -46 169 -46 281 l0 87 106 0 c61 0 135 -7 177 -16z m369 -81 c47 -49 61 -119 33 -157 -14 -18 -15 -15 -15 37 l0 57 -45 0 -45 0 0 -57 c-1 -53 -2 -56 -15 -39 -26 34 -19 98 15 144 17 23 34 42 38 42 5 0 20 -12 34 -27z m-288 -94 c11 -16 21 -20 38 -16 31 9 59 -19 52 -50 -5 -18 -1 -28 15 -39 27 -19 27 -50 1 -64 -14 -7 -20 -20 -18 -38 3 -38 -8 -52 -43 -52 -16 0 -38 -9 -49 -20 -25 -25 -35 -25 -57 -1 -10 11 -34 21 -53 23 -32 3 -35 6 -38 39 -2 21 -12 45 -23 54 -24 23 -24 42 1 57 13 9 20 24 20 45 0 37 13 48 52 45 18 -2 31 4 38 18 14 26 45 26 64 -1z m582 0 c12 -13 27 -19 42 -16 29 6 55 -19 48 -47 -4 -14 3 -30 21 -48 l25 -27 -26 -26 c-19 -18 -25 -33 -21 -46 9 -28 -12 -49 -49 -49 -20 0 -36 -7 -44 -20 -7 -11 -19 -20 -27 -20 -8 0 -20 9 -27 20 -8 13 -24 20 -44 20 -37 0 -58 21 -49 49 4 13 -2 28 -21 46 l-26 26 25 27 c18 18 25 34 21 48 -7 28 19 53 48 47 15 -3 30 3 42 16 11 12 24 21 31 21 7 0 20 -9 31 -21z m-294 -289 c8 -13 24 -20 44 -20 38 0 58 -21 49 -50 -5 -16 -1 -26 14 -36 12 -9 21 -24 21 -34 0 -10 -9 -25 -21 -34 -15 -10 -19 -20 -14 -36 9 -29 -11 -50 -49 -50 -20 0 -36 -7 -44 -20 -7 -11 -18 -20 -26 -20 -7 0 -21 9 -31 20 -11 12 -31 20 -51 20 -28 0 -35 5 -40 25 -4 14 -4 29 0 32 3 4 -6 19 -21 35 l-27 28 25 26 c13 14 23 35 21 45 -5 28 16 49 48 49 15 0 35 9 45 20 10 11 24 20 31 20 8 0 19 -9 26 -20z m616 -47 c-27 -65 -99 -116 -177 -129 -46 -7 -49 -2 -22 41 43 69 113 114 178 115 32 0 32 -1 21 -27z m-1014 -33 c7 -7 -8 -10 -42 -10 l-52 0 0 -50 0 -50 109 0 c106 0 109 -1 126 -26 16 -25 16 -25 -4 -15 -11 6 -62 11 -113 11 -100 0 -155 17 -192 59 -19 21 -19 21 0 42 43 49 136 71 168 39z m716 -47 c-17 -45 -20 -48 -56 -51 l-39 -3 0 41 0 40 40 0 c22 0 47 5 55 10 8 5 16 10 17 10 0 0 -7 -21 -17 -47z m410 -379 l102 -281 -27 -29 c-14 -15 -31 -48 -38 -71 -8 -33 -16 -43 -32 -43 -22 0 -84 -35 -100 -56 -8 -12 -59 4 -285 86 -151 55 -275 100 -277 100 -1 0 0 7 3 15 5 13 44 15 265 15 l259 0 0 273 c0 151 3 277 7 281 4 3 10 3 14 -1 4 -5 53 -134 109 -289z m-220 189 c0 -51 -1 -55 -13 -38 -20 29 -29 83 -14 89 24 9 27 5 27 -51z m-218 27 c8 -13 24 -20 44 -20 37 0 58 -21 49 -49 -4 -13 2 -28 21 -46 l26 -26 -25 -27 c-18 -18 -25 -34 -21 -48 7 -28 -19 -53 -48 -47 -15 3 -30 -3 -42 -16 -11 -12 -24 -21 -31 -21 -7 0 -20 9 -31 21 -12 13 -27 19 -42 16 -29 -6 -55 19 -48 47 4 14 -3 30 -21 48 l-25 27 26 26 c19 18 25 33 21 46 -9 28 12 49 49 49 20 0 36 7 44 20 7 11 19 20 27 20 8 0 20 -9 27 -20z m-575 -51 c8 -11 21 -15 39 -11 33 6 53 -17 47 -52 -4 -17 1 -27 16 -35 27 -15 27 -43 0 -67 -13 -12 -19 -27 -16 -42 6 -31 -18 -54 -49 -46 -19 5 -29 1 -40 -15 -19 -27 -49 -27 -68 0 -10 15 -20 19 -36 14 -29 -9 -50 11 -50 49 0 20 -7 36 -20 44 -11 7 -20 18 -20 26 0 7 9 21 20 31 11 10 20 30 20 45 0 33 23 54 50 47 14 -4 29 3 45 19 26 26 40 24 62 -7z m257 -49 l42 0 -4 -35 c-3 -23 3 -46 17 -70 12 -20 21 -40 21 -44 0 -5 -24 -11 -52 -14 -29 -4 -63 -9 -75 -13 l-22 -6 20 38 c24 48 24 70 0 118 -16 30 -17 37 -5 32 9 -3 35 -6 58 -6z m1364 -223 l193 -194 -45 -37 c-84 -68 -241 -125 -348 -126 -38 0 -38 0 -38 41 0 58 -26 106 -74 137 -23 14 -43 27 -45 29 -8 5 29 137 54 191 25 55 91 152 103 152 4 0 94 -87 200 -193z m-828 28 l0 -95 -97 0 c-86 0 -95 2 -78 14 11 7 34 17 52 20 38 9 81 50 89 85 6 27 25 71 31 71 2 0 3 -43 3 -95z m-479 -92 c-36 -71 -113 -123 -181 -123 -34 0 -35 2 -19 33 35 67 122 123 197 126 l22 1 -19 -37z m163 12 c19 -14 18 -15 -17 -15 -26 0 -37 4 -37 15 0 19 29 19 54 0z m794 -221 c21 -23 22 -34 22 -160 l0 -136 -134 4 c-126 3 -136 4 -160 27 -34 32 -34 74 0 106 22 20 37 25 80 25 l54 0 0 48 c1 54 17 89 51 108 30 16 58 9 87 -22z m442 -239 c151 -25 287 -48 303 -51 l27 -6 0 -205 c0 -119 -4 -203 -9 -201 -5 2 -153 91 -330 198 l-320 195 -1 63 0 64 28 -6 c15 -3 151 -26 302 -51z m-815 -54 c24 -47 76 -81 134 -88 l51 -6 0 -45 c0 -101 -61 -264 -129 -342 l-30 -35 -196 195 -195 195 32 27 c70 58 225 126 290 127 21 1 31 -6 43 -28z m601 -398 c103 -170 194 -318 202 -330 l14 -23 -208 0 -209 0 -56 330 -56 330 63 0 62 0 188 -307z M490 2275 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M1070 2275 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M780 1980 l0 -50 45 0 45 0 0 50 0 50 -45 0 -45 0 0 -50z M1070 1685 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M490 1645 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z"/> </g></svg>',
  honeymoon: '<svg viewBox="0 0 278 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M1172 2669 c-113 -56 -135 -210 -45 -310 l34 -38 -208 -3 c-207 -3 -208 -3 -256 -31 -56 -33 -67 -48 -133 -191 l-51 -111 -161 -5 c-154 -5 -162 -6 -187 -30 -58 -54 -71 -124 -34 -190 24 -42 58 -65 111 -75 l37 -7 -45 -54 c-49 -61 -67 -93 -97 -173 -19 -52 -21 -81 -25 -383 -4 -354 -2 -368 52 -403 21 -14 24 -25 28 -103 7 -145 40 -172 212 -172 176 0 216 32 216 173 l0 77 195 0 c187 0 195 -1 186 -18 -8 -16 -19 -18 -63 -14 -80 6 -111 -19 -175 -143 -66 -125 -77 -163 -64 -213 14 -50 51 -84 134 -123 76 -35 131 -37 180 -4 39 25 147 241 147 295 0 49 -20 91 -55 116 -25 19 -25 19 -9 62 l17 42 124 0 123 0 0 -34 0 -34 -60 -4 c-45 -3 -66 -10 -83 -26 -21 -22 -22 -30 -22 -208 l0 -186 28 -24 c27 -23 34 -24 177 -24 160 0 191 7 209 47 7 14 11 91 11 194 l0 171 -29 29 c-26 25 -37 29 -85 29 l-56 0 0 35 0 35 123 0 123 0 21 -44 21 -43 -24 -13 c-28 -15 -64 -84 -64 -122 0 -15 28 -82 63 -150 93 -183 136 -203 285 -128 90 45 113 73 120 140 3 39 -3 60 -56 165 -53 105 -66 123 -102 144 -31 17 -53 22 -93 19 -43 -2 -52 0 -55 15 -3 16 11 17 186 17 l189 0 5 -82 c7 -141 42 -168 212 -168 176 0 216 32 216 173 0 78 0 78 40 116 l40 38 0 319 c0 345 -5 385 -56 491 -14 28 -45 75 -70 102 -43 47 -44 51 -22 51 41 1 107 37 128 72 27 45 27 120 -1 165 -35 56 -60 63 -227 63 l-149 0 -57 124 c-96 205 -117 216 -403 216 l-197 0 36 38 c45 46 58 78 58 145 0 69 -25 114 -84 155 -40 26 -58 32 -103 32 -52 0 -123 -26 -138 -51 -5 -7 -14 -4 -29 10 -49 46 -143 55 -214 20z m131 -80 c12 -6 41 -30 65 -52 l42 -41 50 49 c44 43 56 50 91 50 34 0 46 -6 70 -33 56 -62 40 -98 -105 -242 l-106 -105 -115 115 c-63 62 -119 126 -126 142 -15 37 4 84 45 109 36 22 58 24 89 8z m-9 -398 l38 -39 -233 -5 c-243 -4 -321 -16 -406 -61 l-33 -16 10 25 c28 75 59 110 106 125 16 4 130 9 254 9 l226 1 38 -39z m737 29 c40 -11 77 -48 102 -102 17 -40 11 -46 -25 -27 -11 6 -50 20 -87 31 -55 17 -104 21 -304 25 l-239 5 38 39 38 39 221 0 c121 0 236 -5 256 -10z m-44 -187 c39 -11 108 -40 153 -64 81 -43 82 -45 115 -116 l34 -73 -880 0 c-483 0 -879 2 -879 5 0 3 14 36 31 75 l31 69 92 45 c84 41 164 68 241 79 17 3 246 4 510 3 451 -2 484 -4 552 -23z m-1542 -195 l-24 -53 -78 -3 c-96 -4 -121 2 -132 31 -9 22 2 55 23 69 6 4 61 8 123 8 l112 0 -24 -52z m2145 32 c24 -24 25 -47 3 -72 -13 -15 -32 -18 -108 -18 l-93 0 -17 43 c-9 23 -19 48 -22 55 -4 9 21 12 106 12 98 0 113 -2 131 -20z m-2060 -245 l0 -54 -37 -7 c-49 -9 -119 -79 -128 -128 -20 -104 54 -206 148 -206 30 0 39 -5 58 -37 36 -61 80 -103 144 -136 l60 -32 203 -3 c111 -2 202 -5 202 -7 0 -3 -8 -20 -17 -39 l-16 -35 -366 -3 -366 -3 -38 -27 c-50 -34 -88 -90 -94 -139 -6 -45 -30 -52 -64 -18 -20 20 -21 27 -17 317 4 272 6 302 26 354 49 134 176 258 265 258 l37 0 0 -55z m1660 0 l0 -55 -110 0 c-74 0 -122 -5 -145 -14 -35 -15 -75 -67 -75 -98 0 -16 -12 -18 -120 -18 l-120 0 0 35 c0 99 -107 167 -189 121 -20 -11 -28 -11 -50 0 -33 18 -73 18 -116 0 -44 -19 -68 -57 -69 -112 l-1 -44 -122 0 c-123 0 -123 0 -123 24 0 13 -9 35 -21 50 -37 47 -68 56 -194 56 l-115 0 0 55 0 55 785 0 785 0 0 -55z m208 31 c98 -62 181 -182 202 -295 5 -29 10 -177 10 -327 0 -271 0 -273 -22 -288 -35 -24 -45 -20 -56 27 -16 61 -63 121 -114 146 -43 20 -58 21 -399 21 l-354 0 -16 39 -17 39 207 4 c205 4 206 4 256 32 63 36 120 90 147 139 19 31 27 37 56 37 120 0 192 145 127 256 -23 39 -89 84 -123 84 -8 0 -12 19 -12 55 l0 55 35 0 c20 0 52 -10 73 -24z m-1054 -152 c21 -20 21 -64 0 -64 -47 0 -72 48 -36 69 9 6 18 11 19 11 1 0 9 -7 17 -16z m171 -4 c17 -19 17 -21 0 -40 -25 -28 -65 -27 -65 2 0 21 26 58 40 58 4 0 15 -9 25 -20z m-674 -38 c32 -27 20 -46 -53 -83 -81 -41 -148 -59 -224 -59 -50 0 -64 4 -81 23 -29 32 -34 54 -20 84 19 43 57 52 213 53 123 0 145 -2 165 -18z m1464 4 c59 -25 70 -82 23 -126 -54 -50 -292 1 -361 78 -18 20 -18 21 2 41 19 19 33 21 161 21 99 0 151 -4 175 -14z m-977 -124 c-1 -5 -25 -59 -53 -121 l-50 -112 -210 3 c-234 3 -253 8 -323 81 l-34 35 58 17 c60 17 154 61 189 89 17 13 55 15 223 16 112 0 202 -4 200 -8z m596 -17 c38 -29 127 -69 176 -80 53 -11 54 -15 18 -52 -69 -73 -89 -78 -321 -81 l-207 -3 -31 68 c-17 37 -42 92 -54 121 l-24 52 205 0 c203 0 206 0 238 -25z m-564 -185 c0 -19 -5 -30 -14 -30 -12 0 -12 5 -3 30 6 17 13 30 14 30 2 0 3 -13 3 -30z m120 -22 c0 -5 -7 -8 -15 -8 -10 0 -15 10 -15 33 l1 32 14 -25 c8 -14 14 -28 15 -32z m-120 -138 l0 -40 -55 0 -55 0 20 40 c18 35 25 40 55 40 34 0 35 -1 35 -40z m170 36 c0 -2 7 -20 15 -40 l15 -36 -55 0 -55 0 0 40 0 40 40 0 c22 0 40 -2 40 -4z m-430 -171 c0 -2 -11 -29 -24 -60 l-25 -55 -340 0 c-232 0 -341 3 -341 10 0 25 33 72 63 90 30 19 52 20 350 20 174 0 317 -2 317 -5z m260 -55 l0 -60 -100 0 c-55 0 -100 2 -100 4 0 2 12 29 26 60 l25 56 75 0 74 0 0 -60z m265 10 c14 -27 25 -54 25 -60 0 -6 -38 -10 -100 -10 l-100 0 0 60 0 60 75 0 75 0 25 -50z m781 8 c19 -21 34 -47 34 -58 0 -20 -6 -20 -338 -20 l-338 0 -27 55 c-15 31 -27 58 -27 61 0 2 149 3 331 2 l331 -3 34 -37z m-1876 -228 c0 -65 -21 -100 -60 -100 -17 0 -20 7 -20 45 l0 45 -45 0 -45 0 0 -45 c0 -48 -11 -56 -51 -35 -16 9 -19 22 -19 80 l0 70 120 0 120 0 0 -60z m2000 0 c0 -65 -21 -100 -60 -100 -17 0 -20 7 -20 45 l0 45 -45 0 -45 0 0 -45 c0 -48 -11 -56 -51 -35 -16 9 -19 22 -19 80 l0 70 120 0 120 0 0 -60z m-1521 -100 c46 -23 62 -47 54 -78 -3 -12 -7 -22 -9 -22 -3 0 -46 21 -96 46 l-92 46 27 24 c30 25 38 24 116 -16z m922 8 c6 -11 9 -21 7 -23 -17 -15 -171 -84 -178 -80 -6 4 -10 19 -10 35 0 27 7 33 67 63 70 36 97 37 114 5z m-401 -48 l0 -40 -120 0 -120 0 0 40 0 40 120 0 120 0 0 -40z m-610 -105 l90 -45 -20 -41 c-29 -56 -53 -62 -115 -32 -63 32 -85 51 -85 74 0 17 30 89 37 89 2 0 44 -20 93 -45z m1088 0 c29 -60 19 -78 -60 -115 -47 -22 -65 -27 -80 -19 -20 11 -58 66 -58 84 0 9 152 92 171 94 3 1 15 -19 27 -44z m-478 -85 l0 -60 -120 0 -120 0 0 60 0 60 120 0 120 0 0 -60z"/> </g></svg>',
  tuxedo: '<svg viewBox="0 0 278 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M900 2581 l0 -109 -217 -73 c-120 -39 -234 -80 -253 -90 -50 -25 -95 -75 -124 -139 l-26 -55 0 -777 0 -778 190 0 c105 0 190 -1 190 -3 0 -2 -11 -37 -25 -77 -30 -88 -31 -134 -5 -177 24 -41 21 -39 256 -125 182 -67 205 -73 274 -73 89 1 146 23 207 81 l40 39 39 -38 c59 -58 115 -80 204 -81 69 -1 91 5 280 73 243 89 270 108 270 188 0 27 -11 82 -24 121 l-25 72 195 0 194 0 -2 778 -3 777 -23 50 c-26 56 -70 106 -122 140 -19 12 -135 55 -257 96 l-223 74 0 107 0 108 -55 0 c-45 0 -88 -13 -243 -76 -103 -41 -196 -75 -207 -75 -11 0 -104 34 -207 75 -155 63 -198 76 -243 76 l-55 0 0 -109z m293 -68 l167 -67 0 -44 0 -44 -47 28 c-89 52 -103 57 -156 51 -37 -3 -68 1 -109 16 l-58 21 0 59 c0 52 2 58 18 53 9 -4 92 -37 185 -73z m627 18 l0 -58 -57 -21 c-42 -15 -72 -19 -110 -15 -47 5 -58 2 -120 -33 -37 -22 -71 -40 -75 -42 -5 -2 -8 16 -8 40 l0 44 178 72 c97 39 180 71 185 71 4 1 7 -25 7 -58z m-831 -448 l82 -288 140 -219 c119 -187 138 -221 126 -233 -11 -12 -34 5 -155 113 l-142 127 0 107 0 107 -67 45 -67 44 -57 226 -56 225 46 16 c25 8 51 16 57 16 7 1 47 -124 93 -286z m789 185 c-16 -57 -31 -107 -33 -113 -2 -5 -4 34 -4 87 l-1 98 33 14 c17 8 33 15 33 15 1 1 -11 -45 -28 -101z m201 81 c23 -7 40 -17 38 -23 -2 -6 -28 -108 -57 -227 l-54 -215 -63 -42 -63 -42 0 -105 0 -104 -181 -152 c-176 -147 -180 -150 -147 -98 19 30 91 142 160 249 l126 195 82 285 c46 157 85 289 87 293 3 5 11 6 18 3 7 -2 32 -10 54 -17z m-928 1 c17 -9 19 -22 18 -103 l0 -92 -24 80 c-41 137 -41 140 6 115z m210 -47 c43 -26 79 -50 79 -53 -1 -10 -156 -96 -168 -92 -21 7 -16 192 6 192 2 0 39 -21 83 -47z m387 -43 c2 -46 0 -90 -3 -98 -5 -14 -29 -3 -139 66 l-38 24 78 48 c44 27 84 47 89 46 6 -2 11 -40 13 -86z m-883 -198 l59 -239 58 -38 58 -37 0 -103 0 -102 170 -153 170 -153 0 -286 c0 -302 9 -395 49 -525 28 -90 27 -105 -10 -149 -41 -50 -102 -81 -159 -80 -48 0 -422 131 -448 156 -11 12 -6 36 32 153 144 443 161 766 61 1164 -19 74 -73 238 -119 364 -47 127 -83 232 -80 235 8 9 67 29 84 30 12 1 29 -54 75 -237z m1421 218 c32 -12 37 12 -65 -265 -95 -255 -143 -437 -165 -622 -19 -161 -20 -222 -2 -383 18 -158 54 -316 114 -497 46 -142 46 -143 27 -161 -11 -11 -105 -50 -210 -87 -218 -79 -257 -84 -330 -41 -60 36 -89 81 -126 201 -46 149 -59 252 -58 490 l0 210 249 205 249 205 1 105 0 105 59 38 59 38 57 232 c32 128 60 236 63 240 4 9 32 4 78 -13z m-1627 -179 l51 -138 0 -572 0 -571 -120 0 -120 0 0 623 c0 419 4 635 11 662 10 38 95 135 118 135 5 0 32 -62 60 -139z m1798 110 c22 -16 50 -49 62 -73 21 -44 21 -52 21 -681 l0 -637 -120 0 -120 0 0 566 0 566 53 144 c28 79 55 144 58 144 3 0 24 -13 46 -29z m-886 -77 l59 -35 0 -229 0 -229 -62 -96 -61 -96 -59 91 -58 91 0 237 0 237 53 32 c28 17 56 32 61 32 4 1 35 -15 67 -35z m-305 -74 l24 0 0 -137 -1 -138 -18 35 c-10 19 -33 87 -51 150 -18 63 -35 122 -38 130 -3 8 9 3 27 -12 18 -16 43 -28 57 -28z m528 -86 c-34 -121 -58 -184 -69 -184 -3 0 -5 61 -5 135 0 129 1 135 20 135 28 0 80 28 80 42 0 6 2 9 5 6 3 -3 -11 -64 -31 -134z m-927 -625 c16 -147 16 -163 -1 -310 -9 -84 -28 -197 -41 -249 l-23 -95 0 495 0 495 23 -90 c13 -49 32 -160 42 -246z m1342 -161 l-1 -483 -19 80 c-46 191 -61 424 -39 606 10 80 50 279 57 279 2 0 3 -217 2 -482z m-1499 -498 l0 -40 -120 0 -120 0 0 40 0 40 120 0 120 0 0 -40z m1830 0 l0 -40 -120 0 -120 0 0 40 0 40 120 0 120 0 0 -40z M1490 980 l0 -50 45 0 45 0 0 50 0 50 -45 0 -45 0 0 -50z M1490 685 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z M1360 1980 l0 -50 45 0 45 0 0 50 0 50 -45 0 -45 0 0 -50z M1360 1685 l0 -45 45 0 45 0 0 45 0 45 -45 0 -45 0 0 -45z"/> </g></svg>'
};

const NOMBRES_ICONOS_ITINERARIO = {
  church: 'Iglesia',
  ceremony: 'Ceremonia',
  bride: 'Novia',
  groom: 'Novio',
  priest: 'Sacerdote',
  wedding_dress: 'Vestido de novia',
  bell: 'Campanas',
  bow: 'Flecha de Cupido',
  hotel: 'Recepción / Salón',
  celebration: 'Celebración',
  party: 'Fiesta',
  balloon: 'Globos',
  champagne: 'Brindis',
  wedding_cake: 'Pastel',
  congratulation: 'Felicitaciones',
  caring: 'Los novios',
  gift: 'Regalo',
  heart: 'Corazones',
  diamond: 'Anillo',
  earing: 'Aretes',
  pearl_necklace: 'Collar de perlas',
  invitation: 'Invitación',
  marriage_certificate: 'Acta de matrimonio',
  wedding_ring: 'Argollas',
  anniversary: 'Aniversario',
  angel: 'Ángel',
  cupid: 'Cupido',
  floral: 'Flores',
  honeymoon: 'Luna de miel',
  tuxedo: 'Traje del novio'
};

const GRUPOS_ICONOS_ITINERARIO = [
  { grupo: 'Ceremonia', items: ['church', 'ceremony', 'bride', 'groom', 'priest', 'wedding_dress', 'bell', 'bow'] },
  { grupo: 'Recepción y fiesta', items: ['hotel', 'celebration', 'party', 'balloon', 'champagne', 'wedding_cake', 'congratulation', 'caring'] },
  { grupo: 'Detalles y regalos', items: ['gift', 'heart', 'diamond', 'earing', 'pearl_necklace', 'invitation', 'marriage_certificate', 'wedding_ring'] },
  { grupo: 'Otros momentos', items: ['anniversary', 'angel', 'cupid', 'floral', 'honeymoon', 'tuxedo'] }
];

let PICKER_ICONO_INDEX = null;

// ---------------- TIMELINE (repetidor) ----------------
function pintarTimeline(){
  document.getElementById('lista-timeline').innerHTML = timelineItems.map((t, i) => `
    <div class="repetidor-item">
      <button class="quitar" onclick="quitarTimeline(${i})">✕</button>
      <div class="form-grid">
        <div class="campo"><label>Hora</label><input type="text" value="${t.hora || ''}" oninput="timelineItems[${i}].hora=this.value" placeholder="6:00 PM"></div>
        <div class="campo"><label>Momento</label><input type="text" value="${t.titulo || ''}" oninput="timelineItems[${i}].titulo=this.value"></div>
      </div>
      <div class="campo">
        <label>Ícono (opcional)</label>
        <button type="button" class="selector-icono" onclick="abrirPickerIcono(${i})">
          ${t.icono && ICONOS_ITINERARIO[t.icono] ? `<span class="selector-icono-svg">${ICONOS_ITINERARIO[t.icono]}</span><span>${NOMBRES_ICONOS_ITINERARIO[t.icono]}</span>` : `<span class="selector-icono-vacio">Elegir ícono</span>`}
          <span class="selector-icono-cambiar">Cambiar</span>
        </button>
      </div>
    </div>`).join('');
}
function agregarTimeline(){ timelineItems.push({ hora: '', titulo: '', icono: '' }); pintarTimeline(); }
function quitarTimeline(i){ timelineItems.splice(i, 1); pintarTimeline(); }
async function guardarTimeline(){
  await rpc('portal_guardar_timeline', { p_codigo: CODIGO, p_items: timelineItems });
  mostrarOk('ok-timeline');
}

// ---------------- SELECTOR VISUAL DE ÍCONOS (modal, agrupado por momento) ----------------
function abrirPickerIcono(i){
  PICKER_ICONO_INDEX = i;
  const actual = timelineItems[i].icono || '';
  document.getElementById('picker-icono-grupos').innerHTML = GRUPOS_ICONOS_ITINERARIO.map(g => `
    <div class="picker-icono-grupo">
      <h4>${g.grupo}</h4>
      <div class="picker-icono-grid">
        ${g.items.map(valor => `
          <button type="button" class="picker-icono-op ${valor === actual ? 'activo' : ''}" onclick="elegirIconoTimeline('${valor}')">
            <span class="picker-icono-svg">${ICONOS_ITINERARIO[valor]}</span>
            <span class="picker-icono-nombre">${NOMBRES_ICONOS_ITINERARIO[valor]}</span>
          </button>`).join('')}
      </div>
    </div>`).join('');
  document.getElementById('modal-icono').classList.remove('oculto');
}
function elegirIconoTimeline(valor){
  if (PICKER_ICONO_INDEX === null) return;
  timelineItems[PICKER_ICONO_INDEX].icono = valor;
  cerrarPickerIcono();
  pintarTimeline();
}
function quitarIconoTimeline(){
  if (PICKER_ICONO_INDEX === null) return;
  timelineItems[PICKER_ICONO_INDEX].icono = '';
  cerrarPickerIcono();
  pintarTimeline();
}
function cerrarPickerIcono(){
  document.getElementById('modal-icono').classList.add('oculto');
  PICKER_ICONO_INDEX = null;
}

// ---------------- DETALLES IMPORTANTES (repetidor) ----------------
function pintarDetalles(){
  document.getElementById('lista-detalles').innerHTML = detallesItems.map((d, i) => `
    <div class="repetidor-item">
      <button class="quitar" onclick="quitarDetalle(${i})">✕</button>
      <div class="form-grid">
        <div class="campo"><label>Ícono</label>
          <select class="select-campo" onchange="detallesItems[${i}].icono=this.value">
            <option value="reloj" ${d.icono==='reloj'?'selected':''}>Reloj</option>
            <option value="adultos" ${d.icono==='adultos'?'selected':''}>Solo adultos</option>
            <option value="regalo" ${d.icono==='regalo'?'selected':''}>Regalo</option>
            <option value="general" ${d.icono==='general'?'selected':''}>General</option>
          </select>
        </div>
        <div class="campo"><label>Título</label><input type="text" value="${d.titulo || ''}" oninput="detallesItems[${i}].titulo=this.value"></div>
      </div>
      <div class="campo"><label>Texto</label><textarea oninput="detallesItems[${i}].texto=this.value">${d.texto || ''}</textarea></div>
    </div>`).join('');
}
function agregarDetalle(){ detallesItems.push({ icono: 'general', titulo: '', texto: '' }); pintarDetalles(); }
function quitarDetalle(i){ detallesItems.splice(i, 1); pintarDetalles(); }
async function guardarDetalles(){
  await rpc('portal_guardar_detalles', { p_codigo: CODIGO, p_items: detallesItems });
  mostrarOk('ok-detalles');
}

// ---------------- MENSAJES (repetidor) ----------------
function pintarMensajes(){
  document.getElementById('lista-mensajes').innerHTML = mensajesItems.map((m, i) => `
    <div class="repetidor-item">
      <button class="quitar" onclick="quitarMensaje(${i})">✕</button>
      <div class="campo"><label>Texto</label><textarea oninput="mensajesItems[${i}].texto=this.value">${m.texto || ''}</textarea></div>
      <div class="campo"><label>Referencia (opcional)</label><input type="text" value="${m.referencia || ''}" oninput="mensajesItems[${i}].referencia=this.value" placeholder="1 Corintios 13:4"></div>
    </div>`).join('');
}
function agregarMensaje(){ mensajesItems.push({ texto: '', referencia: '' }); pintarMensajes(); }
function quitarMensaje(i){ mensajesItems.splice(i, 1); pintarMensajes(); }
async function guardarMensajes(){
  await rpc('portal_guardar_mensajes', { p_codigo: CODIGO, p_items: mensajesItems });
  mostrarOk('ok-mensajes');
}

// ---------------- FINALIZAR ----------------
async function marcarCompleto(){
  await rpc('portal_marcar_completo', { p_codigo: CODIGO });
  mostrarOk('ok-completo');
}
