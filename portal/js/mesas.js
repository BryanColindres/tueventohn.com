// ============================================================================
// PANEL DEL ORGANIZADOR — módulo de Mesas (portal/invitados.html)
// Reutiliza CODIGO y rpc() ya definidos en js/invitados.js (mismo documento).
// Reutiliza INVITADOS (lista completa) y cargarTodo() de invitados.js para
// saber quién ya tiene mesa asignada.
// ============================================================================

let MESAS = [];
let ZONAS = [];
let SALON = { ancho: 980, alto: 520 };
let MESAS_CARGADAS = false;
let ARRASTRE = null; // { tipo, id, ... } — estado del drag en curso

const TAMANO_DEFECTO = { round: { ancho: 150, alto: 150 }, square: { ancho: 150, alto: 150 }, rect: { ancho: 210, alto: 120 } };
const ETIQUETA_ZONA = { pista: '🎵 Pista de baile', barra: '🍸 Barra', entrada: '🚪 Entrada', escenario: '🎤 Escenario / DJ' };

/* ============================================================ CARGA ===== */
window.cargarMesasSiNecesario = async function () {
  if (MESAS_CARGADAS) { renderTodoMesas(); return; }
  await cargarMesasDatos();
  MESAS_CARGADAS = true;
};

async function cargarMesasDatos() {
  const data = await rpc('panel_listar_mesas', { p_codigo: CODIGO });
  if (data.error) return;
  MESAS = data.mesas || [];
  ZONAS = data.zonas || [];
  SALON = data.salon || { ancho: 980, alto: 520 };
  renderTodoMesas();
}

/* ============================================================ GÉNERO ==== */
const NOMBRES_FEMENINOS = new Set(["carmen","pilar","soledad","raquel","ruth","abigail","esther","isis","luz","mar","dolores","guadalupe","itzel","ainhoa","xiomara","alondra","yamileth","yolanda","noemi","jazmin","jazmín","belen","belén","fatima","fátima"]);
const EXCEPCIONES_MASCULINAS = new Set(["lucas","matias","matías","tobias","tobías","elias","elías","isaias","isaías","joshua","jonas","jonás","nicolas","nicolás","andres","andrés","moises","moisés","josue","josué","ezequiel","josé","jose","noe","noé","luca"]);
function detectarGenero(nombreCompleto) {
  const primero = (nombreCompleto || '').trim().split(/\s+/)[0]?.toLowerCase() || '';
  if (NOMBRES_FEMENINOS.has(primero)) return 'F';
  if (EXCEPCIONES_MASCULINAS.has(primero)) return 'M';
  if (primero.endsWith('a') || primero.endsWith('ia')) return 'F';
  return 'M';
}
function iniciales(nombre) { return (nombre || '').split(' ').map(p => p[0]).slice(0, 2).join(''); }

