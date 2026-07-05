let C;

document.addEventListener('DOMContentLoaded', async () => {
  C = await TuBodaBackend.cargarConfig();
  if (!C) return;

  iniciarVideo();
  pintarHero();
  iniciarCountdown();
  pintarMensajes();
  pintarHistoria();
  pintarTimeline();
  pintarUbicacion();
  pintarAddons();
  generarBurbujas();
  pintarRSVP();
  pintarFooter();
  iniciarReveal();
});

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
  document.getElementById('hero-fecha').textContent = C.fechaTexto;
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
  if (!C.timeline || !C.timeline.length) { seccion.style.display = 'none'; return; }
  const icono = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/></svg>';
  cont.innerHTML = C.timeline.map(t => `
    <div class="prog-item reveal">
      ${icono}
      <span class="prog-titulo">${t.titulo}</span>
      <span class="prog-hora">${t.hora}</span>
    </div>`).join('');
}

function pintarUbicacion(){
  document.getElementById('ubicacion-nombre').textContent = C.lugar.nombre;
  document.getElementById('ubicacion-direccion').textContent = C.lugar.direccion;
  document.getElementById('ubicacion-link').href = C.lugar.mapsUrl;
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
  function bloque(v, l){ return `<div class="cd-item"><span>${String(v).padStart(2,'0')}</span><p>${l}</p></div>`; }
  actualizar();
  setInterval(actualizar, 1000);
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
