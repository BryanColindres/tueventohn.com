// ============================================================
// MAIN.JS — MOTOR DE LA PLANTILLA ELEGANTE
// No se edita por boda. Solo lee config.js.
// ============================================================
let C;
window.IDENTIFICADOR_INVITADO = new URLSearchParams(window.location.search).get('id') || null;

document.addEventListener('DOMContentLoaded', async () => {
  C = await TuBodaBackend.cargarConfig();
  if (!C) return;
  TuBodaTextos.aplicar(C);

  if (window.IDENTIFICADOR_INVITADO) {
    TuBodaBackend.marcarApertura(window.IDENTIFICADOR_INVITADO);
  }

  iniciarVideo();
  pintarHero();
  pintarBannerPersonal();
  iniciarCountdown();
  pintarMensajes();
  pintarHistoria();
  pintarVideoInterno();
  pintarTimeline();
  pintarDetalles();
  pintarVestimenta();
  pintarUbicacion();
  pintarRegalos();
  pintarAddons();
  pintarCancion();
  pintarRSVP();
  pintarFooter();
  iniciarMusica();
  TuBodaBackend.limpiarDivisoresHuerfanos();
  iniciarReveal();

  pintarMensajeVoz();
});


// ---------------- VIDEO DE APERTURA ----------------
function iniciarVideo(){
  const screen = document.getElementById('video-screen');
  const overlay = document.getElementById('video-overlay');
  const video = document.getElementById('video-el');
  const invitation = document.getElementById('invitation');
  const progress = document.getElementById('video-progress');

  document.getElementById('overlay-nombres').textContent = `${C.pareja.nombreA} & ${C.pareja.nombreB}`;
  document.getElementById('overlay-fecha').textContent = C.fechaTexto || '';

  const videoActivo = !C.modules || C.modules.video !== false;
  if (videoActivo && C.video) video.src = C.video;

  function cerrarTodo(){
    overlay.classList.add('gone');
    screen.classList.add('closing');
    setTimeout(() => screen.classList.add('gone'), 800);
    mostrarPantallaNombre(invitation);
  }

  if (window.self !== window.top) {
    cerrarTodo();
  } else {
    overlay.addEventListener('click', () => {
      overlay.classList.add('hiding');
      screen.classList.add('playing');
      if (videoActivo && C.video) {
        video.muted = false;
      video.play().catch(cerrarTodo);
        video.addEventListener('timeupdate', () => {
          if (video.duration) progress.style.width = (video.currentTime / video.duration * 100) + '%';
        });
        video.addEventListener('ended', () => setTimeout(cerrarTodo, (C.videoDelay || 0) * 1000));
      } else {
        setTimeout(cerrarTodo, 500);
      }
    });
  }
}

// ---------------- HERO Y BANNER PERSONALIZADO ----------------
function pintarHero(){
  document.getElementById('hero-nombreA').textContent = C.pareja.nombreA;
  document.getElementById('hero-nombreB').textContent = C.pareja.nombreB;
  document.getElementById('hero-apellidos').textContent = `${C.pareja.apellidoA} · ${C.pareja.apellidoB}`;
  document.getElementById('hero-fecha-top').textContent = C.fechaTexto;
  document.getElementById('hero-photo').innerHTML = C.fotos.hero ? `<img src="${C.fotos.hero}" alt="">` : '';
}

function pintarBannerPersonal(){
  if (C.invitado && C.invitado.nombre) {
    document.getElementById('banner-personal-nombre').textContent = C.invitado.nombre;
    document.getElementById('banner-personal').classList.remove('oculto');
    return;
  }
  // Vista de catálogo/demo (sin ?id= real): mostramos un ejemplo de cómo
  // se vería la personalización, para que el cliente entienda que existe.
  if (!window.IDENTIFICADOR_INVITADO && C.eventoId === 'demo' && C.modules && C.modules.rsvp_premium) {
    document.getElementById('banner-personal-nombre').textContent = '[aquí va el nombre de tu invitado]';
    document.getElementById('banner-personal').classList.remove('oculto');
  }
}

