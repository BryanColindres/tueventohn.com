-- ============================================================================
-- TUBODA PLATFORM — FUNCIONES DEL PORTAL DEL CLIENTE
-- El portal NO usa Supabase Auth (el cliente no tiene usuario/contraseña).
-- Todo el acceso se valida manualmente contra eventos.codigo_portal dentro
-- de funciones SECURITY DEFINER — así no hace falta exponer RLS de escritura
-- pública sobre las tablas de contenido.
-- ============================================================================

create extension if not exists "unaccent";

-- ----------------------------------------------------------------------------
-- 1. Obtener el estado actual del evento (para pintar el formulario del portal)
-- ----------------------------------------------------------------------------
create or replace function portal_obtener_evento(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_evento eventos%rowtype;
begin
  select * into v_evento from eventos where codigo_portal = p_codigo;
  if not found then
    return jsonb_build_object('error', 'codigo_invalido');
  end if;

  return jsonb_build_object(
    'nombreEvento', v_evento.nombre_evento,
    'novioANombre', v_evento.novio_a_nombre, 'novioAApellido', v_evento.novio_a_apellido,
    'novioBNombre', v_evento.novio_b_nombre, 'novioBApellido', v_evento.novio_b_apellido,
    'whatsappA', v_evento.whatsapp_a, 'whatsappB', v_evento.whatsapp_b,
    'fecha', v_evento.fecha, 'hora', v_evento.hora,
    'lugarNombre', v_evento.lugar_nombre, 'lugarDireccion', v_evento.lugar_direccion,
    'lugarMapsUrl', v_evento.lugar_maps_url,
    'fotoHeroUrl', v_evento.foto_hero_url, 'fotoFooterUrl', v_evento.foto_footer_url,
    'videoIntroUrl', v_evento.video_intro_url,
    'slugPublico', v_evento.slug_publico,
    'estadoId', v_evento.estado_id,
    'historia', (select coalesce(jsonb_agg(jsonb_build_object('id', h.id, 'titulo', h.titulo, 'texto', h.descripcion, 'foto', h.imagen_url) order by h.orden), '[]'::jsonb) from historia h where h.evento_id = v_evento.id),
    'timeline', (select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'hora', t.hora, 'titulo', t.titulo) order by t.orden), '[]'::jsonb) from timeline t where t.evento_id = v_evento.id),
    'mensajes', (select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'texto', m.texto, 'referencia', m.referencia) order by m.orden), '[]'::jsonb) from mensajes m where m.evento_id = v_evento.id),
    'modulosActivos', (select coalesce(jsonb_object_agg(mo.slug, em.activo), '{}'::jsonb) from evento_modulo em join modulos mo on mo.id = em.modulo_id where em.evento_id = v_evento.id)
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. Actualizar los datos generales del evento
-- ----------------------------------------------------------------------------
create or replace function portal_actualizar_evento(
  p_codigo text,
  p_novio_a_nombre text default null,
  p_novio_a_apellido text default null,
  p_novio_b_nombre text default null,
  p_novio_b_apellido text default null,
  p_whatsapp_a text default null,
  p_whatsapp_b text default null,
  p_fecha date default null,
  p_hora time default null,
  p_lugar_nombre text default null,
  p_lugar_direccion text default null,
  p_lugar_maps_url text default null,
  p_foto_hero_url text default null,
  p_foto_footer_url text default null,
  p_video_intro_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id from eventos where codigo_portal = p_codigo;
  if v_id is null then
    return jsonb_build_object('error', 'codigo_invalido');
  end if;

  update eventos set
    novio_a_nombre    = coalesce(p_novio_a_nombre, novio_a_nombre),
    novio_a_apellido  = coalesce(p_novio_a_apellido, novio_a_apellido),
    novio_b_nombre    = coalesce(p_novio_b_nombre, novio_b_nombre),
    novio_b_apellido  = coalesce(p_novio_b_apellido, novio_b_apellido),
    whatsapp_a        = coalesce(p_whatsapp_a, whatsapp_a),
    whatsapp_b        = coalesce(p_whatsapp_b, whatsapp_b),
    fecha             = coalesce(p_fecha, fecha),
    hora              = coalesce(p_hora, hora),
    lugar_nombre      = coalesce(p_lugar_nombre, lugar_nombre),
    lugar_direccion   = coalesce(p_lugar_direccion, lugar_direccion),
    lugar_maps_url    = coalesce(p_lugar_maps_url, lugar_maps_url),
    foto_hero_url     = coalesce(p_foto_hero_url, foto_hero_url),
    foto_footer_url   = coalesce(p_foto_footer_url, foto_footer_url),
    video_intro_url   = coalesce(p_video_intro_url, video_intro_url),
    nombre_evento     = coalesce(p_novio_a_nombre, novio_a_nombre) || ' & ' || coalesce(p_novio_b_nombre, novio_b_nombre)
  where id = v_id;

  return jsonb_build_object('ok', true);
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. Reemplazar historia / timeline / mensajes completos (el portal manda
--    el arreglo final cada vez que el cliente guarda esa sección)
-- ----------------------------------------------------------------------------
create or replace function portal_guardar_historia(p_codigo text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_item jsonb; v_orden int := 0;
begin
  select id into v_id from eventos where codigo_portal = p_codigo;
  if v_id is null then return jsonb_build_object('error', 'codigo_invalido'); end if;

  delete from historia where evento_id = v_id;
  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into historia (evento_id, titulo, descripcion, imagen_url, orden)
    values (v_id, v_item->>'titulo', v_item->>'texto', v_item->>'foto', v_orden);
    v_orden := v_orden + 1;
  end loop;
  return jsonb_build_object('ok', true);
end; $$;

create or replace function portal_guardar_timeline(p_codigo text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_item jsonb; v_orden int := 0;
begin
  select id into v_id from eventos where codigo_portal = p_codigo;
  if v_id is null then return jsonb_build_object('error', 'codigo_invalido'); end if;

  delete from timeline where evento_id = v_id;
  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into timeline (evento_id, hora, titulo, orden)
    values (v_id, v_item->>'hora', v_item->>'titulo', v_orden);
    v_orden := v_orden + 1;
  end loop;
  return jsonb_build_object('ok', true);
end; $$;

create or replace function portal_guardar_mensajes(p_codigo text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_item jsonb; v_orden int := 0;
begin
  select id into v_id from eventos where codigo_portal = p_codigo;
  if v_id is null then return jsonb_build_object('error', 'codigo_invalido'); end if;

  delete from mensajes where evento_id = v_id;
  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into mensajes (evento_id, texto, referencia, orden)
    values (v_id, v_item->>'texto', v_item->>'referencia', v_orden);
    v_orden := v_orden + 1;
  end loop;
  return jsonb_build_object('ok', true);
end; $$;

-- ----------------------------------------------------------------------------
-- 4. RSVP Premium — recibe la lista de nombres, genera identificadores únicos,
--    reemplaza la lista anterior, y devuelve nombre+link para armar el Excel.
--    El archivo Excel en sí NUNCA se guarda — solo esta lista ligera.
-- ----------------------------------------------------------------------------
create or replace function portal_generar_links_invitados(p_codigo text, p_nombres text[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_evento eventos%rowtype;
  v_nombre text;
  v_identificador text;
  v_resultado jsonb := '[]'::jsonb;
begin
  select * into v_evento from eventos where codigo_portal = p_codigo;
  if not found then return jsonb_build_object('error', 'codigo_invalido'); end if;

  delete from invitados where evento_id = v_evento.id;

  foreach v_nombre in array p_nombres loop
    v_identificador := generar_identificador_invitado(v_nombre);
    insert into invitados (evento_id, nombre, identificador_publico)
    values (v_evento.id, v_nombre, v_identificador);
    v_resultado := v_resultado || jsonb_build_object(
      'nombre', v_nombre,
      'link', 'https://tubodahn.com/invitacion/' || v_evento.slug_publico || '?id=' || v_identificador
    );
  end loop;

  return jsonb_build_object('ok', true, 'invitados', v_resultado);
end;
$$;

-- Validar si un identificador de invitado es válido para un evento (lo usa
-- la invitación pública cuando el evento tiene RSVP Premium activado)
create or replace function validar_identificador_invitado(p_slug text, p_identificador text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_existe boolean;
begin
  select exists(
    select 1 from invitados i
    join eventos e on e.id = i.evento_id
    where e.slug_publico = p_slug and i.identificador_publico = p_identificador
  ) into v_existe;
  return v_existe;
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. Marcar formulario como completo (dispara notificación al admin)
-- ----------------------------------------------------------------------------
create or replace function portal_marcar_completo(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_evento eventos%rowtype;
  v_estado_revision uuid;
begin
  select * into v_evento from eventos where codigo_portal = p_codigo;
  if not found then return jsonb_build_object('error', 'codigo_invalido'); end if;

  select id into v_estado_revision from estados where nombre = 'En Revisión';

  update eventos set estado_id = v_estado_revision where id = v_evento.id;

  insert into notificaciones (evento_id, tipo, mensaje)
  values (v_evento.id, 'formulario_completo', coalesce(v_evento.nombre_evento, 'Un cliente') || ' terminó de llenar su información.');

  return jsonb_build_object('ok', true);
end;
$$;

-- Fin de la migración 0002
