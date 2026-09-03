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
let primeraCarga = true;
let PAGINA_INVITADOS = 1;
let POR_PAGINA_INVITADOS = 20;
let PAGINA_FAMILIAS = 1;
const POR_PAGINA_FAMILIAS = 10;

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

  if (primeraCarga) {
    // Se limpia solo aquí, por si el navegador restauró un valor viejo del
    // buscador al recargar la página. En recargas posteriores (después de
    // confirmar, editar, etc.) NO se toca, para no perder el filtro activo.
    document.getElementById('buscar-invitado').value = '';
    document.getElementById('filtro-estado').value = 'todos';
    document.getElementById('filtro-invitado-por').value = 'todos';
    primeraCarga = false;
    // Nombres de la pareja + fecha, para armar el mensaje de "copiar link".
    // cargarEventoInfo() vive en itinerario.js (misma página) y llena
    // el global EVENTO_INFO — no hace falta duplicarlo aquí.
    if (window.cargarEventoInfo) await cargarEventoInfo();
  }

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
  if (tab === 'itinerario' && window.cargarItinerarioSiNecesario) window.cargarItinerarioSiNecesario();
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
  const filtroInvitadoPor = document.getElementById('filtro-invitado-por').value;

  const filtrados = INVITADOS.filter(i => {
    const nombre = (i.nombre || '').toLowerCase();
    const familia = (i.familia || '').toLowerCase();
    const coincideBusqueda = !busqueda || nombre.includes(busqueda) || familia.includes(busqueda);
    const coincideEstado = filtro === 'todos' || i.estado === filtro;
    const invitadoPor = (i.invitado_por || '').toLowerCase().trim();
    const coincideInvitadoPor = filtroInvitadoPor === 'todos'
      || (filtroInvitadoPor === 'sin_especificar' ? !invitadoPor : invitadoPor === filtroInvitadoPor);
    return coincideBusqueda && coincideEstado && coincideInvitadoPor;
  });

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA_INVITADOS));
  if (PAGINA_INVITADOS > totalPaginas) PAGINA_INVITADOS = totalPaginas;
  const inicio = (PAGINA_INVITADOS - 1) * POR_PAGINA_INVITADOS;
  const pagina = filtrados.slice(inicio, inicio + POR_PAGINA_INVITADOS);

  const cuerpo = document.getElementById('cuerpo-tabla-invitados');
  cuerpo.innerHTML = pagina.map(i => `
    <div class="ti-fila">
      <div>
        <div class="ti-nombre">${escapar(i.nombre)}</div>
        <div class="ti-sub">${i.familia ? 'Familia ' + escapar(i.familia) : 'Sin familia'}${i.telefono ? ' · ' + escapar(i.telefono) : ''}</div>
      </div>
      <div>
        ${badgeEstado(i)}
        <div class="ti-sub" style="margin-top:.3rem">${i.invitado_por ? 'Invita: ' + escapar(i.invitado_por) : '—'}</div>
      </div>
      <div class="ti-sub">${badgeApertura(i)}</div>
      <div class="ti-acciones">
        <button class="ti-icon-btn" title="Copiar link personal (con mensaje)" onclick="copiarLinkPersonal('${i.id}')">${ICONO_LINK}</button>
        ${i.link_familiar
          ? `<button class="ti-icon-btn" title="Copiar link familiar (con mensaje, toda la familia)" onclick="copiarLinkFamiliarDesdeInvitado('${i.id}')">${ICONO_FAMILIA}</button>`
          : `<span class="ti-icon-btn ti-icon-vacio"></span>`}
        <button class="ti-icon-btn ti-icon-btn--whatsapp" title="Enviar por WhatsApp" onclick="compartirWhatsapp('${i.id}')">${ICONO_WHATSAPP}</button>
        <button class="ti-icon-btn" title="Editar" onclick="abrirModalEditar('${i.id}')">✎</button>
        <button class="ti-icon-btn" title="Eliminar" onclick="eliminarInvitado('${i.id}')">🗑</button>
      </div>
    </div>
  `).join('');

  document.getElementById('sin-invitados').classList.toggle('oculto', filtrados.length > 0);
  renderPaginacionInvitados(filtrados.length, totalPaginas);
}

