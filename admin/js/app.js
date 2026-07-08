// ============================================================================
// PANEL ADMINISTRATIVO — lógica de la aplicación
// Router simple por hash (#dashboard, #invitaciones, #crear, #editar/<id>)
// ============================================================================

const estado = {
  tiposEvento: [], plantillas: [], paquetes: [], modulos: [], estados: [],
  wizard: { paso: 1, tipoEventoId: null, plantillaId: null, paqueteId: null, addonsExtra: [] },
  eventoActualId: null
};

document.addEventListener('DOMContentLoaded', () => {
  if (Auth.estaLogueado()) mostrarApp(); else mostrarLogin();
  document.getElementById('form-login').addEventListener('submit', onLogin);
  document.getElementById('btn-logout').addEventListener('click', () => { Auth.logout(); location.reload(); });
  window.addEventListener('hashchange', enrutar);
});

function mostrarLogin(){
  document.getElementById('vista-login').classList.remove('oculto');
  document.getElementById('app-shell').classList.add('oculto');
}

async function mostrarApp(){
  document.getElementById('vista-login').classList.add('oculto');
  document.getElementById('app-shell').classList.remove('oculto');
  await cargarCatalogosBase();
  enrutar();
  // Refresca notificaciones cada 20s mientras el panel está abierto en el dashboard
  // (no es "tiempo real" con websockets, pero evita tener que recargar la página)
  setInterval(() => {
    if (location.hash.slice(1) === 'dashboard' || !location.hash) renderDashboard();
  }, 20000);
}

async function onLogin(e){
  e.preventDefault();
  const correo = document.getElementById('login-correo').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.classList.add('oculto');
  try {
    await Auth.login(correo, password);
    mostrarApp();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('oculto');
  }
}

async function cargarCatalogosBase(){
  [estado.tiposEvento, estado.plantillas, estado.paquetes, estado.modulos, estado.estados] = await Promise.all([
    apiGet('tipos_evento', 'select=*&order=orden.asc'),
    apiGet('plantillas', 'select=*&order=orden.asc'),
    apiGet('paquetes', 'select=*&order=orden.asc'),
    apiGet('modulos', 'select=*'),
    apiGet('estados', 'select=*&order=orden.asc')
  ]);
}

// ---------------- ROUTER ----------------
function enrutar(){
  const hash = location.hash.slice(1) || 'dashboard';
  const [ruta, param] = hash.split('/');

  document.querySelectorAll('.vista').forEach(v => v.classList.add('oculto'));
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('activo'));

  if (ruta === 'dashboard') {
    document.getElementById('vista-dashboard').classList.remove('oculto');
    document.querySelector('[data-vista="dashboard"]')?.classList.add('activo');
    renderDashboard();
  } else if (ruta === 'invitaciones') {
    document.getElementById('vista-invitaciones').classList.remove('oculto');
    document.querySelector('[data-vista="invitaciones"]')?.classList.add('activo');
    renderInvitaciones();
  } else if (ruta === 'clientes') {
    document.getElementById('vista-clientes').classList.remove('oculto');
    document.querySelector('[data-vista="clientes"]')?.classList.add('activo');
    renderClientes();
  } else if (ruta === 'reportes') {
    document.getElementById('vista-reportes').classList.remove('oculto');
    document.querySelector('[data-vista="reportes"]')?.classList.add('activo');
    renderReportes();
  } else if (ruta === 'crear') {
    document.getElementById('vista-crear').classList.remove('oculto');
    document.querySelector('[data-vista="crear"]')?.classList.add('activo');
    iniciarWizard();
  } else if (ruta === 'editar' && param) {
    document.getElementById('vista-editar').classList.remove('oculto');
    renderEditar(param);
  }
}

function mostrarToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('oculto');
  setTimeout(() => t.classList.add('oculto'), 2600);
}

