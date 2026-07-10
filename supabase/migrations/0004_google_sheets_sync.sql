-- ============================================================================
-- 0004_google_sheets_sync.sql
-- Agrega lo necesario para: (a) guardar invitados de forma estructurada,
-- (b) rastrear el Google Sheet de cada evento, (c) registrar fallos de
-- sincronización con mensajes amigables para el panel.
--
-- SUPUESTOS A VERIFICAR ANTES DE CORRER ESTO (avísame si algo no cuadra):
--   1. La tabla `eventos` ya existe con columna `id` (uuid, PK).
--   2. La tabla `clientes` ya existe con columna `correo`.
--   3. `eventos` tiene una columna que referencia a `clientes` — asumo
--      `cliente_id`. Si se llama distinto, cambia la línea marcada abajo.
--   4. Ya existen las funciones portal_agregar_invitado_manual /
--      portal_listar_invitados / portal_generar_links_invitados de una
--      migración anterior (0002_portal_functions.sql, no incluida en el
--      zip que me diste). Si esas funciones YA escriben en una tabla
--      `invitados` con nombres de columnas distintos a los de aquí,
--      NO corras este CREATE TABLE — mándame esa migración y ajusto esto
--      para no duplicar ni romper nada.
-- ============================================================================

-- ---------- 1. Invitados (si no existe ya desde 0002) ----------
create table if not exists invitados (
  id                 uuid primary key default gen_random_uuid(),
  evento_id          uuid not null references eventos(id) on delete cascade,
  codigo             text not null unique,
  nombre             text not null,
  familia            text,
  telefono           text,
  estado             text not null default 'pendiente'
                       check (estado in ('pendiente','confirmado','rechazado')),
  asistentes         int not null default 1,
  adultos            int not null default 1,
  ninos              int not null default 0,
  mensaje            text,
  fecha_confirmacion timestamptz,
  creado_en          timestamptz not null default now(),
  actualizado_en     timestamptz not null default now()
);

create index if not exists idx_invitados_evento on invitados(evento_id);

-- Mantiene actualizado_en al día en cada cambio (útil para depurar sync)
create or replace function _tocar_actualizado_en()
returns trigger language plpgsql as $$
begin
  new.actualizado_en = now();
  return new;
end $$;

drop trigger if exists trg_invitados_actualizado on invitados;
create trigger trg_invitados_actualizado
  before update on invitados
  for each row execute function _tocar_actualizado_en();

-- ---------- 2. Rastreo del Google Sheet por evento ----------
alter table eventos add column if not exists google_sheet_id text;
alter table eventos add column if not exists google_sheet_url text;
alter table eventos add column if not exists google_sheet_synced_at timestamptz;

-- ---------- 3. Registro de errores de sincronización ----------
-- El panel puede leer esta tabla para mostrar "no se pudo sincronizar,
-- reintentando" en vez de fallar en silencio.
create table if not exists sync_errors (
  id          uuid primary key default gen_random_uuid(),
  evento_id   uuid references eventos(id) on delete cascade,
  contexto    text not null,          -- ej. 'crear_sheet', 'sync_invitados'
  detalle     text,
  intentos    int not null default 1,
  resuelto    boolean not null default false,
  creado_en   timestamptz not null default now()
);

create index if not exists idx_sync_errors_evento on sync_errors(evento_id) where not resuelto;

-- ---------- 4. RLS ----------
-- invitados: mismo criterio de acceso que el resto del panel admin
-- (ajusta el nombre de policy/rol si tus otras tablas usan otro esquema).
alter table invitados enable row level security;
alter table sync_errors enable row level security;

drop policy if exists "admin_all_invitados" on invitados;
create policy "admin_all_invitados" on invitados
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "admin_read_sync_errors" on sync_errors;
create policy "admin_read_sync_errors" on sync_errors
  for select using (auth.role() = 'authenticated');

-- ---------- 5. Webhook automático hacia la Edge Function ----------
-- La forma recomendada de disparar la sincronización es un Database Webhook
-- configurado desde el Dashboard (Database → Webhooks → Create a new hook):
--   Tabla:      invitados
--   Eventos:    INSERT, UPDATE, DELETE
--   Tipo:       HTTP Request
--   URL:        https://<tu-proyecto>.supabase.co/functions/v1/sheets-sync
--   Headers:    Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY o un secreto propio>
-- No lo creo aquí por SQL porque requiere el project ref y las credenciales,
-- que no debo poner en un archivo versionado. Te dejo los clics exactos
-- en el mensaje.
