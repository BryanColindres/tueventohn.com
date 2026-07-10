-- ============================================================================
-- 0006_panel_organizador_schema.sql
-- Rediseño completo de `invitados` + tablas nuevas para mesas/zonas/
-- recordatorios + todas las funciones RPC del Panel del Organizador.
--
-- Seguro de correr: confirmaste que `invitados` está vacía (0 filas), así
-- que no hay migración de datos que hacer, solo cambio de estructura.
-- ============================================================================

-- ----------------------------------------------------------------------
-- 1. Tablas nuevas primero (invitados va a referenciar `mesas`)
-- ----------------------------------------------------------------------

create table if not exists mesas (
  id         uuid primary key default gen_random_uuid(),
  evento_id  uuid not null references eventos(id) on delete cascade,
  nombre     text not null,
  forma      text not null default 'round' check (forma in ('round','square','rect')),
  capacidad  int  not null default 8 check (capacidad between 1 and 30),
  es_novios  boolean not null default false,
  pos_x      numeric not null default 40,
  pos_y      numeric not null default 40,
  ancho      numeric not null default 150,
  alto       numeric not null default 150,
  creado_en  timestamptz not null default now()
);
create index if not exists idx_mesas_evento on mesas(evento_id);

create table if not exists zonas (
  id         uuid primary key default gen_random_uuid(),
  evento_id  uuid not null references eventos(id) on delete cascade,
  tipo       text not null check (tipo in ('pista','barra','entrada','escenario')),
  etiqueta   text not null,
  pos_x      numeric not null default 40,
  pos_y      numeric not null default 40,
  ancho      numeric not null default 200,
  alto       numeric not null default 160
);
create index if not exists idx_zonas_evento on zonas(evento_id);

create table if not exists salon_config (
  evento_id  uuid primary key references eventos(id) on delete cascade,
  ancho      numeric not null default 980,
  alto       numeric not null default 520
);

create table if not exists recordatorios_log (
  id          uuid primary key default gen_random_uuid(),
  evento_id   uuid not null references eventos(id) on delete cascade,
  invitado_id uuid references invitados(id) on delete cascade,
  canal       text not null default 'whatsapp',
  enviado_en  timestamptz not null default now()
);
create index if not exists idx_recordatorios_evento on recordatorios_log(evento_id);

-- ----------------------------------------------------------------------
-- 2. Rediseño de `invitados`
-- ----------------------------------------------------------------------

alter table invitados rename column observaciones to mensaje;
alter table invitados add column if not exists familia text;
alter table invitados add column if not exists telefono text;

alter table invitados add column if not exists estado text;
update invitados set estado = case when confirmado then 'confirmado' else 'pendiente' end where estado is null;
alter table invitados alter column estado set default 'pendiente';
alter table invitados alter column estado set not null;
alter table invitados drop constraint if exists invitados_estado_check;
alter table invitados add constraint invitados_estado_check check (estado in ('pendiente','confirmado','rechazado'));
alter table invitados drop column if exists confirmado;

alter table invitados add column if not exists mesa_id uuid references mesas(id) on delete set null;
alter table invitados add column if not exists asiento_index int;
alter table invitados drop column if exists mesa;

-- un asiento solo puede tener un invitado
create unique index if not exists idx_invitados_asiento_unico
  on invitados(mesa_id, asiento_index) where mesa_id is not null;

-- un identificador de link no se puede repetir
create unique index if not exists idx_invitados_identificador
  on invitados(identificador_publico) where identificador_publico is not null;

create index if not exists idx_invitados_evento on invitados(evento_id);

-- ----------------------------------------------------------------------
-- 3. RLS para las tablas nuevas (mismo criterio que ya usas: acceso admin
--    autenticado; las escrituras del lado del invitado pasan por funciones
--    SECURITY DEFINER, igual que ya hace `invitados`)
-- ----------------------------------------------------------------------

alter table mesas enable row level security;
alter table zonas enable row level security;
alter table salon_config enable row level security;
alter table recordatorios_log enable row level security;

