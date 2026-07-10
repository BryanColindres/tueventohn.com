// ============================================================================
// _shared/google-auth.ts
// Obtiene un access_token de Google usando el refresh_token de la cuenta
// nubeeventos01@gmail.com (autorizada una sola vez, ver README de la función
// sheets-sync para el paso a paso). NO usa cuenta de servicio: las cuentas
// de servicio normales no tienen cuota de almacenamiento en Drive desde 2023,
// así que no pueden crear Sheets en una cuenta Gmail personal.
//
// Secretos requeridos (supabase secrets set ...):
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   GOOGLE_REFRESH_TOKEN
// ============================================================================

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getGoogleAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Faltan credenciales de Google (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN). " +
      "Configúralas con `supabase secrets set`."
    );
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const texto = await res.text();
    throw new Error(`No se pudo renovar el token de Google (${res.status}): ${texto}`);
  }

  const data = await res.json();
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

// ---------------------------------------------------------------------------
// Reintentos con backoff exponencial para cualquier llamada a Google.
// ---------------------------------------------------------------------------
export async function conReintentos<T>(
  fn: () => Promise<T>,
  intentos = 3,
  esperaBaseMs = 500
): Promise<T> {
  let ultimoError: unknown;
  for (let i = 0; i < intentos; i++) {
    try {
      return await fn();
    } catch (err) {
      ultimoError = err;
      if (i < intentos - 1) {
        await new Promise((r) => setTimeout(r, esperaBaseMs * Math.pow(3, i)));
      }
    }
  }
  throw ultimoError;
}