// ---------------- DASHBOARD ----------------
async function renderDashboard(){
  const [eventos, notifs] = await Promise.all([
    apiGet('eventos', 'select=id,publicado,estados(nombre)'),
    apiGet('notificaciones', 'select=*&order=fecha.desc&limit=8')
  ]);

  const publicadas = eventos.filter(e => e.publicado).length;
  const pendientes = eventos.filter(e => !e.publicado).length;

  document.getElementById('dashboard-stats').innerHTML = `
    <div class="stat-card"><p class="valor">${eventos.length}</p><p class="label">Invitaciones totales</p></div>
    <div class="stat-card"><p class="valor">${publicadas}</p><p class="label">Publicadas</p></div>
    <div class="stat-card"><p class="valor">${pendientes}</p><p class="label">Pendientes</p></div>
    <div class="stat-card"><p class="valor">${notifs.filter(n=>!n.leida).length}</p><p class="label">Notificaciones sin leer</p></div>
  `;

  const cont = document.getElementById('dashboard-actividad');
  if (!notifs.length) { cont.innerHTML = '<p style="color:var(--texto-mid)">Sin actividad todavía.</p>'; return; }
  cont.innerHTML = notifs.map(n => `
    <div class="actividad-item">
      <span>${n.mensaje}</span>
      <span class="tiempo">${new Date(n.fecha).toLocaleString('es-HN')}</span>
    </div>`).join('');
}

