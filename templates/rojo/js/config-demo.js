// ============================================================
// CONFIG.JS — PLANTILLA ELEGANTE
// Todo lo que se edita para cada boda vive aquí.
// ============================================================
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

  fotos: {
    hero: "img/hero.jpg",
    footer: "img/preboda6.jpg"
  },

  video: "img/zapatos.mp4",
  videoDelay: 0,

  // 0 a N — si el array queda vacío, la sección se oculta
  mensajes: [
    { texto: "El amor es paciente, el amor es bondadoso. No es envidioso, no se jacta, no se envanece.", referencia: "1 Corintios 13:4" }
  ],

  historia: [
    { titulo: "Nos conocimos", texto: "Un día aparecimos en la vida del otro, sin planearlo ni esperarlo.", foto: "img/nos_conocimos.jpg" },
    { titulo: "Primera cita", texto: "Una cita inolvidable donde finalmente confesamos lo que ya llevábamos dentro.", foto: "img/primera_cita.jpg" },
    { titulo: "La propuesta", texto: "El amor quedó inmortalizado con un sí que llenó de lágrimas y sonrisas nuestro camino hacia el altar.", foto: "img/propuesta.jpg" }
  ],

  timeline: [
    { hora: "5:30 PM", titulo: "Llegada de invitados", icono: "◆" },
    { hora: "6:00 PM", titulo: "Ceremonia", icono: "✦" },
    { hora: "7:00 PM", titulo: "Sesión de fotos", icono: "◆" },
    { hora: "7:30 PM", titulo: "Recepción", icono: "✦" },
    { hora: "8:30 PM", titulo: "Cena", icono: "◆" },
    { hora: "9:30 PM", titulo: "Primer baile", icono: "✦" },
    { hora: "10:00 PM", titulo: "Fiesta", icono: "◆" }
  ],

  modules: { firmas: true, galeria: true },

  airtable: { apiKey: "PEGAR_API_KEY", baseId: "PEGAR_BASE_ID", tableId: "Firmas" },
  cloudinary: { cloudName: "PEGAR_CLOUD_NAME", uploadPreset: "PEGAR_UPLOAD_PRESET" },

  galeriaMuestra: ["img/preboda8.jpg","img/preboda9.jpg","img/preboda10.jpg","img/preboda11.jpg","img/preboda12.jpg","img/preboda13.jpg"],

  whatsapp: { novio: "50431626792", novia: "50499223790" }
};

// eventoId de demostración (no existe en Supabase, solo para pruebas visuales)
window.CONFIG_DEMO.eventoId = 'demo';