/* ============================================================ GEOMETRÍA = */
function posicionesAsiento(forma, capacidad) {
  const pts = [];
  if (forma === 'round') {
    const r = 41;
    for (let i = 0; i < capacidad; i++) {
      const a = (2 * Math.PI * i) / capacidad - Math.PI / 2;
      pts.push({ left: 50 + r * Math.cos(a), top: 50 + r * Math.sin(a) });
    }
    return pts;
  }
  const w = forma === 'rect' ? 92 : 80, h = forma === 'rect' ? 46 : 80;
  const perim = 2 * (w + h), x0 = (100 - w) / 2, y0 = (100 - h) / 2;
  const caminar = (t) => {
    if (t < w) return { left: x0 + t, top: y0 };
    t -= w; if (t < h) return { left: x0 + w, top: y0 + t };
    t -= h; if (t < w) return { left: x0 + w - t, top: y0 + h };
    t -= w; return { left: x0, top: y0 + h - t };
  };
  for (let i = 0; i < capacidad; i++) pts.push(caminar(((i + 0.5) / capacidad) * perim));
  return pts;
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ============================================================ RENDER ==== */
function renderTodoMesas() {
  const canvas = document.getElementById('canvas-salon');
  canvas.style.width = SALON.ancho + 'px';
  canvas.style.height = SALON.alto + 'px';
  canvas.querySelectorAll('.mesa-en-canvas, .zona-en-canvas').forEach(el => el.remove());
  ZONAS.forEach(z => canvas.appendChild(crearElementoZona(z)));
  MESAS.forEach(m => canvas.appendChild(crearElementoMesa(m)));
  renderSidebarPendientes();
  renderDetalleMesas();
  renderPrintMesas();
}

function crearElementoZona(z) {
  const div = document.createElement('div');
  div.className = `zona-en-canvas zona-tipo-${z.tipo}`;
  div.style.left = z.pos_x + 'px'; div.style.top = z.pos_y + 'px';
  div.style.width = z.ancho + 'px'; div.style.height = z.alto + 'px';
  div.innerHTML = `<span>${ETIQUETA_ZONA[z.tipo]}</span>
    <button class="zona-borrar no-print" onclick="event.stopPropagation();eliminarZona('${z.id}')">✕</button>
    <div class="resize-handle no-print" onmousedown="event.stopPropagation();iniciarRedimensionZona(event,'${z.id}')"></div>`;
  div.onmousedown = (e) => { if (e.target.closest('button,.resize-handle')) return; iniciarArrastreZona(e, z); };
  return div;
}

function crearElementoMesa(m) {
  const wrap = document.createElement('div');
  wrap.className = 'mesa-en-canvas';
  wrap.style.left = m.pos_x + 'px'; wrap.style.top = m.pos_y + 'px'; wrap.style.width = m.ancho + 'px';

  const ocupadas = m.asientos.length;
  const llena = ocupadas >= m.capacidad;

  const header = document.createElement('div');
  header.className = 'mesa-header';
  header.innerHTML = `
    <span class="no-print">⠿</span>
    ${m.es_novios ? '<span>♛</span>' : ''}
    <span class="nombre" title="${escaparTexto(m.nombre)}">${escaparTexto(m.nombre)}</span>
    <span class="badge-ocupacion ${llena ? 'llena' : ''}">${ocupadas}/${m.capacidad}</span>
    <span class="no-print" style="margin-left:auto;display:flex;gap:4px">
      <button onclick="event.stopPropagation();togglePopoverForma('${m.id}')" title="Cambiar forma">⬡</button>
      ${!m.es_novios ? `<button onclick="event.stopPropagation();eliminarMesa('${m.id}')" title="Eliminar">🗑</button>` : ''}
    </span>
  `;
  header.onmousedown = (e) => { if (e.target.closest('button')) return; iniciarArrastreMesa(e, m); };
  wrap.appendChild(header);

  const popover = document.createElement('div');
  popover.id = `popover-forma-${m.id}`;
  popover.className = 'menu-flotante oculto no-print';
  popover.style.top = '28px'; popover.style.right = '0'; popover.style.left = 'auto';
  popover.innerHTML = `
    <button onclick="cambiarFormaMesa('${m.id}','round')">◯ Redonda</button>
    <button onclick="cambiarFormaMesa('${m.id}','square')">▢ Cuadrada</button>
    <button onclick="cambiarFormaMesa('${m.id}','rect')">▭ Rectangular</button>`;
  wrap.appendChild(popover);

  const shape = document.createElement('div');
  shape.className = `mesa-shape forma-${m.forma}`;
  shape.style.width = m.ancho + 'px'; shape.style.height = m.alto + 'px';
  shape.onmousedown = (e) => { if (e.target.closest('.asiento,.resize-handle')) return; iniciarArrastreMesa(e, m); };
  shape.ondragover = (e) => { e.preventDefault(); shape.classList.add('sobre-drop'); };
  shape.ondragleave = () => shape.classList.remove('sobre-drop');
  shape.ondrop = (e) => { e.preventDefault(); shape.classList.remove('sobre-drop'); soltarEnMesa(e, m.id); };

  if (m.forma === 'round') {
    const centro = document.createElement('div');
    centro.className = 'mesa-centro';
    centro.textContent = m.es_novios ? '♥' : m.nombre.replace('Mesa ', '');
    shape.appendChild(centro);
  }

  posicionesAsiento(m.forma, m.capacidad).forEach((pos, i) => {
    const ocupante = m.asientos.find(a => a.asiento_index === i);
    const dot = document.createElement('div');
    dot.className = `asiento ${ocupante ? 'ocupado' : 'vacio'}`;
    dot.style.left = pos.left + '%'; dot.style.top = pos.top + '%';
    dot.dataset.asiento = i;
    if (ocupante) {
      const genero = detectarGenero(ocupante.nombre);
      dot.style.background = genero === 'F' ? 'var(--rosa-suave)' : 'var(--celeste-claro)';
      dot.style.color = genero === 'F' ? '#9C5F5A' : 'var(--celeste-oscuro)';
      dot.textContent = iniciales(ocupante.nombre);
      dot.title = `${ocupante.nombre} (clic para quitar)`;
      dot.onclick = () => quitarAsiento(ocupante.invitado_id);
    } else {
      dot.title = `Asiento ${i + 1} — vacío`;
    }
    dot.ondragover = (e) => { e.preventDefault(); e.stopPropagation(); };
    dot.ondrop = (e) => { e.preventDefault(); e.stopPropagation(); soltarEnAsiento(e, m.id, i); };
    shape.appendChild(dot);
  });

  const resize = document.createElement('div');
  resize.className = 'resize-handle no-print';
  resize.title = 'Arrastra para cambiar el tamaño';
  resize.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); iniciarRedimensionMesa(e, m); };
  shape.appendChild(resize);

  wrap.appendChild(shape);
  return wrap;
}

