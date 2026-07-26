// ============================================================================
// PANEL DEL ORGANIZADOR — módulo de Itinerario (portal/invitados.html)
// Reutiliza CODIGO, rpc(), escapar(), mostrarToast() y set() ya definidos en
// js/invitados.js (mismo documento).
//
// El cronograma es INDEPENDIENTE del contenido de la invitación (no usa
// portal_guardar_timeline / datos.timeline): vive en sus propias tablas
// (itinerario_bloques / itinerario_items, vía panel_obtener_itinerario /
// panel_guardar_itinerario) porque no todos los clientes llenan el
// itinerario en el contenido de su invitación. Solo se reutiliza
// portal_obtener_evento para los nombres y la fecha (eso sí lo llenan todos
// desde el principio, en "Datos principales").
//
// El checklist vive en su propia tabla (tareas_planeacion), también nueva.
// ============================================================================

let BLOQUES = [];           // [{ titulo, items: [{hora, titulo}] }]
let CHECKLIST_ITEMS = [];
let EVENTO_INFO = {};
let ITINERARIO_CARGADO = false;
let PLANTILLA_CRONOGRAMA = 'clasico';
let PLANTILLA_CHECKLIST = 'clasico';

// Fondo real de cada plantilla, para que html2canvas capture el color
// correcto incluso si el navegador tarda en pintar el CSS.
const FONDOS_PLANTILLA = { clasico: '#ffffff', floral: '#F6E4E2', moderno: '#123A54' };

window.cargarItinerarioSiNecesario = async function () {
  if (ITINERARIO_CARGADO) return;
  await cargarEventoInfo();
  await Promise.all([cargarCronogramaDatos(), cargarChecklistDatos()]);
  ITINERARIO_CARGADO = true;
};

function cambiarSubTabItinerario(tab) {
  document.querySelectorAll('#tab-itinerario .gen-tab').forEach(b => b.classList.toggle('activo', b.dataset.tab === tab));
  document.getElementById('itin-sub-cronograma').classList.toggle('oculto', tab !== 'cronograma');
  document.getElementById('itin-sub-checklist').classList.toggle('oculto', tab !== 'checklist');
}

/* ---------------- info del evento (nombres y fecha, para los encabezados) */
async function cargarEventoInfo() {
  const datos = await rpc('portal_obtener_evento', { p_codigo: CODIGO });
  if (!datos || datos.error) return;
  EVENTO_INFO = datos;
}

