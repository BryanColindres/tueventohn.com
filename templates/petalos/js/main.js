// ═══════════════════════════════════════════════════════
//  MAIN.JS — Plantilla "Pétalos"
//  Motor de la plantilla. No se edita por boda — todo el
//  contenido viene de C (config compartido), igual que las
//  otras 14 plantillas.
// ═══════════════════════════════════════════════════════
let C;
let GUEST = '';
const $ = id => document.getElementById(id);
const EVENTO_SLUG = new URLSearchParams(window.location.search).get('evento');
window.IDENTIFICADOR_INVITADO = new URLSearchParams(window.location.search).get('id') || null;

function set(id, v) { const el = $(id); if (el && v != null) el.textContent = v; }
function href(id, u) { const el = $(id); if (el && u) el.href = u; }
function primerNombre(nombre) { return (nombre || '').split(' ')[0]; }

// ── Fecha compacta "03 · 10 · 2026" (para hero/footer/tap) ──
function fechaCompacta(fechaIso) {
  const d = new Date(fechaIso);
  if (isNaN(d)) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())} · ${pad(d.getMonth() + 1)} · ${d.getFullYear()}`;
}
// Iniciales tipo "B·S" -> "B <span>&</span> S"
function iniciales(html, iniciales) {
  const el = $(html);
  if (!el || !iniciales) return;
  const partes = iniciales.split('·');
  el.innerHTML = partes.length === 2 ? `${partes[0]} <span>&</span> ${partes[1]}` : iniciales;
}

function ocultarVelo() {
  const v = $('veloCarga');
  if (!v) return;
  v.style.opacity = '0';
  setTimeout(() => v.remove(), 400);
}

function mostrarGate(tipo) {
  document.body.classList.add(tipo === 'blocked' ? 'gate-blocked' : 'gate-denied');
  iniciales('gateMonogram', C && C.pareja && C.pareja.iniciales);
  iniciales('gateMonogramBloqueado', C && C.pareja && C.pareja.iniciales);
  const numero = (C && C.whatsapp && C.whatsapp.novio) || '';
  if (numero) {
    const wa = 'https://wa.me/' + numero + '?text=' + encodeURIComponent('Hola, tengo un problema con el link de mi invitación.');
    href('gateDeniedWA', wa);
  }
}

// ── INIT ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  C = await TuBodaBackend.cargarConfig();
  if (!C) { ocultarVelo(); return; }
  TuBodaTextos.aplicar(C);

  // Acceso personalizado por invitado — SOLO si el cliente activó el
  // módulo. Si no, el link funciona igual que en las otras 14 plantillas.
  if (C.modules && C.modules.acceso_invitado && window.IDENTIFICADOR_INVITADO) {
    const acceso = await TuBodaBackend.validarAccesoInvitado(EVENTO_SLUG, window.IDENTIFICADOR_INVITADO);
    if (!acceso || !acceso.encontrado) { ocultarVelo(); mostrarGate('denied'); return; }
    if (acceso.bloqueado) { ocultarVelo(); mostrarGate('blocked'); return; }
    GUEST = acceso.nombre || '';
    TuBodaBackend.marcarApertura(window.IDENTIFICADOR_INVITADO);
  } else if (window.IDENTIFICADOR_INVITADO) {
    // Personalización normal (la misma que usan las otras plantillas con
    // RSVP Premium): resuelve el nombre, sin bloquear a nadie.
    try {
      const invitado = await TuBodaBackend.obtenerInvitado(EVENTO_SLUG, window.IDENTIFICADOR_INVITADO);
      if (invitado) GUEST = invitado.nombre;
    } catch (e) { /* si falla, sigue sin nombre */ }
    TuBodaBackend.marcarApertura(window.IDENTIFICADOR_INVITADO);
  }

  ocultarVelo();
  applyConfig();
  spawnPetals('videoPetals', 12);
  spawnPetals('petalsHero', 10);
  initVideo();
  initMusic();
  initVoice();
  initBook();
  initVestModal();
  initAutoNudge();
});

// ── Aplicar config ────────────────────────────────────
function applyConfig() {
  // Nombres
  set('heroNovio', C.pareja.nombreA);
  set('heroNovia', C.pareja.nombreB);
  set('heroApellidos', (C.pareja.apellidoA || '') + ' · ' + (C.pareja.apellidoB || ''));
  set('footerNovio', primerNombre(C.pareja.nombreA));
  set('footerNovia', primerNombre(C.pareja.nombreB));
  set('waLabelNovio', primerNombre(C.pareja.nombreA) + ' · Novio');
  set('waLabelNovia', primerNombre(C.pareja.nombreB) + ' · Novia');
  iniciales('gateMonogram', C.pareja.iniciales);
  iniciales('tapMonogram', C.pareja.iniciales);
  iniciales('bookSpineIniciales', C.pareja.iniciales);

  // Hero / fotos
  const heroFoto = $('heroFoto'); if (heroFoto && C.fotos && C.fotos.hero) heroFoto.src = C.fotos.hero;
  const versePhoto = $('versePhoto'); if (versePhoto && C.fotos && C.fotos.heroB) versePhoto.src = C.fotos.heroB;
  const voicePhoto = $('voicePhoto'); if (voicePhoto && C.fotos && C.fotos.heroB) voicePhoto.src = C.fotos.heroB;
  const eventoFoto = $('eventoFoto'); if (eventoFoto && C.lugar && C.lugar.foto) eventoFoto.src = C.lugar.foto;
  const footerUrl = (C.fotos && C.fotos.footer) || 'img/footer.mp4';
  const esVideoFooter = /\.(mp4|webm|mov)(\?|$)/i.test(footerUrl);
  const footerVideo = $('footerVideo'), footerFoto = $('footerFoto');
  if (esVideoFooter && footerVideo) { footerVideo.src = footerUrl; footerVideo.style.display = 'block'; }
  else if (footerFoto) { footerFoto.src = footerUrl; footerFoto.style.display = 'block'; }
  const rsvpPhoto = document.querySelector('#rsvpPhoto img'); if (rsvpPhoto && C.rsvpFotoUrl) rsvpPhoto.src = C.rsvpFotoUrl;

  set('heroFecha', fechaCompacta(C.fecha));
  set('footerFecha', fechaCompacta(C.fecha));
  set('tapFecha', fechaCompacta(C.fecha));
  set('bookSpineAnio', new Date(C.fecha).getFullYear());

  // Versículo (texto + cita vienen en un solo campo: "texto — cita")
  const partesVerso = (C.versiculoHistoria || '').split(' — ');
  set('verseText', partesVerso[0] ? '"' + partesVerso[0].replace(/^"|"$/g, '') + '"' : '');
  set('verseCite', partesVerso[1] ? '— ' + partesVerso[1] : '');

  // Evento / lugar (dinámico — cada cliente tiene su propio salón)
  set('venueName', C.lugar.nombre);
  set('eventDate', C.fechaTexto);
  set('eventTime', C.horaTexto);
  set('eventVenue', C.lugar.direccion);
  set('mapVenueLabel', C.lugar.nombre);
  set('mapPinLabel', C.lugar.nombre);
  href('mapsBtn', C.lugar.mapsUrl);
  href('wazeBtn', C.lugar.wazeUrl);
  const mapIframe = $('mapIframe');
  if (mapIframe) {
    mapIframe.src = (C.lugar.lat != null && C.lugar.lng != null)
      ? `https://www.google.com/maps?q=${C.lugar.lat},${C.lugar.lng}&z=16&output=embed`
      : `https://www.google.com/maps?q=${encodeURIComponent((C.lugar.nombre || '') + ' ' + (C.lugar.direccion || ''))}&z=16&output=embed`;
  }

  // Mensaje de voz
  const seccionVoz = $('section-voice');
  const tieneVoz = C.modules && C.modules.mensaje_personalizado && C.mensajePersonalizado && C.mensajePersonalizado.url;
  if (!tieneVoz) { if (seccionVoz) seccionVoz.style.display = 'none'; }
  else {
    set('voiceName', GUEST || 'Querido invitado');
    set('voiceDesc', `${primerNombre(C.pareja.nombreA)} y ${primerNombre(C.pareja.nombreB)} grabaron un mensaje especial para ti`);
    const voiceM = $('voiceMsg'); if (voiceM) voiceM.src = C.mensajePersonalizado.url;
  }
  set('bookGuestName', GUEST || 'Invitado especial');

  // RSVP — bloque personal (solo si hay nombre resuelto)
  if (GUEST) {
    const block = $('rsvpPersonal');
    if (block) block.style.display = 'block';
    set('rsvpPersonalNombre', GUEST);
  }
  pintarRSVP();

  buildInstrucciones();
  pintarVestimenta();
  pintarHistoriaIntro();

  // Galería (reusa el campo compartido `galeriaMuestra`)
  const gg = $('galleryGrid');
  if (gg) {
    if (!C.modules || !C.modules.galeria || !C.galeriaMuestra || !C.galeriaMuestra.length) {
      gg.closest('section')?.querySelectorAll('.container').forEach(c => { if (c.contains(gg)) c.style.display = 'none'; });
    } else {
      gg.innerHTML = C.galeriaMuestra.map((src, i) => `
        <div class="gal-item reveal" data-idx="${i}"><img src="${src}" onerror="this.parentElement.style.display='none'"/></div>`).join('');
    }
  }

  buildTimelineIlustrado();
  pintarCancion();

  const privRow = $('bookPrivacyRow');
  if (privRow) privRow.style.display = (!C.modules || C.modules.firmas !== false) ? 'block' : 'none';

  startCountdown();
  setTimeout(initReveal, 100);
  initLightbox();
}