/* ============================================================ DRAG ====== */
document.addEventListener('mousemove', (e) => {
  if (!ARRASTRE) return;
  const canvas = document.getElementById('canvas-salon');
  const rect = canvas.getBoundingClientRect();

  if (ARRASTRE.tipo === 'mesa') {
    const m = MESAS.find(x => x.id === ARRASTRE.id);
    let nx = clamp(e.clientX - rect.left - ARRASTRE.offsetX, 0, SALON.ancho - m.ancho);
    let ny = clamp(e.clientY - rect.top - ARRASTRE.offsetY, 0, SALON.alto - m.alto - 24);
    let pegada = false;
    MESAS.forEach(o => {
      if (o.id === m.id) return;
      const th = 14;
      const solapaV = ny < o.pos_y + o.alto && ny + m.alto > o.pos_y;
      if (solapaV) {
        if (Math.abs(nx + m.ancho - o.pos_x) < th) { nx = o.pos_x - m.ancho; pegada = true; }
        else if (Math.abs(nx - (o.pos_x + o.ancho)) < th) { nx = o.pos_x + o.ancho; pegada = true; }
      }
      const solapaH = nx < o.pos_x + o.ancho && nx + m.ancho > o.pos_x;
      if (solapaH) {
        if (Math.abs(ny + m.alto - o.pos_y) < th) { ny = o.pos_y - m.alto; pegada = true; }
        else if (Math.abs(ny - (o.pos_y + o.alto)) < th) { ny = o.pos_y + o.alto; pegada = true; }
      }
    });
    m.pos_x = nx; m.pos_y = ny;
    const wrap = document.querySelectorAll('.mesa-en-canvas')[MESAS.indexOf(m)];
    if (wrap) { wrap.style.left = nx + 'px'; wrap.style.top = ny + 'px'; wrap.querySelector('.mesa-shape').classList.toggle('pegada', pegada); }
  } else if (ARRASTRE.tipo === 'resize-mesa') {
    const m = MESAS.find(x => x.id === ARRASTRE.id);
    if (m.forma === 'rect') {
      m.ancho = clamp(ARRASTRE.startAncho + (e.clientX - ARRASTRE.startX), 110, 420);
      m.alto = clamp(ARRASTRE.startAlto + (e.clientY - ARRASTRE.startY), 70, 260);
    } else {
      const delta = Math.max(e.clientX - ARRASTRE.startX, e.clientY - ARRASTRE.startY);
      const ns = clamp(ARRASTRE.startAncho + delta, 90, 320);
      m.ancho = ns; m.alto = ns;
    }
    renderTodoMesas();
  } else if (ARRASTRE.tipo === 'zona') {
    const z = ZONAS.find(x => x.id === ARRASTRE.id);
    z.pos_x = clamp(e.clientX - rect.left - ARRASTRE.offsetX, 0, SALON.ancho - z.ancho);
    z.pos_y = clamp(e.clientY - rect.top - ARRASTRE.offsetY, 0, SALON.alto - z.alto - 24);
    const el = document.querySelectorAll('.zona-en-canvas')[ZONAS.indexOf(z)];
    if (el) { el.style.left = z.pos_x + 'px'; el.style.top = z.pos_y + 'px'; }
  } else if (ARRASTRE.tipo === 'resize-zona') {
    const z = ZONAS.find(x => x.id === ARRASTRE.id);
    z.ancho = Math.max(70, ARRASTRE.startAncho + (e.clientX - ARRASTRE.startX));
    z.alto = Math.max(50, ARRASTRE.startAlto + (e.clientY - ARRASTRE.startY));
    renderTodoMesas();
  } else if (ARRASTRE.tipo === 'resize-canvas') {
    SALON.ancho = Math.max(680, ARRASTRE.startAncho + (e.clientX - ARRASTRE.startX));
    SALON.alto = Math.max(380, ARRASTRE.startAlto + (e.clientY - ARRASTRE.startY));
    const canvasEl = document.getElementById('canvas-salon');
    canvasEl.style.width = SALON.ancho + 'px'; canvasEl.style.height = SALON.alto + 'px';
  }
});

