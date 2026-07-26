// ============================================================================
// PANEL DEL ORGANIZADOR — módulo de Itinerario (portal/invitados.html)
// Reutiliza CODIGO, rpc(), escapar(), mostrarToast() y set() ya definidos en
// js/invitados.js (mismo documento).
//
// El "Cronograma" reutiliza las mismas funciones RPC que usa el contenido de
// la invitación (portal_obtener_evento / portal_guardar_timeline): lo que se
// edita aquí es el mismo itinerario que ve el invitado en la invitación, así
// que no se duplica información. El "Checklist" es una tabla nueva
// (tareas_planeacion), propia de este panel.
// ============================================================================

let CRONOGRAMA_ITEMS = [];
let CHECKLIST_ITEMS = [];
let EVENTO_INFO = {};
let ITINERARIO_CARGADO = false;
let PLANTILLA_CRONOGRAMA = 'clasico';

window.cargarItinerarioSiNecesario = async function () {
  if (ITINERARIO_CARGADO) return;
  await Promise.all([cargarCronogramaDatos(), cargarChecklistDatos()]);
  ITINERARIO_CARGADO = true;
};

function cambiarSubTabItinerario(tab) {
  document.querySelectorAll('#tab-itinerario .gen-tab').forEach(b => b.classList.toggle('activo', b.dataset.tab === tab));
  document.getElementById('itin-sub-cronograma').classList.toggle('oculto', tab !== 'cronograma');
  document.getElementById('itin-sub-checklist').classList.toggle('oculto', tab !== 'checklist');
}

/* ============================================================ CRONOGRAMA = */
async function cargarCronogramaDatos() {
  const datos = await rpc('portal_obtener_evento', { p_codigo: CODIGO });
  if (!datos || datos.error) return;
  EVENTO_INFO = datos;
  CRONOGRAMA_ITEMS = datos.timeline || [];
  pintarCronogramaEditor();
  actualizarPreviewCronograma();
}

function pintarCronogramaEditor() {
  const cont = document.getElementById('lista-cronograma');
  if (!cont) return;

  if (!CRONOGRAMA_ITEMS.length) {
    cont.innerHTML = `<p class="desc">Todavía no agregas ningún momento. Empieza con "+ Agregar momento".</p>`;
    return;
  }

  cont.innerHTML = CRONOGRAMA_ITEMS.map((t, i) => `
    <div class="cronograma-item-editor">
      <input type="text" value="${escapar(t.hora || '')}" placeholder="6:00 PM"
        oninput="CRONOGRAMA_ITEMS[${i}].hora=this.value; actualizarPreviewCronograma()">
      <input type="text" value="${escapar(t.titulo || '')}" placeholder="Ej. Ceremonia religiosa"
        oninput="CRONOGRAMA_ITEMS[${i}].titulo=this.value; actualizarPreviewCronograma()">
      <div class="cronograma-item-editor-acciones">
        <button type="button" title="Subir" ${i === 0 ? 'disabled' : ''} onclick="moverMomentoCronograma(${i},-1)">▲</button>
        <button type="button" title="Bajar" ${i === CRONOGRAMA_ITEMS.length - 1 ? 'disabled' : ''} onclick="moverMomentoCronograma(${i},1)">▼</button>
        <button type="button" class="quitar" title="Quitar" onclick="quitarMomentoCronograma(${i})">✕</button>
      </div>
    </div>`).join('');
}

function agregarMomentoCronograma() {
  CRONOGRAMA_ITEMS.push({ hora: '', titulo: '', icono: '' });
  pintarCronogramaEditor();
  actualizarPreviewCronograma();
}
function quitarMomentoCronograma(i) {
  CRONOGRAMA_ITEMS.splice(i, 1);
  pintarCronogramaEditor();
  actualizarPreviewCronograma();
}
function moverMomentoCronograma(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= CRONOGRAMA_ITEMS.length) return;
  [CRONOGRAMA_ITEMS[i], CRONOGRAMA_ITEMS[j]] = [CRONOGRAMA_ITEMS[j], CRONOGRAMA_ITEMS[i]];
  pintarCronogramaEditor();
  actualizarPreviewCronograma();
}

