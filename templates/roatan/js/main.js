let C;

document.addEventListener('DOMContentLoaded', async () => {
  C = await TuBodaBackend.cargarConfig();
  if (!C) return;

  iniciarVideo();
  pintarHero();
  pintarBannerPersonal();
  iniciarCountdown();
  pintarMensajes();
  pintarHistoria();
  pintarTimeline();
  pintarUbicacion();
  pintarAddons();
  generarBurbujas();
  pintarRSVP();
  pintarFooter();
  pintarVideoInterno();
  pintarDetalles();
  pintarVestimenta();
  pintarRegalos();
  iniciarMusica();
  iniciarReveal();

  pintarMensajeVoz();
});

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

  // Dentro de un iframe (vista previa del catálogo) se abre directo,
  // sin esperar el toque del usuario y sin reproducir video.
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
    } else { setTimeout(cerrarTodo, 500); }
  });
  }
}

function pintarHero(){
  document.getElementById('hero-nombreA').textContent = C.pareja.nombreA;
  document.getElementById('hero-nombreB').textContent = C.pareja.nombreB;
  document.getElementById('hero-fecha').textContent = C.fechaTexto;
  document.getElementById('hero-photo').innerHTML = C.fotos.hero ? `<img src="${C.fotos.hero}" alt="">` : '';
}

function pintarMensajes(){
  const seccion = document.getElementById('section-mensajes');
  if ((C.modules && C.modules.mensajes === false) || !C.mensajes || !C.mensajes.length) { seccion.style.display = 'none'; return; }
  document.getElementById('mensajes-contenido').innerHTML = C.mensajes.map(m => `
    <div class="mensaje-card reveal">
      <p>${m.texto}</p>
      ${m.referencia ? `<span class="ref">${m.referencia}</span>` : ''}
    </div>`).join('');
}