function renderPaginacionInvitados(totalFiltrados, totalPaginas){
  const cont = document.getElementById('paginacion-invitados');
  if (!cont) return;
  if (!totalFiltrados) { cont.innerHTML = ''; return; }

  const inicio = (PAGINA_INVITADOS - 1) * POR_PAGINA_INVITADOS + 1;
  const fin = Math.min(PAGINA_INVITADOS * POR_PAGINA_INVITADOS, totalFiltrados);

  cont.innerHTML = `
    <span class="paginacion-info">${inicio}–${fin} de ${totalFiltrados}</span>
    <div class="paginacion-controles">
      <button type="button" ${PAGINA_INVITADOS === 1 ? 'disabled' : ''} onclick="cambiarPaginaInvitados(${PAGINA_INVITADOS - 1})">‹</button>
      <span>Página ${PAGINA_INVITADOS} de ${totalPaginas}</span>
      <button type="button" ${PAGINA_INVITADOS === totalPaginas ? 'disabled' : ''} onclick="cambiarPaginaInvitados(${PAGINA_INVITADOS + 1})">›</button>
    </div>
    <label class="paginacion-cantidad">
      Ver
      <select onchange="cambiarCantidadPorPagina(this.value)">
        ${[10, 20, 50, 100].map(n => `<option value="${n}" ${n === POR_PAGINA_INVITADOS ? 'selected' : ''}>${n}</option>`).join('')}
      </select>
      por página
    </label>
  `;
}

function cambiarPaginaInvitados(nueva){
  PAGINA_INVITADOS = nueva;
  renderTablaInvitados();
}

function cambiarCantidadPorPagina(valor){
  POR_PAGINA_INVITADOS = parseInt(valor, 10);
  PAGINA_INVITADOS = 1;
  renderTablaInvitados();
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
  const invitadoPor = document.getElementById('nuevo-invitado-por').value;
  if (!nombre) { mostrarToast('Escribe un nombre'); return; }

  const res = await rpc('portal_agregar_invitado_manual', {
    p_codigo: CODIGO, p_nombre: nombre, p_familia: familia || null,
    p_telefono: telefono || null, p_forzar: forzar, p_invitado_por: invitadoPor || null
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
    document.getElementById('nuevo-invitado-por').value = '';
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

    // La plantilla trae un título y subtítulo decorativos arriba de los
    // encabezados reales -- se busca la fila que de verdad dice "Nombre",
    // sin importar cuántas filas de título haya encima.
    const filasCrudas = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: '' });
    const filaEncabezado = filasCrudas.findIndex(fila =>
      fila.some(celda => String(celda).trim().toLowerCase() === 'nombre y apellido')
    );
    if (filaEncabezado === -1) {
      mostrarErrorExcel('No encontramos una columna llamada "Nombre y apellido" en tu archivo. Usa la plantilla que puedes descargar arriba — no cambies el nombre de las columnas.');
      return;
    }

    filas = XLSX.utils.sheet_to_json(hoja, { defval: '', range: filaEncabezado });
  } catch {
    mostrarErrorExcel('No se pudo leer el archivo. Asegúrate de subir un .xlsx o .xls sin dañar, idealmente descargando la plantilla de arriba.');
    return;
  }

  if (!filas.length) {
    mostrarErrorExcel('El archivo está vacío. Descarga la plantilla, agrega tus invitados desde la fila 5, y súbela de nuevo.');
    return;
  }

  const clave = (fila, nombre) => {
    const k = Object.keys(fila).find(k => k.trim().toLowerCase() === nombre);
    return k ? String(fila[k]).trim() : '';
  };

  const invitados = filas
    .map(f => ({
      nombre: clave(f, 'nombre y apellido'), familia: clave(f, 'familia'),
      telefono: clave(f, 'teléfono') || clave(f, 'telefono'),
      invitado_por: clave(f, 'invitado por'),
      esEjemplo: clave(f, 'es_ejemplo').toLowerCase() === 'si'
    }))
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
  document.getElementById('editar-invitado-por').value = inv.invitado_por || '';
  document.getElementById('modal-editar').classList.remove('oculto');
}
function cerrarModalEditar() { document.getElementById('modal-editar').classList.add('oculto'); }

