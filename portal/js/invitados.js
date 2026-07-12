// ============================================================================
// PANEL DEL ORGANIZADOR — portal/invitados.html
// Acceso por código único (?codigo=XXXX), sin login — mismo patrón que el
// resto del portal. Todas las escrituras pasan por funciones RPC.
// ============================================================================

const SUPABASE_URL = "https://npfgugnoycokhtljbwkw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Ij3gofHHYKTHps92RKXKwQ_5Hya3_GW";

let CODIGO = null;
let INVITADOS = [];      // caché local de la última carga
let FAMILIAS = [];
let FIRMAS = [];
let DUPLICADO_PENDIENTE = null; // datos en espera de confirmación de familia duplicada

async function rpc(nombre, parametros) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nombre}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify(parametros)
  });
  const data = await res.json();
  if (!res.ok || data?.error) {
    console.error('Error en', nombre, data);
    mostrarToast('No se pudo completar la acción. Intenta de nuevo.');
    return { ok: false, error: data?.error || 'error_desconocido' };
  }
  return data;
}

/* ============================================================ INICIO ==== */
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  CODIGO = params.get('codigo');
  if (!CODIGO) { mostrarErrorCarga(); return; }

  await cargarTodo();
});

function mostrarErrorCarga() {
  document.getElementById('portal-contenido').classList.add('oculto');
  document.getElementById('portal-error').classList.remove('oculto');
}

async function cargarTodo() {
  const data = await rpc('portal_listar_invitados', { p_codigo: CODIGO });
  if (data.error === 'codigo_invalido') { mostrarErrorCarga(); return; }

  INVITADOS = data.invitados || [];
  document.getElementById('portal-contenido').classList.remove('oculto');
  document.getElementById('portal-nombre-evento').textContent = 'Panel del Organizador';

  // Se limpia por si el navegador restauró un valor viejo del buscador al recargar.
  document.getElementById('buscar-invitado').value = '';
  document.getElementById('filtro-estado').value = 'todos';

  renderResumen();
  renderTablaInvitados();
  await cargarFamilias();
}

/* ============================================================ TABS ====== */
function cambiarTabPanel(tab) {
  document.querySelectorAll('.panel-tab[data-tab]').forEach(b => b.classList.toggle('activo', b.dataset.tab === tab));
  document.querySelectorAll('.panel-vista').forEach(v => v.classList.add('oculto'));
  document.getElementById(`tab-${tab}`).classList.remove('oculto');
  if (tab === 'mesas' && window.cargarMesasSiNecesario) window.cargarMesasSiNecesario();
  if (tab === 'muro') cargarFirmas();
}

function cambiarTabGenerador(tab) {
  document.querySelectorAll('.gen-tab').forEach(b => b.classList.toggle('activo', b.dataset.tab === tab));
  document.getElementById('gen-tab-manual').classList.toggle('oculto', tab !== 'manual');
  document.getElementById('gen-tab-excel').classList.toggle('oculto', tab !== 'excel');
}

/* ============================================================ RESUMEN === */
function renderResumen() {
  const total = INVITADOS.length;
  const confirmados = INVITADOS.filter(i => i.estado === 'confirmado');
  const pendientes = INVITADOS.filter(i => i.estado === 'pendiente');
  const rechazados = INVITADOS.filter(i => i.estado === 'rechazado');

  const adultos = confirmados.reduce((s, i) => s + (i.adultos || 0), 0);
  const ninos = confirmados.reduce((s, i) => s + (i.ninos || 0), 0);

  const abiertas = INVITADOS.filter(i => i.primera_apertura_en).length;
  const sinAbrir = total - abiertas;

  set('st-total', total);
  set('st-confirmados', confirmados.length);
  set('st-pendientes', pendientes.length);
  set('st-rechazados', rechazados.length);
  set('st-adultos', adultos);
  set('st-ninos', ninos);
  set('st-abiertas', abiertas);
  set('st-sin-abrir', sinAbrir);

  const pct = total ? Math.round((confirmados.length / total) * 100) : 0;
  set('rsvp-pct', `${pct}%`);
  document.getElementById('barra-confirmado').style.width = total ? `${(confirmados.length / total) * 100}%` : '0%';
  document.getElementById('barra-pendiente').style.width = total ? `${(pendientes.length / total) * 100}%` : '0%';
  document.getElementById('barra-rechazado').style.width = total ? `${(rechazados.length / total) * 100}%` : '0%';
}
function set(id, val) { document.getElementById(id).textContent = val; }