// ---------------- MENSAJES / PROMESAS DE AMOR ----------------
function pintarMensajes(){
  const seccion = document.getElementById('section-mensajes');
  if ((C.modules && C.modules.mensajes === false) || !C.mensajes || !C.mensajes.length) { seccion.style.display = 'none'; return; }
  document.getElementById('mensajes-contenido').innerHTML = C.mensajes.map(m => `
    <div class="mensaje-card reveal">
      <p>${m.texto}</p>
      ${m.referencia ? `<span class="ref">${m.referencia}</span>` : ''}
    </div>`).join('');
}

// ---------------- HISTORIA — ESTILO INSTAGRAM STORIES ----------------
function pintarHistoria(){
  const seccion = document.getElementById('section-historia');
  const cont = document.getElementById('historia-contenido');
  if ((C.modules && C.modules.historia === false) || !C.historia || !C.historia.length) { seccion.style.display = 'none'; return; }

  const slides = C.historia;
  cont.innerHTML = `
    <div class="story" id="story">
      <div class="story-bars" id="story-bars">
        ${slides.map(() => `<div class="story-bar"><div class="story-bar-fill"></div></div>`).join('')}
      </div>
      <div class="story-slides" id="story-slides">
        ${slides.map((h, i) => `
          <div class="story-slide${i === 0 ? ' active' : ''}">
            <img src="${h.foto}" alt="${h.titulo || ''}">
            <div class="story-caption">
              ${h.titulo ? `<div class="st-title">${h.titulo}</div>` : ''}
              <div class="st-text">${h.texto}</div>
            </div>
          </div>`).join('')}
      </div>
      <div class="story-tap left" id="story-tap-left"></div>
      <div class="story-tap right" id="story-tap-right"></div>
    </div>
    <p class="story-hint">Toca los lados para avanzar o retroceder</p>`;

  iniciarStory(slides.length);
}

function iniciarStory(total){
  let actual = 0;
  let temporizador = null;
  const DURACION = 4500;
  const bars = () => document.querySelectorAll('#story-bars .story-bar');
  const slides = () => document.querySelectorAll('#story-slides .story-slide');

  function render(){
    slides().forEach((s, i) => s.classList.toggle('active', i === actual));
    bars().forEach((b, i) => {
      const f = b.querySelector('.story-bar-fill');
      if (i < actual) { f.style.transition = 'none'; f.style.width = '100%'; }
      else if (i === actual) {
        f.style.transition = 'none'; f.style.width = '0%';
        requestAnimationFrame(() => { f.style.transition = `width ${DURACION}ms linear`; f.style.width = '100%'; });
      } else { f.style.transition = 'none'; f.style.width = '0%'; }
    });
  }
  function siguiente(){ if (actual < total - 1) { actual++; render(); reiniciar(); } }
  function anterior(){ if (actual > 0) { actual--; render(); reiniciar(); } }
  function reiniciar(){ clearTimeout(temporizador); temporizador = setTimeout(siguiente, DURACION); }

  document.getElementById('story-tap-right').addEventListener('click', siguiente);
  document.getElementById('story-tap-left').addEventListener('click', anterior);
  render();
  reiniciar();
}

// ---------------- VIDEO INTERNO ----------------
function pintarVideoInterno(){
  const seccion = document.getElementById('section-video-interno');
  if (!C.modules || !C.modules.video_interno || !C.videoInterno || !C.videoInterno.url) {
    seccion.style.display = 'none';
    return;
  }
  document.getElementById('video-interno-el').src = C.videoInterno.url;
  document.getElementById('video-interno-frase').textContent = C.videoInterno.frase || '';
}