async function pintarRSVP() {
  const tienePremium = !!(C.modules && C.modules.rsvp_premium);

  if (!tienePremium) {
    const mensajeBase = `Hola, soy ${GUEST || 'un invitado'}, confirmo mi asistencia a la boda de ${primerNombre(C.pareja.nombreA)} y ${primerNombre(C.pareja.nombreB)}${C.fechaTexto ? ' el ' + C.fechaTexto : ''}.`;
    const encoded = encodeURIComponent(mensajeBase);
    href('whatsappBtnNovio', C.whatsapp && C.whatsapp.novio ? `https://wa.me/${C.whatsapp.novio}?text=${encoded}` : null);
    href('whatsappBtnNovia', C.whatsapp && C.whatsapp.novia ? `https://wa.me/${C.whatsapp.novia}?text=${encoded}` : null);
    const waBlock = $('rsvpWhatsappBlock'); if (waBlock) waBlock.style.display = 'block';
    return;
  }

  // RSVP Premium: nadie escribe su nombre, ya viene identificado por el
  // link (individual o familiar) — se guarda de verdad en la base.
  const id = window.IDENTIFICADOR_INVITADO;
  const formWrap = $('rsvpFormWrap'), sinLink = $('rsvpSinLink');

  let personas = [];
  if (id) {
    try { personas = await TuBodaBackend.cargarPersonasParaRSVP(id); } catch (e) { personas = []; }
  } else if (C.rsvpDemoPersonas) {
    personas = C.rsvpDemoPersonas; // vista de ejemplo (catálogo), no guarda nada
  }

  if (!personas.length) { if (sinLink) sinLink.style.display = 'block'; return; }

  const todosRespondieron = personas.every(p => p.estado && p.estado !== 'pendiente');
  if (todosRespondieron) { mostrarResumenRSVP(personas); return; }

  if (formWrap) formWrap.style.display = 'block';

  if (personas.length === 1) {
    const persona = personas[0];
    const indivWrap = $('rsvpIndividual'); if (indivWrap) indivWrap.style.display = 'flex';
    const guardar = async (asiste) => {
      if (!id) { toast('Esto es una vista de ejemplo — aquí no se guarda nada.'); return; }
      try {
        await TuBodaBackend.confirmarAsistencia(id, [{ invitado_id: persona.invitado_id, asiste }]);
        if (formWrap) formWrap.style.display = 'none';
        const gracias = $('rsvpGracias'); if (gracias) gracias.style.display = 'block';
      } catch (err) { toast('No se pudo enviar tu confirmación, intenta de nuevo'); }
    };
    const siBtn = $('rsvpIndividualSi'), noBtn = $('rsvpIndividualNo');
    if (siBtn) siBtn.addEventListener('click', () => guardar(true));
    if (noBtn) noBtn.addEventListener('click', () => guardar(false));
    return;
  }

  // Familia: un botón de entrada, al tocarlo se despliegan los nombres.
  const botonEntrada = $('rsvpBotonEntrada');
  if (botonEntrada) {
    botonEntrada.style.display = 'inline-flex';
    botonEntrada.addEventListener('click', () => {
      botonEntrada.style.display = 'none';
      desplegarFamiliaRSVP(personas, id, formWrap);
    }, { once: true });
  }
}

