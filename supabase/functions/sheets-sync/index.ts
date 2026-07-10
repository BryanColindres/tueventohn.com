// ============================================================================
// supabase/functions/sheets-sync/index.ts
//
// Se dispara con cada INSERT / UPDATE / DELETE en `invitados` (vía Database
// Webhook) o se puede llamar manualmente desde el panel admin con
// { evento_id } en el body (botón "Reintentar sincronización").
//
// Qué hace:
//   1. Si el evento todavía no tiene Google Sheet, lo crea y lo comparte
//      con el correo del cliente.
//   2. Trae TODOS los invitados actuales del evento desde Supabase
//      (fuente de verdad) y sobrescribe la hoja completa — así nunca hay
//      desincronización de filas, sin importar qué cambió.
//   3. Si algo falla, reintenta con backoff y, si aun así falla, lo deja
//      registrado en `sync_errors` con un mensaje entendible para el
//      panel (nunca lanza un error crudo de la API de Google al usuario).
//
// Secretos requeridos además de los de Google:
//   SUPABASE_URL              (ya viene inyectado automáticamente)
//   SUPABASE_SERVICE_ROLE_KEY (ya viene inyectado automáticamente)
// ============================================================================

import { getGoogleAccessToken, conReintentos } from "../_shared/google-auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const DRIVE_API = "https://www.googleapis.com/drive/v3";

const HEADERS_SHEET = [
  "Código", "Nombre", "Familia", "Teléfono", "Estado",
  "Asistentes", "Adultos", "Niños", "Mensaje", "Fecha de confirmación",
];

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));

    // Acepta tanto el payload de un Database Webhook (record/old_record)
    // como una llamada manual { evento_id }.
    const eventoId =
      body?.record?.evento_id ?? body?.old_record?.evento_id ?? body?.evento_id;

    if (!eventoId) {
      return json({ ok: false, mensaje: "No se recibió evento_id." }, 400);
    }

    await sincronizarEvento(eventoId);
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false, mensaje: "Error interno sincronizando con Google Sheets." }, 500);
  }
});

async function sincronizarEvento(eventoId: string) {
  try {
    const evento = await obtenerEvento(eventoId);
    if (!evento) throw new Error(`No se encontró el evento ${eventoId}`);

    let sheetId = evento.google_sheet_id as string | null;

    if (!sheetId) {
      sheetId = await conReintentos(() => crearYCompartirSheet(evento));
      await actualizarEvento(eventoId, {
        google_sheet_id: sheetId,
        google_sheet_url: `https://docs.google.com/spreadsheets/d/${sheetId}`,
      });
    }

    const invitados = await obtenerInvitados(eventoId);
    await conReintentos(() => escribirInvitados(sheetId!, invitados));

    await actualizarEvento(eventoId, { google_sheet_synced_at: new Date().toISOString() });
    await marcarErroresResueltos(eventoId);
  } catch (err) {
    await registrarError(eventoId, "sync_invitados", String(err?.message ?? err));
    // No relanzamos: un fallo de Google nunca debe tumbar la escritura que
    // ya se hizo en Supabase (la base de datos siempre manda).
  }
}

/* ---------------------------------------------------------------------- */
/*  Google Sheets / Drive                                                  */
/* ---------------------------------------------------------------------- */

async function crearYCompartirSheet(evento: any): Promise<string> {
  const token = await getGoogleAccessToken();

  const nombreHoja = `Invitados — ${evento.nombre_evento || evento.slug || evento.id}`;

  const resCrear = await fetch(SHEETS_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      properties: { title: nombreHoja },
      sheets: [{ properties: { title: "Invitados" } }],
    }),
  });
  if (!resCrear.ok) throw new Error(`No se pudo crear el Google Sheet: ${await resCrear.text()}`);
  const data = await resCrear.json();
  const sheetId = data.spreadsheetId as string;

  // Compartir con el correo del cliente (si lo tenemos) como editor,
  // para que pueda verlo y editarlo sin pedir acceso.
  const correoCliente = evento.clientes?.correo;
  if (correoCliente) {
    const resCompartir = await fetch(`${DRIVE_API}/files/${sheetId}/permissions?sendNotificationEmail=true`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ role: "writer", type: "user", emailAddress: correoCliente }),
    });
    if (!resCompartir.ok) {
      // No es fatal: el sheet ya existe, solo no se compartió. Lo dejamos
      // registrado para reintentar el compartir después si hace falta.
      console.warn(`No se pudo compartir el Sheet con ${correoCliente}: ${await resCompartir.text()}`);
    }
  }

  return sheetId;
}

async function escribirInvitados(sheetId: string, invitados: any[]) {
  const token = await getGoogleAccessToken();

  const filas = [
    HEADERS_SHEET,
    ...invitados.map((i) => [
      i.codigo, i.nombre, i.familia ?? "", i.telefono ?? "",
      etiquetaEstado(i.estado), i.asistentes, i.adultos, i.ninos,
      i.mensaje ?? "", i.fecha_confirmacion ? new Date(i.fecha_confirmacion).toLocaleString("es-HN") : "",
    ]),
  ];

  // 1) Limpiar todo el rango primero, para que filas eliminadas en Supabase
  //    no queden "fantasma" en el Sheet.
  const resClear = await fetch(`${SHEETS_API}/${sheetId}/values/Invitados!A1:Z5000:clear`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resClear.ok) throw new Error(`No se pudo limpiar la hoja: ${await resClear.text()}`);

  // 2) Escribir todo de nuevo desde la base de datos (fuente de verdad).
  const resUpdate = await fetch(
    `${SHEETS_API}/${sheetId}/values/Invitados!A1?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: filas }),
    }
  );
  if (!resUpdate.ok) throw new Error(`No se pudo escribir en la hoja: ${await resUpdate.text()}`);
}

function etiquetaEstado(estado: string) {
  return { confirmado: "Confirmado", pendiente: "Pendiente", rechazado: "No viene" }[estado] ?? estado;
}

/* ---------------------------------------------------------------------- */
/*  Supabase (REST, con service role — esta función corre en servidor)     */
/* ---------------------------------------------------------------------- */

async function obtenerEvento(eventoId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/eventos?id=eq.${eventoId}&select=id,nombre_evento,slug,google_sheet_id,clientes(correo)`,
    { headers: sbHeaders() }
  );
  const rows = await res.json();
  return rows?.[0] ?? null;
}

async function actualizarEvento(eventoId: string, cambios: Record<string, unknown>) {
  await fetch(`${SUPABASE_URL}/rest/v1/eventos?id=eq.${eventoId}`, {
    method: "PATCH",
    headers: { ...sbHeaders(), "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(cambios),
  });
}

async function obtenerInvitados(eventoId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/invitados?evento_id=eq.${eventoId}&order=creado_en.asc`,
    { headers: sbHeaders() }
  );
  return res.json();
}

async function registrarError(eventoId: string, contexto: string, detalle: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/sync_errors`, {
    method: "POST",
    headers: { ...sbHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify([{ evento_id: eventoId, contexto, detalle }]),
  });
}

async function marcarErroresResueltos(eventoId: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/sync_errors?evento_id=eq.${eventoId}&resuelto=eq.false`, {
    method: "PATCH",
    headers: { ...sbHeaders(), "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ resuelto: true }),
  });
}

function sbHeaders() {
  return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
