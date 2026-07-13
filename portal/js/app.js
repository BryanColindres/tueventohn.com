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
    renderGaleriaPortal(extras.galeria || []);
  }

  historiaItems = datos.historia || [];
  timelineItems = datos.timeline || [];
  mensajesItems = datos.mensajes || [];
  detallesItems = datos.detallesImportantes || [];
  pintarHistoria();
  pintarTimeline();
  pintarMensajes();
  pintarDetalles();

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

  aplicarBloqueosPorModulo(datos.modulosActivos || {});
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
  regalos: 'Regalos',
  firmas: 'Fotos adicionales'
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
    'tarjeta-fotos-decorativas': 'firmas'
  };

  Object.entries(mapaTarjetas).forEach(([idTarjeta, slugModulo]) => {
    if (modulosActivos[slugModulo] === true) return; // sí lo compró, se queda normal

    const tarjeta = document.getElementById(idTarjeta);
    if (!tarjeta) return;
    const titulo = tarjeta.querySelector('h2').outerHTML;
    const nombreBonito = NOMBRES_MODULOS[slugModulo];

    tarjeta.classList.add('tarjeta-bloqueada');
    tarjeta.innerHTML = `
      ${titulo}
      <div class="bloqueo-mensaje">
        <p>Este módulo no está incluido en tu paquete actual. Es una excelente forma de hacer tu invitación aún más especial — escríbenos y te decimos cómo agregarlo.</p>
        <a href="https://wa.me/50431626792?text=${encodeURIComponent('Hola, quiero agregar el módulo de ' + nombreBonito + ' a mi invitación')}" target="_blank" class="btn btn-dorado btn-chico">Quiero agregarlo</a>
      </div>
    `;
  });
}

// ---------------- BARRA DE PROGRESO (cuenta cuántas tarjetas ya tienen algo) ----------------
function actualizarProgreso(){
  const tarjetas = [...document.querySelectorAll('.tarjeta:not(.tarjeta-final)')];
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
  setTimeout(() => el.classList.add('oculto'), 4000);

  const tarjeta = el.closest('.tarjeta');
  if (tarjeta) {
    tarjeta.classList.remove('tarjeta-sin-guardar');
    const aviso = tarjeta.querySelector('.aviso-sin-guardar');
    if (aviso) aviso.remove();
  }
  actualizarProgreso();
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
function refrescarPreview(idCampo, tipo){
  const cont = document.getElementById(`preview-${idCampo}`);
  if (!cont) return;
  const url = valor(idCampo);
  if (!url) { cont.classList.add('oculto'); cont.innerHTML = ''; return; }
  cont.classList.remove('oculto');
  if (tipo === 'image') {
    cont.innerHTML = `<img src="${url}" alt="" class="preview-img"><span class="preview-label">✓ Ya subiste esto</span>`;
  } else if (tipo === 'audio') {
    cont.innerHTML = `<audio controls src="${url}" class="preview-audio"></audio><span class="preview-label">✓ Ya subiste esto</span>`;
  } else if (tipo === 'video') {
    cont.innerHTML = `<video controls src="${url}" class="preview-video"></video><span class="preview-label">✓ Ya subiste esto</span>`;
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
    refrescarPreview(idDestino, esVideo ? 'video' : 'image');
  }
}

async function subirAudioSimple(e, idDestino){
  const archivo = e.target.files[0];
  if (!archivo) return;
  const url = await subirArchivoCloudinary(archivo, 'video'); // Cloudinary sube audio bajo el recurso "video"
  if (url) {
    document.getElementById(idDestino).value = url;
    refrescarPreview(idDestino, 'audio');
  }
}

async function subirMensajePersonalizado(e){
  const archivo = e.target.files[0];
  if (!archivo) return;
  const esVideo = archivo.type.startsWith('video/');
  const url = await subirArchivoCloudinary(archivo, 'video');
  if (url) {
    document.getElementById('p-mensaje-url').value = url;
    refrescarPreview('p-mensaje-url', esVideo ? 'video' : 'audio');
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
  mostrarOk('ok-fotos');
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
    refrescarPreview('p-video-apertura-url', 'video');
  }
}

async function guardarVideoApertura(){
  await rpc('portal_actualizar_video_apertura', { p_codigo: CODIGO, p_url: valor('p-video-apertura-url') });
  mostrarOk('ok-video-apertura');
}

// ---------------- GALERÍA ----------------
async function subirFotoGaleriaCliente(e){
  const archivo = e.target.files[0];
  if (!archivo) return;
  const url = await subirArchivoCloudinary(archivo, 'image');
  if (!url) return;
  const res = await rpc('portal_agregar_foto_galeria', { p_codigo: CODIGO, p_url: url });
  if (res && res.ok) {
    const extras = await rpc('portal_obtener_extras', { p_codigo: CODIGO });
    if (extras && extras.ok) renderGaleriaPortal(extras.galeria || []);
  }
  e.target.value = '';
}

function renderGaleriaPortal(fotos){
  const cont = document.getElementById('galeria-lista');
  if (!fotos.length) { cont.innerHTML = '<p class="desc">Todavía no has agregado fotos.</p>'; return; }
  cont.innerHTML = fotos.map(f => `
    <div class="galeria-item-portal">
      <img src="${f.url}" alt="">
      <button type="button" class="galeria-eliminar" onclick="eliminarFotoGaleriaCliente('${f.id}')" title="Eliminar">✕</button>
    </div>
  `).join('');
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
      <div class="campo"><label>Foto</label><input type="file" accept="image/*" onchange="subirFotoHistoria(event, ${i})"></div>
    </div>`).join('');
}
function agregarHistoria(){ historiaItems.push({ titulo: '', texto: '', foto: '' }); pintarHistoria(); }
function quitarHistoria(i){ historiaItems.splice(i, 1); pintarHistoria(); }
async function subirFotoHistoria(e, i){
  const archivo = e.target.files[0];
  if (!archivo) return;
  const url = await subirArchivoCloudinary(archivo, 'image');
  if (url) historiaItems[i].foto = url;
}
async function guardarHistoria(){
  await rpc('portal_guardar_historia', { p_codigo: CODIGO, p_items: historiaItems });
  mostrarOk('ok-historia');
}

const ICONOS_ITINERARIO_NOMBRES = {
  '': 'Sin ícono', ceremonia: 'Ceremonia', recepcion: 'Recepción', coctel: 'Cóctel', cena: 'Cena',
  baile: 'Primer baile', fiesta: 'Fiesta', brindis: 'Brindis', pastel: 'Pastel',
  ramo: 'Lanzamiento del ramo', salida: 'Salida de los novios'
};

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
        <select class="select-campo" onchange="timelineItems[${i}].icono=this.value">
          ${Object.entries(ICONOS_ITINERARIO_NOMBRES).map(([valor, nombre]) => `<option value="${valor}" ${t.icono === valor ? 'selected' : ''}>${nombre}</option>`).join('')}
        </select>
      </div>
    </div>`).join('');
}
function agregarTimeline(){ timelineItems.push({ hora: '', titulo: '', icono: '' }); pintarTimeline(); }
function quitarTimeline(i){ timelineItems.splice(i, 1); pintarTimeline(); }
async function guardarTimeline(){
  await rpc('portal_guardar_timeline', { p_codigo: CODIGO, p_items: timelineItems });
  mostrarOk('ok-timeline');
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