document.addEventListener('mouseup', async () => {
  if (!ARRASTRE) return;
  const tipo = ARRASTRE.tipo, id = ARRASTRE.id;
  ARRASTRE = null;

  if (tipo === 'mesa' || tipo === 'resize-mesa') { await persistirMesa(MESAS.find(m => m.id === id)); }
  else if (tipo === 'zona' || tipo === 'resize-zona') { await persistirZona(ZONAS.find(z => z.id === id)); }
  else if (tipo === 'resize-canvas') { await rpc('panel_guardar_salon', { p_codigo: CODIGO, p_ancho: SALON.ancho, p_alto: SALON.alto }); }
  renderTodoMesas();
});

function iniciarArrastreMesa(e, m) {
  e.preventDefault();
  const rect = document.getElementById('canvas-salon').getBoundingClientRect();
  ARRASTRE = { tipo: 'mesa', id: m.id, offsetX: e.clientX - rect.left - m.pos_x, offsetY: e.clientY - rect.top - m.pos_y };
}
function iniciarRedimensionMesa(e, m) {
  ARRASTRE = { tipo: 'resize-mesa', id: m.id, startAncho: m.ancho, startAlto: m.alto, startX: e.clientX, startY: e.clientY };
}
function iniciarArrastreZona(e, z) {
  const rect = document.getElementById('canvas-salon').getBoundingClientRect();
  ARRASTRE = { tipo: 'zona', id: z.id, offsetX: e.clientX - rect.left - z.pos_x, offsetY: e.clientY - rect.top - z.pos_y };
}
function iniciarRedimensionZona(e, id) {
  const z = ZONAS.find(x => x.id === id);
  ARRASTRE = { tipo: 'resize-zona', id, startAncho: z.ancho, startAlto: z.alto, startX: e.clientX, startY: e.clientY };
}
document.getElementById('canvas-resize-handle').onmousedown = (e) => {
  e.preventDefault();
  ARRASTRE = { tipo: 'resize-canvas', startAncho: SALON.ancho, startAlto: SALON.alto, startX: e.clientX, startY: e.clientY };
};

