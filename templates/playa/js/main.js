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
  pintarVestimenta();
  pintarAddons();
  pintarRSVP();
  pintarFooter();
  iniciarCapitulos();
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
  if (!C.mensajes || !C.mensajes.length) { seccion.remove(); return; }
  document.getElementById('mensajes-contenido').innerHTML = C.mensajes.map(m => `
    <div class="mensaje-card">
      <p>${m.texto}</p>
      ${m.referencia ? `<span class="ref">${m.referencia}</span>` : ''}
    </div>`).join('');
}

function pintarHistoria(){
  const seccion = document.getElementById('section-historia');
  const cont = document.getElementById('historia-contenido');
  if (!C.historia || !C.historia.length) { seccion.remove(); return; }
  cont.innerHTML = C.historia.map(h => `
    <div class="historia-item">
      <div class="historia-item__foto"><img src="${h.foto}" alt="${h.titulo || ''}"></div>
      <div class="historia-item__texto">
        ${h.titulo ? `<h3>${h.titulo}</h3>` : ''}
        <p>${h.texto}</p>
      </div>
    </div>`).join('');
}

function pintarTimeline(){
  const seccion = document.getElementById('section-timeline');
  const cont = document.getElementById('timeline-contenido');
  if (!C.timeline || !C.timeline.length) { seccion.remove(); return; }
  cont.innerHTML = C.timeline.map((t, i) => `
    <div class="prog-item">
      <span class="prog-num">${i + 1}.</span>
      <p class="prog-titulo-linea"><span class="prog-hora">${t.hora}</span> + ${t.titulo}:</p>
      <p class="prog-texto">${t.texto || ''}</p>
    </div>`).join('');
}

function pintarUbicacion(){
  document.getElementById('ubicacion-nombre').textContent = C.lugar.nombre;
  document.getElementById('ubicacion-direccion').textContent = C.lugar.direccion;
  document.getElementById('ubicacion-link').href = C.lugar.mapsUrl;
}

function pintarVestimenta(){
  const seccion = document.getElementById('section-vestimenta');
  if (!C.vestimenta) { seccion.remove(); return; }
  document.getElementById('vestimenta-titulo').textContent = C.vestimenta.titulo || 'Código de vestimenta';
  document.getElementById('vestimenta-texto').textContent = C.vestimenta.texto || '';
  document.getElementById('vestimenta-paleta').innerHTML = (C.vestimenta.colores || [])
    .map(c => `<span class="paleta-color" style="background:${c}"></span>`).join('');
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
  function bloque(v, l){ return `<div class="cd-item"><span>${String(v).padStart(2,'0')}</span><p>${l}</p></div>`; }
  actualizar();
  setInterval(actualizar, 1000);
}

// ---------------- NAVEGACIÓN POR CAPÍTULOS ----------------
function iniciarCapitulos(){
  const capitulos = Array.from(document.querySelectorAll('.capitulo'));
  const dotsWrap = document.getElementById('cap-dots');
  const btnPrev = document.getElementById('cap-prev');
  const btnNext = document.getElementById('cap-next');
  let actual = 0;

  capitulos.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'cap-dot' + (i === 0 ? ' activo' : '');
    dot.addEventListener('click', () => ir(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function ir(i){
    if (i < 0 || i >= capitulos.length) return;
    capitulos[actual].classList.remove('activo');
    dots[actual].classList.remove('activo');
    actual = i;
    capitulos[actual].classList.add('activo');
    capitulos[actual].scrollTop = 0;
    dots[actual].classList.add('activo');
    btnPrev.disabled = actual === 0;
    btnNext.disabled = actual === capitulos.length - 1;
  }

  btnPrev.addEventListener('click', () => ir(actual - 1));
  btnNext.addEventListener('click', () => ir(actual + 1));
  btnPrev.disabled = true;

  // swipe táctil simple
  let startY = null;
  document.getElementById('capitulos').addEventListener('touchstart', e => { startY = e.touches[0].clientY; });
  document.getElementById('capitulos').addEventListener('touchend', e => {
    if (startY === null) return;
    const diff = startY - e.changedTouches[0].clientY;
    const cap = capitulos[actual];
    const enFondo = cap.scrollTop + cap.clientHeight >= cap.scrollHeight - 4;
    const enInicio = cap.scrollTop <= 4;
    if (Math.abs(diff) > 60) {
      if (diff > 0 && enFondo) ir(actual + 1);
      else if (diff < 0 && enInicio) ir(actual - 1);
    }
    startY = null;
  });
}
