// ============================================================================
// CONFIG-DEMO-PETALOS.JS — demo/catálogo SOLO para esta plantilla.
// A diferencia de las otras 14 (que comparten shared/js/config-demo.js),
// "petalos" trae su propio demo local: así cada foto queda exactamente en
// el archivo que le corresponde (dentro de esta misma carpeta), sin
// depender de que la carpeta compartida assets/demo/ tenga algo que en
// realidad nunca tuvo (la galería de vestimenta, por ejemplo). El shape
// (nombres de llaves) es el MISMO contrato que usan las otras 14 — para un
// evento real, estos mismos campos los llena get_event_config/get_event_extra.
// ============================================================================
window.CONFIG_DEMO = {
  eventoId: 'demo',

  pareja: {
    nombreA: "Bryan Daniel", nombreB: "Stefany Jissel",
    apellidoA: "Colindres Mejia", apellidoB: "Herrera Flores",
    iniciales: "B·S"
  },

  fecha: "2026-10-03T10:30:00",
  fechaTexto: "Sábado, 03 de octubre de 2026",
  hora: "10:30",
  rsvpFechaLimite: "15 de septiembre de 2026",

  lugar: {
    nombre: "Valletal Eventos",
    direccion: "Cerro Grande, Valle de Ángeles",
    mapsUrl: "https://maps.app.goo.gl/5VHu6E56MUNGPrey8?g_st=ac",
    wazeUrl: "https://waze.com/ul?ll=14.129855588419803,-87.03454760434946&navigate=yes",
    lat: 14.129855588419803, lng: -87.03454760434946,
    foto: "img/preboda3.jpg"
  },

  // "texto — cita", igual que en el resto de la plataforma.
  versiculoHistoria: "\"El amor es paciente, es bondadoso. El amor no es envidioso ni jactancioso ni orgulloso.\" — 1 Corintios 13:4",

  fotos: {
    hero: "img/preboda2.jpg",
    // heroB se reusa para la foto del versículo Y la del mensaje de voz —
    // en el original ambas eran el mismo archivo (img/hero.jpg).
    heroB: "img/hero.jpg",
    footer: "img/novios.jpg"
  },

  video: "img/video-intro.mp4",
  videoDelay: 0,
  videoInterno: { url: "img/video-intro.mp4", frase: "Cada momento juntos nos trajo hasta aquí." },
  musicaUrl: "audio/musica.mp3",

  mensajePersonalizado: { tipo: "audio", url: "audio/mensaje.mp3" },

  rsvpFotoUrl: "img/preboda12.jpg",

  // ── Historia — 3 párrafos con foto alterna (texto exacto, sin resumir) ──
  historia: [
    { titulo: "Con la bendición de Dios", texto: "Con la bendición de Dios y de nuestros padres, hemos decidido dar un paso más en esta hermosa historia que comenzó hace tres años, cuando supimos que algo especial nacía entre nosotros. Desde entonces, cada momento compartido ha sido un regalo; nuestro amor ha crecido día a día, al igual que nuestro deseo de caminar juntos por la vida.", foto: "img/preboda4.jpg" },
    { titulo: "El día más importante", texto: "Hoy, con el corazón lleno de alegría e ilusión, queremos que seas testigo y parte del día más importante de nuestras vidas, compartiendo este momento tan especial junto a las personas que más amamos.", foto: "img/preboda5.jpg" },
    { titulo: "Una sola carne", texto: "\"Así que no son ya más dos, sino una sola carne; por tanto, lo que Dios juntó, no lo separe el hombre.\" Mateo 19:6", foto: "img/preboda7.jpg" }
  ],

  // ── Línea de tiempo — las 9 entradas originales (hora/ícono/título) ──
  timeline: [
    { hora: "Enero, 2022", titulo: "Nos conocimos", icono: "cupid" },
    { hora: "2022", titulo: "Primeras conversaciones", icono: "sobre" },
    { hora: "Enero, 2023", titulo: "Primera cita", icono: "champagne" },
    { hora: "10 de abril, 2023", titulo: "Nos hicimos novios", icono: "anillo2" },
    { hora: "Mayo, 2024", titulo: "Nuestro primer viaje", icono: "honeymoon" },
    { hora: "Diciembre, 2024", titulo: "Nuestras familias", icono: "heart" },
    { hora: "Febrero, 2026", titulo: "La propuesta", icono: "diamond" },
    { hora: "Mayo, 2026", titulo: "La preboda", icono: "camara" },
    { hora: "03 de Octubre, 2026", titulo: "Nos casamos", icono: "church" }
  ],

  detallesImportantes: [
    { icono: "reloj", titulo: "Hora de llegada", texto: "Te pedimos llegar 30 minutos antes de la ceremonia para que puedas ubicarte con comodidad." },
    { icono: "adultos", titulo: "Solo adultos", texto: "Esperamos compartir una celebración pensada exclusivamente para adultos. Para una mejor organización del evento, agradecemos respetar que la invitación es únicamente para las personas señaladas." },
    { icono: "regalo", titulo: "Regalos", texto: "Tu presencia es el mejor regalo en este día especial; cualquier otro detalle será una contribución para nuestro hogar y futuros sueños." }
  ],

  vestimenta: {
    texto: "Nos reservamos el blanco para la novia y el beige para el novio. Los invitamos a usar tonos cálidos y elegantes.",
    pinterestUrl: "https://pin.it/7ask6Yvrq",
    // Las 8 fotos reales que sí existen en img/vestimenta/ para cada género
    // (el resto de plantillas no usa este campo).
    galeriaHombres: ["img/vestimenta/h1.jpg","img/vestimenta/h2.jpg","img/vestimenta/h3.jpg","img/vestimenta/h4.jpg","img/vestimenta/h5.jpg","img/vestimenta/h6.jpg","img/vestimenta/h7.jpg","img/vestimenta/h8.jpg"],
    galeriaMujeres: ["img/vestimenta/m1.jpg","img/vestimenta/m2.jpg","img/vestimenta/m3.jpg","img/vestimenta/m4.jpg","img/vestimenta/m5.jpg","img/vestimenta/m6.jpg","img/vestimenta/m7.jpg","img/vestimenta/m8.jpg"]
  },

  // Las 16 fotos originales, en el mismo orden (se corrigió preboda1: el
  // archivo real es .png, el config original decía .jpg por error y esa
  // única foto se perdía en silencio — aquí sí se ve).
  galeriaMuestra: ["img/preboda10.jpg","img/preboda11.jpg","img/preboda12.jpg","img/preboda9.jpg","img/preboda13.jpg","img/preboda14.jpg","img/preboda15.jpg","img/preboda16.jpg","img/preboda8.jpg","img/preboda7.jpg","img/preboda6.jpg","img/preboda5.jpg","img/preboda4.jpg","img/preboda3.jpg","img/preboda2.jpg","img/preboda1.png"],

  whatsapp: { novio: "50431626792", novia: "50499223790" },

  cancionModo: "embed",
  cancionEmbedUrl: "https://open.spotify.com/embed/playlist/4q1xgZvpq2mJjQaZKajgFp",

  rsvpDemoPersonas: [
    { invitado_id: "demo-1", nombre: "Invitado de ejemplo", estado: "pendiente" }
  ],

  modules: {
    countdown: true, musica: true, mapa: true, timeline: true,
    historia: true, detalles: true, regalos: true, vestimenta: true,
    mensaje_personalizado: true, firmas: true, video: true, galeria: true,
    vestimenta_galeria: true, cancion: true, rsvp_premium: false, video_interno: true,
    // Apagado en el demo — no complica la vista de catálogo. Actívalo por
    // evento real cuando el cliente sí quiera links personales con bloqueo.
    acceso_invitado: false
  },

  textos: {}
};