async function persistirMesa(m) {
  await rpc('panel_guardar_mesa', {
    p_codigo: CODIGO, p_mesa_id: m.id, p_nombre: m.nombre, p_forma: m.forma, p_capacidad: m.capacidad,
    p_es_novios: m.es_novios, p_pos_x: m.pos_x, p_pos_y: m.pos_y, p_ancho: m.ancho, p_alto: m.alto
  });
}
async function persistirZona(z) {
  await rpc('panel_guardar_zona', {
    p_codigo: CODIGO, p_zona_id: z.id, p_tipo: z.tipo, p_etiqueta: z.etiqueta,
    p_pos_x: z.pos_x, p_pos_y: z.pos_y, p_ancho: z.ancho, p_alto: z.alto
  });
}

/* ============================================================ FORMA ===== */
function togglePopoverForma(id) {
  document.querySelectorAll('.menu-flotante').forEach(el => { if (el.id !== `popover-forma-${id}`) el.classList.add('oculto'); });
  document.getElementById(`popover-forma-${id}`).classList.toggle('oculto');
}
async function cambiarFormaMesa(id, forma) {
  const m = MESAS.find(x => x.id === id);
  m.forma = forma;
  document.getElementById(`popover-forma-${id}`).classList.add('oculto');
  await persistirMesa(m);
  renderTodoMesas();
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('[onclick*="togglePopoverForma"]')) {
    document.querySelectorAll('.menu-flotante').forEach(el => el.classList.add('oculto'));
  }
});

/* ============================================================ CRUD MESA = */
function abrirModalMesa() {
  document.getElementById('mesa-id').value = '';
  document.getElementById('mesa-nombre').value = `Mesa ${MESAS.filter(m => !m.es_novios).length + 1}`;
  document.getElementById('mesa-capacidad').value = 8;
  document.getElementById('mesa-capacidad-valor').textContent = 8;
  document.getElementById('mesa-es-novios').checked = false;
  elegirForma('round');
  document.getElementById('modal-mesa').classList.remove('oculto');
}
function cerrarModalMesa() { document.getElementById('modal-mesa').classList.add('oculto'); }
function elegirForma(forma) {
  document.querySelectorAll('.forma-op').forEach(b => b.classList.toggle('activo', b.dataset.forma === forma));
}
async function guardarMesaNueva() {
  const nombre = document.getElementById('mesa-nombre').value.trim();
  if (!nombre) { mostrarToast('Ponle un nombre a la mesa'); return; }
  const forma = document.querySelector('.forma-op.activo').dataset.forma;
  const capacidad = Number(document.getElementById('mesa-capacidad').value);
  const esNovios = document.getElementById('mesa-es-novios').checked;
  const tam = TAMANO_DEFECTO[forma];
  const n = MESAS.length;

  const res = await rpc('panel_guardar_mesa', {
    p_codigo: CODIGO, p_mesa_id: null, p_nombre: nombre, p_forma: forma, p_capacidad: capacidad,
    p_es_novios: esNovios, p_pos_x: 40 + (n % 4) * 60, p_pos_y: 40 + Math.floor(n / 4) * 60,
    p_ancho: tam.ancho, p_alto: tam.alto
  });
  if (res.ok) { cerrarModalMesa(); await cargarMesasDatos(); mostrarToast('Mesa creada'); }
}
async function eliminarMesa(id) {
  if (!confirm('¿Eliminar esta mesa? Los invitados sentados quedarán sin mesa.')) return;
  const res = await rpc('panel_eliminar_mesa', { p_codigo: CODIGO, p_mesa_id: id });
  if (res.ok) { await cargarMesasDatos(); await window.cargarTodo(); mostrarToast('Mesa eliminada'); }
}