drop policy if exists "admin_all_mesas" on mesas;
create policy "admin_all_mesas" on mesas for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin_all_zonas" on zonas;
create policy "admin_all_zonas" on zonas for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin_all_salon_config" on salon_config;
create policy "admin_all_salon_config" on salon_config for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin_all_recordatorios" on recordatorios_log;
create policy "admin_all_recordatorios" on recordatorios_log for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================================
-- 4. FUNCIONES — Invitados
-- ============================================================================

-- Verifica si ya existe una familia con ese nombre en el evento (para el
-- diálogo "¿Deseas crearla de todas formas?").
create or replace function panel_verificar_familia(p_codigo text, p_familia text)
returns boolean
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_evento eventos%rowtype;
  v_existe boolean;
begin
  select * into v_evento from eventos where codigo_portal = p_codigo;
  if not found then return false; end if;

  select exists(
    select 1 from invitados
    where evento_id = v_evento.id
      and lower(trim(regexp_replace(familia, '\s+', ' ', 'g'))) =
          lower(trim(regexp_replace(p_familia, '\s+', ' ', 'g')))
  ) into v_existe;

  return v_existe;
end;
$$;

-- Agregar un invitado uno por uno (con opción de forzar familia duplicada).
create or replace function portal_agregar_invitado_manual(
  p_codigo text, p_nombre text, p_familia text default null,
  p_telefono text default null, p_forzar boolean default false
)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_evento eventos%rowtype;
  v_ruta_plantilla text;
  v_identificador text;
  v_duplicada boolean;
begin
  select * into v_evento from eventos where codigo_portal = p_codigo;
  if not found then return jsonb_build_object('error', 'codigo_invalido'); end if;

  if p_familia is not null and not p_forzar then
    v_duplicada := panel_verificar_familia(p_codigo, p_familia);
    if v_duplicada then
      return jsonb_build_object('ok', false, 'familia_duplicada', true);
    end if;
  end if;

  select ruta_html into v_ruta_plantilla from plantillas where id = v_evento.plantilla_id;
  v_identificador := generar_identificador_invitado(p_nombre);

  insert into invitados (evento_id, nombre, familia, telefono, identificador_publico)
  values (v_evento.id, p_nombre, p_familia, p_telefono, v_identificador);

  return jsonb_build_object(
    'ok', true, 'nombre', p_nombre,
    'link', 'https://nubeeventos.click/' || v_ruta_plantilla || '?evento=' || v_evento.slug_publico || '&id=' || v_identificador
  );
end;
$$;

-- Carga masiva desde Excel: AGREGA a la lista existente (no la reemplaza).
create or replace function portal_generar_links_invitados(p_codigo text, p_nombres text[])
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_evento eventos%rowtype;
  v_ruta_plantilla text;
  v_nombre text;
  v_identificador text;
  v_resultado jsonb := '[]'::jsonb;
begin
  select * into v_evento from eventos where codigo_portal = p_codigo;
  if not found then return jsonb_build_object('error', 'codigo_invalido'); end if;

  select ruta_html into v_ruta_plantilla from plantillas where id = v_evento.plantilla_id;

  foreach v_nombre in array p_nombres loop
    v_identificador := generar_identificador_invitado(v_nombre);
    insert into invitados (evento_id, nombre, identificador_publico)
    values (v_evento.id, v_nombre, v_identificador);
    v_resultado := v_resultado || jsonb_build_object(
      'nombre', v_nombre,
      'link', 'https://nubeeventos.click/' || v_ruta_plantilla || '?evento=' || v_evento.slug_publico || '&id=' || v_identificador
    );
  end loop;

  return jsonb_build_object('ok', true, 'invitados', v_resultado);
end;
$$;

-- Listado completo para el panel (dashboard + tabla de invitados).
create or replace function portal_listar_invitados(p_codigo text)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_evento eventos%rowtype;
  v_ruta_plantilla text;
  v_resultado jsonb;
