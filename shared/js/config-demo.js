// ============================================================================
// CONFIG-DEMO.JS — ÚNICO PARA LAS 13 PLANTILLAS
// Mismo shape, mismas claves, mismos textos por defecto en todas. Lo único
// que cambia entre plantillas es el CSS (colores/layout/orden visual) — no
// el contenido ni los módulos activos.
//
// TODO el paquete va activado (modules: todo true) para que el demo se vea
// completo en cualquier plantilla del catálogo, sin importar qué paquete
// compre el cliente real.
//
// `textos` trae los overrides de palabras para ESTE evento de ejemplo (aquí
// vacío = usa lo que ya está escrito en el HTML de cada plantilla). En un
// evento real, este objeto viene de Supabase y es donde el cliente cambia
// una palabra sin tocar código — ver shared/js/textos.js.
// ============================================================================
window.CONFIG_DEMO = {
  eventoId: 'demo',

  pareja: {
    nombreA: "Bryan", nombreB: "Stefany",
    apellidoA: "Colindres Mejía", apellidoB: "Herrera Flores",
    iniciales: "B·S"
  },

  fecha: "2026-10-03T18:00:00",
  fechaTexto: "Sábado, 03 de Octubre de 2026",
  coordenadas: "14°N 45' · 87°W 12' — Valle de Ángeles, bajo el mismo cielo",
  rsvpFechaLimite: "15 de septiembre de 2026",

  lugar: {
    nombre: "Valletal Eventos",
    direccion: "Cerro Grande, Valle de Ángeles, Honduras",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Valletal+Eventos+Valle+de+Angeles+Honduras",
    wazeUrl: "https://waze.com/ul?q=Valletal%20Eventos%20Valle%20de%20Angeles%20Honduras&navigate=yes",
    foto: "../../assets/demo/img/preboda10.jpg"
  },

  fotos: { hero: "../../assets/demo/img/hero.jpg", heroA: "../../assets/demo/img/hero.jpg", heroB: "../../assets/demo/img/preboda6.jpg", footer: "../../assets/demo/img/novios.jpg" },

  video: "../../assets/demo/video-intro.mp4",
  videoDelay: 1.5,
  musicaUrl: "../../assets/demo/musica.mp3",

  mensajePersonalizado: { tipo: "audio", url: "../../assets/demo/musica.mp3" },

  mensajes: [
    { texto: "El amor es paciente, el amor es bondadoso. No es envidioso, no se jacta, no se envanece.", referencia: "1 Corintios 13:4" }
  ],

  // Estilo Instagram Stories en TODAS las plantillas (el visor ya es
  // compartido — ver shared/js/historia-stories.js).
  historia: [
    { titulo: "Nos conocimos", texto: "Un día aparecimos en la vida del otro, sin planearlo ni esperarlo.", foto: "../../assets/demo/img/nos_conocimos.jpg" },
    { titulo: "Primeras conversaciones", texto: "Mensajes que se alargaban hasta la madrugada, sin darnos cuenta del tiempo.", foto: "../../assets/demo/img/primeras_conv.jpg" },
    { titulo: "Primera cita", texto: "Una cita inolvidable donde finalmente confesamos lo que ya llevábamos dentro.", foto: "../../assets/demo/img/primera_cita.jpg" },
    { titulo: "Nuestro primer viaje", texto: "Descubrimos que viajar juntos también era encontrarnos más.", foto: "../../assets/demo/img/viaje.jpg" },
    { titulo: "La propuesta", texto: "El amor quedó sellado con un sí que llenó de lágrimas y sonrisas nuestro camino hacia el altar.", foto: "../../assets/demo/img/propuesta.jpg" }
  ],

  videoInterno: { url: "../../assets/demo/video-intro.mp4", frase: "Cada momento juntos nos trajo hasta aquí." },

  timeline: [
    { hora: "5:30 PM", titulo: "Llegada de invitados" },
    { hora: "6:00 PM", titulo: "Ceremonia" },
    { hora: "7:00 PM", titulo: "Sesión de fotos" },
    { hora: "7:30 PM", titulo: "Recepción" },
    { hora: "8:30 PM", titulo: "Cena" },
    { hora: "9:30 PM", titulo: "Primer baile" },
    { hora: "10:00 PM", titulo: "Fiesta" }
  ],

  detallesImportantes: [
    { icono: "reloj", titulo: "Hora de llegada", texto: "Te pedimos llegar 30 minutos antes de la ceremonia para ubicarte con comodidad." },
    { icono: "adultos", titulo: "Solo adultos", texto: "Esperamos compartir una celebración pensada exclusivamente para adultos." },
    { icono: "regalo", titulo: "Regalos", texto: "Tu presencia es el mejor regalo. Cualquier otro detalle será una contribución a nuestro nuevo hogar." }
  ],

  vestimenta: {
    texto: "Etiqueta formal. Te compartimos los colores que nos encantaría ver — y uno que preferimos guardar para la novia.",
    // Paleta editable por el cliente (esto SOLO es para código de vestimenta,
    // no para el diseño del sitio). Si paletaColores viene vacío, la plantilla
    // no muestra la sección de swatches, solo el texto y (si existe) fotoUrl/pinterestUrl.
    paletaColores: [
      { hex: "#9B6B6B", nombre: "Rosa Profundo" },
      { hex: "#C4907A", nombre: "Rosa Medio" },
      { hex: "#D4A99A", nombre: "Rosa Suave" },
      { hex: "#EDD5C5", nombre: "Blush" }
    ],
    colorEvitar: { hex: "#FFFFFF", nombre: "Blanco (reservado para la novia)" },
    fotoReferenciaUrl: null,
    pinterestUrl: "https://pinterest.com"
  },

  regalos: {
    texto: "Tu presencia es nuestro regalo más grande. Si deseas hacernos un obsequio, aquí puedes encontrar los detalles.",
    cuentaTexto: "Banco Atlántida\nCuenta de ahorros: 1234567890\nA nombre de: Bryan Colindres"
  },

  rsvpFotoUrl: "../../assets/demo/img/preboda8.jpg",
  firmasFotoUrl: "../../assets/demo/img/preboda9.jpg",

  // Vista previa del RSVP cuando no hay ?id= real en la URL (ej. catálogo).
  // No se guarda nada, es solo para que el demo se vea completo.
  rsvpDemoPersonas: [
    { invitado_id: "demo-1", nombre: "Familia Colindres Mejía" },
    { invitado_id: "demo-2", nombre: "Ana Colindres" },
    { invitado_id: "demo-3", nombre: "Diego Colindres" }
  ],

  // TODO activado — el demo debe verse completo sin importar el paquete real.
  modules: {
    countdown: true, musica: true, mapa: true, historia: true, mensajes: true,
    timeline: true, galeria: true, firmas: true, rsvp: true, rsvp_premium: true,
    video: true, cancion: true, detalles: true, regalos: true, vestimenta: true,
    mensaje_personalizado: true, video_interno: true
  },

  // Cómo se muestra la sección de canción (depende del paquete real del cliente;
  // en el demo mostramos el modo "embed" para que se vea la versión completa).
  cancionModo: "embed", // "embed" (Spotify/YouTube embebido) | "lista" (solo escriben, sin reproductor)
  cancionEmbedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DXcfZ6moR6J0G",

  galeriaMuestra: ["../../assets/demo/img/preboda2.jpg", "../../assets/demo/img/preboda3.jpg", "../../assets/demo/img/preboda4.jpg", "../../assets/demo/img/preboda5.jpg", "../../assets/demo/img/preboda6.jpg", "../../assets/demo/img/preboda7.jpg"],

  // Placas tipo museo (las usa "opuestos"; el resto de plantillas la ignoran).
  placas: [
    { numero: "I", titulo: "Dos naturalezas", texto: "Uno encuentra orden en los números; ella encuentra poesía en el desorden. Él planea cada minuto; ella deja que el tiempo la sorprenda. Son, en casi todo, ejercicios de contraste." },
    { numero: "II", titulo: "Lo que los une", texto: "Y sin embargo, en lo esencial, avanzan siempre en la misma dirección." }
  ],

  whatsapp: { novio: "50431626792", novia: "50499223790" },

  // Overrides de palabras para ESTE evento de ejemplo. Vacío a propósito:
  // así el demo muestra los textos por defecto que ya trae cada plantilla.
  // En un evento real esto viene de Supabase (una fila por evento).
  textos: {}
};