function desplegarFamiliaRSVP(personas, id, formWrap) {
  const wrap = $('rsvpPersonas'), familiaWrap = $('rsvpFamiliaWrap');
  if (familiaWrap) familiaWrap.style.display = 'block';

  const decisiones = {};
  if (wrap) wrap.innerHTML = personas.map(p => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:.8rem;flex-wrap:wrap">
      <span style="color:white;font-family:var(--font-b)">${p.nombre}</span>
      <span style="display:flex;gap:.5rem">
        <button type="button" class="rsvp-op rsvp-si btn btn-outline${p.estado === 'confirmado' ? ' activo' : ''}" data-id="${p.invitado_id}" style="padding:.5rem 1rem;font-size:.8rem;border-color:rgba(255,255,255,.6);color:white">Sí</button>
        <button type="button" class="rsvp-op rsvp-no btn btn-outline${p.estado === 'rechazado' ? ' activo' : ''}" data-id="${p.invitado_id}" style="padding:.5rem 1rem;font-size:.8rem;border-color:rgba(255,255,255,.6);color:white">No</button>
      </span>
    </div>`).join('');

  personas.forEach(p => { if (p.estado && p.estado !== 'pendiente') decisiones[p.invitado_id] = p.estado === 'confirmado'; });

  wrap?.querySelectorAll('.rsvp-op').forEach(btn => {
    btn.addEventListener('click', () => {
      const pid = btn.dataset.id;
      decisiones[pid] = btn.classList.contains('rsvp-si');
      wrap.querySelectorAll(`.rsvp-op[data-id="${pid}"]`).forEach(b => b.style.background = 'transparent');
      btn.style.background = 'rgba(255,255,255,.25)';
    });
  });

  const enviarBtn = $('rsvpEnviar');
  if (enviarBtn) enviarBtn.addEventListener('click', async () => {
    const arr = Object.entries(decisiones).map(([invitado_id, asiste]) => ({ invitado_id, asiste }));
    if (arr.length < personas.length) { toast('Selecciona una opción para cada persona de la lista'); return; }
    if (!id) { toast('Esto es una vista de ejemplo — aquí no se guarda nada.'); return; }
    try {
      await TuBodaBackend.confirmarAsistencia(id, arr);
      if (formWrap) formWrap.style.display = 'none';
      const gracias = $('rsvpGracias'); if (gracias) gracias.style.display = 'block';
    } catch (err) { toast('No se pudo enviar tu confirmación, intenta de nuevo'); }
  });
}

function mostrarResumenRSVP(personas) {
  const cont = $('rsvpResumen');
  if (!cont) return;
  const iconos = { confirmado: '✅', rechazado: '🚫' };
  cont.innerHTML = (personas.length === 1
    ? `<p>${personas[0].estado === 'confirmado' ? 'Ya confirmaste tu asistencia. ¡Te esperamos!' : 'Registramos que no podrás acompañarnos. ¡Gracias por avisarnos!'}</p>`
    : `<p>Así quedaron las confirmaciones de tu familia:</p><ul style="list-style:none;padding:0;margin-top:.6rem;display:flex;flex-direction:column;gap:.4rem">${personas.map(p => `<li>${iconos[p.estado] || '•'} ${p.nombre}</li>`).join('')}</ul>`
  );
  cont.style.display = 'block';
}

// ── Instrucciones / detalles importantes (reusa C.detallesImportantes) ──
function buildInstrucciones() {
  const seccion = $('section-detalles');
  const grid = $('instrGrid');
  if (!grid) return;
  if ((C.modules && C.modules.detalles === false) || !C.detallesImportantes || !C.detallesImportantes.length) {
    if (seccion) seccion.style.display = 'none';
    return;
  }
  grid.innerHTML = C.detallesImportantes.map(item => `
    <div class="instr-card reveal">
      <div class="instr-card__icon">${item.icono || '🌹'}</div>
      <h3>${item.titulo}</h3>
      <p>${item.texto}</p>
    </div>`).join('');
}

// ── Historia — reusa C.historia (ya conectado al portal) ──
function pintarHistoriaIntro() {
  const seccion = $('section-historia-intro');
  const grid = $('storyGrid');
  if ((C.modules && C.modules.historia === false) || !C.historia || !C.historia.length) {
    if (seccion) seccion.style.display = 'none';
    return;
  }
  if (grid) grid.innerHTML = C.historia.map((item, i) => {
    const lado = i % 2 === 0 ? 'left' : 'right';
    const fotoHtml = item.foto ? `<div class="story-split__photo"><img src="${item.foto}" onerror="this.parentElement.style.display='none'"/></div>` : '';
    const textoHtml = `<div class="story-split__text">${item.titulo ? `<h3 style="font-family:var(--font-a);font-size:1.3rem;margin-bottom:.5rem;color:var(--rose-deep)">${item.titulo}</h3>` : ''}<p>${item.texto || ''}</p></div>`;
    return `<div class="story-split story-split--${lado} reveal-${lado}">${lado === 'left' ? fotoHtml + textoHtml : textoHtml + fotoHtml}</div>`;
  }).join('');
}

// ── Línea de tiempo — reusa C.timeline (ya conectado al portal) ──
function buildTimelineIlustrado() {
  const seccion = $('section-timeline-ilustrado');
  const wrap = $('timelineWrap');
  if (!wrap) return;
  if ((C.modules && C.modules.timeline === false) || !C.timeline || !C.timeline.length) {
    if (seccion) seccion.style.display = 'none';
    return;
  }
  wrap.innerHTML = C.timeline.map((item, i) => {
    const body = `<div class="tl-body"><span class="tl-fecha">${item.hora || ''}</span><h3 class="tl-titulo">${item.titulo || ''}</h3></div>`;
    const dot = `<div class="tl-dot"><div class="tl-dot__icon">${item.icono || '🌹'}</div></div>`;
    const empty = `<div class="tl-empty"></div>`;
    return `<div class="tl-item" data-i="${i}">${i % 2 === 0 ? body + dot + empty : empty + dot + body}</div>`;
  }).join('');
  document.querySelectorAll('.tl-item').forEach(el => {
    const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); obs.unobserve(e.target); } }), { threshold: 0.15 });
    obs.observe(el);
  });
}

// ── Vestimenta (texto + paleta de referencia por género) ──
function pintarVestimenta() {
  const seccion = $('sectionVestimenta');
  if (!C.modules || !C.modules.vestimenta || !C.vestimenta || !C.vestimenta.texto) {
    if (seccion) seccion.style.display = 'none';
    return;
  }
  set('vestTexto', C.vestimenta.texto);

  const tieneGaleria = (C.modules && C.modules.vestimenta_galeria !== false) && (
    (C.vestimenta.galeriaHombres && C.vestimenta.galeriaHombres.length) ||
    (C.vestimenta.galeriaMujeres && C.vestimenta.galeriaMujeres.length)
  );
  const btn = $('vestGaleriaBtn');
  if (btn) btn.style.display = tieneGaleria ? 'inline-flex' : 'none';
}

// ── Pétalos ────────────────────────────────────────────
function spawnPetals(containerId, count) {
  const el = $(containerId);
  if (!el) return;
  const colors = ['#EDD5C5', '#D4A99A', '#C4907A', '#E8C4B4', '#F0D8CC'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const sz = Math.random() * 14 + 7;
    p.className = containerId === 'videoPetals' ? 'v-petal' : 'petal';
    p.style.cssText = `left:${Math.random() * 100}%;width:${sz}px;height:${sz * 1.3}px;background:${colors[i % colors.length]};animation-duration:${Math.random() * 7 + 6}s;animation-delay:${Math.random() * 10}s;`;
    el.appendChild(p);
  }
}

// ── Countdown ─────────────────────────────────────────
function startCountdown() {
  const seccion = document.querySelector('.section-countdown');
  if (C.modules && C.modules.countdown === false) { if (seccion) seccion.style.display = 'none'; return; }
  const target = new Date(C.fecha).getTime();
  const pad = n => String(Math.floor(n)).padStart(2, '0');
  const tick = () => {
    const diff = target - Date.now();
    if (diff <= 0) { const l = $('cdLabel'); if (l) l.textContent = '¡Es hoy! 🌹'; return; }
    set('cd-days', pad(diff / 86400000));
    set('cd-hours', pad((diff % 86400000) / 3600000));
    set('cd-mins', pad((diff % 3600000) / 60000));
    set('cd-secs', pad((diff % 60000) / 1000));
  };
  tick(); setInterval(tick, 1000);
}

// ── Scroll Reveal ─────────────────────────────────────
function initReveal() {
  const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }), { threshold: 0.1 });
  document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el => obs.observe(el));
}

// ══════════════════════════════════════════════════════
//  VIDEO INTRO
// ══════════════════════════════════════════════════════
function initVideo() {
  const screen = $('videoScreen'), videoEl = $('videoEl'), progressF = $('videoProgressFill'),
        skipBtn = $('videoSkip'), invitation = $('invitation'), tapMsg = $('videoTapMsg');

  const videoActivo = !C.modules || C.modules.video !== false;
  if (!videoActivo || !C.video) { abrirInvitacionDirecto(); return; }

  videoEl.src = C.video;
  const delayMs = (C.videoDelay || 1) * 1000;
  let playStarted = false, skipShown = false;

  screen.addEventListener('click', () => { if (!playStarted) startVideo(); });

  function startVideo() {
    if (playStarted) return;
    playStarted = true;
    if (tapMsg) { tapMsg.classList.add('hiding'); setTimeout(() => tapMsg.classList.add('gone'), 700); }
    videoEl.volume = 1;
    videoEl.play().catch(() => { videoEl.muted = true; videoEl.play().catch(() => openInvitation()); });
  }

  videoEl.addEventListener('timeupdate', () => {
    if (!videoEl.duration) return;
    if (progressF) progressF.style.width = (videoEl.currentTime / videoEl.duration * 100) + '%';
    if (!skipShown && videoEl.currentTime >= 3) { skipShown = true; if (skipBtn) skipBtn.style.display = 'block'; }
  });
  videoEl.addEventListener('ended', () => setTimeout(openInvitation, delayMs));
  if (skipBtn) skipBtn.addEventListener('click', openInvitation);

  function openInvitation() {
    if (screen.classList.contains('closing')) return;
    screen.classList.add('closing');
    setTimeout(() => {
      screen.classList.add('gone');
      if (GUEST) showNameScreen(() => revelarInvitacion(invitation));
      else revelarInvitacion(invitation);
    }, 800);
  }
}

function abrirInvitacionDirecto() {
  const screen = $('videoScreen'), invitation = $('invitation');
  if (screen) screen.style.display = 'none';
  if (GUEST) showNameScreen(() => revelarInvitacion(invitation));
  else revelarInvitacion(invitation);
}

function revelarInvitacion(invitation) {
  invitation.classList.add('visible');
  playMusicSoftly();
}

function showNameScreen(callback) {
  const ns = $('nameScreen'), nameEl = $('nameScreenGuest');
  if (!ns || !nameEl) { callback(); return; }
  nameEl.textContent = GUEST;
  const sub = $('nameScreenSub'); if (sub) sub.textContent = `${C.pareja.nombreA} & ${C.pareja.nombreB} · ${fechaCompacta(C.fecha)}`;
  spawnPetals('namePetals', 10);
  ns.style.display = 'flex'; ns.style.opacity = '0';
  requestAnimationFrame(() => { ns.style.transition = 'opacity .8s ease'; ns.style.opacity = '1'; });
  setTimeout(() => {
    ns.style.opacity = '0';
    setTimeout(() => { ns.style.display = 'none'; callback(); }, 700);
  }, 4800);
}

// ── Música ────────────────────────────────────────────
let musicOn = false;
function initMusic() {
  const btn = $('musicBtn'), aud = $('bgMusic');
  if (!aud || !C.musicaUrl || (C.modules && C.modules.musica === false)) { if (btn) btn.style.display = 'none'; return; }
  aud.src = C.musicaUrl; aud.volume = 0;
  btn.addEventListener('click', () => {
    if (musicOn) { aud.pause(); musicOn = false; toggleIcon(false); }
    else { aud.play().catch(() => {}); fadeVol(aud, 0, .32, 3500); musicOn = true; toggleIcon(true); }
  });
}
function toggleIcon(on) { const a = $('musicOn'), b = $('musicOff'); if (a) a.style.display = on ? 'block' : 'none'; if (b) b.style.display = on ? 'none' : 'block'; }
function playMusicSoftly() {
  const aud = $('bgMusic');
  if (!aud || musicOn || !aud.src) return;
  aud.play().then(() => { musicOn = true; toggleIcon(true); fadeVol(aud, 0, .28, 5000); }).catch(() => {});
}
function fadeVol(aud, from, to, ms) {
  aud.volume = from;
  const steps = 60, step = (to - from) / steps;
  let cur = from;
  const iv = setInterval(() => { cur += step; aud.volume = Math.min(Math.max(cur, 0), 1); if ((step > 0 && cur >= to) || (step < 0 && cur <= to)) clearInterval(iv); }, ms / steps);
}

// ── Mensaje de voz ────────────────────────────────────
function initVoice() {
  const btn = $('voiceBtn'), aud = $('voiceMsg'), prog = $('voiceProgress'), fill = $('voiceProgressFill'), lbl = $('voiceLabel'), ico = $('voiceIcon');
  if (!btn || !aud || !aud.src) return;
  let playing = false;

  function startPlay() {
    const bg = $('bgMusic');
    if (aud.readyState >= 2) { doPlay(bg); }
    else { lbl.textContent = 'Cargando…'; aud.load(); aud.addEventListener('canplay', function onCanPlay() { aud.removeEventListener('canplay', onCanPlay); doPlay(bg); }, { once: true }); }
  }
  function doPlay(bg) {
    aud.play().then(() => {
      playing = true; ico.textContent = '⏸'; lbl.textContent = 'Pausar'; prog.classList.add('active');
      if (bg && musicOn) fadeVol(bg, bg.volume, .07, 1500);
    }).catch(() => { playing = false; ico.textContent = '▶'; lbl.textContent = 'Toca de nuevo para escuchar'; });
  }
  btn.addEventListener('click', () => {
    if (!playing) startPlay();
    else {
      aud.pause(); playing = false; ico.textContent = '▶'; lbl.textContent = 'Escuchar mensaje';
      const bg = $('bgMusic'); if (bg && musicOn) fadeVol(bg, bg.volume, .28, 1500);
    }
  });
  aud.addEventListener('timeupdate', () => { if (aud.duration) fill.style.width = (aud.currentTime / aud.duration * 100) + '%'; });
  aud.addEventListener('ended', () => {
    playing = false; ico.textContent = '▶'; lbl.textContent = 'Escuchar de nuevo';
    const bg = $('bgMusic'); if (bg && musicOn) fadeVol(bg, bg.volume, .28, 2000);
  });
}

// ── Lightbox ──────────────────────────────────────────
let lbImgs = [], lbIdx = 0;
function closeLightbox() {
  const lb = $('lightbox');
  if (!lb || !lb.classList.contains('open')) return;
  lb.classList.remove('open'); document.body.style.overflow = '';
  if (history.state && history.state.lightboxOpen) history.back();
}
function openLightbox(srcs, idx) {
  const lb = $('lightbox'), img = $('lbImg');
  if (!lb) return;
  lbImgs = srcs; lbIdx = idx; img.src = lbImgs[lbIdx];
  lb.classList.add('open'); document.body.style.overflow = 'hidden';
  history.pushState({ lightboxOpen: true }, '');
}
function initLightbox() {
  const lb = $('lightbox'), img = $('lbImg');
  if (!lb) return;
  $('lbClose').onclick = closeLightbox;
  $('lbPrev').onclick = () => { lbIdx = (lbIdx - 1 + lbImgs.length) % lbImgs.length; img.src = lbImgs[lbIdx]; };
  $('lbNext').onclick = () => { lbIdx = (lbIdx + 1) % lbImgs.length; img.src = lbImgs[lbIdx]; };
  lb.onclick = e => { if (e.target === lb) closeLightbox(); };
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') { lbIdx = (lbIdx - 1 + lbImgs.length) % lbImgs.length; img.src = lbImgs[lbIdx]; }
    if (e.key === 'ArrowRight') { lbIdx = (lbIdx + 1) % lbImgs.length; img.src = lbImgs[lbIdx]; }
  });
  window.addEventListener('popstate', () => { if (lb.classList.contains('open')) { lb.classList.remove('open'); document.body.style.overflow = ''; } });
  const gg = $('galleryGrid');
  if (gg) gg.addEventListener('click', e => {
    const item = e.target.closest('.gal-item'); if (!item) return;
    const srcs = Array.from(document.querySelectorAll('.gal-item img')).map(i => i.src);
    openLightbox(srcs, parseInt(item.dataset.idx) || 0);
  });
}

// ══════════════════════════════════════════════════════
//  LIBRO DE FIRMAS — ahora sobre Supabase (TuBodaBackend),
//  con el mismo flip-book CSS de la invitación original.
// ══════════════════════════════════════════════════════
let selectedEmoji = '❤️', uploadedPhotoUrl = '';
let _bookIdx = 0, _bookData = [], _bookFlipping = false;
// CLOUDINARY_CLOUD_NAME / CLOUDINARY_UPLOAD_PRESET ya están declaradas en
// shared/js/backend.js (se carga antes que este archivo) — no redeclarar
// aquí o el navegador tira SyntaxError por identificador duplicado.

function buildFlipBook(entries) {
  _bookData = entries || []; _bookIdx = 0;
  const emptyMsg = $('bookEmptyMsg'), navEl = $('bookNav'), fc = $('bookFlipContainer');
  if (!_bookData.length) { if (emptyMsg) emptyMsg.style.display = 'block'; if (navEl) navEl.style.display = 'none'; if (fc) fc.innerHTML = ''; return; }
  if (emptyMsg) emptyMsg.style.display = 'none';
  if (navEl) navEl.style.display = _bookData.length > 1 ? 'flex' : 'none';
  _renderPage(0, 'none'); _updateCounter();
}
function _buildPageHTML(e) {
  const hasPhoto = e.fotoUrl && e.fotoUrl !== '';
  return `<div class="stpf-page__inner">
    <div class="stpf-page__header"><span class="stpf-page__name">${e.nombre}</span><span class="stpf-page__emoji">${e.emoji || '❤️'}</span></div>
    <div class="stpf-page__line"></div>
    <p class="stpf-page__msg">"${e.mensaje}"</p>
    <p class="stpf-page__date">${e.fecha || ''}</p>
    ${hasPhoto ? `<div class="stpf-page__photo book-css-photo"><img src="${e.fotoUrl}" alt="${e.nombre}" loading="lazy"/></div>` : ''}
  </div>`;
}
function _renderPage(idx, direction) {
  const container = $('bookFlipContainer');
  if (!container || !_bookData.length) return;
  const e = _bookData[idx]; if (!e) return;
  const newPage = document.createElement('div'); newPage.className = 'book-css-page'; newPage.innerHTML = _buildPageHTML(e);
  if (direction === 'none') { container.innerHTML = ''; container.appendChild(newPage); return; }
  const oldPage = container.querySelector('.book-css-page');
  const outAnim = direction === 'next' ? 'css-flip-out-left' : 'css-flip-out-right';
  const inAnim = direction === 'next' ? 'css-flip-in-right' : 'css-flip-in-left';
  if (oldPage) {
    oldPage.classList.add(outAnim);
    setTimeout(() => {
      container.innerHTML = '';
      newPage.style.animation = `${inAnim} 0.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards`;
      container.appendChild(newPage);
      setTimeout(() => { newPage.style.animation = ''; _bookFlipping = false; }, 420);
    }, 300);
  } else { container.appendChild(newPage); _bookFlipping = false; }
}
function _updateCounter() { const n = $('bookPageNum'); if (n && _bookData.length) n.textContent = `${_bookIdx + 1} / ${_bookData.length}`; }

function initBook() {
  const seccion = $('section-firmas');
  if (!C.modules || C.modules.firmas === false) { if (seccion) seccion.style.display = 'none'; return; }

  document.querySelectorAll('.book-emoji').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.book-emoji').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected'); selectedEmoji = btn.dataset.e;
  }));
  const ta = $('bookMessage');
  if (ta) ta.addEventListener('input', () => set('bookChars', 280 - ta.value.length));

  const preview = $('bookPhotoPreview'), input = $('bookPhotoInput'), img = $('bookPhotoImg'),
        placeholder = $('bookPhotoPlaceholder'), removeBtn = $('bookPhotoRemove');
  if (preview) {
    preview.addEventListener('click', () => { if (!uploadedPhotoUrl) input.click(); });
    input.addEventListener('change', async e => {
      const file = e.target.files[0]; if (!file) return;
      placeholder.style.display = 'none'; img.style.display = 'none'; removeBtn.style.display = 'flex';
      const spinner = document.createElement('div'); spinner.id = 'bookUploadSpinner';
      spinner.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--cream);border-radius:12px;gap:.3rem';
      spinner.innerHTML = '<div style="width:24px;height:24px;border:2px solid var(--blush);border-top-color:var(--rose-mid);border-radius:50%;animation:spin .7s linear infinite"></div><span style="font-size:.6rem;color:var(--text-light);letter-spacing:.08em">Subiendo...</span>';
      preview.appendChild(spinner);
      uploadedPhotoUrl = await uploadCloudinary(file);
      const sp = $('bookUploadSpinner'); if (sp) sp.remove();
      if (uploadedPhotoUrl) { img.src = uploadedPhotoUrl; img.style.display = 'block'; }
      else { toast('⚠️ No se pudo subir la foto, pero tu mensaje se puede enviar igual'); }
    });
    if (removeBtn) removeBtn.addEventListener('click', e => {
      e.stopPropagation(); img.src = ''; img.style.display = 'none';
      placeholder.style.display = 'flex'; removeBtn.style.display = 'none'; uploadedPhotoUrl = ''; input.value = '';
    });
  }
  $('bookSubmit').addEventListener('click', submitFirma);
  const prevB = $('bookPrev'), nextB = $('bookNext');
  if (prevB) prevB.addEventListener('click', () => { if (_bookFlipping || _bookIdx <= 0) return; _bookFlipping = true; _bookIdx--; _renderPage(_bookIdx, 'prev'); _updateCounter(); });
  if (nextB) nextB.addEventListener('click', () => { if (_bookFlipping || _bookIdx >= _bookData.length - 1) return; _bookFlipping = true; _bookIdx++; _renderPage(_bookIdx, 'next'); _updateCounter(); });

  cargarFirmasPetalos();
}

async function uploadCloudinary(file) {
  const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  const isVideo = file.type.startsWith('video/') || /\.(mov|mp4|avi|webm)$/i.test(file.name);
  const endpoint = isVideo ? 'video' : 'image';
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${endpoint}/upload`, { method: 'POST', body: fd });
    const d = await res.json();
    if (!d.secure_url) return '';
    const transform = isVideo ? 'f_jpg,q_auto,so_0' : 'f_jpg,q_auto';
    return d.secure_url.replace('/upload/', `/upload/${transform}/`).replace(/\.[^/.]+$/, '.jpg');
  } catch (e) { return ''; }
}

