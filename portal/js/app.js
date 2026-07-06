// ============================================================================
// PORTAL DEL CLIENTE — acceso por código único (?codigo=XXXX), sin login.
// Todas las escrituras pasan por funciones RPC (SECURITY DEFINER) que validan
// el código dentro de Postgres.
// ============================================================================

const SUPABASE_URL = "https://npfgugnoycokhtljbwkw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Ij3gofHHYKTHps92RKXKwQ_5Hya3_GW";
const CLOUDINARY_CLOUD_NAME = "PEGAR_CLOUD_NAME";
const CLOUDINARY_UPLOAD_PRESET = "PEGAR_UPLOAD_PRESET";

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
  return res.json();
}

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  CODIGO = params.get('codigo');

  if (!CODIGO) { mostrarError(); return; }

  const datos = await rpc('portal_obtener_evento', { p_codigo: CODIGO });
  if (!datos || datos.error) { mostrarError(); return; }

  document.getElementById('portal-nombre-evento').textContent = datos.nombreEvento || 'Tu invitación';
  document.getElementById('portal-contenido').classList.remove('oculto');

  document.getElementById('p-novio-a-nombre').value = datos.novioANombre || '';
  document.getElementById('p-novio-a-apellido').value = datos.novioAApellido || '';
  document.getElementById('p-novio-b-nombre').value = datos.novioBNombre || '';
  document.getElementById('p-novio-b-apellido').value = datos.novioBApellido || '';
  document.getElementById('p-whatsapp-a').value = datos.whatsappA || '';
  document.getElementById('p-whatsapp-b').value = datos.whatsappB || '';
  document.getElementById('p-fecha').value = datos.fecha || '';
  document.getElementById('p-hora').value = datos.hora || '';
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

  historiaItems = datos.historia || [];
  timelineItems = datos.timeline || [];
  mensajesItems = datos.mensajes || [];
  detallesItems = datos.detallesImportantes || [];
  pintarHistoria();
  pintarTimeline();
  pintarMensajes();
  pintarDetalles();

  cargarInvitadosGenerados();
});

function mostrarError(){
  document.getElementById('portal-error').classList.remove('oculto');
  document.getElementById('portal-nombre-evento').textContent = 'Link no válido';
}

function mostrarOk(idBoton){
  const el = document.getElementById(idBoton);
  el.classList.remove('oculto');
  setTimeout(() => el.classList.add('oculto'), 2500);
}

function valor(id){ return document.getElementById(id).value; }

