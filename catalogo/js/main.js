// ============================================================================
// CATÁLOGO — lee las plantillas directamente de Supabase.
// Nunca hay una lista de plantillas escrita a mano aquí: si se agrega una
// plantilla nueva a la base de datos (tabla `plantillas`), aparece sola.
// ============================================================================

const SUPABASE_URL = "https://npfgugnoycokhtljbwkw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Ij3gofHHYKTHps92RKXKwQ_5Hya3_GW";
const WHATSAPP_NUMERO = "50431626792";

document.addEventListener('DOMContentLoaded', () => {
  cargarPlantillas();
  cargarPaquetes();
  pintarFAQ();
  configurarWhatsapp();
});

async function cargarPlantillas(){
  const grid = document.getElementById('catalogo-grid');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/plantillas?estado=eq.activa&order=orden.asc&select=nombre,slug,tagline,ruta_html`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    const plantillas = await res.json();

    grid.innerHTML = plantillas.map(p => {
      const url = `../${p.ruta_html}`;
      return `
      <div class="plantilla-card">
        <div class="telefono-wrap" data-url="${url}">
          <div class="telefono">
            <div class="telefono-notch"></div>
            <div class="telefono-pantalla">
              <iframe src="${url}" loading="lazy" tabindex="-1" title="Vista previa de ${p.nombre}"></iframe>
              <div class="telefono-click" role="link" aria-label="Abrir plantilla ${p.nombre}"></div>
            </div>
          </div>
        </div>
        <p class="plantilla-nombre">${p.nombre}</p>
        <p class="plantilla-tag">${p.tagline || ''}</p>
        <a href="https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent('Hola, me interesa la plantilla "' + p.nombre + '" del catálogo')}" target="_blank" class="btn-plantilla">Encargar invitación</a>
      </div>`;
    }).join('');

    TuBodaPreview.iniciarTodas();
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p style="text-align:center;color:#999">No se pudo cargar el catálogo. Intenta de nuevo en unos minutos.</p>`;
  }
}

// Checklist por paquete, en orden (0 = Esencial, 1 = Elegante, 2 = Experiencia Completa).
// Cada paquete incluye todo lo del anterior, más lo que está listado aquí.
const CARACTERISTICAS = [
  [
    'La plantilla que elijas del catálogo',
    'Música de fondo automática',
    'Contador regresivo a la boda',
    'Ubicación con Google Maps y Waze',
    'Confirmación de asistencia por WhatsApp'
  ],
  [
    'Confirmación de asistencia automatizada, individual o por familia',
    'Libro de firmas y muro de deseos, moderado por ustedes',
    'Historia de la pareja estilo Instagram',
    'Playlist personalizada de Spotify o YouTube'
  ],
  [
    'Dashboard de invitados con confirmaciones, aperturas y estadísticas.',
    'Organizador de mesas para planificar la distribución de tus invitados.',
   // 'Recordatorios automáticos por WhatsApp a quien no ha confirmado',
    'Soporte prioritario durante todo el proceso'
  ]
];

async function cargarPaquetes(){
  const cont = document.getElementById('precios-grid');
  if (!cont) return;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/paquetes?activo=eq.true&order=orden.asc&select=*`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    const paquetes = await res.json();
    if (!paquetes.length) return;

    cont.innerHTML = paquetes.map((p, i) => {
      const propias = CARACTERISTICAS[i] || [];
      const heredado = i > 0 ? `<li class="precio-heredado">Todo lo de ${paquetes[i - 1].nombre}, más:</li>` : '';
      const items = propias.map(f => `<li><span class="precio-check">✓</span>${f}</li>`).join('');
      return `
      <div class="precio-card ${i === 2 ? 'destacado' : ''}">
        ${i === 2 ? '<span class="precio-badge">Más elegido</span>' : ''}
        <p class="precio-nombre">${p.nombre}</p>
        <p class="precio-valor">L. ${Number(p.precio).toLocaleString('es-HN')}</p>
        ${p.descripcion ? `<p style="color:var(--texto-mid);font-size:.86rem;margin-bottom:1rem">${p.descripcion}</p>` : ''}
        <ul class="precio-lista">${heredado}${items}</ul>
        <a href="https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent('Hola, quiero cotizar el paquete ' + p.nombre)}"
           target="_blank" class="btn ${i === 2 ? 'btn-dorado' : 'btn-outline-claro'}" style="justify-content:center;${i!==2?'color:var(--texto);border-color:rgba(0,0,0,.2)':''}">
           Cotizar por WhatsApp</a>
      </div>`;
    }).join('');
  } catch (err) { console.error(err); }
}

const FAQS = [
  { p: "¿Cómo pago mi invitación?", r: "Todo el proceso es por WhatsApp: nos escribes, eliges tu plantilla y paquete, y te enviamos los datos de pago por transferencia bancaria." },
  { p: "¿Cuánto tarda la entrega?", r: "El tiempo estimado es de 5 dias después de recibir todos tus datos, fotos e historia completos." },
  { p: "¿Puedo cambiar fotos o textos después de recibirla?", r: "Sí, incluimos una ronda de ajustes sin costo antes de la entrega final." },
  { p: "¿Funciona en cualquier celular?", r: "Sí, es un sitio web — funciona en cualquier celular con navegador, sin necesidad de instalar nada." },
  { p: "¿Puedo pedir una plantilla que no esté en el catálogo?", r: "Sí, podemos platicar tu idea y ver si es posible crear un diseño a la medida con un costo adicional." },
  { p: "¿El link tiene fecha de vencimiento?", r: "No, tu invitación se mantiene activa; si quieres desactivarla después del evento, también podemos hacerlo." }
];

function pintarFAQ(){
  const cont = document.getElementById('faq-lista');
  cont.innerHTML = FAQS.map((f, i) => `
    <div class="faq-item" data-i="${i}">
      <div class="faq-pregunta"><span>${f.p}</span><span class="signo">+</span></div>
      <div class="faq-respuesta"><p>${f.r}</p></div>
    </div>
  `).join('');
  cont.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-pregunta').addEventListener('click', () => item.classList.toggle('abierto'));
  });
}

function configurarWhatsapp(){
  const msj = encodeURIComponent('Hola, quiero información sobre las invitaciones digitales de boda');
  document.getElementById('nav-whatsapp').href = `https://wa.me/${WHATSAPP_NUMERO}?text=${msj}`;
  document.getElementById('footer-whatsapp').href = `https://wa.me/${WHATSAPP_NUMERO}?text=${msj}`;
}
