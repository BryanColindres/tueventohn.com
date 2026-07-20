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
  TuBodaBackend.pintarBendicionYVersiculo(C);
  TuBodaBackend.pintarFotoIntermedia(C);
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
  TuBodaBackend.pintarVersiculoCierre(C);
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
  const modoInstagram = !!(C.modules && C.modules.historia_instagram);

  if (!modoInstagram) {
    cont.innerHTML = slides.map(h => `
      <div class="historia-item reveal">
        <div class="historia-item__foto"><img src="${h.foto}" alt="${h.titulo || ''}"></div>
        <div class="historia-item__texto">
          ${h.titulo ? `<h3>${h.titulo}</h3>` : ''}
          <p>${h.texto}</p>
        </div>
      </div>`).join('');
    return;
  }
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
  reloj: '<svg viewBox="0 0 278 278" xmlns="http://www.w3.org/2000/svg"><g fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M139 26c-62.4 0-113 50.6-113 113s50.6 113 113 113 113-50.6 113-113S201.4 26 139 26zm0 24c49.1 0 89 39.9 89 89s-39.9 89-89 89-89-39.9-89-89 39.9-89 89-89z"/><rect x="129" y="60" width="20" height="90" rx="10"/><rect x="139" y="130" width="20" height="66" rx="10" transform="rotate(55 139 130)"/><rect x="94" y="14" width="90" height="18" rx="9"/></g></svg>',
  adultos: '<svg viewBox="0 0 884 731" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,731.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M4579 7086 c-36 -12 -83 -35 -104 -49 -21 -14 -42 -24 -47 -21 -4 3 -8 -45 -8 -105 0 -61 4 -111 9 -111 5 0 33 19 61 43 29 23 67 52 84 65 37 27 130 56 157 49 18 -5 19 1 19 74 l0 79 -52 0 c-29 0 -83 -11 -119 -24z M4910 6965 c0 -87 3 -101 27 -143 24 -40 28 -58 28 -127 0 -69 -4 -87 -27 -129 -26 -45 -28 -57 -28 -160 l1 -111 72 76 c121 126 164 246 139 389 -21 121 -97 241 -181 285 l-31 16 0 -96z M4591 6206 c-85 -85 -158 -153 -163 -150 -4 3 -8 -44 -8 -105 0 -70 4 -112 11 -117 7 -4 75 57 166 148 l154 154 -3 112 -3 112 -154 -154z M3230 5377 l0 -73 208 -13 c114 -7 228 -15 255 -18 l47 -5 0 76 c0 70 -2 76 -22 81 -46 10 -266 25 -375 25 l-113 0 0 -73z M5700 5375 l0 -75 68 0 c67 0 237 -12 365 -26 l68 -7 -3 79 -3 79 -120 11 c-66 7 -177 12 -247 13 l-128 1 0 -75z M3980 5292 l0 -77 60 -27 c33 -14 60 -32 60 -38 0 -6 -27 -24 -60 -38 l-60 -27 0 -88 c0 -101 -6 -98 99 -51 30 13 55 23 57 22 1 -2 8 -84 14 -183 19 -280 1 -602 -50 -883 -22 -120 -78 -348 -104 -421 -13 -34 -16 -86 -16 -240 l1 -196 34 65 c125 238 223 588 271 965 27 205 26 716 0 949 -21 183 -29 203 -97 258 -35 28 -167 88 -195 88 -11 0 -14 -18 -14 -78z M6440 5291 l0 -79 48 -17 c26 -8 56 -22 66 -30 19 -15 19 -15 1 -29 -10 -7 -40 -21 -67 -31 l-48 -17 0 -89 c0 -49 4 -89 9 -89 5 0 41 13 80 29 l70 28 8 -46 c4 -25 8 -190 8 -366 -1 -245 -5 -350 -18 -450 -26 -189 -71 -404 -114 -540 l-38 -120 -2 -205 -2 -205 59 119 c125 252 214 591 257 978 39 354 9 1012 -51 1103 -22 33 -104 85 -179 113 -88 33 -87 34 -87 -57z M3595 5020 c-33 -5 -129 -11 -212 -15 l-153 -8 0 -88 0 -89 103 0 c93 0 220 10 355 26 l52 6 0 89 0 89 -42 -1 c-24 -1 -70 -5 -103 -9z M6060 5020 c-36 -4 -131 -11 -212 -15 l-148 -8 0 -90 0 -90 163 6 c89 3 201 12 250 18 l87 12 0 88 0 89 -37 -1 c-21 -1 -67 -5 -103 -9z M1645 3073 c-11 -2 -46 -16 -77 -30 l-58 -27 0 -103 c0 -102 0 -104 21 -93 11 7 38 27 59 46 44 40 97 64 140 64 l30 0 0 75 0 75 -47 -1 c-27 -1 -57 -3 -68 -6z M1882 2749 l0 -292 49 49 c65 63 93 114 108 192 22 114 -18 235 -102 307 -22 19 -44 35 -48 35 -4 0 -7 -131 -7 -291z M3705 2919 c-46 -62 -147 -153 -214 -193 -73 -43 -128 -62 -203 -71 l-58 -7 0 -74 c0 -72 1 -74 25 -74 l25 0 0 -979 c0 -880 -2 -981 -16 -995 -8 -9 -20 -14 -25 -11 -5 4 -9 -28 -9 -76 l0 -82 46 7 c76 10 154 89 154 155 0 18 6 21 43 21 47 0 209 -18 244 -26 23 -6 23 -4 23 74 l0 80 -37 6 c-33 5 -245 26 -265 26 -5 0 -8 409 -8 908 l0 908 93 47 c50 26 120 70 155 98 l62 49 0 125 c0 69 -1 125 -2 125 -2 0 -16 -19 -33 -41z M6095 2844 c-117 -118 -204 -168 -323 -186 l-72 -12 0 -73 c0 -66 2 -73 20 -73 20 0 20 -7 20 -984 0 -811 -2 -986 -13 -995 -8 -6 -17 -8 -20 -4 -4 3 -7 -30 -7 -75 0 -82 0 -82 26 -82 65 0 135 57 161 131 17 46 20 49 53 49 46 0 220 -19 243 -26 15 -5 17 3 17 74 l0 80 -32 5 c-18 4 -62 9 -98 12 -36 3 -89 8 -117 11 l-53 5 0 913 0 912 38 13 c58 21 162 85 215 133 l48 43 -3 115 -3 115 -100 -101z M1633 2428 l-123 -121 0 -104 c0 -57 3 -103 8 -103 4 0 60 53 125 118 l118 118 -3 107 -3 106 -122 -121z M7475 2429 c-28 -4 -73 -18 -100 -31 -28 -12 -53 -21 -57 -20 -5 1 -8 -48 -8 -108 0 -109 0 -111 21 -100 11 7 37 26 57 44 51 46 94 66 142 66 l41 0 -3 78 c-3 87 -3 87 -93 71z M7691 2103 l0 -286 50 49 c28 27 63 72 77 99 24 44 27 61 27 145 0 81 -4 102 -25 145 -25 49 -100 135 -119 135 -6 0 -10 -112 -10 -287z M7446 1791 c-66 -66 -123 -118 -128 -115 -4 3 -8 -44 -8 -105 0 -60 4 -112 8 -115 5 -3 63 50 131 118 l122 122 -3 107 -3 107 -119 -119z M3980 537 c0 -84 0 -85 28 -92 l27 -7 -27 -10 c-27 -9 -28 -11 -28 -89 0 -43 4 -79 9 -79 20 0 157 54 187 74 42 27 55 50 56 98 1 53 -43 98 -137 143 -122 58 -115 60 -115 -38z M6440 540 l0 -80 33 -13 32 -14 -32 -7 -33 -8 0 -80 0 -80 28 6 c59 14 163 60 192 85 23 19 33 37 37 67 6 50 -12 83 -72 124 -37 26 -157 80 -177 80 -4 0 -8 -36 -8 -80z M3605 360 c-38 -4 -111 -8 -161 -9 -50 0 -119 -4 -153 -7 l-61 -7 0 -73 0 -74 79 0 c89 0 374 18 409 25 20 5 22 11 22 80 l0 75 -32 -2 c-18 0 -64 -4 -103 -8z M6070 360 c-36 -4 -110 -8 -165 -9 -55 -1 -124 -4 -152 -7 l-53 -7 0 -75 0 -75 173 7 c94 4 206 11 247 14 l75 7 3 78 3 77 -33 -2 c-18 0 -62 -4 -98 -8z"/> </g></svg>',
  regalo: '<svg viewBox="0 0 308 278" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,278.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M1752 2674 c-63 -32 -93 -106 -77 -190 5 -31 31 -63 143 -176 74 -76 141 -138 147 -138 6 0 70 60 142 133 140 142 160 176 150 250 -6 47 -31 83 -77 115 -56 37 -159 26 -199 -22 -12 -14 -17 -12 -48 11 -45 34 -131 42 -181 17z m153 -125 l55 -51 56 51 c71 65 109 66 143 4 17 -33 -2 -62 -106 -166 l-89 -87 -102 103 c-110 112 -119 131 -77 172 35 36 60 31 120 -26z M431 2559 c-78 -23 -145 -90 -171 -173 -18 -56 -7 -147 23 -199 14 -23 117 -143 228 -266 l203 -223 25 28 c13 16 106 118 205 227 183 201 220 253 232 334 9 60 -19 145 -63 194 -56 62 -105 83 -188 83 -75 0 -122 -17 -184 -69 l-31 -27 -42 36 c-66 57 -157 77 -237 55z m138 -101 c12 -4 51 -35 85 -68 l62 -59 55 55 c64 66 97 85 149 86 112 1 191 -121 146 -225 -15 -34 -343 -400 -355 -395 -12 5 -315 340 -337 373 -46 66 -37 141 21 200 52 51 100 61 174 33z M1046 1956 c-60 -30 -111 -78 -139 -131 -28 -55 -36 -194 -13 -249 9 -21 16 -40 16 -42 0 -2 -47 -4 -105 -4 -110 0 -156 -12 -169 -45 -8 -22 -8 -238 0 -260 10 -25 58 -45 109 -45 l45 0 0 -540 0 -540 755 0 755 0 0 53 1 52 39 -45 40 -45 28 31 c15 17 106 118 202 223 96 106 186 210 199 233 32 52 41 166 18 221 -26 61 -65 104 -120 132 -96 47 -223 28 -304 -47 l-22 -20 -40 33 -41 32 0 114 0 113 45 0 c56 0 103 23 115 56 13 33 13 205 0 238 -16 43 -57 56 -174 56 l-106 0 18 43 c26 63 22 179 -7 237 -40 77 -68 107 -132 139 -53 26 -74 31 -136 31 -127 0 -218 -61 -293 -194 l-32 -56 -52 0 c-49 0 -53 2 -68 33 -9 17 -36 60 -61 93 -63 86 -139 124 -246 124 -59 -1 -87 -6 -125 -24z m208 -87 c51 -23 71 -44 118 -119 l35 -55 -27 -22 -27 -22 -41 64 c-22 35 -52 71 -66 80 -40 26 -96 29 -136 7 -76 -41 -89 -136 -31 -217 17 -24 31 -46 31 -49 0 -3 -18 -6 -39 -6 -32 0 -43 5 -59 28 -49 70 -54 145 -14 223 22 44 36 58 81 81 64 34 115 36 175 7z m737 7 c122 -51 167 -179 104 -295 -27 -49 -30 -51 -72 -51 -48 0 -48 0 -4 58 55 74 32 186 -44 218 -74 30 -131 6 -186 -78 -21 -33 -40 -64 -42 -71 -3 -8 -15 -3 -32 14 l-27 27 45 69 c36 57 54 75 98 97 59 29 110 33 160 12z m-788 -173 c8 -10 34 -53 57 -95 l42 -78 -34 0 c-20 0 -38 7 -45 18 -6 9 -30 43 -52 76 -33 47 -39 62 -30 77 12 24 41 24 62 2z m747 2 c16 -19 11 -29 -46 -109 -39 -54 -53 -66 -76 -66 -32 0 -34 9 -12 52 63 121 104 159 134 123z m-336 -85 c23 -11 51 -35 64 -52 l22 -33 -146 -3 c-81 -1 -149 0 -152 2 -9 10 47 73 80 89 44 22 83 21 132 -3z m-383 -262 l-40 -73 -236 -3 -235 -2 0 75 0 75 275 0 276 0 -40 -72z m239 69 c0 -2 -13 -42 -29 -89 -16 -47 -37 -134 -47 -194 -10 -60 -19 -111 -20 -112 -1 -2 -19 8 -40 22 l-38 25 -33 -20 c-37 -23 -37 -22 -22 53 19 95 74 215 132 290 17 20 31 27 60 27 20 1 37 0 37 -2z m251 -30 c65 -82 122 -212 135 -310 l7 -51 -35 22 -34 21 -37 -25 -37 -24 -5 22 c-2 13 -12 66 -21 118 -8 52 -28 132 -44 178 l-29 82 37 0 c30 0 42 -6 63 -33z m659 -42 l0 -75 -237 0 -238 1 -41 74 -42 75 279 0 279 0 0 -75z m-810 -62 c0 -7 -12 -13 -26 -13 -20 0 -25 4 -20 16 3 9 9 28 13 42 l6 27 13 -30 c7 -16 13 -36 14 -42z m-420 -150 c-12 -55 -33 -256 -29 -276 3 -14 19 -7 87 38 l82 55 0 -385 0 -385 -205 0 -205 0 0 495 0 495 139 0 139 0 -8 -37z m454 15 c3 -13 11 -84 18 -158 6 -74 13 -137 14 -139 2 -2 16 6 32 18 17 12 33 21 36 21 3 0 6 -160 6 -355 l0 -355 -165 0 -165 0 0 355 c0 195 3 355 8 355 4 0 18 -9 32 -20 44 -35 50 -27 50 65 0 46 5 118 11 160 l11 75 53 0 c46 0 53 -3 59 -22z m606 -473 l0 -495 -205 0 -205 0 0 385 0 385 85 -57 c47 -31 87 -54 90 -51 4 4 -19 230 -31 296 l-6 32 136 0 136 0 0 -495z m456 180 c45 -26 84 -90 84 -136 -1 -49 -39 -103 -189 -269 -84 -93 -160 -175 -168 -181 -11 -10 -21 -5 -53 26 l-40 39 0 240 0 240 40 -39 40 -39 58 56 c95 94 149 109 228 63z M2414 1850 c-30 -12 -71 -64 -79 -100 -13 -57 12 -99 128 -217 61 -62 116 -113 122 -113 13 0 229 218 244 247 15 29 14 92 -2 123 -18 35 -74 70 -114 70 -34 0 -106 -31 -118 -51 -5 -7 -14 -4 -29 10 -40 37 -104 51 -152 31z m121 -139 c21 -23 43 -41 49 -41 5 0 33 23 62 50 47 44 56 49 74 40 42 -23 35 -39 -51 -126 l-84 -84 -77 77 c-80 80 -95 112 -61 132 22 12 38 3 88 -48z M321 552 c-39 -21 -71 -73 -71 -115 0 -52 28 -92 142 -205 l114 -112 121 122 c127 129 145 160 129 224 -25 97 -141 134 -221 70 l-29 -24 -32 24 c-43 33 -110 40 -153 16z m134 -132 l49 -50 51 50 c55 54 87 63 105 29 10 -18 2 -30 -72 -105 l-83 -85 -83 85 c-74 75 -82 87 -72 105 18 35 52 25 105 -29z"/> </g></svg>',
  general: '<svg viewBox="0 0 1176 1386" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0.000000,1386.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none"> <path d="M5822 11620 c-63 -38 -62 -31 -62 -658 0 -313 3 -760 7 -993 l6 -424 33 -32 c29 -30 37 -33 96 -33 71 0 99 14 123 60 13 25 15 160 15 1015 0 1088 4 1025 -63 1065 -42 26 -112 26 -155 0z M3785 11102 c-51 -24 -78 -65 -78 -117 0 -30 98 -276 389 -975 429 -1033 413 -1000 499 -1000 93 0 149 49 149 130 0 67 -774 1921 -814 1950 -41 29 -98 34 -145 12z M7922 11092 c-19 -10 -40 -29 -48 -42 -8 -14 -190 -443 -404 -954 -302 -718 -390 -938 -390 -970 0 -75 54 -129 130 -130 53 -1 93 16 115 50 20 31 785 1850 798 1897 7 29 6 47 -7 82 -30 77 -118 108 -194 67z M9770 9913 c-19 -10 -344 -328 -721 -708 -574 -577 -687 -696 -693 -724 -21 -112 67 -194 173 -162 30 8 170 145 724 705 378 381 691 706 697 721 14 37 12 72 -6 110 -30 64 -110 90 -174 58z M1900 9880 c-37 -37 -40 -44 -40 -97 l0 -57 232 -236 c683 -691 1146 -1153 1170 -1166 15 -8 47 -14 72 -14 82 0 145 81 130 167 -6 34 -80 112 -708 741 l-701 702 -58 0 c-53 0 -60 -3 -97 -40z M5826 8799 c-56 -44 -54 -8 -57 -894 l-4 -820 22 -31 c12 -17 36 -37 53 -44 41 -17 124 -8 151 16 50 44 49 29 49 894 0 890 3 853 -60 885 -43 22 -122 20 -154 -6z M10037 7716 c-521 -222 -956 -411 -967 -421 -27 -24 -43 -80 -36 -120 14 -70 91 -124 155 -108 59 14 1907 805 1928 825 85 79 23 229 -93 227 -28 0 -308 -115 -987 -403z M744 8094 c-69 -34 -89 -138 -37 -201 25 -31 127 -76 950 -424 711 -300 932 -389 964 -389 80 0 129 52 129 137 0 95 48 70 -978 503 -657 277 -934 390 -960 390 -21 0 -51 -7 -68 -16z M3889 7961 c-76 -24 -104 -66 -96 -145 l4 -51 534 -529 c294 -291 548 -537 564 -548 37 -22 86 -23 131 -2 36 17 50 36 65 87 21 74 25 70 -550 638 -297 293 -545 535 -553 539 -24 14 -73 19 -99 11z M7858 7958 c-15 -7 -270 -255 -567 -551 -514 -512 -540 -540 -546 -581 -14 -90 45 -156 138 -156 l49 0 306 299 c169 165 418 411 554 548 217 218 247 253 254 288 9 50 -12 111 -47 138 -33 24 -105 31 -141 15z M3112 6003 c-18 -9 -40 -29 -48 -44 -19 -38 -18 -114 2 -145 37 -56 10 -54 827 -54 l754 0 34 23 c78 52 71 180 -12 223 -24 12 -142 14 -776 14 -670 0 -751 -2 -781 -17z M7144 5986 c-31 -31 -34 -39 -34 -93 0 -65 15 -95 60 -118 25 -13 133 -15 775 -15 827 0 792 -3 821 65 29 70 4 152 -56 182 -19 10 -196 13 -778 13 l-754 0 -34 -34z M263 5980 c-51 -16 -83 -63 -83 -121 0 -60 21 -104 58 -123 22 -11 206 -14 1072 -17 l1045 -4 31 22 c41 30 58 72 51 130 -4 38 -12 54 -41 80 l-36 33 -757 0 c-417 0 -882 2 -1033 5 -169 3 -287 1 -307 -5z M9441 5973 c-89 -31 -110 -157 -37 -221 l34 -29 1034 -8 c1117 -8 1075 -9 1122 44 44 49 28 172 -27 203 -32 19 -2074 29 -2126 11z M4947 5172 c-37 -5 -51 -19 -656 -655 -578 -608 -560 -586 -530 -671 26 -72 111 -106 180 -71 34 17 1132 1164 1156 1208 26 47 10 119 -35 160 -23 21 -74 34 -115 29z M6779 5117 c-45 -30 -66 -93 -51 -146 9 -28 135 -164 546 -591 295 -305 549 -566 566 -579 57 -45 162 -24 195 39 20 40 19 99 -4 135 -25 40 -1060 1113 -1102 1143 -43 30 -105 29 -150 -1z M5844 4780 c-31 -12 -72 -66 -79 -103 -4 -18 -3 -403 2 -855 l8 -824 37 -34 c33 -29 45 -34 88 -34 28 0 64 7 80 15 63 32 60 -7 60 907 0 788 -1 835 -18 867 -31 58 -115 87 -178 61z M2630 4623 c-8 -3 -435 -194 -950 -424 -1030 -461 -990 -440 -990 -529 0 -80 56 -140 131 -140 21 0 370 151 986 426 787 352 957 432 974 456 39 54 23 150 -31 189 -27 20 -96 32 -120 22z M9096 4615 c-21 -7 -43 -20 -48 -27 -48 -71 -52 -138 -10 -185 22 -25 210 -111 982 -449 682 -299 965 -418 991 -419 76 0 129 61 129 149 0 34 -6 50 -27 73 -21 21 -276 137 -978 445 -522 229 -961 419 -975 422 -14 3 -43 -1 -64 -9z M3244 3393 c-26 -15 -1267 -1297 -1361 -1406 -42 -48 -46 -115 -10 -168 43 -64 144 -74 205 -21 54 48 1329 1379 1347 1405 22 35 23 109 1 142 -40 60 -122 82 -182 48z M8410 3372 c-46 -45 -59 -96 -39 -147 15 -37 1354 -1430 1397 -1454 35 -19 97 -16 135 6 57 33 85 125 54 180 -16 28 -1340 1401 -1379 1431 -22 16 -45 22 -81 22 -44 0 -54 -4 -87 -38z M4490 2733 c-25 -23 -93 -185 -406 -973 -207 -520 -378 -958 -380 -975 -10 -65 64 -145 133 -145 48 0 101 27 118 61 8 15 182 448 386 960 245 618 370 945 371 970 1 77 -58 129 -146 129 -36 0 -52 -6 -76 -27z M7139 2721 c-34 -34 -39 -45 -39 -84 0 -37 74 -227 381 -984 210 -516 385 -946 390 -955 18 -34 68 -60 115 -60 72 0 121 45 131 119 4 33 -51 173 -380 983 -211 520 -390 955 -398 968 -19 30 -69 52 -119 52 -36 0 -48 -6 -81 -39z M5829 2273 c-15 -9 -35 -30 -45 -47 -18 -30 -19 -73 -22 -1007 l-2 -975 22 -35 c63 -94 202 -84 244 17 12 28 14 201 14 999 0 1066 4 1005 -63 1045 -39 24 -112 26 -148 3z"/> </g></svg>'
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
  TuBodaBackend.pintarUbicacionRecepcion(C);
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
  const urlEmbebida = hayPlaylistReal ? TuBodaBackend.normalizarPlaylistUrl(C.cancionEmbedUrl) : null;

  if (hayPlaylistReal) {
    // Es una playlist real y compartida: ábranla y agreguen ahí mismo, no
    // hace falta un formulario aparte en el sitio.
    intro.textContent = 'Esta es nuestra playlist para la fiesta. Ábrela y, si quieres, agrega ahí mismo tu canción favorita.';
    const esSpotify = urlEmbebida.includes('spotify.com');
    const esYoutube = urlEmbebida.includes('youtube.com') || urlEmbebida.includes('youtu.be');
    if (esSpotify) {
      embedWrap.innerHTML = `<iframe src="${urlEmbebida}" width="100%" height="352" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
    } else if (esYoutube) {
      embedWrap.innerHTML = `<iframe width="100%" height="220" src="${urlEmbebida}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen loading="lazy"></iframe>`;
    } else {
      embedWrap.innerHTML = `<a href="${urlEmbebida}" target="_blank" class="btn btn-outline">Abrir playlist</a>`;
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
    await TuBodaBackend.enviarFirma(C.eventoId, nombre, mensaje);
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
