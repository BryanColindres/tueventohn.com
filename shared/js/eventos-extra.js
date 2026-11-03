// ============================================================================
// DATOS FIJOS POR EVENTO
// Para datos de un evento que todavía no tienen campo en el portal / base de datos
// (por ahora: el enlace del álbum de fotos). cargarConfig() (backend.js) los mezcla
// en la config del evento. La llave es el valor de ?evento= de la invitación (slug).
//
// Ejemplo:
//   "harold-dalia": { albumFotosUrl: "https://drive.google.com/drive/folders/XXXXXXXX?usp=sharing" }
// ============================================================================
window.EVENTOS_EXTRA = {
};