// ---------------- INVITACIONES ----------------
async function renderInvitaciones(){
  const grid = document.getElementById('eventos-grid');
  grid.innerHTML = '<p style="color:var(--texto-mid)">Cargando...</p>';

  const eventos = await apiGet('eventos',
    'select=id,nombre_evento,publicado,slug_publico,clientes(nombre),plantillas(nombre,slug),paquetes(nombre),estados(nombre,color)&order=created_at.desc');

  if (!eventos.length) { grid.innerHTML = '<p style="color:var(--texto-mid)">Todavía no hay invitaciones. Crea la primera.</p>'; return; }

  grid.innerHTML = eventos.map(ev => `
    <div class="evento-card">
      <p class="nombre">${ev.nombre_evento || '(sin nombre)'}</p>
      <div class="meta">
        <span class="tag">${ev.clientes?.nombre || ''}</span>
        <span class="tag">${ev.plantillas?.nombre || ''}</span>
        <span class="tag">${ev.paquetes?.nombre || ''}</span>
        <span class="tag estado" style="background:${ev.estados?.color || '#666'}">${ev.estados?.nombre || ''}</span>
      </div>
      <div class="acciones">
        <a href="#editar/${ev.id}" class="btn btn-fantasma">Editar</a>
        <button class="btn btn-fantasma" onclick="duplicarEvento('${ev.id}')">Duplicar</button>
        ${ev.publicado ? `<a href="../templates/${ev.plantillas?.slug || ''}/index.html?evento=${ev.slug_publico}" target="_blank" class="btn btn-dorado">Ver</a>` : ''}
      </div>
    </div>`).join('');

  document.getElementById('buscador-eventos').oninput = (e) => {
    const q = e.target.value.toLowerCase();
    grid.querySelectorAll('.evento-card').forEach(card => {
      card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };
}

// ---------------- WIZARD DE CREACIÓN ----------------
function iniciarWizard(){
  estado.wizard = { paso: 1, tipoEventoId: null, plantillaId: null, paqueteId: null, addonsExtra: [] };
  mostrarPasoWizard(1);

  document.getElementById('wizard-tipos').innerHTML = estado.tiposEvento.map(t => `
    <div class="opcion-card" data-id="${t.id}" onclick="seleccionarWizard('tipoEventoId','${t.id}',this)">
      <p class="titulo">${t.nombre}</p>
    </div>`).join('');

  document.getElementById('wizard-plantillas').innerHTML = estado.plantillas.map(p => `
    <div class="opcion-card" data-id="${p.id}" onclick="seleccionarWizard('plantillaId','${p.id}',this)">
      <p class="titulo">${p.nombre}</p>
      <p class="desc">${p.tagline || ''}</p>
    </div>`).join('');

  document.getElementById('wizard-paquetes').innerHTML = estado.paquetes.map(p => `
    <div class="opcion-card" data-id="${p.id}" onclick="seleccionarWizard('paqueteId','${p.id}',this)">
      <p class="titulo">${p.nombre}</p>
      <p class="desc">L. ${Number(p.precio).toLocaleString('es-HN')}</p>
    </div>`).join('');

  document.getElementById('wizard-btn-atras').onclick = () => cambiarPasoWizard(-1);
  document.getElementById('wizard-btn-siguiente').onclick = onWizardSiguiente;
}

window.seleccionarWizard = function(campo, id, el){
  estado.wizard[campo] = id;
  el.parentElement.querySelectorAll('.opcion-card').forEach(c => c.classList.remove('seleccionada'));
  el.classList.add('seleccionada');
};

function mostrarPasoWizard(n){
  for (let i = 1; i <= 5; i++) {
    document.getElementById(`wizard-paso-${i}`).classList.toggle('oculto', i !== n);
    document.querySelector(`.wizard-paso[data-paso="${i}"]`).classList.toggle('activo', i === n);
    document.querySelector(`.wizard-paso[data-paso="${i}"]`).classList.toggle('completo', i < n);
  }
  document.getElementById('wizard-btn-atras').style.visibility = n === 1 ? 'hidden' : 'visible';
  document.getElementById('wizard-btn-siguiente').textContent = n === 5 ? 'Crear invitación' : 'Siguiente';

  if (n === 4) pintarWizardAddons();
}

async function pintarWizardAddons(){
  const cont = document.getElementById('wizard-addons');
  cont.innerHTML = '<p style="color:var(--texto-mid)">Cargando...</p>';

  const paqueteElegido = estado.paquetes.find(p => p.id === estado.wizard.paqueteId);
  const esPremium = paqueteElegido && paqueteElegido.nombre === 'Premium';

  const incluidosEnPaquete = await apiGet('paquete_modulo', `paquete_id=eq.${estado.wizard.paqueteId}&select=modulo_id`);
  const idsIncluidos = new Set(incluidosEnPaquete.map(i => i.modulo_id));

  let modulosAMostrar;
  if (esPremium) {
    // Premium: se muestra TODO, ya pre-marcado (puede desmarcar si quiere quitar algo)
    modulosAMostrar = estado.modulos;
    modulosAMostrar.forEach(m => {
      if (!estado.wizard.addonsExtra.includes(m.id)) estado.wizard.addonsExtra.push(m.id);
    });
  } else {
    // Básico / Estándar: solo se muestra lo que NO viene ya incluido en el paquete
    modulosAMostrar = estado.modulos.filter(m => !idsIncluidos.has(m.id));
  }

  if (!modulosAMostrar.length) {
    cont.innerHTML = '<p style="color:var(--texto-mid)">Este paquete ya incluye todos los módulos disponibles.</p>';
    return;
  }

  cont.innerHTML = modulosAMostrar.map(m => `
    <div class="opcion-card ${estado.wizard.addonsExtra.includes(m.id) ? 'seleccionada' : ''}" data-id="${m.id}" onclick="toggleWizardAddon('${m.id}', this)">
      <p class="titulo">${m.nombre}</p>
      <p class="desc">L. ${Number(m.precio).toLocaleString('es-HN')}</p>
    </div>`).join('');
}

window.toggleWizardAddon = function(id, el){
  const i = estado.wizard.addonsExtra.indexOf(id);
  if (i === -1) estado.wizard.addonsExtra.push(id); else estado.wizard.addonsExtra.splice(i, 1);
  el.classList.toggle('seleccionada');
};

function cambiarPasoWizard(delta){
  const nuevo = estado.wizard.paso + delta;
  if (nuevo < 1 || nuevo > 5) return;
  estado.wizard.paso = nuevo;
  mostrarPasoWizard(nuevo);
}

async function onWizardSiguiente(){
  const w = estado.wizard;
  if (w.paso === 1 && !w.tipoEventoId) return mostrarToast('Elige un tipo de evento');
  if (w.paso === 2 && !w.plantillaId) return mostrarToast('Elige una plantilla');
  if (w.paso === 3 && !w.paqueteId) return mostrarToast('Elige un paquete');

  if (w.paso < 5) { cambiarPasoWizard(1); return; }

  // paso 5: crear todo
  const nombreCliente = document.getElementById('wizard-cliente-nombre').value.trim();
  const telefono = document.getElementById('wizard-cliente-telefono').value.trim();
  const correo = document.getElementById('wizard-cliente-correo').value.trim();
  const nombreEvento = document.getElementById('wizard-nombre-evento').value.trim();
  if (!nombreCliente || !nombreEvento) return mostrarToast('Faltan campos obligatorios');

  try {
    const [cliente] = await apiPost('clientes', [{ nombre: nombreCliente, telefono, correo }]);

    let slug = generarSlug(nombreEvento);
    const existentes = await apiGet('eventos', `slug_publico=eq.${slug}&select=id`);
    if (existentes.length) slug = `${slug}-${Math.floor(Math.random()*90+10)}`;

    const codigoPortal = generarCodigoPortal();
    const estadoInicial = estado.estados.find(e => e.nombre === 'Esperando Información');

    const [evento] = await apiPost('eventos', [{
      tipo_evento_id: w.tipoEventoId,
      plantilla_id: w.plantillaId,
      cliente_id: cliente.id,
      paquete_id: w.paqueteId,
      estado_id: estadoInicial.id,
      slug_publico: slug,
      codigo_portal: codigoPortal,
      nombre_evento: nombreEvento
    }]);

    // activar módulos del paquete elegido
    const paqueteElegido = estado.paquetes.find(p => p.id === w.paqueteId);
    const modulosPaquete = await apiGet('paquete_modulo', `paquete_id=eq.${w.paqueteId}&select=modulo_id`);
    const idsActivar = (paqueteElegido && paqueteElegido.nombre === 'Premium')
      ? new Set(w.addonsExtra) // en Premium, lo que quede marcado en el paso 4 es la lista final (si desmarcan algo, se respeta)
      : new Set([...modulosPaquete.map(m => m.modulo_id), ...w.addonsExtra]);
    const filasEventoModulo = [...idsActivar].map(modulo_id => ({ evento_id: evento.id, modulo_id, activo: true }));
    if (filasEventoModulo.length) await apiPost('evento_modulo', filasEventoModulo);

    mostrarToast('Invitación creada');
    location.hash = `#editar/${evento.id}`;
  } catch (err) {
    console.error(err);
    mostrarToast('Error al crear la invitación');
  }
}

// ---------------- EDITAR EVENTO ----------------
async function renderEditar(id){
  estado.eventoActualId = id;
  const [evento] = await apiGet('eventos', `id=eq.${id}&select=*,clientes(*),estados(*)`);
  if (!evento) { mostrarToast('Invitación no encontrada'); location.hash = '#invitaciones'; return; }

  document.getElementById('editar-titulo').textContent = evento.nombre_evento || 'Editar invitación';

  document.getElementById('editar-estado-barra').innerHTML =
    `<span class="estado-pill" style="background:${evento.estados?.color || '#666'}">${evento.estados?.nombre || ''}</span>`;

  const baseUrl = window.location.origin + window.location.pathname.replace('admin/index.html', '');
  const linkDatos = `${baseUrl}portal/index.html?codigo=${evento.codigo_portal}`;
  const linkInvitados = `${baseUrl}portal/invitados.html?codigo=${evento.codigo_portal}`;

  document.getElementById('editar-portal-box').innerHTML = `
    <div style="width:100%">
      <p style="color:var(--texto-mid);font-size:.78rem;margin-bottom:.3rem">Link para que llenen sus datos</p>
      <div style="display:flex;gap:.5rem;margin-bottom:1rem">
        <input type="text" readonly value="${linkDatos}" id="input-link-datos" style="flex:1;padding:.6rem .8rem;background:var(--gris-mid);border:1px solid var(--gris-borde);border-radius:8px;color:var(--blanco);font-size:.8rem">
        <button class="btn btn-fantasma" onclick="copiarLink('input-link-datos')">Copiar</button>
      </div>
      <p style="color:var(--texto-mid);font-size:.78rem;margin-bottom:.3rem">Link para el generador de invitados (RSVP Premium)</p>
      <div style="display:flex;gap:.5rem">
        <input type="text" readonly value="${linkInvitados}" id="input-link-invitados" style="flex:1;padding:.6rem .8rem;background:var(--gris-mid);border:1px solid var(--gris-borde);border-radius:8px;color:var(--blanco);font-size:.8rem">
        <button class="btn btn-fantasma" onclick="copiarLink('input-link-invitados')">Copiar</button>
      </div>
    </div>
  `;

  // pestaña cliente
  const c = evento.clientes || {};
  document.getElementById('ed-cliente-nombre').value = c.nombre || '';
  document.getElementById('ed-cliente-telefono').value = c.telefono || '';
  document.getElementById('ed-cliente-correo').value = c.correo || '';
  document.getElementById('ed-cliente-pago').value = c.estado_pago || 'pendiente';
  document.getElementById('ed-cliente-notas').value = c.notas || '';

  // pestaña evento
  document.getElementById('ed-novio-a-nombre').value = evento.novio_a_nombre || '';
  document.getElementById('ed-novio-a-apellido').value = evento.novio_a_apellido || '';
  document.getElementById('ed-novio-b-nombre').value = evento.novio_b_nombre || '';
  document.getElementById('ed-novio-b-apellido').value = evento.novio_b_apellido || '';
  document.getElementById('ed-whatsapp-a').value = evento.whatsapp_a || '';
  document.getElementById('ed-whatsapp-b').value = evento.whatsapp_b || '';
  document.getElementById('ed-fecha').value = evento.fecha || '';
  document.getElementById('ed-hora').value = evento.hora || '';
  document.getElementById('ed-lugar-nombre').value = evento.lugar_nombre || '';
  document.getElementById('ed-lugar-direccion').value = evento.lugar_direccion || '';
  document.getElementById('ed-lugar-maps').value = evento.lugar_maps_url || '';
  document.getElementById('ed-foto-hero').value = evento.foto_hero_url || '';

  // pestaña módulos
  const activos = await apiGet('evento_modulo', `evento_id=eq.${id}&select=modulo_id,activo`);
  const mapaActivos = Object.fromEntries(activos.map(a => [a.modulo_id, a.activo]));
  document.getElementById('ed-modulos-lista').innerHTML = estado.modulos.map(m => `
    <div class="modulo-row">
      <div class="info"><p class="nombre">${m.nombre}</p><p class="precio">L. ${Number(m.precio).toLocaleString('es-HN')} · ${m.categoria || ''}</p></div>
      <label class="switch">
        <input type="checkbox" data-modulo="${m.id}" ${mapaActivos[m.id] ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
    </div>`).join('');

  // tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('activo'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('activo'));
      btn.classList.add('activo');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('activo');
    };
  });

  document.getElementById('btn-guardar-evento').onclick = () => guardarEdicion(id, evento.cliente_id);
  document.getElementById('btn-publicar-evento').onclick = () => publicarEvento(id);
  document.getElementById('btn-duplicar-evento').onclick = () => duplicarEvento(id);
}