// ---------------- ITINERARIO ----------------
function pintarTimeline(){
  const seccion = document.getElementById('section-timeline');
  const cont = document.getElementById('timeline-contenido');
  if ((C.modules && C.modules.timeline === false) || !C.timeline || !C.timeline.length) { seccion.style.display = 'none'; return; }
  cont.innerHTML = C.timeline.map((t, i) => `
    <div class="prog-item reveal">
      <span class="prog-num">${i + 1}</span>
      <span class="prog-titulo">${TuBodaBackend.iconoTimelineHtml(t.icono)}${t.titulo}</span>
      <span class="prog-hora">${t.hora}</span>
      ${i < C.timeline.length - 1 ? '<div class="prog-linea"></div>' : ''}
    </div>`).join('');
}

// ---------------- DETALLES IMPORTANTES ----------------
const ICONOS_DETALLES = {
  reloj: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  adultos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="8" r="2.4"/><path d="M2 21v-1a6 6 0 0112 0v1M15 21v-.6a5 5 0 016.5-4.8"/></svg>',
  regalo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="8" width="18" height="13"/><path d="M3 8h18M12 8v13M12 8c-1.5-4-6-4-6-1s3 1 6 1zm0 0c1.5-4 6-4 6-1s-3 1-6 1z"/></svg>',
  general: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>'
};
function pintarDetalles(){
  const seccion = document.getElementById('section-detalles');
  if (!C.modules || !C.modules.detalles || !C.detallesImportantes || !C.detallesImportantes.length) {
    seccion.style.display = 'none';
    return;
  }
  document.getElementById('detalles-grid').innerHTML = C.detallesImportantes.map(d => `
    <div class="detalle-card reveal">
      <div class="detalle-card__icono">${ICONOS_DETALLES[d.icono] || ICONOS_DETALLES.general}</div>
      <h3>${d.titulo}</h3>
      <p>${d.texto}</p>
    </div>`).join('');
}

// ---------------- CÓDIGO DE VESTIMENTA ----------------
function pintarVestimenta(){
  const seccion = document.getElementById('section-vestimenta');
  if (!C.modules || !C.modules.vestimenta || !C.vestimenta || !C.vestimenta.texto) {
    seccion.style.display = 'none';
    return;
  }
  document.getElementById('vestimenta-texto').textContent = C.vestimenta.texto;

  if (C.vestimenta.paletaColores && C.vestimenta.paletaColores.length) {
    const cont = document.getElementById('vestimenta-paleta');
    cont.innerHTML = C.vestimenta.paletaColores.map(c => `
      <div class="paleta-swatch">
        <span class="paleta-circulo" style="background:${c.hex}"></span>
        <span class="paleta-nombre">${c.nombre || ''}</span>
      </div>`).join('');
    cont.classList.remove('oculto');
  }

  if (C.vestimenta.colorEvitar) {
    const p = document.getElementById('vestimenta-evitar');
    p.innerHTML = `Evitemos: <span class="paleta-circulo paleta-circulo--inline" style="background:${C.vestimenta.colorEvitar.hex}"></span> ${C.vestimenta.colorEvitar.nombre || ''}`;
    p.classList.remove('oculto');
  }

  const url = C.vestimenta.fotoReferenciaUrl || C.vestimenta.pinterestUrl || C.vestimenta.botonUrl;
  if (url) {
    const btn = document.getElementById('vestimenta-boton');
    btn.href = url;
    btn.classList.remove('oculto');
  }
}

// ---------------- UBICACIÓN ----------------
function pintarUbicacion(){
  document.getElementById('ubicacion-nombre').textContent = C.lugar.nombre;
  document.getElementById('ubicacion-direccion').textContent = C.lugar.direccion;
  document.getElementById('ubicacion-link').href = C.lugar.mapsUrl;

  if (C.lugar.wazeUrl) {
    const waze = document.getElementById('ubicacion-waze');
    waze.href = C.lugar.wazeUrl;
    waze.classList.remove('oculto');
  }
  if (C.lugar.foto) {
    document.getElementById('map-foto').innerHTML = `<img src="${C.lugar.foto}" alt="">`;
    document.getElementById('map-foto').classList.remove('oculto');
  }
}