begin
  select * into v_evento from eventos where codigo_portal = p_codigo;
  if not found then return jsonb_build_object('error', 'codigo_invalido'); end if;

  select ruta_html into v_ruta_plantilla from plantillas where id = v_evento.plantilla_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', i.id,
    'nombre', i.nombre,
    'familia', i.familia,
    'telefono', i.telefono,
    'estado', i.estado,
    'adultos', i.adultos,
    'ninos', i.ninos,
    'mensaje', i.mensaje,
    'fecha_confirmacion', i.fecha_confirmacion,
    'mesa_id', i.mesa_id,
    'identificador', i.identificador_publico,
    'link', 'https://nubeeventos.click/' || v_ruta_plantilla || '?evento=' || v_evento.slug_publico || '&id=' || i.identificador_publico
  ) order by i.created_at), '[]'::jsonb)
  into v_resultado
  from invitados i where i.evento_id = v_evento.id;

  return jsonb_build_object('ok', true, 'invitados', v_resultado);
end;
$$;

-- Editar un invitado existente desde el panel.
create or replace function panel_editar_invitado(
  p_codigo text, p_invitado_id uuid, p_nombre text, p_familia text, p_telefono text
)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
declare v_evento_id uuid;
begin
  select evento_id into v_evento_id from invitados
    where id = p_invitado_id and evento_id = (select id from eventos where codigo_portal = p_codigo);
  if v_evento_id is null then return jsonb_build_object('ok', false, 'error', 'no_encontrado'); end if;

  update invitados set nombre = p_nombre, familia = p_familia, telefono = p_telefono
  where id = p_invitado_id;

  return jsonb_build_object('ok', true);
end;
$$;

-- Eliminar un invitado desde el panel.
create or replace function panel_eliminar_invitado(p_codigo text, p_invitado_id uuid)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
begin
  delete from invitados
  where id = p_invitado_id
    and evento_id = (select id from eventos where codigo_portal = p_codigo);
  return jsonb_build_object('ok', true);
end;
$$;

-- Cambiar el estado manualmente desde el panel (el organizador marca a mano).
create or replace function panel_cambiar_estado_invitado(p_codigo text, p_invitado_id uuid, p_estado text)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
begin
  if p_estado not in ('pendiente','confirmado','rechazado') then
    return jsonb_build_object('ok', false, 'error', 'estado_invalido');
  end if;

  update invitados set
    estado = p_estado,
    fecha_confirmacion = case when p_estado = 'confirmado' then now() else fecha_confirmacion end
  where id = p_invitado_id
    and evento_id = (select id from eventos where codigo_portal = p_codigo);

  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================================
-- 5. FUNCIONES — RSVP público (llamadas desde la plantilla de invitación)
-- ============================================================================

create or replace function obtener_invitado(p_slug text, p_identificador text)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
declare v_inv invitados%rowtype;
begin
  select i.* into v_inv from invitados i
  join eventos e on e.id = i.evento_id
  where e.slug_publico = p_slug and i.identificador_publico = p_identificador;

  if not found then return jsonb_build_object('error', 'no_encontrado'); end if;

  return jsonb_build_object(
    'nombre', v_inv.nombre, 'estado', v_inv.estado,
    'adultos', v_inv.adultos, 'ninos', v_inv.ninos, 'mensaje', v_inv.mensaje
  );
end;
$$;

-- La función que faltaba: el invitado confirma/rechaza su asistencia.
-- SIEMPRE actualiza la fila existente, nunca crea una nueva.
create or replace function confirmar_invitado(
  p_slug text, p_identificador text, p_estado text,
  p_adultos int default 1, p_ninos int default 0, p_mensaje text default null
)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
declare v_id uuid;
begin
  if p_estado not in ('confirmado','rechazado') then
    return jsonb_build_object('ok', false, 'error', 'estado_invalido');
  end if;

  select i.id into v_id from invitados i
  join eventos e on e.id = i.evento_id
  where e.slug_publico = p_slug and i.identificador_publico = p_identificador;

  if v_id is null then return jsonb_build_object('ok', false, 'error', 'no_encontrado'); end if;

  update invitados set
    estado = p_estado,
    adultos = greatest(coalesce(p_adultos, 1), 0),
    ninos = greatest(coalesce(p_ninos, 0), 0),
    mensaje = p_mensaje,
    fecha_confirmacion = now()
  where id = v_id;

  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================================
-- 6. FUNCIONES — Mesas y asientos (para la siguiente entrega, ya listas)
-- ============================================================================