async function guardarEdicion(eventoId, clienteId){
  try {
    await apiPatch('clientes', `id=eq.${clienteId}`, {
      nombre: document.getElementById('ed-cliente-nombre').value,
      telefono: document.getElementById('ed-cliente-telefono').value,
      correo: document.getElementById('ed-cliente-correo').value,
      estado_pago: document.getElementById('ed-cliente-pago').value,
      notas: document.getElementById('ed-cliente-notas').value
    });

    await apiPatch('eventos', `id=eq.${eventoId}`, {
      novio_a_nombre: document.getElementById('ed-novio-a-nombre').value,
      novio_a_apellido: document.getElementById('ed-novio-a-apellido').value,
      novio_b_nombre: document.getElementById('ed-novio-b-nombre').value,
      novio_b_apellido: document.getElementById('ed-novio-b-apellido').value,
      whatsapp_a: document.getElementById('ed-whatsapp-a').value,
      whatsapp_b: document.getElementById('ed-whatsapp-b').value,
      fecha: document.getElementById('ed-fecha').value || null,
      hora: document.getElementById('ed-hora').value || null,
      lugar_nombre: document.getElementById('ed-lugar-nombre').value,
      lugar_direccion: document.getElementById('ed-lugar-direccion').value,
      lugar_maps_url: document.getElementById('ed-lugar-maps').value,
      foto_hero_url: document.getElementById('ed-foto-hero').value,
      nombre_evento: `${document.getElementById('ed-novio-a-nombre').value} & ${document.getElementById('ed-novio-b-nombre').value}`
    });

    // módulos
    const checkboxes = document.querySelectorAll('#ed-modulos-lista input[type="checkbox"]');
    const existentes = await apiGet('evento_modulo', `evento_id=eq.${eventoId}&select=modulo_id`);
    const existentesSet = new Set(existentes.map(e => e.modulo_id));
    const nuevas = [];
    for (const cb of checkboxes) {
      const moduloId = cb.dataset.modulo;
      if (existentesSet.has(moduloId)) {
        await apiPatch('evento_modulo', `evento_id=eq.${eventoId}&modulo_id=eq.${moduloId}`, { activo: cb.checked });
      } else if (cb.checked) {
        nuevas.push({ evento_id: eventoId, modulo_id: moduloId, activo: true });
      }
    }
    if (nuevas.length) await apiPost('evento_modulo', nuevas);

    mostrarToast('Guardado');
  } catch (err) {
    console.error(err);
    mostrarToast('Error al guardar');
  }
}