function pintarHistoria(){
  const seccion = document.getElementById('section-historia');
  const cont = document.getElementById('historia-contenido');
  if ((C.modules && C.modules.historia === false) || !C.historia || !C.historia.length) { seccion.style.display = 'none'; return; }
  cont.innerHTML = `<svg class="ruta-svg" id="ruta-svg"></svg>` + C.historia.map(h => `
    <div class="historia-item reveal">
      <span class="historia-item__x">✕</span>
      <div class="historia-item__foto"><img src="${h.foto}" alt="${h.titulo || ''}"></div>
      <div class="historia-item__texto">
        ${h.titulo ? `<h3>${h.titulo}</h3>` : ''}
        <p>${h.texto}</p>
      </div>
    </div>`).join('');

  // dibujar la línea de ruta conectando los círculos X de cada punto
  requestAnimationFrame(() => {
    const wrap = document.querySelector('.ruta-mapa');
    const svg = document.getElementById('ruta-svg');
    const marcas = wrap.querySelectorAll('.historia-item__x');
    if (!marcas.length) return;
    const wrapRect = wrap.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${wrapRect.width} ${wrapRect.height}`);
    let puntos = [];
    marcas.forEach(m => {
      const r = m.getBoundingClientRect();
      puntos.push([r.left - wrapRect.left + r.width / 2, r.top - wrapRect.top + r.height / 2]);
    });
    const path = puntos.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    svg.innerHTML = `<path d="${path}" fill="none" stroke="#E8735A" stroke-width="2" stroke-dasharray="6 6" opacity="0.7"/>`;
  });
}

function pintarTimeline(){
  const seccion = document.getElementById('section-timeline');
  const cont = document.getElementById('timeline-contenido');
  if ((C.modules && C.modules.timeline === false) || !C.timeline || !C.timeline.length) { seccion.style.display = 'none'; return; }
  const icono = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/></svg>';
  cont.innerHTML = C.timeline.map(t => `
    <div class="prog-item reveal">
      ${icono}
      <span class="prog-titulo">${TuBodaBackend.iconoTimelineHtml(t.icono)}${t.titulo}</span>
      <span class="prog-hora">${t.hora}</span>
    </div>`).join('');
}

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

function generarBurbujas(){
  const cont = document.getElementById('burbujas-galeria');
  if (!cont) return;
  for (let i = 0; i < 14; i++) {
    const b = document.createElement('span');
    b.className = 'burbuja';
    const size = 6 + Math.random() * 16;
    b.style.width = size + 'px';
    b.style.height = size + 'px';
    b.style.left = Math.random() * 100 + '%';
    b.style.bottom = '-20px';
    b.style.animationDelay = (Math.random() * 8) + 's';
    b.style.animationDuration = (6 + Math.random() * 5) + 's';
    cont.appendChild(b);
  }
}

function pintarAddons(){
  if (C.modules && C.modules.galeria) {
    const grid = document.getElementById('galeria-grid');
    const fotos = C.galeriaMuestra || [];
    // posiciones (%) calculadas sobre el viewBox 400x180 del barco, alineadas al casco
    const posiciones = [
      { left: 30, top: 44, size: 26 },
      { left: 44, top: 44, size: 26 },
      { left: 58, top: 44, size: 26 },
      { left: 72, top: 44, size: 26 },
      { left: 37, top: 20, size: 18 },
      { left: 58, top: 20, size: 18 }
    ];
    fotos.forEach((src, i) => {
      const pos = posiciones[i % posiciones.length];
      const div = document.createElement('div');
      div.className = 'barco-ventana';
      div.style.left = pos.left + '%';
      div.style.top = pos.top + '%';
      div.style.width = pos.size + '%';
      div.style.aspectRatio = '1';
      div.style.transform = 'translate(-50%,-50%)';
      div.innerHTML = `<img src="${src}" alt="">`;
      grid.appendChild(div);
    });
    document.getElementById('btn-subir-foto').addEventListener('click', () => document.getElementById('input-foto').click());
    document.getElementById('input-foto').addEventListener('change', subirFoto);
  }

  const seccionDeseo = document.getElementById('section-deseo');
  if (!C.modules || !C.modules.firmas) {
    seccionDeseo.style.display = 'none';
  } else {
    if (C.firmasFotoUrl) {
      document.getElementById('firmas-foto').innerHTML = `<img src="${C.firmasFotoUrl}" alt="">`;
      document.getElementById('firmas-foto').classList.remove('oculto');
    }
    document.getElementById('btn-soltar').addEventListener('click', enviarDeseo);
    cargarDeseos();
  }
}

async function subirFoto(e){
  const archivo = e.target.files[0];
  if (!archivo) return;
  try {
    const url = await TuBodaBackend.subirFotoGaleria(C.eventoId, archivo);
    const div = document.createElement('div');
    div.className = 'barco-ventana';
    div.style.left = '50%';
    div.style.top = '85%';
    div.style.width = '16%';
    div.style.aspectRatio = '1';
    div.style.transform = 'translate(-50%,-50%)';
    div.innerHTML = `<img src="${url}" alt="">`;
    document.getElementById('galeria-grid').appendChild(div);
  } catch (err) { alert('No se pudo subir la foto. Intenta de nuevo.'); }
}

async function enviarDeseo(){
  const nombre = document.getElementById('deseo-nombre').value.trim();
  const mensaje = document.getElementById('deseo-texto').value.trim();
  if (!nombre || !mensaje) { alert('Escribe tu nombre y tu deseo antes de soltar la botella.'); return; }

  const papel = document.getElementById('deseo-papel');
  const botella = document.getElementById('deseo-botella');
  const gracias = document.getElementById('deseo-gracias');
  const btn = document.getElementById('btn-soltar');

  btn.disabled = true;
  papel.classList.add('metiendo');

  setTimeout(() => {
    botella.classList.add('enviada');
  }, 500);

  setTimeout(async () => {
    gracias.classList.add('visible');
    await guardarDeseo(nombre, mensaje);
    document.getElementById('deseo-nombre').value = '';
    document.getElementById('deseo-texto').value = '';
    setTimeout(() => {
      papel.classList.remove('metiendo');
      botella.classList.remove('enviada');
      gracias.classList.remove('visible');
      btn.disabled = false;
    }, 1800);
  }, 1300);
}

async function guardarDeseo(nombre, mensaje){
  try {
    await TuBodaBackend.enviarFirma(C.eventoId, nombre, mensaje);
    cargarDeseos();
  } catch (err) { console.error(err); }
}

async function cargarDeseos(){
  try {
    const registros = await TuBodaBackend.cargarFirmas(C.eventoId);
    const lista = document.getElementById('deseos-lista');
    if (!registros || !registros.length) return;
    lista.innerHTML = registros.map(r => `
      <div class="deseo-item"><b>${r.nombre || ''}:</b> ${r.mensaje || ''}</div>
    `).join('');
  } catch (err) { console.error(err); }
}

function pintarRSVP(){
  const spanFechaLimite = document.getElementById('rsvp-fecha-limite');
  if (spanFechaLimite) spanFechaLimite.textContent = C.rsvpFechaLimite || 'la fecha indicada';
  if (C.rsvpFotoUrl) {
    document.getElementById('rsvp-foto').innerHTML = `<img src="${C.rsvpFotoUrl}" alt="">`;
    document.getElementById('rsvp-foto').classList.remove('oculto');
  }
  const msj = encodeURIComponent(`Hola, confirmo mi asistencia a la boda de ${C.pareja.nombreA} y ${C.pareja.nombreB}`);
  document.getElementById('rsvp-novio').href = `https://wa.me/${C.whatsapp.novio}?text=${msj}`;
  document.getElementById('rsvp-novia').href = `https://wa.me/${C.whatsapp.novia}?text=${msj}`;
}

function pintarFooter(){
  document.getElementById('footer-iniciales').textContent = `${C.pareja.nombreA} & ${C.pareja.nombreB}`;
  document.getElementById('footer-fecha').textContent = C.fechaTexto;
  document.getElementById('footer-photo').innerHTML = C.fotos.footer ? `<img src="${C.fotos.footer}" alt="">` : '';
}

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



// ---------------- BANNER PERSONALIZADO ----------------
function pintarBannerPersonal(){
  if (!C.invitado || !C.invitado.nombre) return;
  document.getElementById('banner-personal-nombre').textContent = C.invitado.nombre;
  document.getElementById('banner-personal').classList.remove('oculto');
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
  if (C.vestimenta.botonUrl) {
    const btn = document.getElementById('vestimenta-boton');
    btn.href = C.vestimenta.botonUrl;
    btn.classList.remove('oculto');
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

// ---------------- SENDERO DE HUELLAS (serpentea por toda la página) ----------------
function generarSendero(){
  const svg = document.getElementById('sendero-huellas');
  const alto = document.body.scrollHeight;
  const ancho = window.innerWidth;
  svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
  svg.setAttribute('width', ancho);
  svg.setAttribute('height', alto);

  const pasos = Math.max(24, Math.floor(alto / 90));
  let huellas = '';
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    const y = t * alto;
    const x = ancho * 0.5 + Math.sin(t * Math.PI * 5) * (ancho * 0.32);
    const rotacion = Math.cos(t * Math.PI * 5) * 20;
    const lado = i % 2 === 0 ? -8 : 8;
    huellas += `<ellipse cx="${(x + lado).toFixed(1)}" cy="${y.toFixed(1)}" rx="3.5" ry="6" fill="#2E2418" opacity="0.12" transform="rotate(${rotacion.toFixed(0)} ${(x+lado).toFixed(1)} ${y.toFixed(1)})"/>`;
  }
  svg.innerHTML = huellas;
}
window.addEventListener('load', () => { generarSendero(); setTimeout(generarSendero, 800); });
let reajusteTimeout;
window.addEventListener('resize', () => { clearTimeout(reajusteTimeout); reajusteTimeout = setTimeout(generarSendero, 250); });