async function submitFirma() {
  const msg = ($('bookMessage').value || '').trim();
  if (!msg) { toast('Por favor escribe un mensaje 🌹'); return; }
  const btn = $('bookSubmit'); btn.disabled = true; $('bookSubmitLabel').textContent = 'Enviando...';
  const esPrivado = $('bookPrivate')?.checked || false;

  try {
    await TuBodaBackend.enviarFirma(C.eventoId, GUEST || 'Invitado especial', msg, null, {
      emoji: selectedEmoji, fotoUrl: uploadedPhotoUrl, privado: esPrivado
    });
    toast(esPrivado ? '🔒 Mensaje enviado — solo los novios lo verán 💌' : '💌 ¡Tu mensaje fue enviado con amor! Aparecerá aquí en cuanto sea aprobado.');
  } catch (e) { toast('No se pudo enviar tu mensaje, intenta de nuevo'); }

  $('bookMessage').value = ''; set('bookChars', '280');
  uploadedPhotoUrl = ''; if ($('bookPhotoInput')) $('bookPhotoInput').value = '';
  const pi = $('bookPhotoImg'); if (pi) { pi.src = ''; pi.style.display = 'none'; }
  const pp = $('bookPhotoPlaceholder'); if (pp) pp.style.display = 'flex';
  const pr = $('bookPhotoRemove'); if (pr) pr.style.display = 'none';
  btn.disabled = false; $('bookSubmitLabel').textContent = 'Firmar el libro 💌';
}

