window.CONFIG_DEMO = {
  pareja: {
    nombreA: "Bryan", nombreB: "Stefany",
    apellidoA: "Colindres Mejía", apellidoB: "Herrera Flores",
    iniciales: "B·S"
  },
  fecha: "2026-10-03T18:00:00",
  fechaTexto: "Sábado, 03 de Octubre de 2026",

  lugar: {
    nombre: "Valletal Eventos",
    direccion: "Cerro Grande, Valle de Ángeles, Honduras",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Valletal+Eventos+Valle+de+Angeles+Honduras",
    wazeUrl: "https://waze.com/ul?q=Valletal%20Eventos%20Valle%20de%20Angeles%20Honduras&navigate=yes",
    foto: "img/preboda9.jpg"
  },

  fotos: { heroA: "img/hero.jpg", heroB: "img/preboda6.jpg", footer: "img/preboda8.jpg" },
  video: "img/video-intro.mp4",
  videoDelay: 1.5,
  musicaUrl: "audio/musica.mp3",

  // invitado: { nombre: "Familia Pérez" }, // <-- descomenta para probar la pantalla de nombre y el mensaje personalizado con nombre real
  mensajePersonalizado: { tipo: "audio", url: "audio/musica.mp3" },

  // Placas tipo museo — prosa, no listas
  placas: [
    {
      numero: "I",
      titulo: "Dos naturalezas",
      texto: "Uno encuentra orden en los números; ella encuentra poesía en el desorden. Él planea cada minuto; ella deja que el tiempo la sorprenda. Son, en casi todo, ejercicios de contraste."
    },
    {
      numero: "II",
      titulo: "Lo que los une",
      texto: "Y sin embargo, llegaron al mismo instante, eligiéndose el uno al otro, todos los días, sin necesidad de estar de acuerdo en nada más."
    }
  ],

  mensajes: [
    { texto: "El amor es paciente, el amor es bondadoso. No es envidioso, no se jacta, no se envanece.", referencia: "1 Corintios 13:4" }
  ],

  historia: [
    { titulo: "Nos conocimos", texto: "Un día aparecimos en la vida del otro, sin planearlo ni esperarlo.", foto: "img/nos_conocimos.jpg" },
    { titulo: "Primera cita", texto: "Una cita inolvidable donde finalmente confesamos lo que ya llevábamos dentro.", foto: "img/primera_cita.jpg" },
    { titulo: "La propuesta", texto: "El amor quedó inmortalizado con un sí que llenó de lágrimas y sonrisas nuestro camino hacia el altar.", foto: "img/propuesta.jpg" }
  ],

  timeline: [
    { hora: "5:30 PM", titulo: "Llegada de invitados" },
    { hora: "6:00 PM", titulo: "Ceremonia" },
    { hora: "7:00 PM", titulo: "Sesión de fotos" },
    { hora: "7:30 PM", titulo: "Recepción" },
    { hora: "8:30 PM", titulo: "Cena" },
    { hora: "9:30 PM", titulo: "Primer baile" },
    { hora: "10:00 PM", titulo: "Fiesta" }
  ],


  videoInterno: { url: "img/video-intro.mp4", frase: "Cada momento juntos nos trajo hasta aquí." },

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

  rsvpFotoUrl: "img/preboda12.jpg",
  firmasFotoUrl: "img/preboda13.jpg",

  modules: {
    countdown: true, musica: true, mapa: true, historia: true, mensajes: true,
    timeline: true, galeria: true, firmas: true, rsvp: true, rsvp_premium: true,
    video: true, cancion: true, detalles: true, regalos: true, vestimenta: true,
    mensaje_personalizado: true, video_interno: true
  },

  airtable: { apiKey: "PEGAR_API_KEY", baseId: "PEGAR_BASE_ID", tableId: "Firmas" },
  cloudinary: { cloudName: "PEGAR_CLOUD_NAME", uploadPreset: "PEGAR_UPLOAD_PRESET" },
  galeriaMuestra: ["img/preboda9.jpg","img/preboda10.jpg","img/preboda11.jpg","img/preboda12.jpg","img/preboda13.jpg","img/preboda14.jpg"],
  whatsapp: { novio: "50431626792", novia: "50499223790" }
};

// eventoId de demostración (no existe en Supabase, solo para pruebas visuales)
window.CONFIG_DEMO.eventoId = 'demo';