// ---------------- REGALOS ----------------
function pintarRegalos(){
  const seccion = document.getElementById('section-regalos');
  if (!C.modules || !C.modules.regalos || !C.regalos || !C.regalos.texto) {
    seccion.style.display = 'none';
    return;
  }
  document.getElementById('regalos-texto').textContent = C.regalos.texto;
  if (C.regalos.cuentaTexto) {
    const btn = document.getElementById('regalos-boton');
    const detalle = document.getElementById('regalos-detalle');
    btn.classList.remove('oculto');
    btn.addEventListener('click', () => detalle.classList.toggle('oculto'));
    detalle.textContent = C.regalos.cuentaTexto;
  }
}

// ---------------- GALERÍA + LIBRO DE FIRMAS ----------------
function pintarAddons(){
  const seccionGaleria = document.getElementById('section-galeria');
  if (!C.modules || !C.modules.galeria || !C.galeriaMuestra || !C.galeriaMuestra.length) {
    seccionGaleria.style.display = 'none';
  } else {
    const grid = document.getElementById('galeria-grid');
    C.galeriaMuestra.forEach(src => {
      const div = document.createElement('div');
      div.className = 'gal-item reveal';
      div.innerHTML = `<img src="${src}" alt="">`;
      grid.appendChild(div);
    });
  }

  const seccionFirmas = document.getElementById('section-firmas');
  if (!C.modules || !C.modules.firmas) {
    seccionFirmas.style.display = 'none';
  } else {
    if (C.firmasFotoUrl) {
      document.getElementById('firmas-foto').innerHTML = `<img src="${C.firmasFotoUrl}" alt="">`;
      document.getElementById('firmas-foto').classList.remove('oculto');
    }
    document.getElementById('form-firma').addEventListener('submit', enviarFirma);
    cargarFirmas();
  }
}

function pintarCancion(){
  const seccion = document.getElementById('section-cancion');
  if (!C.modules || !C.modules.cancion) { seccion.style.display = 'none'; return; }

  const embedWrap = document.getElementById('cancion-embed-wrap');
  const form = document.getElementById('form-cancion');
  const intro = document.getElementById('cancion-intro');

  const hayPlaylistReal = C.cancionModo === 'embed' && C.cancionEmbedUrl;

  if (hayPlaylistReal) {
    // Es una playlist real y compartida: ábranla y agreguen ahí mismo, no
    // hace falta un formulario aparte en el sitio.
    intro.textContent = 'Esta es nuestra playlist para la fiesta. Ábrela y, si quieres, agrega ahí mismo tu canción favorita.';
    const esSpotify = C.cancionEmbedUrl.includes('spotify.com');
    const esYoutube = C.cancionEmbedUrl.includes('youtube.com') || C.cancionEmbedUrl.includes('youtu.be');
    if (esSpotify) {
      embedWrap.innerHTML = `<iframe src="${C.cancionEmbedUrl}" width="100%" height="352" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
    } else if (esYoutube) {
      embedWrap.innerHTML = `<iframe width="100%" height="220" src="${C.cancionEmbedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen loading="lazy"></iframe>`;
    } else {
      embedWrap.innerHTML = `<a href="${C.cancionEmbedUrl}" target="_blank" class="btn btn-outline">Abrir playlist</a>`;
    }
    embedWrap.classList.remove('oculto');
    form.classList.add('oculto');
    return;
  }

  // Sin playlist real compartida: dejamos que sugieran una canción por escrito.
  intro.textContent = 'Escribe una canción que no puede faltar en la fiesta.';
  form.classList.remove('oculto');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('cancion-input');
    const nombreInput = document.getElementById('cancion-nombre');
    const texto = input.value.trim();
    if (!texto) return;
    try {
      await TuBodaBackend.enviarCancion(C.eventoId, nombreInput.value.trim() || 'Invitado', texto);
      input.value = '';
      nombreInput.value = '';
      mostrarConfirmacionCancion();
    } catch (err) { alert('No se pudo guardar tu canción. Intenta de nuevo.'); }
  });
}