async function guardarCronograma() {
  const res = await rpc('portal_guardar_timeline', { p_codigo: CODIGO, p_items: CRONOGRAMA_ITEMS });
  if (res?.error) return;
  mostrarToast('Cronograma guardado');
}

/* ---------------- plantillas y vista previa ---------------- */
function elegirPlantillaCronograma(tpl) {
  PLANTILLA_CRONOGRAMA = tpl;
  document.querySelectorAll('#plantilla-picker-cronograma .plantilla-op').forEach(b => b.classList.toggle('activo', b.dataset.tpl === tpl));
  const preview = document.getElementById('cronograma-preview');
  if (preview) preview.className = `cronograma-tarjeta tpl-${tpl}`;
}

// Adivina un emoji sencillo según palabras clave del título — puramente
// decorativo para la tarjeta descargable, no se guarda en ningún lado.
function emojiPorTitulo(titulo) {
  const t = (titulo || '').toLowerCase();
  if (/ceremonia|iglesia|misa|votos|capilla/.test(t)) return '💍';
  if (/recepci[oó]n|entrada|bienvenida|c[oó]ctel/.test(t)) return '🥂';
  if (/cena|comida|banquete|almuerzo/.test(t)) return '🍽️';
  if (/baile|fiesta|dj|m[uú]sica/.test(t)) return '💃';
  if (/pastel|corte/.test(t)) return '🎂';
  if (/foto/.test(t)) return '📸';
  if (/ramo/.test(t)) return '💐';
  if (/brindis|copas/.test(t)) return '🥂';
  return '🕐';
}

