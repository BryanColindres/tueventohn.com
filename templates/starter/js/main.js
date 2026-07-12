// ============================================================
// MAIN.JS — ESTRUCTURA MÍNIMA DE ARRANQUE
// Toda plantilla nueva debe:
//  1. Cargar CONFIG con TuBodaBackend.cargarConfig()
//  2. Pintar cada sección solo si CONFIG trae los datos
//  3. Usar TuBodaBackend para firmas / galería / canciones
//  4. Nunca acceder a Supabase o Cloudinary directamente
// ============================================================
let C;

document.addEventListener('DOMContentLoaded', async () => {
  C = await TuBodaBackend.cargarConfig();
  if (!C) return;
  TuBodaTextos.aplicar(C);

  pintarHero();
  // agregar aquí las funciones pintarX() de las secciones que la plantilla use
});

function pintarHero(){
  document.getElementById('hero-nombreA').textContent = C.pareja.nombreA;
  document.getElementById('hero-nombreB').textContent = C.pareja.nombreB;
  document.getElementById('hero-fecha').textContent = C.fechaTexto;
}

// Ejemplo de patrón para módulos opcionales — copiar para cada sección nueva:
//
// function pintarHistoria(){
//   const seccion = document.getElementById('section-historia');
//   if (!C.historia || !C.historia.length) { seccion.style.display = 'none'; return; }
//   ...
// }