// Carga los mensajes ya APROBADOS desde Supabase (la moderación la hace
// el panel admin, igual que en las otras 14 plantillas).
async function cargarFirmasPetalos() {
  try {
    const firmas = await TuBodaBackend.cargarFirmas(C.eventoId);
    const normalizadas = (firmas || []).filter(f => !f.privado).map(f => ({
      nombre: f.nombre, mensaje: f.mensaje, emoji: f.emoji || '❤️', fotoUrl: f.foto_url || ''
    }));
    const sorted = normalizadas.sort((a, b) => (a.fotoUrl && !b.fotoUrl) ? -1 : ((!a.fotoUrl && b.fotoUrl) ? 1 : 0));
    buildFlipBook(sorted);
  } catch (e) { buildFlipBook([]); }
}

function toast(msg) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:var(--rose-deep);color:white;padding:.85rem 2rem;border-radius:50px;font-family:var(--font-b);font-size:.85rem;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.2);white-space:nowrap';
  t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// ── Playlist / canción ──────────────────────────────────
function pintarCancion() {
  const seccion = $('section-cancion');
  if (!C.modules || !C.modules.cancion) { if (seccion) seccion.style.display = 'none'; return; }

  const embedWrap = $('cancionEmbedWrap'), form = $('formCancion'), intro = $('cancionIntro');
  const hayPlaylistReal = C.cancionModo === 'embed' && C.cancionEmbedUrl;

  if (hayPlaylistReal) {
    const urlEmbebida = TuBodaBackend.normalizarPlaylistUrl(C.cancionEmbedUrl);
    set('cancionIntro', 'Esta es nuestra playlist para la fiesta. Ábrela y, si quieres, agrega ahí mismo tu canción favorita.');
    const esSpotify = urlEmbebida.includes('spotify.com');
    const esYoutube = urlEmbebida.includes('youtube.com') || urlEmbebida.includes('youtu.be');
    if (esSpotify) embedWrap.innerHTML = `<iframe src="${urlEmbebida}" width="100%" height="352" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
    else if (esYoutube) embedWrap.innerHTML = `<iframe width="100%" height="220" src="${urlEmbebida}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen loading="lazy"></iframe>`;
    else embedWrap.innerHTML = `<a href="${urlEmbebida}" target="_blank" class="btn btn-outline">Abrir playlist</a>`;
    embedWrap.style.display = 'block';
    if (form) form.style.display = 'none';
    return;
  }

  // Sin playlist real compartida: los invitados sugieren una canción escrita.
  set('cancionIntro', 'Escribe una canción que no puede faltar en la fiesta.');
  if (form) {
    form.style.display = 'flex';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = $('cancionInput'), nombreInput = $('cancionNombre');
      const texto = input.value.trim();
      if (!texto) return;
      try {
        await TuBodaBackend.enviarCancion(C.eventoId, (nombreInput.value || '').trim() || 'Invitado', texto);
        input.value = ''; nombreInput.value = '';
        toast('¡Gracias! Ya la anotamos. 🎶');
      } catch (err) { toast('No se pudo guardar tu canción, intenta de nuevo'); }
    });
  }
}