function mostrarConfirmacionCancion(){
  const form = document.getElementById('form-cancion');
  const aviso = document.createElement('p');
  aviso.className = 'cancion-gracias';
  aviso.textContent = '¡Gracias! Ya la anotamos.';
  form.after(aviso);
  setTimeout(() => aviso.remove(), 3000);
}

async function enviarFirma(e){
  e.preventDefault();
  const nombre = document.getElementById('firma-nombre').value.trim();
  const mensaje = document.getElementById('firma-mensaje').value.trim();
  try {
    await TuBodaBackend.enviarFirma(C.eventoId, nombre, mensaje, window.IDENTIFICADOR_INVITADO || null);
    document.getElementById('form-firma').reset();
    // No la agregamos a la lista pública: entra "pendiente" y solo la ve
    // el organizador hasta que la aprueba. Mostramos su propio mensaje
    // marcado como "en revisión" para que sepa que sí se envió.
    document.getElementById('firma-pendiente-nombre').textContent = nombre;
    document.getElementById('firma-pendiente-mensaje').textContent = mensaje;
    document.getElementById('firma-pendiente').classList.remove('oculto');
  } catch (err) { alert('No se pudo guardar tu firma. Intenta de nuevo.'); }
}

async function cargarFirmas(){
  try {
    const registros = await TuBodaBackend.cargarFirmas(C.eventoId);
    if (!registros || !registros.length) return;
    iniciarPaginacionFirmas(registros);
  } catch (err) { console.error(err); }
}

function iniciarPaginacionFirmas(registros){
  const POR_PAGINA = 4;
  let pagina = 0;
  const totalPaginas = Math.ceil(registros.length / POR_PAGINA);
  const lista = document.getElementById('firmas-lista');
  const nav = document.getElementById('firmas-nav');

  function render(){
    const inicio = pagina * POR_PAGINA;
    const pagados = registros.slice(inicio, inicio + POR_PAGINA);
    lista.innerHTML = pagados.map(r => `
      <div class="firma-item">
        <div class="nombre">${r.nombre || ''}</div>
        <div class="mensaje">${r.mensaje || ''}</div>
      </div>`).join('');

    if (totalPaginas > 1) {
      nav.classList.remove('oculto');
      nav.innerHTML = `
        <button type="button" id="firmas-prev" ${pagina === 0 ? 'disabled' : ''}>‹</button>
        <span>${pagina + 1} / ${totalPaginas}</span>
        <button type="button" id="firmas-next" ${pagina === totalPaginas - 1 ? 'disabled' : ''}>›</button>`;
      document.getElementById('firmas-prev').addEventListener('click', () => { pagina--; render(); });
      document.getElementById('firmas-next').addEventListener('click', () => { pagina++; render(); });
    }
  }
  render();
}