/* ============================================================ CRUD ZONA = */
function toggleMenuZona() { document.getElementById('menu-zona').classList.toggle('oculto'); }
async function agregarZona(tipo) {
  document.getElementById('menu-zona').classList.add('oculto');
  const res = await rpc('panel_guardar_zona', {
    p_codigo: CODIGO, p_zona_id: null, p_tipo: tipo, p_etiqueta: ETIQUETA_ZONA[tipo].replace(/^\S+\s/, ''),
    p_pos_x: 30, p_pos_y: 30, p_ancho: tipo === 'pista' ? 220 : (tipo === 'escenario' || tipo === 'barra' ? 170 : 110),
    p_alto: tipo === 'pista' ? 180 : (tipo === 'entrada' ? 50 : (tipo === 'barra' ? 60 : 70))
  });
  if (res.ok) await cargarMesasDatos();
}
async function eliminarZona(id) {
  const res = await rpc('panel_eliminar_zona', { p_codigo: CODIGO, p_zona_id: id });
  if (res.ok) await cargarMesasDatos();
}

/* ============================================================ ASIENTOS == */
function soltarEnMesa(e, mesaId) {
  const payload = leerPayloadDrag(e);
  if (!payload) return;
  asignarAsientoAuto(payload.invitado_id, mesaId);
}
function soltarEnAsiento(e, mesaId, asientoIndex) {
  const payload = leerPayloadDrag(e);
  if (!payload) return;
  asignarAsiento(payload.invitado_id, mesaId, asientoIndex);
}
function leerPayloadDrag(e) {
  try { return JSON.parse(e.dataTransfer.getData('text/plain')); } catch { return null; }
}
async function asignarAsientoAuto(invitadoId, mesaId) {
  const m = MESAS.find(x => x.id === mesaId);
  const ocupados = new Set(m.asientos.map(a => a.asiento_index));
  let libre = -1;
  for (let i = 0; i < m.capacidad; i++) if (!ocupados.has(i)) { libre = i; break; }
  if (libre === -1) { mostrarToast(`${m.nombre} está completa`); return; }
  await asignarAsiento(invitadoId, mesaId, libre);
}
async function asignarAsiento(invitadoId, mesaId, asientoIndex) {
  const res = await rpc('panel_asignar_asiento', { p_codigo: CODIGO, p_invitado_id: invitadoId, p_mesa_id: mesaId, p_asiento_index: asientoIndex });
  if (res.ok) { await cargarMesasDatos(); await window.cargarTodo(); }
}
async function quitarAsiento(invitadoId) {
  const res = await rpc('panel_quitar_asiento', { p_codigo: CODIGO, p_invitado_id: invitadoId });
  if (res.ok) { await cargarMesasDatos(); await window.cargarTodo(); }
}

/* ============================================================ SIDEBAR === */
function renderSidebarPendientes() {
  const cont = document.getElementById('lista-pendientes');
  if (!cont) return;
  const busqueda = (document.getElementById('buscar-pendiente')?.value || '').toLowerCase();
  const sentadosIds = new Set(MESAS.flatMap(m => m.asientos.map(a => a.invitado_id)));
  const pendientes = (INVITADOS || []).filter(g =>
    g.estado === 'confirmado' && !sentadosIds.has(g.id) && g.nombre.toLowerCase().includes(busqueda)
  );

  if (!pendientes.length) { cont.innerHTML = `<p class="desc" style="font-size:.75rem">Todos los confirmados tienen mesa.</p>`; return; }

  cont.innerHTML = pendientes.map(g => {
    const genero = detectarGenero(g.nombre);
    return `<div class="chip-invitado" draggable="true" ondragstart="event.dataTransfer.setData('text/plain', JSON.stringify({invitado_id:'${g.id}'}))">
      <span class="genero-dot ${genero === 'F' ? 'genero-f' : 'genero-m'}">${genero === 'F' ? '♀' : '♂'}</span>
      <span>${escaparTexto(g.nombre)}</span>
    </div>`;
  }).join('');
}