function nombresEvento() {
  return [EVENTO_INFO.novioANombre, EVENTO_INFO.novioBNombre].filter(Boolean).join(' & ');
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

/* ============================================================ CRONOGRAMA = */
async function cargarCronogramaDatos() {
  const data = await rpc('panel_obtener_itinerario', { p_codigo: CODIGO });
  if (data?.error) return;
  BLOQUES = (data.bloques || []).map(b => ({ titulo: b.titulo || '', items: (b.items || []).map(t => ({ hora: t.hora || '', titulo: t.titulo || '' })) }));
  pintarBloquesItinerario();
  actualizarPreviewCronograma();
}

function pintarBloquesItinerario() {
  const cont = document.getElementById('lista-bloques-itinerario');
  if (!cont) return;

  if (!BLOQUES.length) {
    cont.innerHTML = `<p class="desc">Agrega una sección para empezar (por ejemplo "Ceremonia" o una sola sección general).</p>`;
    return;
  }

  cont.innerHTML = BLOQUES.map((b, bi) => `
    <div class="itin-bloque">
      <div class="itin-bloque-encabezado">
        <input type="text" class="itin-bloque-titulo" value="${escapar(b.titulo || '')}" placeholder="Nombre de la sección (ej. Ceremonia)"
          oninput="BLOQUES[${bi}].titulo=this.value; actualizarPreviewCronograma()">
        <button type="button" class="quitar" title="Eliminar sección" onclick="quitarBloqueItinerario(${bi})">✕</button>
      </div>

      <div class="itin-bloque-items">
        ${b.items.length ? b.items.map((t, ii) => `
          <div class="cronograma-item-editor">
            <input type="text" value="${escapar(t.hora || '')}" placeholder="6:00 PM"
              oninput="BLOQUES[${bi}].items[${ii}].hora=this.value; actualizarPreviewCronograma()">
            <input type="text" value="${escapar(t.titulo || '')}" placeholder="Ej. Entrada de los novios"
              oninput="BLOQUES[${bi}].items[${ii}].titulo=this.value; actualizarPreviewCronograma()">
            <div class="cronograma-item-editor-acciones">
              <button type="button" title="Subir" ${ii === 0 ? 'disabled' : ''} onclick="moverMomentoItinerario(${bi},${ii},-1)">▲</button>
              <button type="button" title="Bajar" ${ii === b.items.length - 1 ? 'disabled' : ''} onclick="moverMomentoItinerario(${bi},${ii},1)">▼</button>
              <button type="button" class="quitar" title="Quitar" onclick="quitarMomentoItinerario(${bi},${ii})">✕</button>
            </div>
          </div>`).join('') : `<p class="desc" style="margin:.2rem 0 .8rem">Sin momentos todavía.</p>`}
      </div>

      <button type="button" class="btn btn-outline btn-chico" onclick="agregarMomentoItinerario(${bi})">+ Agregar momento</button>
    </div>`).join('');
}

function agregarBloqueItinerario(nombreSugerido) {
  BLOQUES.push({ titulo: nombreSugerido || `Sección ${BLOQUES.length + 1}`, items: [] });
  pintarBloquesItinerario();
  actualizarPreviewCronograma();
}
function quitarBloqueItinerario(bi) {
  BLOQUES.splice(bi, 1);
  pintarBloquesItinerario();
  actualizarPreviewCronograma();
}
function agregarMomentoItinerario(bi) {
  BLOQUES[bi].items.push({ hora: '', titulo: '' });
  pintarBloquesItinerario();
  actualizarPreviewCronograma();
}
function quitarMomentoItinerario(bi, ii) {
  BLOQUES[bi].items.splice(ii, 1);
  pintarBloquesItinerario();
  actualizarPreviewCronograma();
}
function moverMomentoItinerario(bi, ii, dir) {
  const items = BLOQUES[bi].items;
  const jj = ii + dir;
  if (jj < 0 || jj >= items.length) return;
  [items[ii], items[jj]] = [items[jj], items[ii]];
  pintarBloquesItinerario();
  actualizarPreviewCronograma();
}

async function guardarItinerario() {
  const res = await rpc('panel_guardar_itinerario', { p_codigo: CODIGO, p_bloques: BLOQUES });
  if (res?.error) return;
  mostrarToast('Itinerario guardado');
}

/* ---------------- plantillas y vista previa ---------------- */
function elegirPlantillaCronograma(tpl) {
  PLANTILLA_CRONOGRAMA = tpl;
  document.querySelectorAll('#plantilla-picker-cronograma .plantilla-op').forEach(b => b.classList.toggle('activo', b.dataset.tpl === tpl));
  const preview = document.getElementById('cronograma-preview');
  if (preview) preview.className = `cronograma-tarjeta tpl-${tpl}`;
  const botones = document.getElementById('cronograma-descarga-botones');
  if (botones) botones.className = `cronograma-descarga-botones tpl-btn-${tpl}`;
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

function actualizarPreviewCronograma() {
  const preview = document.getElementById('cronograma-preview');
  if (!preview) return;

  const bloquesConItems = BLOQUES
    .map(b => ({ titulo: b.titulo, items: b.items.filter(t => (t.hora || '').trim() || (t.titulo || '').trim()) }))
    .filter(b => b.items.length);

  const nombres = nombresEvento();
  const fecha = formatearFechaBonita(EVENTO_INFO.fecha);

  if (!bloquesConItems.length) {
    preview.innerHTML = `<p class="desc" style="margin:0">Agrega momentos al itinerario para ver la vista previa aquí.</p>`;
    return;
  }

  const soloUnaSeccion = bloquesConItems.length === 1;

  preview.innerHTML = `
    <div class="cronograma-header">
      <p class="cronograma-eyebrow">Itinerario del día</p>
      <h3>${escapar(nombres) || 'Nuestra boda'}</h3>
      ${fecha ? `<p class="cronograma-fecha">${escapar(fecha)}</p>` : ''}
    </div>
    ${bloquesConItems.map(b => `
      <div class="cronograma-bloque">
        ${!soloUnaSeccion ? `<p class="cronograma-bloque-titulo">${escapar(b.titulo || '')}</p>` : ''}
        <div class="cronograma-lista">
          ${b.items.map(t => `
            <div class="cronograma-item">
              <span class="cronograma-item-icono">${emojiPorTitulo(t.titulo)}</span>
              <span class="cronograma-item-hora">${escapar(t.hora || '')}</span>
              <span class="cronograma-item-titulo">${escapar(t.titulo || '')}</span>
            </div>`).join('')}
        </div>
      </div>`).join('')}
    <p class="cronograma-footer">Nube Eventos</p>`;
}

/* ---------------- descarga imagen / PDF (cronograma) ---------------- */
function hayMomentosParaDescargar() {
  return BLOQUES.some(b => b.items.some(t => (t.hora || '').trim() || (t.titulo || '').trim()));
}

// Espera a que las fuentes (Playfair Display / Jost) terminen de cargar antes
// de capturar — si no, html2canvas a veces captura con la fuente de respaldo
// a medio pintar y el layout sale corrido.
async function esperarFuentes() {
  try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) { /* no crítico */ }
}

async function capturarElemento(el, plantilla) {
  await esperarFuentes();
  return html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: FONDOS_PLANTILLA[plantilla] || '#ffffff',
    width: el.offsetWidth,
    windowWidth: el.offsetWidth
  });
}

