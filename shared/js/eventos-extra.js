// ============================================================================
// DATOS FIJOS POR EVENTO
// Para datos de un evento que todavía no tienen campo en el portal / base de datos
// (por ahora: el enlace del álbum de fotos). cargarConfig() (backend.js) los mezcla
// en la config del evento. La llave es el valor de ?evento= de la invitación (slug).
//
// albumFotosUrl: carpeta de Drive compartida como "Cualquier persona con el enlace: Editor"
// (así los invitados pueden subir). Aparece como sección con QR después de la confirmación.
// ============================================================================
window.EVENTOS_EXTRA = {
  "harold-dalia": {
    albumFotosUrl: "https://drive.google.com/drive/folders/1GGs75g_9ny8QMsobH2YXf3kRoTlfdCRX?usp=sharing"
  }
};