function renderDetalleMesas() {
  const cont = document.getElementById('detalle-mesas');
  if (!cont) return;
  cont.innerHTML = MESAS.map(m => {
    const filas = [];
    for (let i = 0; i < m.capacidad; i++) {
      const oc = m.asientos.find(a => a.asiento_index === i);
      if (oc) {
        filas.push(`<div class="fila-asiento con-invitado" draggable="true"
            ondragstart="event.dataTransfer.setData('text/plain', JSON.stringify({invitado_id:'${oc.invitado_id}'}))">
          <span class="num">${i + 1}</span><span>${escaparTexto(oc.nombre)}</span>
          <button class="quitar-asiento" onclick="quitarAsiento('${oc.invitado_id}')">✕</button>
        </div>`);
      } else {
        filas.push(`<div class="fila-asiento vacia" ondragover="event.preventDefault()"
            ondrop="event.preventDefault();soltarEnAsiento(event,'${m.id}',${i})">
          <span class="num">${i + 1}</span><span>vacío — arrastra aquí</span>
        </div>`);
      }
    }
    return `<div class="mesa-detalle-grupo"><div class="mesa-detalle-titulo">${m.es_novios ? '♛ ' : ''}${escaparTexto(m.nombre)}</div>${filas.join('')}</div>`;
  }).join('');
}

/* ============================================================ IMPRIMIR == */
function renderPrintMesas() {
  const cont = document.getElementById('print-mesas');
  if (!cont) return;
  const sentadosIds = new Set(MESAS.flatMap(m => m.asientos.map(a => a.invitado_id)));
  const pendientes = (INVITADOS || []).filter(g => g.estado === 'confirmado' && !sentadosIds.has(g.id));

  let html = `<h2 style="font-family:var(--font-display);font-style:italic">Distribución de Mesas</h2>`;
  MESAS.forEach(m => {
    html += `<div style="margin-bottom:16px"><div style="border-bottom:1.5px solid var(--celeste-oscuro);padding-bottom:4px;margin-bottom:6px">
      <strong>${escaparTexto(m.nombre)}</strong> — ${m.asientos.length}/${m.capacidad}</div>`;
    if (!m.asientos.length) html += `<p style="font-style:italic;color:#888">Sin invitados asignados</p>`;
    else html += `<ol>${m.asientos.sort((a,b)=>a.asiento_index-b.asiento_index).map(a => `<li>${escaparTexto(a.nombre)}</li>`).join('')}</ol>`;
    html += `</div>`;
  });
  if (pendientes.length) {
    html += `<div><div style="border-bottom:1.5px solid var(--rosa);padding-bottom:4px;margin-bottom:6px"><strong>Pendientes de asignar</strong></div>
      <ol>${pendientes.map(g => `<li>${escaparTexto(g.nombre)}</li>`).join('')}</ol></div>`;
  }
  cont.innerHTML = html;
}

/* ============================================================ EXCEL ===== */
function exportarExcelMesas() {
  const filas = [];
  MESAS.forEach(m => {
    filas.push([`${m.nombre}${m.es_novios ? ' (Mesa de honor)' : ''}`, `Capacidad ${m.asientos.length}/${m.capacidad}`]);
    filas.push(['Nombre']);
    m.asientos.sort((a, b) => a.asiento_index - b.asiento_index).forEach(a => filas.push([a.nombre]));
    filas.push([]);
  });
  const sentadosIds = new Set(MESAS.flatMap(m => m.asientos.map(a => a.invitado_id)));
  const pendientes = (INVITADOS || []).filter(g => g.estado === 'confirmado' && !sentadosIds.has(g.id));
  if (pendientes.length) { filas.push(['Pendientes de asignar']); pendientes.forEach(g => filas.push([g.nombre])); }

  const ws = XLSX.utils.aoa_to_sheet(filas);
  ws['!cols'] = [{ wch: 32 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Distribución de Mesas');
  XLSX.writeFile(wb, 'distribucion-mesas.xlsx');
}

/* ============================================================ UTILS ===== */
function escaparTexto(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; }