function descargarCanvasComoImagen(canvas, nombreArchivo) {
  canvas.toBlob(blob => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombreArchivo;
    a.click();
  });
}

function descargarCanvasComoPDF(canvas, nombreArchivo) {
  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const anchoMM = 100;
  const altoMM = anchoMM * (canvas.height / canvas.width);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [anchoMM, altoMM] });
  pdf.addImage(imgData, 'PNG', 0, 0, anchoMM, altoMM);
  pdf.save(nombreArchivo);
}

async function descargarCronogramaImagen() {
  if (!hayMomentosParaDescargar()) { mostrarToast('Agrega al menos un momento antes de descargar'); return; }
  if (!window.html2canvas) { mostrarToast('No se pudo cargar el generador de imágenes'); return; }
  const el = document.getElementById('cronograma-preview');
  const canvas = await capturarElemento(el, PLANTILLA_CRONOGRAMA);
  descargarCanvasComoImagen(canvas, `itinerario-${PLANTILLA_CRONOGRAMA}.png`);
}

async function descargarCronogramaPDF() {
  if (!hayMomentosParaDescargar()) { mostrarToast('Agrega al menos un momento antes de descargar'); return; }
  if (!window.html2canvas || !window.jspdf) { mostrarToast('No se pudo cargar el generador de PDF'); return; }
  const el = document.getElementById('cronograma-preview');
  const canvas = await capturarElemento(el, PLANTILLA_CRONOGRAMA);
  descargarCanvasComoPDF(canvas, `itinerario-${PLANTILLA_CRONOGRAMA}.pdf`);
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
  if (cont) {
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
  }

  actualizarProgresoChecklist();
  actualizarPreviewChecklist();
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

/* ---------------- checklist descargable (para imprimir a mano) ---------------- */
function elegirPlantillaChecklist(tpl) {
  PLANTILLA_CHECKLIST = tpl;
  document.querySelectorAll('#plantilla-picker-checklist .plantilla-op').forEach(b => b.classList.toggle('activo', b.dataset.tpl === tpl));
  const preview = document.getElementById('checklist-preview');
  if (preview) preview.className = `checklist-tarjeta tpl-${tpl}`;
  const botones = document.getElementById('checklist-descarga-botones');
  if (botones) botones.className = `cronograma-descarga-botones tpl-btn-${tpl}`;
}

function actualizarPreviewChecklist() {
  const preview = document.getElementById('checklist-preview');
  if (!preview) return;

  const nombres = nombresEvento();
  const fecha = formatearFechaBonita(EVENTO_INFO.fecha);

  if (!CHECKLIST_ITEMS.length) {
    preview.innerHTML = `<p class="desc" style="margin:0">Agrega tareas para ver la vista previa aquí.</p>`;
    return;
  }

  preview.innerHTML = `
    <p class="checklist-tarjeta-eyebrow">Checklist de boda</p>
    <h3>${escapar(nombres) || 'Nuestra boda'}</h3>
    ${fecha ? `<p class="checklist-tarjeta-fecha">${escapar(fecha)}</p>` : ''}
    <div class="checklist-tarjeta-lista">
      ${CHECKLIST_ITEMS.map(t => `<div class="checklist-tarjeta-item"><span class="checklist-tarjeta-caja"></span> ${escapar(t.texto)}</div>`).join('')}
    </div>
    <div class="checklist-tarjeta-notas">
      <div class="checklist-tarjeta-nota"><p>Ideas</p></div>
      <div class="checklist-tarjeta-nota"><p>No olvidar</p></div>
    </div>
    <p class="cronograma-footer">Nube Eventos</p>`;
}

async function descargarChecklistImagen() {
  if (!CHECKLIST_ITEMS.length) { mostrarToast('Agrega al menos una tarea antes de descargar'); return; }
  if (!window.html2canvas) { mostrarToast('No se pudo cargar el generador de imágenes'); return; }
  const el = document.getElementById('checklist-preview');
  const canvas = await capturarElemento(el, PLANTILLA_CHECKLIST);
  descargarCanvasComoImagen(canvas, `checklist-boda-${PLANTILLA_CHECKLIST}.png`);
}

async function descargarChecklistPDF() {
  if (!CHECKLIST_ITEMS.length) { mostrarToast('Agrega al menos una tarea antes de descargar'); return; }
  if (!window.html2canvas || !window.jspdf) { mostrarToast('No se pudo cargar el generador de PDF'); return; }
  const el = document.getElementById('checklist-preview');
  const canvas = await capturarElemento(el, PLANTILLA_CHECKLIST);
  descargarCanvasComoPDF(canvas, `checklist-boda-${PLANTILLA_CHECKLIST}.pdf`);
}