// Formatea "2026-09-12" como "Sábado 12 de septiembre de 2026" sin librerías,
// construyendo la fecha con año/mes/día locales para evitar el corrimiento de
// un día que da new Date('YYYY-MM-DD') por interpretarse en UTC.
function formatearFechaBonita(fechaStr) {
  if (!fechaStr) return '';
  const [y, m, d] = fechaStr.split('-').map(Number);
  if (!y || !m || !d) return '';
  const fecha = new Date(y, m - 1, d);
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${dias[fecha.getDay()]} ${d} de ${meses[m - 1]} de ${y}`;
}

function actualizarPreviewCronograma() {
  const preview = document.getElementById('cronograma-preview');
  if (!preview) return;

  const items = CRONOGRAMA_ITEMS.filter(t => (t.hora || '').trim() || (t.titulo || '').trim());
  const nombres = [EVENTO_INFO.novioANombre, EVENTO_INFO.novioBNombre].filter(Boolean).join(' & ');
  const fecha = formatearFechaBonita(EVENTO_INFO.fecha);

  if (!items.length) {
    preview.innerHTML = `<p class="desc" style="margin:0">Agrega momentos al cronograma para ver la vista previa aquí.</p>`;
    return;
  }

  preview.innerHTML = `
    <div class="cronograma-header">
      <p class="cronograma-eyebrow">Itinerario del día</p>
      <h3>${escapar(nombres) || 'Nuestra boda'}</h3>
      ${fecha ? `<p class="cronograma-fecha">${escapar(fecha)}</p>` : ''}
    </div>
    <div class="cronograma-lista">
      ${items.map(t => `
        <div class="cronograma-item">
          <span class="cronograma-item-icono">${emojiPorTitulo(t.titulo)}</span>
          <span class="cronograma-item-hora">${escapar(t.hora || '')}</span>
          <span class="cronograma-item-titulo">${escapar(t.titulo || '')}</span>
        </div>`).join('')}
    </div>
    <p class="cronograma-footer">Nube Eventos</p>`;
}

/* ---------------- descarga imagen / PDF ---------------- */
function hayMomentosParaDescargar() {
  return CRONOGRAMA_ITEMS.some(t => (t.hora || '').trim() || (t.titulo || '').trim());
}

async function descargarCronogramaImagen() {
  if (!hayMomentosParaDescargar()) { mostrarToast('Agrega al menos un momento antes de descargar'); return; }
  if (!window.html2canvas) { mostrarToast('No se pudo cargar el generador de imágenes'); return; }

  const el = document.getElementById('cronograma-preview');
  const canvas = await html2canvas(el, { scale: 3, backgroundColor: null });
  canvas.toBlob(blob => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `itinerario-${PLANTILLA_CRONOGRAMA}.png`;
    a.click();
  });
}

async function descargarCronogramaPDF() {
  if (!hayMomentosParaDescargar()) { mostrarToast('Agrega al menos un momento antes de descargar'); return; }
  if (!window.html2canvas || !window.jspdf) { mostrarToast('No se pudo cargar el generador de PDF'); return; }

  const el = document.getElementById('cronograma-preview');
  const canvas = await html2canvas(el, { scale: 3, backgroundColor: '#ffffff' });
  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const anchoMM = 100;
  const altoMM = anchoMM * (canvas.height / canvas.width);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [anchoMM, altoMM] });
  pdf.addImage(imgData, 'PNG', 0, 0, anchoMM, altoMM);
  pdf.save(`itinerario-${PLANTILLA_CRONOGRAMA}.pdf`);
}

/* ============================================================ CHECKLIST = */
async function cargarChecklistDatos() {
  const data = await rpc('panel_listar_checklist', { p_codigo: CODIGO });
  if (data?.error) return;
  CHECKLIST_ITEMS = data.tareas || [];
  pintarChecklist();
}

function pintarChecklist() {
  const cont = document.getElementById('lista-checklist');
  if (!cont) return;

  if (!CHECKLIST_ITEMS.length) {
    cont.innerHTML = `<p class="desc">No tienes tareas todavía. Agrega la primera arriba.</p>`;
  } else {
    cont.innerHTML = CHECKLIST_ITEMS.map((t, i) => `
      <div class="checklist-item ${t.hecha ? 'completada' : ''}">
        <input type="checkbox" ${t.hecha ? 'checked' : ''} onchange="toggleTarea('${t.id}', this.checked)">
        <span class="checklist-texto">${escapar(t.texto)}</span>
        <div class="checklist-item-acciones">
          <button type="button" title="Subir" ${i === 0 ? 'disabled' : ''} onclick="moverTarea(${i},-1)">▲</button>
          <button type="button" title="Bajar" ${i === CHECKLIST_ITEMS.length - 1 ? 'disabled' : ''} onclick="moverTarea(${i},1)">▼</button>
          <button type="button" class="quitar" title="Eliminar" onclick="eliminarTarea('${t.id}')">✕</button>
        </div>
      </div>`).join('');
  }

  actualizarProgresoChecklist();
}

function actualizarProgresoChecklist() {
  const total = CHECKLIST_ITEMS.length;
  const hechas = CHECKLIST_ITEMS.filter(t => t.hecha).length;
  const pct = total ? Math.round((hechas / total) * 100) : 0;
  const barra = document.getElementById('checklist-barra');
  if (barra) barra.style.width = `${pct}%`;
  set('checklist-contador', `${hechas} de ${total} completadas`);
}

async function agregarTarea() {
  const input = document.getElementById('checklist-nuevo-texto');
  const texto = (input.value || '').trim();
  if (!texto) return;

  const res = await rpc('panel_agregar_tarea', { p_codigo: CODIGO, p_texto: texto });
  if (res?.error) return;

  CHECKLIST_ITEMS.push({ id: res.id, texto, hecha: false, orden: res.orden });
  input.value = '';
  pintarChecklist();
}

async function toggleTarea(id, hecha) {
  const item = CHECKLIST_ITEMS.find(t => t.id === id);
  if (item) item.hecha = hecha;
  pintarChecklist();
  await rpc('panel_marcar_tarea', { p_codigo: CODIGO, p_tarea_id: id, p_hecha: hecha });
}

async function eliminarTarea(id) {
  CHECKLIST_ITEMS = CHECKLIST_ITEMS.filter(t => t.id !== id);
  pintarChecklist();
  await rpc('panel_eliminar_tarea', { p_codigo: CODIGO, p_tarea_id: id });
}

async function moverTarea(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= CHECKLIST_ITEMS.length) return;
  [CHECKLIST_ITEMS[i], CHECKLIST_ITEMS[j]] = [CHECKLIST_ITEMS[j], CHECKLIST_ITEMS[i]];
  pintarChecklist();
  await rpc('panel_reordenar_checklist', { p_codigo: CODIGO, p_ids: CHECKLIST_ITEMS.map(t => t.id) });
}
