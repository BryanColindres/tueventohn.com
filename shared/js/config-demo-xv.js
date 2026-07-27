// ============================================================================
// CONFIG-DEMO-XV.JS — ÚNICO PARA TODAS LAS PLANTILLAS DE QUINCE AÑOS
// Mismo patrón que config-demo.js (bodas): mismo shape, mismas claves, mismos
// textos por defecto en todas las plantillas XV. Lo único que cambia entre
// plantillas es el CSS (colores/layout/orden visual) — no el contenido ni
// los módulos activos.
//
// Diferencia clave con el config de bodas: aquí es UNA sola festejada, no una
// pareja — por eso "pareja" se vuelve "festejada" y "whatsapp.novio/novia" se
// vuelve "whatsapp.festejada/papas". Todo lo demás sigue el mismo patrón.
//
// Fotos: por ahora apuntando a las mismas fotos demo de bodas (asset
// compartido) solo para poder ver el diseño armado — reemplazar por fotos
// reales de quince años cuando las tengan.
//
// `textos` trae los overrides de palabras para ESTE evento de ejemplo (vacío
// = usa lo que ya está escrito en el HTML de cada plantilla). En un evento
// real este objeto viene de Supabase — ver shared/js/textos.js.
// ============================================================================
// Usa el MISMO nombre global (window.CONFIG_DEMO) que el config de bodas —
// shared/js/backend.js busca ese nombre exacto en cargarConfig(). Nunca se
// cargan los dos archivos en la misma página (cada plantilla de evento
// carga uno u otro desde su index.html), así que no hay conflicto.
window.CONFIG_DEMO = {
  eventoId: 'demo-xv',

  festejada: {
    nombre: "Camila",
    apellido: "Rodríguez Paz",
    iniciales: "C·R"
  },

  fecha: "2026-11-14T19:00:00",
  fechaTexto: "Sábado, 14 de Noviembre de 2026",
  coordenadas: "14°N 06' · 87°W 13' — Tegucigalpa, Honduras",
  rsvpFechaLimite: "1 de noviembre de 2026",

  lugar: {
    nombre: "Parroquia San José",
    direccion: "Colonia Palmira, Tegucigalpa, Honduras",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Parroquia+San+Jose+Tegucigalpa+Honduras",
    wazeUrl: "https://waze.com/ul?q=Parroquia%20San%20Jose%20Tegucigalpa%20Honduras&navigate=yes",
    foto: "../../assets/demo/img/preboda10.jpg"
  },

  bendicionTexto: "Con la bendición de Dios y de mis padres, y con el corazón lleno de alegría, los invito a celebrar conmigo esta nueva etapa de mi vida.",
  versiculoHistoria: "\"Todo tiene su tiempo, y todo lo que se quiere debajo del cielo tiene su hora.\" — Eclesiastés 3:1",
  versiculoCierre: "\"Encomienda a Jehová tu camino, y confía en él; y él hará.\" — Salmos 37:5",

  mismoLugar: false,
  horaRecepcion: "8:00 PM",
  lugarRecepcion: {
    nombre: "Salón Jardín Los Almendros",
    direccion: "Km 2 carretera a Valle de Ángeles, Honduras",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Salon+Jardin+Los+Almendros+Valle+de+Angeles",
    wazeUrl: "https://waze.com/ul?q=Salon%20Jardin%20Los%20Almendros%20Valle%20de%20Angeles&navigate=yes"
  },

  fotos: { hero: "../../assets/demo/img/hero.jpg", footer: "../../assets/demo/img/novios.jpg" },

  video: "../../assets/demo/video-intro.mp4",
  videoDelay: 1.0,
  musicaUrl: "../../assets/demo/musica.mp3",

  mensajePersonalizado: { tipo: "audio", url: "../../assets/demo/mensaje.mp3" },

  mensajes: [
    { texto: "Hasta aquí me ayudó Jehová. Gracias por acompañarme en cada paso de este camino.", referencia: "1 Samuel 7:12" }
  ],

  // Estilo Instagram Stories — aquí representa momentos de crecimiento,
  // no la historia de una pareja.
  historia: [
    { titulo: "Cuando llegué a la familia", texto: "El día que mi familia me recibió con los brazos abiertos y una promesa de amor.", foto: "../../assets/demo/img/nos_conocimos.jpg" },
    { titulo: "Primeros pasos", texto: "Entre risas y tropiezos, fui aprendiendo a caminar por mi propio camino.", foto: "../../assets/demo/img/primeras_conv.jpg" },
    { titulo: "La niña que fui", texto: "Años de escuela, amigas y sueños que empezaban a tomar forma.", foto: "../../assets/demo/img/primera_cita.jpg" },
    { titulo: "Creciendo junto a los míos", texto: "Cada viaje y cada celebración en familia se quedó grabado en mi corazón.", foto: "../../assets/demo/img/viaje.jpg" },
    { titulo: "Hoy, cumplo quince", texto: "Y con el corazón lleno de gratitud, celebro esta nueva etapa junto a quienes más quiero.", foto: "../../assets/demo/img/propuesta.jpg" }
  ],

  videoInterno: { url: "../../assets/demo/video-interno.mp4", frase: "Cada momento me trajo hasta este día." },

  timeline: [
    { hora: "6:30 PM", titulo: "Llegada de invitados" },
    { hora: "7:00 PM", titulo: "Misa de acción de gracias" },
    { hora: "8:00 PM", titulo: "Recepción" },
    { hora: "8:30 PM", titulo: "Entrada de la quinceañera" },
    { hora: "9:00 PM", titulo: "Vals" },
    { hora: "9:30 PM", titulo: "Brindis y cena" },
    { hora: "10:30 PM", titulo: "Fiesta" }
  ],

  detallesImportantes: [
    { icono: "reloj", titulo: "Hora de llegada", texto: "Te pedimos llegar 30 minutos antes de la misa para ubicarte con comodidad." },
    { icono: "general", titulo: "Código de vestimenta", texto: "Etiqueta formal — abajo te comparto los colores que me encantaría ver." },
    { icono: "regalo", titulo: "Lluvia de sobres", texto: "Tu presencia es el mejor regalo. Si deseas hacerme un obsequio, una lluvia de sobres es bienvenida." }
  ],

  vestimenta: {
    texto: "Etiqueta formal. Te comparto los colores que me encantaría ver — y uno que prefiero guardar para mí.",
    paletaColores: [
      { hex: "#9B6B6B", nombre: "Rosa Profundo" },
      { hex: "#C4907A", nombre: "Rosa Medio" },
      { hex: "#D4A99A", nombre: "Rosa Suave" },
      { hex: "#EDD5C5", nombre: "Blush" }
    ],
    colorEvitar: { hex: "#FFFFFF", nombre: "Blanco (reservado para la quinceañera)" },
    fotoReferenciaUrl: null,
    pinterestUrl: "https://pinterest.com"
  },

  regalos: {
    texto: "Tu presencia es mi regalo más grande. Si deseas hacerme un obsequio, aquí puedes encontrar los detalles.",
    cuentaTexto: "Banco Atlántida\nCuenta de ahorros: 1234567890\nA nombre de: Camila Rodríguez"
  },

  rsvpFotoUrl: "../../assets/demo/img/preboda8.jpg",
  firmasFotoUrl: "../../assets/demo/img/preboda9.jpg",
  fotoIntermediaUrl: "../../assets/demo/img/preboda10.jpg",

  rsvpDemoPersonas: [
    { invitado_id: "demo-1", nombre: "Ana Colindres" },
    { invitado_id: "demo-2", nombre: "Diego Colindres" }
  ],

  modules: {
    countdown: true, musica: true, mapa: true, historia: true, mensajes: true,
    timeline: true, galeria: true, firmas: true, rsvp: true, rsvp_premium: true,
    video: true, cancion: true, detalles: true, regalos: true, vestimenta: true,
    mensaje_personalizado: true, video_interno: true, historia_instagram: true
  },

  cancionModo: "embed",
  cancionEmbedUrl: "https://open.spotify.com/embed/playlist/4q1xgZvpq2mJjQaZKajgFp",

  galeriaMuestra: ["../../assets/demo/img/preboda2.jpg", "../../assets/demo/img/preboda3.jpg", "../../assets/demo/img/preboda4.jpg", "../../assets/demo/img/preboda5.jpg", "../../assets/demo/img/preboda6.jpg", "../../assets/demo/img/preboda7.jpg"],

  // whatsapp.festejada = la quinceañera; whatsapp.papas = contacto de sus papás
  // (para el modo RSVP simple por WhatsApp, paquetes sin portal premium).
  whatsapp: { festejada: "50431626792", papas: "50499223790" },

  textos: {}
};