/* ============================================================ TABLA ===== */
function renderTablaInvitados() {
  const busqueda = (document.getElementById('buscar-invitado').value || '').toLowerCase().trim();
  const filtro = document.getElementById('filtro-estado').value;

  const filtrados = INVITADOS.filter(i => {
    const nombre = (i.nombre || '').toLowerCase();
    const familia = (i.familia || '').toLowerCase();
    const coincideBusqueda = !busqueda || nombre.includes(busqueda) || familia.includes(busqueda);
    const coincideEstado = filtro === 'todos' || i.estado === filtro;
    return coincideBusqueda && coincideEstado;
  });

  const cuerpo = document.getElementById('cuerpo-tabla-invitados');
  cuerpo.innerHTML = filtrados.map(i => `
    <div class="ti-fila">
      <div>
        <div class="ti-nombre">${escapar(i.nombre)}</div>
        <div class="ti-sub">${i.familia ? 'Familia ' + escapar(i.familia) : 'Sin familia'}${i.telefono ? ' · ' + escapar(i.telefono) : ''}</div>
      </div>
      <div>
        ${badgeEstado(i)}
        <div class="ti-sub" style="margin-top:.3rem">${(i.adultos || 0) + (i.ninos || 0)} asistente(s)</div>
      </div>
      <div class="ti-sub">${badgeApertura(i)}</div>
      <div class="ti-acciones">
        <button class="ti-icon-btn" title="Copiar link personal" onclick="copiarLinkInvitado('${i.link}')">🔗</button>
        ${i.link_familiar ? `<button class="ti-icon-btn" title="Copiar link familiar (toda la familia)" onclick="copiarLinkInvitado('${i.link_familiar}')">👪</button>` : ''}
        <button class="ti-icon-btn" title="WhatsApp" onclick="compartirWhatsapp('${i.id}')">💬</button>
        <button class="ti-icon-btn" title="Editar" onclick="abrirModalEditar('${i.id}')">✎</button>
        <button class="ti-icon-btn" title="Eliminar" onclick="eliminarInvitado('${i.id}')">🗑</button>
      </div>
    </div>
  `).join('');

  document.getElementById('sin-invitados').classList.toggle('oculto', filtrados.length > 0);
}

function badgeEstado(i) {
  const etiquetas = { pendiente: 'Sin responder', confirmado: 'Confirmado', rechazado: 'No viene' };
  return `<div class="select-wrap">
    <select class="badge-estado badge-${i.estado}" onchange="cambiarEstadoSelect('${i.id}', this.value)">
      ${Object.entries(etiquetas).map(([v, l]) => `<option value="${v}" ${v === i.estado ? 'selected' : ''}>${l}</option>`).join('')}
    </select>
  </div>`;
}

