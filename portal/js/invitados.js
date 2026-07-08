// ============================================================================
// PORTAL — GENERADOR DE INVITADOS (página aparte de "llenar mis datos")
// Mismo código de acceso (?codigo=XXXX), pantalla distinta.
// ============================================================================

const SUPABASE_URL = "https://npfgugnoycokhtljbwkw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Ij3gofHHYKTHps92RKXKwQ_5Hya3_GW";

let CODIGO = null;

async function rpc(nombre, parametros){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nombre}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify(parametros)
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Error en', nombre, data);
    alert('Algo falló. Intenta de nuevo — si sigue fallando, avísale a Bryan.');
    return { error: 'error_supabase', detalle: data };
  }
  return data;
}

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  CODIGO = params.get('codigo');

  if (!CODIGO) { mostrarError(); return; }

  const datos = await rpc('portal_obtener_evento', { p_codigo: CODIGO });
  if (!datos || datos.error) { mostrarError(); return; }

  document.getElementById('portal-nombre-evento').textContent = datos.nombreEvento || 'Tu invitación';
  document.getElementById('portal-contenido').classList.remove('oculto');
  document.getElementById('link-volver').href = `index.html?codigo=${CODIGO}`;

  cargarInvitadosGenerados();
});

function mostrarError(){
  document.getElementById('portal-error').classList.remove('oculto');
  document.getElementById('portal-nombre-evento').textContent = 'Link no válido';
}

// ---------------- GENERADOR ----------------
function cambiarTabGenerador(tab){
  document.querySelectorAll('.gen-tab').forEach(b => b.classList.toggle('activo', b.dataset.tab === tab));
  document.getElementById('gen-tab-manual').classList.toggle('oculto', tab !== 'manual');
  document.getElementById('gen-tab-excel').classList.toggle('oculto', tab !== 'excel');
}

async function agregarInvitadoManual(){
  const input = document.getElementById('invitado-nombre-nuevo');
  const nombre = input.value.trim();
  if (!nombre) return;
  const resultado = await rpc('portal_agregar_invitado_manual', { p_codigo: CODIGO, p_nombre: nombre });
  if (resultado.error) return;
  input.value = '';
  cargarInvitadosGenerados();
}

async function cargarInvitadosGenerados(){
  const resultado = await rpc('portal_listar_invitados', { p_codigo: CODIGO });
  const cont = document.getElementById('lista-invitados-generados');
  const sinInvitados = document.getElementById('sin-invitados');
  if (!resultado || !Array.isArray(resultado) || !resultado.length) {
    cont.innerHTML = '';
    sinInvitados.classList.remove('oculto');
    return;
  }
  sinInvitados.classList.add('oculto');
  cont.innerHTML = resultado.map(i => `<div><b>${i.nombre}</b> — ${i.link} ${i.confirmado === true ? '✅' : i.confirmado === false ? '❌' : '⏳'}</div>`).join('');
}

function procesarExcel(){
  const input = document.getElementById('input-excel');
  const archivo = input.files[0];
  if (!archivo) { alert('Selecciona un archivo primero.'); return; }

  const lector = new FileReader();
  lector.onload = async (e) => {
    const datos = new Uint8Array(e.target.result);
    const libro = XLSX.read(datos, { type: 'array' });
    const hoja = libro.Sheets[libro.SheetNames[0]];
    const filas = XLSX.utils.sheet_to_json(hoja);

    const nombres = filas.map(f => f.Nombre || f.nombre).filter(Boolean);
    if (!nombres.length) { alert('No se encontró la columna "Nombre" en el archivo.'); return; }

    const resultado = await rpc('portal_generar_links_invitados', { p_codigo: CODIGO, p_nombres: nombres });
    if (resultado.error) return;

    cargarInvitadosGenerados();

    const cont = document.getElementById('lista-invitados-generados');
    cont.innerHTML += '<br><button class="btn btn-dorado btn-chico" id="btn-descargar-excel">Descargar Excel con links</button>';
    document.getElementById('btn-descargar-excel').onclick = () => {
      const hojaNueva = XLSX.utils.json_to_sheet(resultado.invitados.map(i => ({ Nombre: i.nombre, Link: i.link })));
      const libroNuevo = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libroNuevo, hojaNueva, 'Invitados');
      XLSX.writeFile(libroNuevo, 'invitados-con-links.xlsx');
    };
  };
  lector.readAsArrayBuffer(archivo);
}
