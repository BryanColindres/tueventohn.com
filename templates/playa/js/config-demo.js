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
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Valletal+Eventos+Valle+de+Angeles+Honduras"
  },

  fotos: { hero: "img/hero.jpg", footer: "img/preboda6.jpg" },
  video: "img/video-intro.mp4",
  videoDelay: 1.5,

  mensajes: [
    { texto: "El amor es paciente, el amor es bondadoso. No es envidioso, no se jacta, no se envanece.", referencia: "1 Corintios 13:4" }
  ],

  historia: [
    { titulo: "Nos conocimos", texto: "Un día aparecimos en la vida del otro, sin planearlo ni esperarlo.", foto: "img/nos_conocimos.jpg" },
    { titulo: "Primera cita", texto: "Una cita inolvidable donde finalmente confesamos lo que ya llevábamos dentro.", foto: "img/primera_cita.jpg" },
    { titulo: "La propuesta", texto: "El amor quedó inmortalizado con un sí que llenó de lágrimas y sonrisas nuestro camino hacia el altar.", foto: "img/propuesta.jpg" }
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

  modules: { firmas: true, galeria: true },

  vestimenta: {
    titulo: "Código de vestimenta",
    texto: "Formal de playa. Colores claros y frescos, telas ligeras. Evita el blanco, reservado para la novia.",
    colores: ["#F2E8D5", "#BFE3E0", "#2CA6A6", "#1B4B5A", "#E8927C"]
  },

  airtable: { apiKey: "PEGAR_API_KEY", baseId: "PEGAR_BASE_ID", tableId: "Firmas" },
  cloudinary: { cloudName: "PEGAR_CLOUD_NAME", uploadPreset: "PEGAR_UPLOAD_PRESET" },
  galeriaMuestra: ["img/preboda8.jpg","img/preboda9.jpg","img/preboda10.jpg","img/preboda11.jpg","img/preboda12.jpg","img/preboda13.jpg"],
  whatsapp: { novio: "50431626792", novia: "50499223790" }
};

// eventoId de demostración (no existe en Supabase, solo para pruebas visuales)
window.CONFIG_DEMO.eventoId = 'demo';
