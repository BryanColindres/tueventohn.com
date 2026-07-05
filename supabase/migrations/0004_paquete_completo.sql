-- ============================================================================
-- TUBODA PLATFORM — PAQUETE COMPLETO (v2 del CONFIG)
-- Agrega los campos y módulos nuevos SIN romper nada de lo que ya existe.
-- ============================================================================

-- ---- Quitar "Dominio propio" (ya no se va a vender) ----
delete from paquete_modulo where modulo_id in (select id from modulos where slug = 'dominio');
delete from modulos where slug = 'dominio';

-- ---- Nuevos módulos ----
insert into modulos (nombre, slug, descripcion, precio, categoria) values
  ('Música de fondo', 'musica', 'Canción de fondo durante toda la invitación', 0, 'contenido'),
  ('Detalles importantes', 'detalles', 'Tarjetas de hora de llegada, solo adultos, etc.', 150, 'contenido'),
  ('Mesa de regalos', 'regalos', 'Sección de regalos con datos de cuenta opcionales', 200, 'contenido'),
  ('Código de vestimenta', 'vestimenta', 'Texto + botón de referencias de vestimenta', 150, 'contenido'),
  ('Mensaje personalizado', 'mensaje_personalizado', 'Video o audio dirigido a cada invitado (requiere RSVP Premium)', 400, 'interactivo'),
  ('Video dentro de la invitación', 'video_interno', 'Un video con una frase, embebido en el cuerpo de la invitación', 500, 'multimedia');

-- ---- Nuevas columnas en eventos ----
alter table eventos add column if not exists musica_url text;

alter table eventos add column if not exists lugar_foto_url text;
alter table eventos add column if not exists lugar_waze_url text;

alter table eventos add column if not exists detalles_importantes jsonb not null default '[]';
-- formato: [{ "icono": "reloj", "titulo": "Hora de llegada", "texto": "..." }, ...]

alter table eventos add column if not exists regalos_texto text;
alter table eventos add column if not exists regalos_cuenta_texto text; -- se muestra solo al tocar el botón "más detalles"

alter table eventos add column if not exists vestimenta_texto text;
alter table eventos add column if not exists vestimenta_boton_url text; -- link a Pinterest/galería de referencias

alter table eventos add column if not exists mensaje_personalizado_tipo text; -- 'video' | 'audio'
alter table eventos add column if not exists mensaje_personalizado_url text;

alter table eventos add column if not exists video_interno_url text;
alter table eventos add column if not exists video_interno_frase text;

alter table eventos add column if not exists rsvp_foto_url text;   -- foto de fondo en la sección de confirmación
alter table eventos add column if not exists firmas_foto_url text; -- foto de fondo en libro de firmas

-- ---- Actualizar el CONFIG BUILDER para incluir todo lo nuevo ----
create or replace function get_event_config(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_evento eventos%rowtype;
  v_config jsonb;
begin
  select * into v_evento from eventos where slug_publico = p_slug and publicado = true;
  if not found then return null; end if;

  select jsonb_build_object(
    'eventoId', v_evento.id,
    'pareja', jsonb_build_object(
      'nombreA', v_evento.novio_a_nombre, 'nombreB', v_evento.novio_b_nombre,
      'apellidoA', v_evento.novio_a_apellido, 'apellidoB', v_evento.novio_b_apellido,
      'iniciales', left(coalesce(v_evento.novio_a_nombre,''),1) || '·' || left(coalesce(v_evento.novio_b_nombre,''),1)
    ),
    'fecha', v_evento.fecha,
    'fechaTexto', to_char(v_evento.fecha, 'FMDay, DD "de" FMMonth "de" YYYY'),
    'hora', v_evento.hora,
    'lugar', jsonb_build_object(
      'nombre', v_evento.lugar_nombre, 'direccion', v_evento.lugar_direccion,
      'mapsUrl', v_evento.lugar_maps_url, 'wazeUrl', v_evento.lugar_waze_url,
      'foto', v_evento.lugar_foto_url
    ),
    'tema', v_evento.tema,
    'colorAcento', v_evento.color_acento,
    'fotos', jsonb_build_object('hero', v_evento.foto_hero_url, 'footer', v_evento.foto_footer_url),
    'video', v_evento.video_intro_url,
    'musicaUrl', v_evento.musica_url,
    'whatsapp', jsonb_build_object('novio', v_evento.whatsapp_a, 'novia', v_evento.whatsapp_b),
    'publico', v_evento.publico,

    'detallesImportantes', coalesce(v_evento.detalles_importantes, '[]'::jsonb),
    'regalos', jsonb_build_object('texto', v_evento.regalos_texto, 'cuentaTexto', v_evento.regalos_cuenta_texto),
    'vestimenta', jsonb_build_object('texto', v_evento.vestimenta_texto, 'botonUrl', v_evento.vestimenta_boton_url),
    'mensajePersonalizado', jsonb_build_object('tipo', v_evento.mensaje_personalizado_tipo, 'url', v_evento.mensaje_personalizado_url),
    'videoInterno', jsonb_build_object('url', v_evento.video_interno_url, 'frase', v_evento.video_interno_frase),
    'rsvpFotoUrl', v_evento.rsvp_foto_url,
    'firmasFotoUrl', v_evento.firmas_foto_url,

    'modules', (
      select coalesce(jsonb_object_agg(m.slug, em.activo), '{}'::jsonb)
      from evento_modulo em join modulos m on m.id = em.modulo_id
      where em.evento_id = v_evento.id
    ),

    'historia', (select coalesce(jsonb_agg(jsonb_build_object('titulo', h.titulo, 'texto', h.descripcion, 'foto', h.imagen_url) order by h.orden), '[]'::jsonb) from historia h where h.evento_id = v_evento.id),
    'timeline', (select coalesce(jsonb_agg(jsonb_build_object('hora', t.hora, 'titulo', t.titulo) order by t.orden), '[]'::jsonb) from timeline t where t.evento_id = v_evento.id),
    'galeriaMuestra', (select coalesce(jsonb_agg(g.imagen_url order by g.orden), '[]'::jsonb) from galeria g where g.evento_id = v_evento.id),
    'mensajes', (select coalesce(jsonb_agg(jsonb_build_object('texto', ms.texto, 'referencia', ms.referencia) order by ms.orden), '[]'::jsonb) from mensajes ms where ms.evento_id = v_evento.id)

  ) into v_config;

  return v_config;
end;
$$;

-- ---- Función: obtener el nombre de un invitado a partir de su identificador
-- (para el banner "esta invitación es personal, enviada para: X" y para la
-- pantalla de mensaje personalizado) ----
create or replace function obtener_invitado(p_slug text, p_identificador text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitado jsonb;
begin
  select jsonb_build_object('nombre', i.nombre, 'confirmado', i.confirmado)
  into v_invitado
  from invitados i
  join eventos e on e.id = i.evento_id
  where e.slug_publico = p_slug and i.identificador_publico = p_identificador;

  if v_invitado is null then
    return jsonb_build_object('error', 'invitado_no_encontrado');
  end if;
  return v_invitado;
end;
$$;

-- Fin de la migración 0004
