// ============================================================================
// PANEL DEL ORGANIZADOR — portal/invitados.html
// Acceso por código único (?codigo=XXXX), sin login — mismo patrón que el
// resto del portal. Todas las escrituras pasan por funciones RPC.
// ============================================================================

const SUPABASE_URL = "https://npfgugnoycokhtljbwkw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Ij3gofHHYKTHps92RKXKwQ_5Hya3_GW";

let CODIGO = null;
let INVITADOS = [];      // caché local de la última carga
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

  renderResumen();
  renderTablaInvitados();
}

/* ============================================================ TABS ====== */
function cambiarTabPanel(tab) {
  document.querySelectorAll('.panel-tab[data-tab]').forEach(b => b.classList.toggle('activo', b.dataset.tab === tab));
  document.querySelectorAll('.panel-vista').forEach(v => v.classList.add('oculto'));
  document.getElementById(`tab-${tab}`).classList.remove('oculto');
  if (tab === 'mesas' && window.cargarMesasSiNecesario) window.cargarMesasSiNecesario();
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

  const hoyStr = new Date().toISOString().slice(0, 10);
  const haceSieteDias = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const hoy = INVITADOS.filter(i => i.fecha_confirmacion && i.fecha_confirmacion.slice(0, 10) === hoyStr).length;
  const semana = INVITADOS.filter(i => i.fecha_confirmacion && i.fecha_confirmacion.slice(0, 10) >= haceSieteDias).length;

  set('st-total', total);
  set('st-confirmados', confirmados.length);
  set('st-pendientes', pendientes.length);
  set('st-rechazados', rechazados.length);
  set('st-adultos', adultos);
  set('st-ninos', ninos);
  set('st-hoy', hoy);
  set('st-semana', semana);

  const pct = total ? Math.round((confirmados.length / total) * 100) : 0;
  set('rsvp-pct', `${pct}%`);
  document.getElementById('barra-confirmado').style.width = total ? `${(confirmados.length / total) * 100}%` : '0%';
  document.getElementById('barra-pendiente').style.width = total ? `${(pendientes.length / total) * 100}%` : '0%';
  document.getElementById('barra-rechazado').style.width = total ? `${(rechazados.length / total) * 100}%` : '0%';
}
function set(id, val) { document.getElementById(id).textContent = val; }

/* ============================================================ TABLA ===== */
function renderTablaInvitados() {
  const busqueda = (document.getElementById('buscar-invitado').value || '').toLowerCase();
  const filtro = document.getElementById('filtro-estado').value;

  const filtrados = INVITADOS.filter(i => {
    const coincideBusqueda = i.nombre.toLowerCase().includes(busqueda) || (i.familia || '').toLowerCase().includes(busqueda);
    const coincideEstado = filtro === 'todos' || i.estado === filtro;
    return coincideBusqueda && coincideEstado;
  });

  const cuerpo = document.getElementById('cuerpo-tabla-invitados');
  cuerpo.innerHTML = filtrados.map(i => `
    <div class="ti-fila">
      <div>
        <div class="ti-nombre">${escapar(i.nombre)}</div>
        <div class="ti-sub">${i.familia ? 'Familia ' + escapar(i.familia) : 'Sin familia'}</div>
      </div>
      <div class="ti-sub">${i.telefono ? escapar(i.telefono) : '—'}</div>
      <div>${badgeEstado(i)}</div>
      <div class="ti-sub">${(i.adultos || 0) + (i.ninos || 0)}</div>
      <div class="ti-acciones">
        <button class="ti-icon-btn" title="Copiar link" onclick="copiarLinkInvitado('${i.link}')">🔗</button>
        <button class="ti-icon-btn" title="WhatsApp" onclick="compartirWhatsapp('${i.id}')">💬</button>
        <button class="ti-icon-btn" title="Editar" onclick="abrirModalEditar('${i.id}')">✎</button>
        <button class="ti-icon-btn" title="Eliminar" onclick="eliminarInvitado('${i.id}')">🗑</button>
      </div>
    </div>
  `).join('');

  document.getElementById('sin-invitados').classList.toggle('oculto', filtrados.length > 0);
}

function badgeEstado(i) {
  const etiquetas = { pendiente: 'Pendiente', confirmado: 'Confirmado', rechazado: 'No viene' };
  return `<button class="badge-estado badge-${i.estado}" onclick="cicloEstado('${i.id}')">${etiquetas[i.estado]}</button>`;
}

async function cicloEstado(id) {
  const inv = INVITADOS.find(i => i.id === id);
  const orden = ['pendiente', 'confirmado', 'rechazado'];
  const siguiente = orden[(orden.indexOf(inv.estado) + 1) % orden.length];
  const res = await rpc('panel_cambiar_estado_invitado', { p_codigo: CODIGO, p_invitado_id: id, p_estado: siguiente });
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
    DUPLICADO_PENDIENTE = { nombre, familia, telefono };
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

async function procesarExcel() {
  const archivo = document.getElementById('input-excel').files[0];
  if (!archivo) { mostrarToast('Selecciona un archivo primero'); return; }

  const buffer = await archivo.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const hoja = wb.Sheets[wb.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json(hoja);
  const nombres = filas.map(f => f.Nombre || f.nombre).filter(Boolean);

  if (!nombres.length) { mostrarToast('No se encontró la columna "Nombre" en el Excel'); return; }

  const res = await rpc('portal_generar_links_invitados', { p_codigo: CODIGO, p_nombres: nombres });
  if (res.ok) {
    document.getElementById('input-excel').value = '';
    await cargarTodo();
    mostrarToast(`${nombres.length} invitados agregados`);
  }
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