create or replace function panel_listar_mesas(p_codigo text)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
declare v_evento_id uuid; v_mesas jsonb; v_zonas jsonb; v_salon jsonb;
begin
  select id into v_evento_id from eventos where codigo_portal = p_codigo;
  if v_evento_id is null then return jsonb_build_object('error', 'codigo_invalido'); end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id, 'nombre', m.nombre, 'forma', m.forma, 'capacidad', m.capacidad,
    'es_novios', m.es_novios, 'pos_x', m.pos_x, 'pos_y', m.pos_y, 'ancho', m.ancho, 'alto', m.alto,
    'asientos', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'asiento_index', i.asiento_index, 'invitado_id', i.id, 'nombre', i.nombre
      )), '[]'::jsonb)
      from invitados i where i.mesa_id = m.id
    )
  )), '[]'::jsonb) into v_mesas from mesas m where m.evento_id = v_evento_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', z.id, 'tipo', z.tipo, 'etiqueta', z.etiqueta,
    'pos_x', z.pos_x, 'pos_y', z.pos_y, 'ancho', z.ancho, 'alto', z.alto
  )), '[]'::jsonb) into v_zonas from zonas z where z.evento_id = v_evento_id;

  select jsonb_build_object('ancho', coalesce(ancho, 980), 'alto', coalesce(alto, 520))
  into v_salon from salon_config where evento_id = v_evento_id;

  return jsonb_build_object('ok', true, 'mesas', v_mesas, 'zonas', v_zonas,
    'salon', coalesce(v_salon, jsonb_build_object('ancho', 980, 'alto', 520)));
end;
$$;

create or replace function panel_guardar_mesa(
  p_codigo text, p_mesa_id uuid, p_nombre text, p_forma text, p_capacidad int,
  p_es_novios boolean, p_pos_x numeric, p_pos_y numeric, p_ancho numeric, p_alto numeric
)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
declare v_evento_id uuid; v_id uuid;
begin
  select id into v_evento_id from eventos where codigo_portal = p_codigo;
  if v_evento_id is null then return jsonb_build_object('ok', false, 'error', 'codigo_invalido'); end if;

  if p_mesa_id is null then
    insert into mesas (evento_id, nombre, forma, capacidad, es_novios, pos_x, pos_y, ancho, alto)
    values (v_evento_id, p_nombre, p_forma, p_capacidad, p_es_novios, p_pos_x, p_pos_y, p_ancho, p_alto)
    returning id into v_id;
  else
    update mesas set nombre = p_nombre, forma = p_forma, capacidad = p_capacidad,
      es_novios = p_es_novios, pos_x = p_pos_x, pos_y = p_pos_y, ancho = p_ancho, alto = p_alto
    where id = p_mesa_id and evento_id = v_evento_id
    returning id into v_id;

    -- si la capacidad bajó, desasigna a quien quedó en un asiento que ya no existe
    update invitados set mesa_id = null, asiento_index = null
    where mesa_id = v_id and asiento_index >= p_capacidad;
  end if;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

create or replace function panel_eliminar_mesa(p_codigo text, p_mesa_id uuid)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
declare v_evento_id uuid;
begin
  select id into v_evento_id from eventos where codigo_portal = p_codigo;
  update invitados set mesa_id = null, asiento_index = null
  where mesa_id = p_mesa_id and evento_id = v_evento_id;
  delete from mesas where id = p_mesa_id and evento_id = v_evento_id;
  return jsonb_build_object('ok', true);
end;
$$;

-- Asigna/mueve/intercambia un invitado a un asiento específico. Si el asiento
-- ya tenía a alguien, ese alguien queda desasignado (vuelve a pendientes) o
-- se intercambia si el invitado que se movió también tenía asiento.
create or replace function panel_asignar_asiento(
  p_codigo text, p_invitado_id uuid, p_mesa_id uuid, p_asiento_index int
)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_evento_id uuid;
  v_ocupante_id uuid;
  v_origen_mesa uuid;
  v_origen_asiento int;
  v_capacidad int;