function badgeApertura(i) {
  if (!i.primera_apertura_en) return `<span class="badge-apertura badge-sin-abrir">⏳ Sin abrir</span>`;
  const fecha = new Date(i.ultima_apertura_en || i.primera_apertura_en);
  const fechaTexto = fecha.toLocaleDateString('es-HN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const veces = i.veces_abierto > 1 ? ` (${i.veces_abierto}x)` : '';
  return `<span class="badge-apertura badge-abierta" title="Se abrió ${i.veces_abierto || 1} vez(es)">✉️ ${fechaTexto}${veces}</span>`;
}

async function cambiarEstadoSelect(id, estado) {
  const res = await rpc('panel_cambiar_estado_invitado', { p_codigo: CODIGO, p_invitado_id: id, p_estado: estado });
  if (res.ok) { await cargarTodo(); mostrarToast('Estado actualizado'); }
}

/* ============================================================ AGREGAR === */
async function agregarInvitadoManual(forzar = false) {
  const nombre = document.getElementById('nuevo-nombre').value.trim();
  const familia = document.getElementById('nuevo-familia').value.trim();
  const telefono = document.getElementById('nuevo-telefono').value.trim();
  if (!nombre) { mostrarToast('Escribe un nombre'); return; }

  const res = await rpc('portal_agregar_invitado_manual', {
    p_codigo: CODIGO, p_nombre: nombre, p_familia: familia || null,
    p_telefono: telefono || null, p_forzar: forzar
  });

  if (res.familia_duplicada) {
    DUPLICADO_PENDIENTE = { nombre, familia, telefono, nombreExistente: res.nombre_existente };
    document.getElementById('duplicado-nombre-existente').textContent = `"${res.nombre_existente}"`;
    document.getElementById('duplicado-nombre-existente-2').textContent = res.nombre_existente;
    document.getElementById('modal-duplicado').classList.remove('oculto');
    return;
  }
  if (res.ok) {
    document.getElementById('nuevo-nombre').value = '';
    document.getElementById('nuevo-familia').value = '';
    document.getElementById('nuevo-telefono').value = '';
    await cargarTodo();
    mostrarToast('Invitado agregado');
  }
}

function cerrarModalDuplicado() {
  DUPLICADO_PENDIENTE = null;
  document.getElementById('modal-duplicado').classList.add('oculto');
}
async function confirmarCrearDuplicado() {
  document.getElementById('modal-duplicado').classList.add('oculto');
  if (!DUPLICADO_PENDIENTE) return;
  document.getElementById('nuevo-nombre').value = DUPLICADO_PENDIENTE.nombre;
  document.getElementById('nuevo-familia').value = DUPLICADO_PENDIENTE.familia;
  document.getElementById('nuevo-telefono').value = DUPLICADO_PENDIENTE.telefono;
  DUPLICADO_PENDIENTE = null;
  await agregarInvitadoManual(true);
}
async function usarFamiliaExistente() {
  document.getElementById('modal-duplicado').classList.add('oculto');
  if (!DUPLICADO_PENDIENTE) return;
  document.getElementById('nuevo-nombre').value = DUPLICADO_PENDIENTE.nombre;
  document.getElementById('nuevo-familia').value = DUPLICADO_PENDIENTE.nombreExistente;
  document.getElementById('nuevo-telefono').value = DUPLICADO_PENDIENTE.telefono;
  DUPLICADO_PENDIENTE = null;
  await agregarInvitadoManual(true);
}

async function procesarExcel() {
  const mensajeEl = document.getElementById('excel-mensaje');
  mensajeEl.classList.add('oculto');

  const archivo = document.getElementById('input-excel').files[0];
  if (!archivo) { mostrarErrorExcel('Selecciona un archivo primero.'); return; }

  let filas;
  try {
    const buffer = await archivo.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const hoja = wb.Sheets[wb.SheetNames[0]];
    filas = XLSX.utils.sheet_to_json(hoja, { defval: '' });
  } catch {
    mostrarErrorExcel('No se pudo leer el archivo. Asegúrate de subir un .xlsx o .xls sin dañar, idealmente descargando la plantilla de arriba.');
    return;
  }

  if (!filas.length) {
    mostrarErrorExcel('El archivo está vacío. Descarga la plantilla, agrega tus invitados desde la fila 5, y súbela de nuevo.');
    return;
  }

  const primeraFila = filas[0];
  const tieneColumnaNombre = Object.keys(primeraFila).some(k => k.trim().toLowerCase() === 'nombre');
  if (!tieneColumnaNombre) {
    mostrarErrorExcel('No encontramos una columna llamada "Nombre" en tu archivo. Usa la plantilla que puedes descargar arriba — no cambies el nombre de las columnas.');
    return;
  }

  const clave = (fila, nombre) => {
    const k = Object.keys(fila).find(k => k.trim().toLowerCase() === nombre);
    return k ? String(fila[k]).trim() : '';
  };

  const invitados = filas
    .map(f => ({ nombre: clave(f, 'nombre'), familia: clave(f, 'familia'), telefono: clave(f, 'teléfono') || clave(f, 'telefono'), esEjemplo: clave(f, 'es_ejemplo').toLowerCase() === 'si' }))
    .filter(i => i.nombre && !i.esEjemplo);

  if (!invitados.length) {
    mostrarErrorExcel('La columna "Nombre" está vacía en todas las filas. Completa al menos un invitado y súbelo de nuevo.');
    return;
  }

  const res = await rpc('portal_generar_links_invitados', { p_codigo: CODIGO, p_invitados: invitados });
  if (res.ok) {
    document.getElementById('input-excel').value = '';
    await cargarTodo();
    mostrarToast(`${res.agregados} invitados agregados`);
  } else {
    mostrarErrorExcel('No se pudo guardar la lista. Intenta de nuevo en un momento.');
  }
}

function mostrarErrorExcel(msg) {
  const el = document.getElementById('excel-mensaje');
  el.textContent = msg;
  el.classList.remove('oculto');
}

/* ============================================================ EDITAR ==== */
function abrirModalEditar(id) {
  const inv = INVITADOS.find(i => i.id === id);
  document.getElementById('editar-id').value = id;
  document.getElementById('editar-nombre').value = inv.nombre || '';
  document.getElementById('editar-familia').value = inv.familia || '';
  document.getElementById('editar-telefono').value = inv.telefono || '';
  document.getElementById('modal-editar').classList.remove('oculto');
}
function cerrarModalEditar() { document.getElementById('modal-editar').classList.add('oculto'); }

async function guardarEdicion() {
  const id = document.getElementById('editar-id').value;
  const nombre = document.getElementById('editar-nombre').value.trim();
  const familia = document.getElementById('editar-familia').value.trim();
  const telefono = document.getElementById('editar-telefono').value.trim();
  if (!nombre) { mostrarToast('El nombre no puede estar vacío'); return; }

  const res = await rpc('panel_editar_invitado', {
    p_codigo: CODIGO, p_invitado_id: id, p_nombre: nombre,
    p_familia: familia || null, p_telefono: telefono || null
  });
  if (res.ok) {
    cerrarModalEditar();
    await cargarTodo();
    mostrarToast('Cambios guardados');
  }
}

async function eliminarInvitado(id) {
  if (!confirm('¿Eliminar a este invitado? Esta acción no se puede deshacer.')) return;
  const res = await rpc('panel_eliminar_invitado', { p_codigo: CODIGO, p_invitado_id: id });
  if (res.ok) { await cargarTodo(); mostrarToast('Invitado eliminado'); }
}

/* ============================================================ COMPARTIR = */
function copiarLinkInvitado(link) {
  navigator.clipboard?.writeText(link).then(
    () => mostrarToast('Link copiado'),
    () => mostrarToast(link)
  );
}
function compartirWhatsapp(id) {
  const inv = INVITADOS.find(i => i.id === id);
  const primerNombre = inv.nombre.split(' ')[0];
  const telefono = (inv.telefono || '').replace(/\D/g, '');
  const mensaje = encodeURIComponent(`¡Hola ${primerNombre}! Este es tu link personal para confirmar tu asistencia: ${inv.link}`);
  const numero = telefono ? `504${telefono}` : '';
  window.open(`https://wa.me/${numero}?text=${mensaje}`, '_blank');
}

/* ============================================================ UTILS ===== */
function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto || '';
  return div.innerHTML;
}
let toastTimer = null;
function mostrarToast(msg) {
  let el = document.getElementById('toast-panel');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-panel';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.remove('oculto');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('oculto'), 2200);
}