// ---------------- RSVP ----------------
async function pintarRSVP(){
  const spanFechaLimite = document.getElementById('rsvp-fecha-limite');
  if (spanFechaLimite) spanFechaLimite.textContent = C.rsvpFechaLimite || 'la fecha indicada';
  if (C.rsvpFotoUrl) {
    document.getElementById('rsvp-foto').innerHTML = `<img src="${C.rsvpFotoUrl}" alt="">`;
    document.getElementById('rsvp-foto').classList.remove('oculto');
  }

  const tienePremium = !!(C.modules && C.modules.rsvp_premium);

  if (!tienePremium) {
    // Paquete sin RSVP Premium: confirman por WhatsApp, como siempre.
    const msj = encodeURIComponent(`Hola, confirmo mi asistencia a la boda de ${C.pareja.nombreA} y ${C.pareja.nombreB}`);
    document.getElementById('rsvp-novio').href = `https://wa.me/${C.whatsapp.novio}?text=${msj}`;
    document.getElementById('rsvp-novia').href = `https://wa.me/${C.whatsapp.novia}?text=${msj}`;
    document.getElementById('rsvp-whatsapp').classList.remove('oculto');
    return;
  }

  // Paquete con RSVP Premium: formulario en la página, con nombres reales
  // ya cargados (nadie escribe su nombre).
  // Paquete con RSVP Premium: nadie escribe su nombre, ya viene identificado
  // por el link (individual o familiar).
  const id = window.IDENTIFICADOR_INVITADO;
  const formWrap = document.getElementById('rsvp-form-wrap');
  const sinLink = document.getElementById('rsvp-sin-link');

  let personas = [];
  if (id) {
    personas = await TuBodaBackend.cargarPersonasParaRSVP(id);
  } else if (C.rsvpDemoPersonas) {
    // Sin ?id= real (ej. viendo el catálogo): vista de ejemplo, no guarda nada.
    personas = C.rsvpDemoPersonas;
  }

  if (!personas.length) { sinLink.classList.remove('oculto'); return; }

  const todosRespondieron = personas.every(p => p.estado && p.estado !== 'pendiente');
  if (todosRespondieron) { mostrarResumenRSVP(personas); return; }

  formWrap.classList.remove('oculto');

  if (personas.length === 1) {
    // Una sola persona: confirma directo con un clic, sin pasos extra.
    const persona = personas[0];
    document.getElementById('rsvp-individual').classList.remove('oculto');
    const guardar = async (asiste) => {
      if (!id) { alert('Esto es una vista de ejemplo — aquí no se guarda nada.'); return; }
      try {
        await TuBodaBackend.confirmarAsistencia(id, [{ invitado_id: persona.invitado_id, asiste }]);
        formWrap.classList.add('oculto');
        document.getElementById('rsvp-gracias').classList.remove('oculto');
      } catch (err) { alert('No se pudo enviar tu confirmación. Intenta de nuevo.'); }
    };
    document.getElementById('rsvp-individual-si').addEventListener('click', () => guardar(true));
    document.getElementById('rsvp-individual-no').addEventListener('click', () => guardar(false));
    return;
  }

  // Familia: un solo botón de entrada; al tocarlo se despliegan los nombres
  // (nunca "Familia X" como opción — solo personas individuales).
  const botonEntrada = document.getElementById('rsvp-boton-entrada');
  botonEntrada.classList.remove('oculto');
  botonEntrada.addEventListener('click', () => {
    botonEntrada.classList.add('oculto');
    desplegarFamiliaRSVP(personas, id, formWrap);
  }, { once: true });
}

function desplegarFamiliaRSVP(personas, id, formWrap) {
  const wrap = document.getElementById('rsvp-personas');
  const familiaWrap = document.getElementById('rsvp-familia-wrap');
  familiaWrap.classList.remove('oculto');

  const decisiones = {};
  wrap.innerHTML = personas.map(p => `
    <div class="rsvp-persona">
      <span class="rsvp-persona-nombre">${p.nombre}</span>
      <span class="rsvp-toggle">
        <button type="button" class="rsvp-op rsvp-si${p.estado === 'confirmado' ? ' activo' : ''}" data-id="${p.invitado_id}" data-texto="opcionSiAsiste">Sí, ahí estaré</button>
        <button type="button" class="rsvp-op rsvp-no${p.estado === 'rechazado' ? ' activo' : ''}" data-id="${p.invitado_id}" data-texto="opcionNoAsiste">No podré asistir</button>
      </span>
    </div>`).join('');

  personas.forEach(p => { if (p.estado && p.estado !== 'pendiente') decisiones[p.invitado_id] = p.estado === 'confirmado'; });

  wrap.querySelectorAll('.rsvp-op').forEach(btn => {
    btn.addEventListener('click', () => {
      const pid = btn.dataset.id;
      decisiones[pid] = btn.classList.contains('rsvp-si');
      wrap.querySelectorAll(`.rsvp-op[data-id="${pid}"]`).forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
    });
  });

  document.getElementById('rsvp-enviar').addEventListener('click', async () => {
    const arr = Object.entries(decisiones).map(([invitado_id, asiste]) => ({ invitado_id, asiste }));
    if (arr.length < personas.length) { alert('Selecciona una opción para cada persona de la lista.'); return; }
    if (!id) { alert('Esto es una vista de ejemplo — aquí no se guarda nada.'); return; }
    try {
      await TuBodaBackend.confirmarAsistencia(id, arr);
      formWrap.classList.add('oculto');
      document.getElementById('rsvp-gracias').classList.remove('oculto');
    } catch (err) { alert('No se pudo enviar tu confirmación. Intenta de nuevo.'); }
  });
}