async function publicarEvento(eventoId){
  try {
    const estadoPublicada = estado.estados.find(e => e.nombre === 'Publicada');
    await apiPatch('eventos', `id=eq.${eventoId}`, { publicado: true, estado_id: estadoPublicada.id });
    mostrarToast('Invitación publicada');
    renderEditar(eventoId);
  } catch (err) {
    console.error(err);
    mostrarToast('Error al publicar');
  }
}

// ---------------- CLIENTES ---------------- 
async function renderClientes(){
  const grid = document.getElementById('clientes-grid');
  grid.innerHTML = '<p style="color:var(--texto-mid)">Cargando...</p>';

  const clientes = await apiGet('clientes', 'select=*&order=created_at.desc');
  if (!clientes.length) { grid.innerHTML = '<p style="color:var(--texto-mid)">Todavía no tienes clientes.</p>'; return; }

  grid.innerHTML = clientes.map(c => `
    <div class="cliente-card">
      <p class="nombre">${c.nombre}</p>
      <p class="dato">${c.telefono || 'Sin teléfono'}</p>
      <p class="dato">${c.correo || 'Sin correo'}</p>
      <p class="dato">Pago: ${c.estado_pago}</p>
      <div class="acciones">
        <button class="btn btn-fantasma" onclick="editarClienteRapido('${c.id}')">Editar</button>
      </div>
    </div>`).join('');

  document.getElementById('buscador-clientes').oninput = (e) => {
    const q = e.target.value.toLowerCase();
    grid.querySelectorAll('.cliente-card').forEach(card => {
      card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };
}

async function editarClienteRapido(clienteId){
  const nombre = prompt('Nombre:');
  if (nombre === null) return;
  const telefono = prompt('Teléfono:');
  const correo = prompt('Correo:');
  await apiPatch('clientes', `id=eq.${clienteId}`, { nombre, telefono, correo });
  renderClientes();
}

// ---------------- REPORTES ----------------
async function renderReportes(){
  const eventos = await apiGet('eventos', 'select=created_at,publicado,paquetes(nombre,precio),plantillas(nombre)');

  document.getElementById('reportes-stats').innerHTML = `
    <div class="stat-card"><p class="valor">${eventos.length}</p><p class="label">Invitaciones totales</p></div>
    <div class="stat-card"><p class="valor">L. ${eventos.reduce((s,e)=>s+Number(e.paquetes?.precio||0),0).toLocaleString('es-HN')}</p><p class="label">Ingresos totales (paquetes)</p></div>
    <div class="stat-card"><p class="valor">${eventos.filter(e=>e.publicado).length}</p><p class="label">Publicadas</p></div>
  `;

  // Ingresos por mes (últimos 6 meses)
  const hoy = new Date();
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    meses.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('es-HN', { month: 'short' }), total: 0 });
  }
  eventos.forEach(e => {
    const d = new Date(e.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const mes = meses.find(m => m.key === key);
    if (mes) mes.total += Number(e.paquetes?.precio || 0);
  });
  pintarGraficoBarras('grafico-ingresos', meses.map(m => ({ label: m.label, valor: m.total, texto: `L. ${m.total.toLocaleString('es-HN')}` })));

  // Plantillas más vendidas
  const conteoPlantillas = {};
  eventos.forEach(e => { const n = e.plantillas?.nombre || 'Sin plantilla'; conteoPlantillas[n] = (conteoPlantillas[n]||0)+1; });
  const datosPlantillas = Object.entries(conteoPlantillas).sort((a,b)=>b[1]-a[1]).slice(0,8)
    .map(([label, valor]) => ({ label, valor, texto: String(valor) }));
  pintarGraficoBarras('grafico-plantillas', datosPlantillas);

  // Paquetes más vendidos
  const conteoPaquetes = {};
  eventos.forEach(e => { const n = e.paquetes?.nombre || 'Sin paquete'; conteoPaquetes[n] = (conteoPaquetes[n]||0)+1; });
  const datosPaquetes = Object.entries(conteoPaquetes).sort((a,b)=>b[1]-a[1])
    .map(([label, valor]) => ({ label, valor, texto: String(valor) }));
  pintarGraficoBarras('grafico-paquetes', datosPaquetes);
}