/* ============================================================ FAMILIAS == */
async function cargarFamilias() {
  const data = await rpc('portal_listar_familias', { p_codigo: CODIGO });
  if (!data.ok) return;
  FAMILIAS = data.familias || [];
  renderListaFamilias();
}

async function crearFamilia() {
  const nombre = document.getElementById('nueva-familia-nombre').value.trim();
  if (!nombre) { mostrarToast('Escribe el nombre de la familia'); return; }
  const res = await rpc('portal_crear_familia', { p_codigo: CODIGO, p_nombre: nombre });
  if (res.ok) {
    document.getElementById('nueva-familia-nombre').value = '';
    await cargarFamilias();
    mostrarToast('Link familiar creado');
  }
}

function renderListaFamilias() {
  const cont = document.getElementById('lista-familias');
  if (!FAMILIAS.length) { cont.innerHTML = `<p class="desc" style="margin-top:.8rem">Todavía no hay familias — se crean solas en cuanto le pongas la misma familia a más de un invitado.</p>`; return; }

  cont.innerHTML = FAMILIAS.map(f => {
    const conteo = f.conteo_manual != null ? f.conteo_manual : f.conteo_miembros;
    return `
    <div class="familia-fila">
      <div>
        <div class="ti-nombre">${escapar(f.nombre)}</div>
        <div class="ti-sub">
          ${f.conteo_miembros} invitado(s) ligado(s) ·
          <span>conteo a mostrar:</span>
          <input type="number" min="0" value="${conteo}" class="conteo-input" onchange="actualizarConteoFamilia('${f.id}', this.value)">
        </div>
      </div>
      <div class="ti-acciones">
        <button class="ti-icon-btn" title="Copiar link familiar" onclick="copiarLinkInvitado('${f.link}')">🔗</button>
      </div>
    </div>`;
  }).join('');
}