// ---------------- SUBIDA DE ARCHIVOS (foto/audio/video genérico) ----------------
async function subirArchivoCloudinary(archivo, tipoRecurso){
  if (CLOUDINARY_CLOUD_NAME.startsWith('PEGAR_')) { alert('Cloudinary no está configurado todavía.'); return null; }
  const formData = new FormData();
  formData.append('file', archivo);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${tipoRecurso}/upload`, { method: 'POST', body: formData });
  const data = await res.json();
  return data.secure_url || null;
}

async function subirFotoSimple(e, idDestino){
  const archivo = e.target.files[0];
  if (!archivo) return;
  const esVideo = archivo.type.startsWith('video/');
  const url = await subirArchivoCloudinary(archivo, esVideo ? 'video' : 'image');
  if (url) document.getElementById(idDestino).value = url;
}

async function subirAudioSimple(e, idDestino){
  const archivo = e.target.files[0];
  if (!archivo) return;
  const url = await subirArchivoCloudinary(archivo, 'video'); // Cloudinary sube audio bajo el recurso "video"
  if (url) document.getElementById(idDestino).value = url;
}

async function subirMensajePersonalizado(e){
  const archivo = e.target.files[0];
  if (!archivo) return;
  const url = await subirArchivoCloudinary(archivo, 'video');
  if (url) document.getElementById('p-mensaje-url').value = url;
}

// ---------------- GUARDAR CADA BLOQUE ----------------
async function guardarDatosPrincipales(){
  await rpc('portal_actualizar_evento', {
    p_codigo: CODIGO,
    p_novio_a_nombre: valor('p-novio-a-nombre'), p_novio_a_apellido: valor('p-novio-a-apellido'),
    p_novio_b_nombre: valor('p-novio-b-nombre'), p_novio_b_apellido: valor('p-novio-b-apellido'),
    p_whatsapp_a: valor('p-whatsapp-a'), p_whatsapp_b: valor('p-whatsapp-b'),
    p_fecha: valor('p-fecha') || null, p_hora: valor('p-hora') || null
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
  await rpc('portal_actualizar_evento', { p_codigo: CODIGO, p_musica_url: valor('p-musica-url') });
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

async function guardarFotosDecorativas(){
  await rpc('portal_actualizar_evento', {
    p_codigo: CODIGO,
    p_firmas_foto_url: valor('p-firmas-foto'),
    p_rsvp_foto_url: valor('p-rsvp-foto')
  });
  mostrarOk('ok-fotos-decorativas');
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

// ---------------- TIMELINE (repetidor) ----------------
function pintarTimeline(){
  document.getElementById('lista-timeline').innerHTML = timelineItems.map((t, i) => `
    <div class="repetidor-item">
      <button class="quitar" onclick="quitarTimeline(${i})">✕</button>
      <div class="form-grid">
        <div class="campo"><label>Hora</label><input type="text" value="${t.hora || ''}" oninput="timelineItems[${i}].hora=this.value" placeholder="6:00 PM"></div>
        <div class="campo"><label>Momento</label><input type="text" value="${t.titulo || ''}" oninput="timelineItems[${i}].titulo=this.value"></div>
      </div>
    </div>`).join('');
}
function agregarTimeline(){ timelineItems.push({ hora: '', titulo: '' }); pintarTimeline(); }
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

// ---------------- GENERADOR DE INVITACIONES ----------------
function cambiarTabGenerador(tab){
  document.querySelectorAll('.gen-tab').forEach(b => b.classList.toggle('activo', b.dataset.tab === tab));
  document.getElementById('gen-tab-manual').classList.toggle('oculto', tab !== 'manual');
  document.getElementById('gen-tab-excel').classList.toggle('oculto', tab !== 'excel');
}

async function agregarInvitadoManual(){
  const input = document.getElementById('invitado-nombre-nuevo');
  const nombre = input.value.trim();
  if (!nombre) return;
  const resultado = await rpc('portal_agregar_invitado_manual', { p_codigo: CODIGO, p_nombre: nombre });
  if (resultado.error) { alert('No se pudo agregar. Intenta de nuevo.'); return; }
  input.value = '';
  cargarInvitadosGenerados();
}

async function cargarInvitadosGenerados(){
  const resultado = await rpc('portal_listar_invitados', { p_codigo: CODIGO });
  const cont = document.getElementById('lista-invitados-generados');
  if (!resultado || !Array.isArray(resultado) || !resultado.length) { cont.innerHTML = ''; return; }
  cont.innerHTML = resultado.map(i => `<div><b>${i.nombre}</b> — ${i.link} ${i.confirmado === true ? '✅' : i.confirmado === false ? '❌' : '⏳'}</div>`).join('');
}

function procesarExcel(){
  const input = document.getElementById('input-excel');
  const archivo = input.files[0];
  if (!archivo) { alert('Selecciona un archivo primero.'); return; }

  const lector = new FileReader();
  lector.onload = async (e) => {
    const datos = new Uint8Array(e.target.result);
    const libro = XLSX.read(datos, { type: 'array' });
    const hoja = libro.Sheets[libro.SheetNames[0]];
    const filas = XLSX.utils.sheet_to_json(hoja);

    const nombres = filas.map(f => f.Nombre || f.nombre).filter(Boolean);
    if (!nombres.length) { alert('No se encontró la columna "Nombre" en el archivo.'); return; }

    const resultado = await rpc('portal_generar_links_invitados', { p_codigo: CODIGO, p_nombres: nombres });
    if (resultado.error) { alert('No se pudo procesar el archivo.'); return; }

    cargarInvitadosGenerados();

    const cont = document.getElementById('lista-invitados-generados');
    cont.innerHTML += '<br><button class="btn btn-dorado btn-chico" id="btn-descargar-excel">Descargar Excel con links</button>';
    document.getElementById('btn-descargar-excel').onclick = () => {
      const hojaNueva = XLSX.utils.json_to_sheet(resultado.invitados.map(i => ({ Nombre: i.nombre, Link: i.link })));
      const libroNuevo = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libroNuevo, hojaNueva, 'Invitados');
      XLSX.writeFile(libroNuevo, 'invitados-con-links.xlsx');
    };
  };
  lector.readAsArrayBuffer(archivo);
}

// ---------------- FINALIZAR ----------------
async function marcarCompleto(){
  await rpc('portal_marcar_completo', { p_codigo: CODIGO });
  mostrarOk('ok-completo');
}
