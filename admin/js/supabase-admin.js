// ============================================================================
// CLIENTE SUPABASE PARA EL PANEL ADMINISTRATIVO
// Usa la API REST directamente (sin librería/bundler) — coherente con que
// todo el sistema es estático y sin paso de compilación.
// ============================================================================

const SUPABASE_URL = "https://npfgugnoycokhtljbwkw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Ij3gofHHYKTHps92RKXKwQ_5Hya3_GW";

const Auth = {
  get token(){ return localStorage.getItem('tuboda_admin_token'); },
  get usuario(){ 
    const raw = localStorage.getItem('tuboda_admin_user');
    return raw ? JSON.parse(raw) : null;
  },
  estaLogueado(){ return !!this.token; },

  async login(correo, password){
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ email: correo, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || 'Credenciales inválidas');
    localStorage.setItem('tuboda_admin_token', data.access_token);
    localStorage.setItem('tuboda_admin_user', JSON.stringify(data.user));
    return data.user;
  },

  logout(){
    localStorage.removeItem('tuboda_admin_token');
    localStorage.removeItem('tuboda_admin_user');
  }
};

async function apiGet(tabla, query = ''){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}?${query}`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${Auth.token || SUPABASE_ANON_KEY}`
    }
  });
  if (!res.ok) throw new Error(`Error consultando ${tabla}`);
  return res.json();
}

async function apiPost(tabla, filas){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${Auth.token || SUPABASE_ANON_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(filas)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPatch(tabla, filtro, cambios){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}?${filtro}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${Auth.token || SUPABASE_ANON_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(cambios)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiDelete(tabla, filtro){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}?${filtro}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${Auth.token || SUPABASE_ANON_KEY}`
    }
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

async function apiRpc(nombre, parametros){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nombre}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${Auth.token || SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(parametros)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function generarSlug(texto){
  return texto.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function generarCodigoPortal(){
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