function mostrarResumenRSVP(personas) {
  const cont = document.getElementById('rsvp-resumen');
  const iconos = { confirmado: '✅', rechazado: '🚫' };
  cont.innerHTML = (personas.length === 1
    ? `<p>${personas[0].estado === 'confirmado' ? 'Ya confirmaste tu asistencia. ¡Te esperamos!' : 'Registramos que no podrás acompañarnos. ¡Gracias por avisarnos!'}</p>`
    : `<p>Así quedaron las confirmaciones de tu familia:</p><ul class="rsvp-resumen-lista">${personas.map(p => `<li>${iconos[p.estado] || '•'} ${p.nombre}</li>`).join('')}</ul>`
  );
  cont.classList.remove('oculto');
}

// ---------------- FOOTER ----------------
function pintarFooter(){
  document.getElementById('footer-iniciales').textContent = `${C.pareja.nombreA} & ${C.pareja.nombreB}`;
  document.getElementById('footer-fecha').textContent = C.fechaTexto;
  document.getElementById('footer-photo').innerHTML = C.fotos.footer ? `<img src="${C.fotos.footer}" alt="">` : '';
}

// ---------------- COUNTDOWN ----------------
function iniciarCountdown(){
  const seccion = document.getElementById('section-countdown');
  if (C.modules && C.modules.countdown === false) { seccion.style.display = 'none'; return; }
  const destino = new Date(C.fecha).getTime();
  const el = document.getElementById('countdown');
  function actualizar(){
    const diff = Math.max(0, destino - Date.now());
    const dias = Math.floor(diff / 86400000);
    const horas = Math.floor((diff % 86400000) / 3600000);
    const min = Math.floor((diff % 3600000) / 60000);
    const seg = Math.floor((diff % 60000) / 1000);
    el.innerHTML = `${bloque(dias,'Días')}${bloque(horas,'Horas')}${bloque(min,'Min')}${bloque(seg,'Seg')}`;
  }
  function bloque(v, l){ return `<div class="cd-item"><span>${String(v).padStart(2,'0')}</span><p>${l}</p></div>`; }
  actualizar();
  setInterval(actualizar, 1000);
}

// ---------------- MÚSICA DE FONDO ----------------
function iniciarMusica(){
  if ((C.modules && C.modules.musica === false) || !C.musicaUrl) return;
  const audio = document.getElementById('musica-audio');
  const btn = document.getElementById('musica-btn');
  audio.src = C.musicaUrl;
  audio.volume = 0.5;
  btn.classList.remove('oculto');
  actualizarIconoMusica(false);

  btn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().then(() => actualizarIconoMusica(true)).catch(() => {});
    } else {
      audio.pause();
      actualizarIconoMusica(false);
    }
  });
}

function actualizarIconoMusica(sonando){
  const btn = document.getElementById('musica-btn');
  if (!btn) return;
  btn.classList.toggle('sonando', sonando);
  btn.innerHTML = sonando ? '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M3 10v4h4l5 5V5L7 10H3z"/><path d="M16 8a5 5 0 010 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M18.6 5.4a9 9 0 010 13.2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/></svg>' : '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M3 10v4h4l5 5V5L7 10H3z"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
}

