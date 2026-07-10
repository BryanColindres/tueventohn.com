-- ============================================================================
-- 0005_trigger_sync_sheets.sql
-- Dispara sheets-sync directamente desde Postgres con cada cambio en
-- `invitados`, usando la extensión pg_net (HTTP asíncrono desde SQL).
-- Reemplaza al "Database Webhook" del dashboard — mismo resultado, pero
-- configurado 100% por código en vez de clics en la interfaz.
--
-- ANTES DE CORRER ESTO:
--   1. Ya debiste haber hecho `supabase functions deploy sheets-sync --no-verify-jwt`
--      (nota el flag nuevo — ver instrucciones que te pasé en el chat).
--   2. Ya debiste haber corrido:
--      supabase secrets set SYNC_WEBHOOK_SECRET="elige-un-valor-largo-random"
--   3. Reemplaza abajo, en la función, el valor 'CAMBIA_ESTE_SECRETO' por
--      ESE MISMO valor que pusiste en el paso 2 (tienen que ser idénticos).
-- ============================================================================

create extension if not exists pg_net with schema extensions;

create or replace function trigger_sheets_sync()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  payload jsonb;
begin
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', case when TG_OP = 'DELETE' then null else row_to_json(NEW) end,
    'old_record', case when TG_OP = 'DELETE' then row_to_json(OLD) else null end
  );

  perform net.http_post(
    url     := 'https://npfgugnoycokhtljbwkw.supabase.co/functions/v1/sheets-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-secret', 'CAMBIA_ESTE_SECRETO'
    ),
    body    := payload
  );

  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists trg_invitados_sync_sheets on invitados;
create trigger trg_invitados_sync_sheets
  after insert or update or delete on invitados
  for each row execute function trigger_sheets_sync();

-- ---------- Prueba rápida ----------
-- Después de correr este archivo, prueba con un insert real:
--
--   insert into invitados (evento_id, codigo, nombre, familia)
--   values ('<uuid-de-un-evento-real>', 'TEST-02', 'Prueba Trigger', 'Prueba');
--
-- Y revisa si se disparó, viendo la cola de pg_net:
--
--   select id, status_code, created, response_body
--   from net._http_response
--   order by created desc
--   limit 5;
--
-- status_code = 200 significa que la función respondió bien.
-- Si no hay filas ahí, el trigger no se está disparando (revisa que la
-- extensión pg_net haya quedado activa: Database → Extensions → pg_net).