async function actualizarConteoFamilia(familiaId, valor) {
  const conteo = parseInt(valor, 10);
  if (isNaN(conteo) || conteo < 0) { mostrarToast('Escribe un número válido'); await cargarFamilias(); return; }
  const res = await rpc('portal_actualizar_conteo_familia', { p_codigo: CODIGO, p_familia_id: familiaId, p_conteo: conteo });
  if (res.ok) mostrarToast('Conteo actualizado');
}

/* ============================================================ MURO DE FIRMAS (moderación) == */
async function cargarFirmas() {
  const data = await rpc('portal_listar_firmas', { p_codigo: CODIGO });
  if (!Array.isArray(data)) { FIRMAS = []; } else { FIRMAS = data; }
  renderTablaFirmas();
}

function renderTablaFirmas() {
  const filtro = document.getElementById('filtro-firma').value;
  const filtradas = filtro === 'todos' ? FIRMAS : FIRMAS.filter(f => f.estado === filtro);

  const cont = document.getElementById('lista-firmas-moderacion');
  cont.innerHTML = filtradas.map(f => `
    <div class="firma-moderacion firma-${f.estado}">
      <div class="firma-moderacion__cuerpo">
        <div class="ti-nombre">${escapar(f.nombre)}</div>
        <p class="desc" style="margin:.2rem 0 .5rem">${escapar(f.mensaje)}</p>
        <span class="badge-firma-estado badge-${f.estado}">${etiquetaEstadoFirma(f.estado)}</span>
      </div>
      <div class="ti-acciones">
        ${f.estado !== 'aprobado' ? `<button class="ti-icon-btn" title="Aprobar" onclick="moderarFirma('${f.id}', 'aprobado')">✅</button>` : ''}
        ${f.estado !== 'rechazado' ? `<button class="ti-icon-btn" title="Rechazar" onclick="moderarFirma('${f.id}', 'rechazado')">🚫</button>` : ''}
        ${f.estado !== 'pendiente' ? `<button class="ti-icon-btn" title="Volver a pendiente" onclick="moderarFirma('${f.id}', 'pendiente')">↩️</button>` : ''}
      </div>
    </div>
  `).join('');

  document.getElementById('sin-firmas').classList.toggle('oculto', filtradas.length > 0);
}

function etiquetaEstadoFirma(estado) {
  return { pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' }[estado] || estado;
}

async function moderarFirma(firmaId, estado) {
  const res = await rpc('portal_moderar_firma', { p_codigo: CODIGO, p_firma_id: firmaId, p_estado: estado });
  if (res.ok) { await cargarFirmas(); mostrarToast('Mensaje actualizado'); }
}