async function guardarEdicion() {
  const id = document.getElementById('editar-id').value;
  const nombre = document.getElementById('editar-nombre').value.trim();
  const familia = document.getElementById('editar-familia').value.trim();
  const telefono = document.getElementById('editar-telefono').value.trim();
  const invitadoPor = document.getElementById('editar-invitado-por').value;
  if (!nombre) { mostrarToast('El nombre no puede estar vacío'); return; }

  const res = await rpc('panel_editar_invitado', {
    p_codigo: CODIGO, p_invitado_id: id, p_nombre: nombre,
    p_familia: familia || null, p_telefono: telefono || null,
    p_invitado_por: invitadoPor || null
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
// Iconos claros para los botones de acción (antes eran emoji que en
// algunos celulares se veían borrosos o no se entendían, sobre todo el de
// "familia"). currentColor hereda el color del botón, salvo WhatsApp que
// va siempre en verde para que se reconozca de un vistazo.
const ICONO_LINK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 12a4 4 0 004 4h3a4 4 0 000-8h-1"/><path d="M15 12a4 4 0 00-4-4H8a4 4 0 000 8h1"/></svg>';
const ICONO_FAMILIA = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.3"/><path d="M2.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5"/><path d="M14.7 20c0-2.3 1.4-4 2.8-4.3 1.8.4 3 2.1 3 4.3"/></svg>';
const ICONO_WHATSAPP = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#25D366" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 01-8.5 8.5c-1.3 0-2.6-.3-3.7-.9L3 20l1-5.7a8.5 8.5 0 1117-1.9z"/></svg>';

// "03 de octubre, 2026" — el formato corto que se usa en el mensaje.
function formatearFechaCorta(fechaStr) {
  if (!fechaStr) return '';
  const [y, m, d] = fechaStr.split('-').map(Number);
  if (!y || !m || !d) return '';
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${String(d).padStart(2, '0')} de ${meses[m - 1]}, ${y}`;
}

// Todos los invitados con esa familia (para listar los nombres en el mensaje).
function nombresDeFamilia(nombreFamilia) {
  return INVITADOS.filter(x => (x.familia || '') === nombreFamilia).map(x => x.nombre).filter(Boolean);
}

// Mismo mensaje siempre, sea link personal o familiar — solo cambian los
// nombres y la cantidad de personas. nombresEvento()/EVENTO_INFO vienen de
// itinerario.js (misma página).
function construirMensajeInvitacion(nombres, link) {
  const pareja = (typeof nombresEvento === 'function') ? nombresEvento() : '';
  const fecha = formatearFechaCorta(EVENTO_INFO.fecha);
  const encabezadoFecha = [pareja, fecha].filter(Boolean).join(' — ');
  const lista = nombres.filter(Boolean);
  const cuerpo = lista.length <= 1
    ? `Esta invitación es para 1 persona:\n${lista[0] || ''}`
    : `Esta invitación es para ${lista.length} personas:\n${lista.join('\n')}`;
  return [
    '💍 ¡Hola!',
    'Con mucha alegría te invitamos a nuestra boda.',
    encabezadoFecha,
    cuerpo,
    'Presiona este enlace para ver tu invitación:',
    link
  ].filter(Boolean).join('\n');
}

function copiarTexto(texto) {
  navigator.clipboard?.writeText(texto).then(
    () => mostrarToast('Mensaje copiado'),
    () => mostrarToast(texto)
  );
}

function copiarLinkPersonal(id) {
  const inv = INVITADOS.find(x => x.id === id);
  if (!inv) return;
  copiarTexto(construirMensajeInvitacion([inv.nombre], inv.link));
}

function copiarLinkFamiliarDesdeInvitado(id) {
  const inv = INVITADOS.find(x => x.id === id);
  if (!inv || !inv.link_familiar) return;
  copiarTexto(construirMensajeInvitacion(nombresDeFamilia(inv.familia), inv.link_familiar));
}

function copiarLinkFamilia(familiaId) {
  const f = FAMILIAS.find(x => x.id === familiaId);
  if (!f) return;
  copiarTexto(construirMensajeInvitacion(nombresDeFamilia(f.nombre), f.link));
}

function compartirWhatsapp(id) {
  const inv = INVITADOS.find(i => i.id === id);
  const telefono = (inv.telefono || '').replace(/\D/g, '');
  const mensaje = encodeURIComponent(construirMensajeInvitacion([inv.nombre], inv.link));
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
  if (!FAMILIAS.length) { cont.innerHTML = `<p class="desc" style="margin-top:.8rem">Todavía no hay familias — se crean solas en cuanto le pongas la misma familia a más de un invitado.</p>`; document.getElementById('paginacion-familias').innerHTML = ''; return; }

  const totalPaginas = Math.max(1, Math.ceil(FAMILIAS.length / POR_PAGINA_FAMILIAS));
  if (PAGINA_FAMILIAS > totalPaginas) PAGINA_FAMILIAS = totalPaginas;
  const inicio = (PAGINA_FAMILIAS - 1) * POR_PAGINA_FAMILIAS;
  const pagina = FAMILIAS.slice(inicio, inicio + POR_PAGINA_FAMILIAS);

  cont.innerHTML = pagina.map(f => {
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
        <button class="ti-icon-btn" title="Copiar link familiar (con mensaje)" onclick="copiarLinkFamilia('${f.id}')">${ICONO_LINK}</button>
      </div>
    </div>`;
  }).join('');

  const pagFam = document.getElementById('paginacion-familias');
  if (totalPaginas <= 1) { pagFam.innerHTML = ''; }
  else {
    pagFam.innerHTML = `
      <div class="paginacion-controles">
        <button type="button" ${PAGINA_FAMILIAS === 1 ? 'disabled' : ''} onclick="cambiarPaginaFamilias(${PAGINA_FAMILIAS - 1})">‹</button>
        <span>Página ${PAGINA_FAMILIAS} de ${totalPaginas}</span>
        <button type="button" ${PAGINA_FAMILIAS === totalPaginas ? 'disabled' : ''} onclick="cambiarPaginaFamilias(${PAGINA_FAMILIAS + 1})">›</button>
      </div>`;
  }
}

function cambiarPaginaFamilias(nueva){
  PAGINA_FAMILIAS = nueva;
  renderListaFamilias();
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