function pintarGraficoBarras(idContenedor, datos){
  const cont = document.getElementById(idContenedor);
  if (!datos.length) { cont.innerHTML = '<p style="color:var(--texto-mid)">Sin datos todavía.</p>'; return; }
  const max = Math.max(...datos.map(d => d.valor), 1);
  cont.innerHTML = datos.map(d => `
    <div class="barra-item">
      <span class="valor">${d.texto}</span>
      <div class="barra" style="height:${Math.max(4, (d.valor / max) * 140)}px"></div>
      <span class="label">${d.label}</span>
    </div>`).join('');
}

// ---------------- DUPLICAR INVITACIÓN ----------------
async function duplicarEvento(eventoId){
  if (!confirm('¿Duplicar esta invitación? Se creará una copia completa (historia, itinerario, mensajes y módulos incluidos) lista para editar.')) return;

  try {
    const [original] = await apiGet('eventos', `id=eq.${eventoId}&select=*`);
    if (!original) return;

    let slug = generarSlug(original.nombre_evento || 'copia') + '-copia';
    const existentes = await apiGet('eventos', `slug_publico=eq.${slug}&select=id`);
    if (existentes.length) slug = `${slug}-${Math.floor(Math.random()*90+10)}`;

    const estadoInicial = estado.estados.find(e => e.nombre === 'Esperando Información');

    const copia = { ...original };
    delete copia.id;
    delete copia.created_at;
    delete copia.updated_at;
    copia.slug_publico = slug;
    copia.codigo_portal = generarCodigoPortal();
    copia.publicado = false;
    copia.estado_id = estadoInicial.id;
    copia.nombre_evento = (original.nombre_evento || '') + ' (copia)';

    const [nuevoEvento] = await apiPost('eventos', [copia]);

    // copiar módulos activos
    const modulosOriginales = await apiGet('evento_modulo', `evento_id=eq.${eventoId}&select=modulo_id,activo`);
    if (modulosOriginales.length) {
      await apiPost('evento_modulo', modulosOriginales.map(m => ({ evento_id: nuevoEvento.id, modulo_id: m.modulo_id, activo: m.activo })));
    }

    // copiar historia, timeline, mensajes
    for (const [tabla, campos] of [
      ['historia', ['titulo','descripcion','imagen_url','orden']],
      ['timeline', ['hora','titulo','nivel','orden']],
      ['mensajes', ['texto','referencia','orden']]
    ]) {
      const filas = await apiGet(tabla, `evento_id=eq.${eventoId}&select=*`);
      if (filas.length) {
        const filasNuevas = filas.map(f => {
          const nueva = { evento_id: nuevoEvento.id };
          campos.forEach(c => nueva[c] = f[c]);
          return nueva;
        });
        await apiPost(tabla, filasNuevas);
      }
    }

    mostrarToast('Invitación duplicada');
    location.hash = `#editar/${nuevoEvento.id}`;
  } catch (err) {
    console.error(err);
    mostrarToast('Error al duplicar');
  }
}

// ---------------- COPIAR AL PORTAPAPELES (con respaldo) ----------------
function copiarLink(idInput){
  const input = document.getElementById(idInput);
  input.select();
  input.setSelectionRange(0, 99999); // por si es móvil

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(input.value)
      .then(() => mostrarToast('Link copiado'))
      .catch(() => mostrarToast('No se pudo copiar automático — el texto ya está seleccionado, usa Ctrl+C'));
  } else {
    // Sitio sin HTTPS o navegador viejo: usamos el método de respaldo
    try {
      document.execCommand('copy');
      mostrarToast('Link copiado');
    } catch (err) {
      mostrarToast('No se pudo copiar automático — el texto ya está seleccionado, usa Ctrl+C');
    }
  }
}
