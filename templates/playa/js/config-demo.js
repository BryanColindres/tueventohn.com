window.CONFIG_DEMO = {
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
    foto: "../../assets/demo/img/preboda4.jpg"
  },

  fotos: { hero: "../../assets/demo/img/familia.jpg", footer: "../../assets/demo/img/hero.jpg" },
  video: "../../assets/demo/video-intro.mp4",
  videoDelay: 1.5,
  musicaUrl: "../../assets/demo/musica.mp3",

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

  timeline: [
    { hora: "5:30 PM", titulo: "Llegada y Bienvenida", texto: "Recíbelos con los pies en la arena: un cóctel de bienvenida frente al mar mientras el sol comienza a bajar." },
    { hora: "6:00 PM", titulo: "La Ceremonia", texto: "Frente al mar, uniremos nuestras vidas rodeados de quienes más amamos, con el sonido de las olas como testigo." },
    { hora: "7:00 PM", titulo: "Sesión de Fotos", texto: "Un momento para capturar el atardecer junto a la pareja, mientras los invitados disfrutan de la brisa y los aperitivos." },
    { hora: "7:30 PM", titulo: "Recepción y Cóctel", texto: "Bebidas frescas y aperitivos junto al mar, para compartir los primeros brindis de la noche." },
    { hora: "8:30 PM", titulo: "Cena", texto: "Una cena preparada con ingredientes frescos, pensada para disfrutar en buena compañía bajo las estrellas." },
    { hora: "9:30 PM", titulo: "Primer Baile", texto: "El primer baile como esposos, para abrir la pista y dar inicio a una noche de celebración." },
    { hora: "10:00 PM", titulo: "Fiesta", texto: "Música, baile y sorpresas hasta que el mar y la noche nos digan que es hora de despedirnos." }
  ],


  videoInterno: { url: "../../assets/demo/video-intro.mp4", frase: "Cada momento juntos nos trajo hasta aquí." },

  detallesImportantes: [
    { icono: "reloj", titulo: "Hora de llegada", texto: "Te pedimos llegar 30 minutos antes de la ceremonia para ubicarte con comodidad." },
    { icono: "adultos", titulo: "Solo adultos", texto: "Esperamos compartir una celebración pensada exclusivamente para adultos." },
    { icono: "regalo", titulo: "Regalos", texto: "Tu presencia es el mejor regalo. Cualquier otro detalle será una contribución a nuestro nuevo hogar." }
  ],

  regalos: {
    texto: "Tu presencia es nuestro regalo más grande. Si deseas hacernos un obsequio, aquí puedes encontrar los detalles.",
    cuentaTexto: "Banco Atlántida\nCuenta de ahorros: 1234567890\nA nombre de: Bryan Colindres"
  },

  rsvpFotoUrl: "../../assets/demo/img/preboda2.jpg",
  firmasFotoUrl: "../../assets/demo/img/preboda3.jpg",

  modules: {
    countdown: true, musica: true, mapa: true, historia: true, mensajes: true,
    timeline: true, galeria: true, firmas: true, rsvp: true, rsvp_premium: true,
    video: true, cancion: true, detalles: true, regalos: true, vestimenta: true,
    mensaje_personalizado: true, video_interno: true
  },


  vestimenta: {
    titulo: "Código de vestimenta",
    texto: "Formal de playa. Colores claros y frescos, telas ligeras. Evita el blanco, reservado para la novia.",
    colores: ["#F2E8D5", "#BFE3E0", "#2CA6A6", "#1B4B5A", "#E8927C"]
  },

  airtable: { apiKey: "PEGAR_API_KEY", baseId: "PEGAR_BASE_ID", tableId: "Firmas" },
  cloudinary: { cloudName: "PEGAR_CLOUD_NAME", uploadPreset: "PEGAR_UPLOAD_PRESET" },
  galeriaMuestra: ["../../assets/demo/img/preboda9.jpg", "../../assets/demo/img/preboda10.jpg", "../../assets/demo/img/preboda11.jpg", "../../assets/demo/img/preboda12.jpg", "../../assets/demo/img/preboda13.jpg", "../../assets/demo/img/preboda14.jpg"],
  whatsapp: { novio: "50431626792", novia: "50499223790" }
};

// eventoId de demostración (no existe en Supabase, solo para pruebas visuales)
window.CONFIG_DEMO.eventoId = 'demo';