function initAutoNudge() {
  const inv = $('invitation');
  let done = false;
  const tryNudge = () => {
    if (done || window.scrollY > 10 || !inv || !inv.classList.contains('visible')) return;
    done = true;
    window.scrollBy({ top: 60, behavior: 'smooth' });
    setTimeout(() => window.scrollBy({ top: -60, behavior: 'smooth' }), 500);
  };
  setTimeout(tryNudge, 1500);
  window.addEventListener('scroll', () => { done = true; }, { once: true, passive: true });
}

// ── Modal de vestimenta (galería por género desde config) ──
function openVestModal() { const m = $('vestModal'); if (m) m.classList.add('open'); }
function closeVestModal() { const m = $('vestModal'); if (m) m.classList.remove('open'); }
window.openVestModal = openVestModal;
window.closeVestModal = closeVestModal;
window.openLightbox = openLightbox;

function initVestModal() {
  const gridH = $('vestGridHombres'), gridD = $('vestGridDamas');
  if (!gridH || !gridD || !C.vestimenta) return;

  const hombres = C.vestimenta.galeriaHombres || [];
  const mujeres = C.vestimenta.galeriaMujeres || [];

  const pintarGrid = (grid, fotos) => {
    grid.innerHTML = fotos.map((src, i) => `
      <div class="vest-grid__item"><img src="${src}" alt="Referencia ${i + 1}" loading="lazy" data-idx="${i}"/></div>`).join('');
    grid.querySelectorAll('img').forEach(imgEl => {
      imgEl.addEventListener('click', () => openLightbox(fotos, parseInt(imgEl.dataset.idx) || 0));
    });
  };
  pintarGrid(gridH, hombres);
  pintarGrid(gridD, mujeres);
  $('vestSeccionHombres').style.display = hombres.length ? '' : 'none';
  $('vestSeccionMujeres').style.display = mujeres.length ? '' : 'none';
  $('vestDivider').style.display = (hombres.length && mujeres.length) ? '' : 'none';

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeVestModal(); });
}
