// ============================================================
// CONFIG-DEMO.JS — PLANTILLA ELEGANTE
// Datos de muestra con TODO el paquete activado, para que el demo
// se vea completo y sirva para vender la plantilla tal cual.
// En un evento real, todo esto viene de Supabase (ver backend.js).
// ============================================================
window.CONFIG_DEMO = {
  eventoId: 'demo',

  pareja: {
    nombreA: "Bryan", nombreB: "Stefany",
    apellidoA: "Colindres Mejía", apellidoB: "Herrera Flores",
    iniciales: "B·S"
  },

  fecha: "2026-10-03T18:00:00",
  fechaTexto: "Sábado, 03 de Octubre de 2026",
  rsvpFechaLimite: "15 de septiembre de 2026",

  lugar: {
    nombre: "Valletal Eventos",
    direccion: "Cerro Grande, Valle de Ángeles, Honduras",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Valletal+Eventos+Valle+de+Angeles+Honduras",
    wazeUrl: "https://waze.com/ul?q=Valletal%20Eventos%20Valle%20de%20Angeles%20Honduras&navigate=yes",
    foto: "../../assets/demo/img/preboda10.jpg"
  },

  fotos: { hero: "../../assets/demo/img/hero.jpg", footer: "../../assets/demo/img/novios.jpg" },

  video: "../../assets/demo/video-intro.mp4",
  videoDelay: 1.5,
  musicaUrl: "../../assets/demo/musica.mp3",

  // Invitado de muestra — así se ve el banner y la pantalla de mensaje
  // personalizado cuando alguien entra con su link único (RSVP Premium)
  // invitado: { nombre: "Familia Pérez" }, // <-- descomenta para probar la pantalla de nombre y el mensaje personalizado con nombre real
  mensajePersonalizado: { tipo: "audio", url: "../../assets/demo/musica.mp3" },

  mensajes: [
    { texto: "El amor es paciente, el amor es bondadoso. No es envidioso, no se jacta, no se envanece.", referencia: "1 Corintios 13:4" }
  ],

  historia: [
    { titulo: "Nos conocimos", texto: "Un día aparecimos en la vida del otro, sin planearlo ni esperarlo.", foto: "../../assets/demo/img/nos_conocimos.jpg" },
    { titulo: "Primera cita", texto: "Una cita inolvidable donde finalmente confesamos lo que ya llevábamos dentro.", foto: "../../assets/demo/img/primera_cita.jpg" },
    { titulo: "La propuesta", texto: "El amor quedó inmortalizado con un sí que llenó de lágrimas y sonrisas nuestro camino hacia el altar.", foto: "../../assets/demo/img/propuesta.jpg" }
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
    texto: "Etiqueta formal, colores suaves y elegantes. Nos reservamos el blanco para la novia.",
    botonUrl: "https://pinterest.com"
  },

  regalos: {
    texto: "Tu presencia es nuestro regalo más grande. Si deseas hacernos un obsequio, aquí puedes encontrar los detalles.",
    cuentaTexto: "Banco Atlántida\nCuenta de ahorros: 1234567890\nA nombre de: Bryan Colindres"
  },

  rsvpFotoUrl: "../../assets/demo/img/preboda8.jpg",
  firmasFotoUrl: "../../assets/demo/img/preboda9.jpg",

  modules: {
    countdown: true, musica: true, mapa: true, historia: true, mensajes: true,
    timeline: true, galeria: true, firmas: true, rsvp: true, rsvp_premium: true,
    video: true, cancion: true, detalles: true, regalos: true, vestimenta: true,
    mensaje_personalizado: true, video_interno: true
  },

  galeriaMuestra: ["../../assets/demo/img/preboda2.jpg", "../../assets/demo/img/preboda3.jpg", "../../assets/demo/img/preboda4.jpg", "../../assets/demo/img/preboda5.jpg", "../../assets/demo/img/preboda6.jpg", "../../assets/demo/img/preboda7.jpg"],

  whatsapp: { novio: "50431626792", novia: "50499223790" }
};