begin
  select id into v_evento_id from eventos where codigo_portal = p_codigo;
  if v_evento_id is null then return jsonb_build_object('ok', false, 'error', 'codigo_invalido'); end if;

  select capacidad into v_capacidad from mesas where id = p_mesa_id and evento_id = v_evento_id;
  if v_capacidad is null then return jsonb_build_object('ok', false, 'error', 'mesa_no_encontrada'); end if;
  if p_asiento_index < 0 or p_asiento_index >= v_capacidad then
    return jsonb_build_object('ok', false, 'error', 'asiento_fuera_de_rango');
  end if;

  select mesa_id, asiento_index into v_origen_mesa, v_origen_asiento
  from invitados where id = p_invitado_id and evento_id = v_evento_id;

  select id into v_ocupante_id from invitados
  where mesa_id = p_mesa_id and asiento_index = p_asiento_index and evento_id = v_evento_id;

  if v_ocupante_id = p_invitado_id then
    return jsonb_build_object('ok', true); -- ya estaba ahí
  end if;

  -- libera temporalmente el asiento destino para evitar choque con el índice único
  update invitados set mesa_id = null, asiento_index = null
  where id = p_invitado_id and evento_id = v_evento_id;

  if v_ocupante_id is not null then
    update invitados set mesa_id = v_origen_mesa, asiento_index = v_origen_asiento
    where id = v_ocupante_id;
  end if;

  update invitados set mesa_id = p_mesa_id, asiento_index = p_asiento_index
  where id = p_invitado_id and evento_id = v_evento_id;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function panel_quitar_asiento(p_codigo text, p_invitado_id uuid)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
begin
  update invitados set mesa_id = null, asiento_index = null
  where id = p_invitado_id
    and evento_id = (select id from eventos where codigo_portal = p_codigo);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function panel_guardar_zona(
  p_codigo text, p_zona_id uuid, p_tipo text, p_etiqueta text,
  p_pos_x numeric, p_pos_y numeric, p_ancho numeric, p_alto numeric
)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
declare v_evento_id uuid; v_id uuid;
begin
  select id into v_evento_id from eventos where codigo_portal = p_codigo;
  if v_evento_id is null then return jsonb_build_object('ok', false, 'error', 'codigo_invalido'); end if;

  if p_zona_id is null then
    insert into zonas (evento_id, tipo, etiqueta, pos_x, pos_y, ancho, alto)
    values (v_evento_id, p_tipo, p_etiqueta, p_pos_x, p_pos_y, p_ancho, p_alto)
    returning id into v_id;
  else
    update zonas set etiqueta = p_etiqueta, pos_x = p_pos_x, pos_y = p_pos_y, ancho = p_ancho, alto = p_alto
    where id = p_zona_id and evento_id = v_evento_id
    returning id into v_id;
  end if;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

create or replace function panel_eliminar_zona(p_codigo text, p_zona_id uuid)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
begin
  delete from zonas where id = p_zona_id
    and evento_id = (select id from eventos where codigo_portal = p_codigo);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function panel_guardar_salon(p_codigo text, p_ancho numeric, p_alto numeric)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
declare v_evento_id uuid;
begin
  select id into v_evento_id from eventos where codigo_portal = p_codigo;
  if v_evento_id is null then return jsonb_build_object('ok', false, 'error', 'codigo_invalido'); end if;

  insert into salon_config (evento_id, ancho, alto) values (v_evento_id, p_ancho, p_alto)
  on conflict (evento_id) do update set ancho = excluded.ancho, alto = excluded.alto;

  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================================
-- 7. FUNCIÓN — Registrar recordatorio enviado (para la siguiente entrega)
-- ============================================================================

create or replace function panel_registrar_recordatorio(p_codigo text, p_invitado_id uuid, p_canal text default 'whatsapp')
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
declare v_evento_id uuid;
begin
  select id into v_evento_id from eventos where codigo_portal = p_codigo;
  if v_evento_id is null then return jsonb_build_object('ok', false, 'error', 'codigo_invalido'); end if;

  insert into recordatorios_log (evento_id, invitado_id, canal)
  values (v_evento_id, p_invitado_id, p_canal);

  return jsonb_build_object('ok', true);
end;
$$;
