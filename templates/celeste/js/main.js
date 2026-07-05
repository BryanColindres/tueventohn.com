let C;

document.addEventListener('DOMContentLoaded', async () => {
  C = await TuBodaBackend.cargarConfig();
  if (!C) return;

  generarEstrellas();
  iniciarVideo();
  pintarHero();
  iniciarCountdown();
  pintarMensajes();
  pintarHistoria();
  pintarTimeline();
  pintarUbicacion();
  pintarAddons();
  pintarRSVP();
  pintarFooter();
  iniciarReveal();
});

function generarEstrellas(){
  const cont = document.getElementById('estrellas');
  for (let i = 0; i < 60; i++) {
    const e = document.createElement('span');
    e.className = 'estrella';
    const size = Math.random() < .8 ? 1.5 : 2.5;
    e.style.width = size + 'px';
    e.style.height = size + 'px';
    e.style.left = Math.random() * 100 + '%';
    e.style.top = Math.random() * 100 + '%';
    e.style.animationDelay = (Math.random() * 4) + 's';
    e.style.animationDuration = (2.5 + Math.random() * 3) + 's';
    cont.appendChild(e);
  }
}

function iniciarVideo(){
  const screen = document.getElementById('video-screen');
  const overlay = document.getElementById('video-overlay');
  const video = document.getElementById('video-el');
  const invitation = document.getElementById('invitation');
  const progress = document.getElementById('video-progress');

  document.getElementById('overlay-nombres').textContent = `${C.pareja.nombreA} & ${C.pareja.nombreB}`;
  document.getElementById('overlay-fecha').textContent = C.fechaTexto || '';
  if (C.video) video.src = C.video;

    function cerrarTodo(){
    overlay.classList.add('gone');
    screen.classList.add('closing');
    setTimeout(() => screen.classList.add('gone'), 800);
    invitation.classList.add('visible');
  }

  // Dentro de un iframe (vista previa del catálogo) se abre directo,
  // sin esperar el toque del usuario y sin reproducir video.
  if (window.self !== window.top) {
    cerrarTodo();
  } else {
    overlay.addEventListener('click', () => {
    overlay.classList.add('hiding');
    screen.classList.add('playing');
    if (C.video) {
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
  document.getElementById('hero-coord').textContent = C.coordenadas || '';
  document.getElementById('hero-photo').innerHTML = C.fotos.hero ? `<img src="${C.fotos.hero}" alt="">` : '';
}

function pintarMensajes(){
  const seccion = document.getElementById('section-mensajes');
  if (!C.mensajes || !C.mensajes.length) { seccion.style.display = 'none'; return; }
  document.getElementById('mensajes-contenido').innerHTML = C.mensajes.map(m => `
    <div class="mensaje-card reveal">
      <p>${m.texto}</p>
      ${m.referencia ? `<span class="ref">${m.referencia}</span>` : ''}
    </div>`).join('');
}

function pintarHistoria(){
  const seccion = document.getElementById('section-historia');
  const cont = document.getElementById('historia-contenido');
  if (!C.historia || !C.historia.length) { seccion.style.display = 'none'; return; }
  cont.innerHTML = C.historia.map(h => `
    <div class="historia-item reveal">
      <div class="historia-item__estrella"></div>
      <div class="historia-item__texto">
        ${h.coord ? `<span class="historia-item__coord">${h.coord}</span>` : ''}
        ${h.titulo ? `<h3>${h.titulo}</h3>` : ''}
        <p>${h.texto}</p>
      </div>
      ${h.foto ? `<div class="historia-item__foto"><img src="${h.foto}" alt=""></div>` : ''}
    </div>`).join('');
}

function pintarTimeline(){
  const seccion = document.getElementById('section-timeline');
  const cont = document.getElementById('timeline-contenido');
  if (!C.timeline || !C.timeline.length) { seccion.style.display = 'none'; return; }
  cont.innerHTML = C.timeline.map(t => `
    <div class="prog-item reveal">
      <span class="prog-icono"></span>
      <span class="prog-titulo">${t.titulo}</span>
      <span class="prog-hora">${t.hora}</span>
    </div>`).join('');
}

function pintarUbicacion(){
  document.getElementById('ubicacion-nombre').textContent = C.lugar.nombre;
  document.getElementById('ubicacion-direccion').textContent = C.lugar.direccion;
  document.getElementById('ubicacion-link').href = C.lugar.mapsUrl;
}

function pintarAddons(){
  const seccionGaleria = document.getElementById('section-galeria');
  if (!C.modules || !C.modules.galeria) {
    seccionGaleria.style.display = 'none';
  } else {
    const grid = document.getElementById('galeria-grid');
    (C.galeriaMuestra || []).forEach(src => {
      const div = document.createElement('div');
      div.className = 'gal-item reveal';
      div.innerHTML = `<img src="${src}" alt="">`;
      grid.appendChild(div);
    });
    document.getElementById('btn-subir-foto').addEventListener('click', () => document.getElementById('input-foto').click());
    document.getElementById('input-foto').addEventListener('change', subirFoto);
  }

  const seccionFirmas = document.getElementById('section-firmas');
  if (!C.modules || !C.modules.firmas) {
    seccionFirmas.style.display = 'none';
  } else {
    document.getElementById('form-firma').addEventListener('submit', enviarFirma);
    cargarFirmas();
  }
}

async function subirFoto(e){
  const archivo = e.target.files[0];
  if (!archivo) return;
  try {
    const url = await TuBodaBackend.subirFotoGaleria(C.eventoId, archivo);
    const div = document.createElement('div');
    div.className = 'gal-item';
    div.innerHTML = `<img src="${url}" alt="">`;
    document.getElementById('galeria-grid').prepend(div);
  } catch (err) { alert('No se pudo subir la foto. Intenta de nuevo.'); }
}

async function enviarFirma(e){
  e.preventDefault();
  const nombre = document.getElementById('firma-nombre').value.trim();
  const mensaje = document.getElementById('firma-mensaje').value.trim();
  try {
    await TuBodaBackend.enviarFirma(C.eventoId, nombre, mensaje);
    document.getElementById('form-firma').reset();
    cargarFirmas();
  } catch (err) { alert('No se pudo guardar tu firma. Intenta de nuevo.'); }
}

async function cargarFirmas(){
  try {
    const registros = await TuBodaBackend.cargarFirmas(C.eventoId);
    const lista = document.getElementById('firmas-lista');
    if (!registros || !registros.length) return;
    lista.innerHTML = registros.map(r => `
      <div class="firma-item">
        <div class="nombre">${r.nombre || ''}</div>
        <div class="mensaje">${r.mensaje || ''}</div>
      </div>`).join('');
  } catch (err) { console.error(err); }
}

function pintarRSVP(){
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
  function bloque(v, l){ return `<div class="cd-item"><div class="cd-orbita"><span>${String(v).padStart(2,'0')}</span></div><p>${l}</p></div>`; }
  actualizar();
  setInterval(actualizar, 1000);
}

function iniciarReveal(){
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// ---------------- SENDERO DE CONSTELACIÓN (serpentea por toda la página) ----------------
function generarSendero(){
  const svg = document.getElementById('sendero-constelacion');
  const alto = document.body.scrollHeight;
  const ancho = window.innerWidth;
  svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
  svg.setAttribute('width', ancho);
  svg.setAttribute('height', alto);

  const puntos = [];
  const pasos = Math.max(18, Math.floor(alto / 260));
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    const y = t * alto;
    // onda suave que se mece de un lado a otro, como flotar en el espacio
    const x = ancho * 0.5 + Math.sin(t * Math.PI * 3.4) * (ancho * 0.28);
    puntos.push([x, y]);
  }

  const path = puntos.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');

  let estrellasSvg = '';
  puntos.forEach((p, i) => {
    if (i % 2 === 0) {
      const r = 1 + Math.random() * 1.6;
      estrellasSvg += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r.toFixed(1)}" fill="#E4CE9A" opacity="${(0.35 + Math.random() * 0.4).toFixed(2)}"/>`;
    }
  });

  svg.innerHTML = `
    <path d="${path}" fill="none" stroke="#C9A968" stroke-width="1" opacity="0.25" stroke-dasharray="2 10" stroke-linecap="round"/>
    ${estrellasSvg}
  `;
}

window.addEventListener('load', () => {
  generarSendero();
  setTimeout(generarSendero, 800); // recalcular tras cargar imágenes
});
let reajusteTimeout;
window.addEventListener('resize', () => {
  clearTimeout(reajusteTimeout);
  reajusteTimeout = setTimeout(generarSendero, 250);
});