// Se intenta reproducir automáticamente justo cuando se revela la invitación
// (dentro del mismo gesto de "tocar para comenzar", por eso el navegador lo permite).
function intentarReproducirMusicaAutomatico(){
  const audio = document.getElementById('musica-audio');
  if (!audio || !audio.src) return;
  audio.play().then(() => actualizarIconoMusica(true)).catch(() => actualizarIconoMusica(false));
}

// ---------------- REVEAL ON SCROLL ----------------

// ---------------- PANTALLA DE NOMBRE (automática, después del video) ----------------
function mostrarPantallaNombre(invitation){
  const activo = C.modules && C.modules.rsvp_premium;
  const tieneNombre = C.invitado && C.invitado.nombre;

  if (!activo || !tieneNombre) {
    invitation.classList.add('visible');
    intentarReproducirMusicaAutomatico();
    return;
  }

  const ns = document.getElementById('name-screen');
  document.getElementById('name-screen-nombre').textContent = C.invitado.nombre;
  document.getElementById('name-screen-sub').textContent = `${C.pareja.nombreA} & ${C.pareja.nombreB}`;

  ns.classList.remove('oculto');
  requestAnimationFrame(() => ns.classList.add('visible'));

  setTimeout(() => {
    ns.classList.remove('visible');
    setTimeout(() => {
      ns.classList.add('oculto');
      invitation.classList.add('visible');
      intentarReproducirMusicaAutomatico();
    }, 800);
  }, 2800);
}

// ---------------- MENSAJE DE VOZ (sección normal dentro del scroll) ----------------
function pintarMensajeVoz(){
  const seccion = document.getElementById('section-voice');
  const activo = C.modules && C.modules.mensaje_personalizado;
  const tieneArchivo = C.mensajePersonalizado && C.mensajePersonalizado.url;

  if (!activo || !tieneArchivo) {
    seccion.style.display = 'none';
    return;
  }
  seccion.classList.remove('oculto');

  document.getElementById('voice-desc').textContent = `${C.pareja.nombreA} y ${C.pareja.nombreB} grabaron un mensaje especial para ti`;
  document.getElementById('voice-nombre').textContent = (C.invitado && C.invitado.nombre) ? C.invitado.nombre : 'Para ti';
  if (C.fotos.hero) document.getElementById('voice-foto').innerHTML = `<img src="${C.fotos.hero}" alt="">`;

  const esVideo = C.mensajePersonalizado.tipo === 'video';

  if (esVideo) {
    document.getElementById('voice-btn').style.display = 'none';
    document.getElementById('voice-progress').style.display = 'none';
    const video = document.getElementById('voice-video');
    video.src = C.mensajePersonalizado.url;
    video.classList.remove('oculto');
    return;
  }

  const audio = new Audio(C.mensajePersonalizado.url);
  const btn = document.getElementById('voice-btn');
  const icon = document.getElementById('voice-icon');
  const label = document.getElementById('voice-label');
  const fill = document.getElementById('voice-progress-fill');
  let reproduciendo = false;

  btn.addEventListener('click', () => {
    if (!reproduciendo) {
      audio.play().then(() => {
        reproduciendo = true;
        icon.textContent = '⏸';
        label.textContent = 'Pausar';
        duckMusica(true);
      }).catch(() => { label.textContent = 'Toca de nuevo para escuchar'; });
    } else {
      audio.pause();
      reproduciendo = false;
      icon.textContent = '▶';
      label.textContent = 'Escuchar mensaje';
      duckMusica(false);
    }
  });

  audio.addEventListener('timeupdate', () => {
    if (audio.duration) fill.style.width = (audio.currentTime / audio.duration * 100) + '%';
  });
  audio.addEventListener('ended', () => {
    reproduciendo = false;
    icon.textContent = '▶';
    label.textContent = 'Escuchar de nuevo';
    duckMusica(false);
  });
}

function duckMusica(bajar){
  const musica = document.getElementById('musica-audio');
  if (!musica || !musica.src) return;
  musica.volume = bajar ? 0.08 : 0.5;
}

function iniciarReveal(){
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}
