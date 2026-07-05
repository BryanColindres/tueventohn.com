-- ============================================================================
-- TUBODA PLATFORM — MIGRACIÓN INICIAL
-- Ejecutar completo en: Supabase Dashboard → SQL Editor → New query → Run
-- (No requiere supabase CLI para esta primera vez)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. CATÁLOGOS BASE
-- ============================================================================

create table tipos_evento (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null unique,
  icono         text,
  color         text,
  activo        boolean not null default true,
  orden         int not null default 0,
  created_at    timestamptz not null default now()
);

create table estados (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null unique,
  color         text,
  orden         int not null default 0,
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- 2. CLIENTES
-- ============================================================================

create table clientes (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  correo        text,
  telefono      text,
  estado        text not null default 'activo',
  notas         text,
  estado_pago   text not null default 'pendiente',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_clientes_telefono on clientes(telefono);
create index idx_clientes_correo on clientes(correo);

-- ============================================================================
-- 3. PLANTILLAS, PAQUETES Y MÓDULOS
-- ============================================================================

create table plantillas (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  slug            text not null unique,
  tipo_evento_id  uuid references tipos_evento(id),
  version         text not null default '1.0',
  estado          text not null default 'activa',
  descripcion     text,
  tagline         text,
  imagen_preview  text,
  ruta_html       text,
  orden           int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table paquetes (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null unique,
  precio        numeric(10,2) not null,
  descripcion   text,
  orden         int not null default 0,
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table modulos (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null unique,
  slug          text not null unique,
  descripcion   text,
  precio        numeric(10,2) not null default 0,
  categoria     text,
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table paquete_modulo (
  id            uuid primary key default gen_random_uuid(),
  paquete_id    uuid not null references paquetes(id) on delete cascade,
  modulo_id     uuid not null references modulos(id) on delete cascade,
  unique(paquete_id, modulo_id)
);

-- ============================================================================
-- 4. EVENTOS
-- ============================================================================

create table eventos (
  id                uuid primary key default gen_random_uuid(),

  tipo_evento_id    uuid not null references tipos_evento(id),
  plantilla_id      uuid not null references plantillas(id),
  cliente_id        uuid not null references clientes(id),
  paquete_id        uuid not null references paquetes(id),
  estado_id         uuid not null references estados(id),

  slug_publico      text not null unique,
  codigo_portal     text not null unique,

  nombre_evento     text,

  -- campos específicos de boda (opcionales — nunca rompen otros tipos de evento)
  novio_a_nombre    text,
  novio_a_apellido  text,
  novio_b_nombre    text,
  novio_b_apellido  text,
  whatsapp_a        text,
  whatsapp_b        text,

  fecha             date,
  hora              time,
  lugar_nombre      text,
  lugar_direccion   text,
  lugar_maps_url    text,
  tema              text,
  color_acento      text,

  foto_hero_url     text,
  foto_footer_url   text,
  video_intro_url   text,

  publicado         boolean not null default false,
  publico           boolean not null default true,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_eventos_cliente on eventos(cliente_id);
create index idx_eventos_estado on eventos(estado_id);
create index idx_eventos_slug on eventos(slug_publico);
create index idx_eventos_codigo_portal on eventos(codigo_portal);

create table evento_modulo (
  id            uuid primary key default gen_random_uuid(),
  evento_id     uuid not null references eventos(id) on delete cascade,
  modulo_id     uuid not null references modulos(id) on delete cascade,
  activo        boolean not null default true,
  activado_en   timestamptz not null default now(),
  activado_por  uuid,
  unique(evento_id, modulo_id)
);

create table solicitudes (
  id            uuid primary key default gen_random_uuid(),
  evento_id     uuid not null references eventos(id) on delete cascade,
  modulo_id     uuid not null references modulos(id),
  fecha         timestamptz not null default now(),
  estado        text not null default 'pendiente',
  observacion   text,
  resuelto_por  uuid,
  resuelto_en   timestamptz
);

create index idx_solicitudes_evento on solicitudes(evento_id);
create index idx_solicitudes_estado on solicitudes(estado);

-- ============================================================================
-- 5. CONTENIDO DEL EVENTO
-- ============================================================================

create table historia (
  id            uuid primary key default gen_random_uuid(),
  evento_id     uuid not null references eventos(id) on delete cascade,
  titulo        text,
  descripcion   text,
  imagen_url    text,
  orden         int not null default 0
);

create table timeline (
  id            uuid primary key default gen_random_uuid(),
  evento_id     uuid not null references eventos(id) on delete cascade,
  hora          text,
  titulo        text not null,
  nivel         int default 3,
  orden         int not null default 0
);

create table galeria (
  id            uuid primary key default gen_random_uuid(),
  evento_id     uuid not null references eventos(id) on delete cascade,
  imagen_url    text not null,
  subido_por    text,
  orden         int not null default 0,
  created_at    timestamptz not null default now()
);

create table mensajes (
  id            uuid primary key default gen_random_uuid(),
  evento_id     uuid not null references eventos(id) on delete cascade,
  texto         text not null,
  referencia    text,
  orden         int not null default 0
);

-- ============================================================================
-- 6. INVITADOS, LIBRO DE FIRMAS Y CANCIONES (contenido generado por invitados)
-- ============================================================================

create table invitados (
  id                    uuid primary key default gen_random_uuid(),
  evento_id             uuid not null references eventos(id) on delete cascade,
  nombre                text not null,
  identificador_publico text unique,
  mesa                  text,
  adultos               int default 1,
  ninos                 int default 0,
  confirmado            boolean,
  observaciones         text,
  fecha_confirmacion    timestamptz,
  created_at            timestamptz not null default now()
);

create index idx_invitados_evento on invitados(evento_id);

create table firmas (
  id            uuid primary key default gen_random_uuid(),
  evento_id     uuid not null references eventos(id) on delete cascade,
  invitado_id   uuid references invitados(id),
  nombre        text not null,
  mensaje       text not null,
  fecha         timestamptz not null default now()
);

create index idx_firmas_evento on firmas(evento_id);

-- Solicitudes de canción (módulo usado por la plantilla "Luces Cálidas")
create table canciones (
  id            uuid primary key default gen_random_uuid(),
  evento_id     uuid not null references eventos(id) on delete cascade,
  nombre        text not null,
  cancion       text not null,
  fecha         timestamptz not null default now()
);

create index idx_canciones_evento on canciones(evento_id);

-- ============================================================================
-- 7. PUBLICACIÓN Y VERSIONES
-- ============================================================================

create table versiones (
  id            uuid primary key default gen_random_uuid(),
  evento_id     uuid not null references eventos(id) on delete cascade,
  numero        int not null,
  comentario    text,
  snapshot      jsonb not null,
  creado_por    uuid,
  fecha         timestamptz not null default now()
);

create index idx_versiones_evento on versiones(evento_id, numero desc);

create table publicaciones (
  id              uuid primary key default gen_random_uuid(),
  evento_id       uuid not null references eventos(id) on delete cascade,
  version_id      uuid references versiones(id),
  fecha           timestamptz not null default now(),
  publicado_por   uuid,
  estado          text not null default 'activa'
);

-- ============================================================================
-- 8. AUDITORÍA Y NOTIFICACIONES
-- ============================================================================

create table logs (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid,
  accion          text not null,
  tabla           text not null,
  registro_id     uuid,
  valor_anterior  jsonb,
  valor_nuevo     jsonb,
  fecha           timestamptz not null default now()
);

create index idx_logs_tabla_registro on logs(tabla, registro_id);
create index idx_logs_usuario on logs(usuario_id);

create table notificaciones (
  id            uuid primary key default gen_random_uuid(),
  evento_id     uuid references eventos(id) on delete cascade,
  tipo          text not null,
  mensaje       text not null,
  leida         boolean not null default false,
  fecha         timestamptz not null default now()
);

create index idx_notificaciones_leida on notificaciones(leida);

-- ============================================================================
-- 9. CONFIGURACIÓN GLOBAL
-- ============================================================================

create table configuracion_global (
  clave         text primary key,
  valor         jsonb not null,
  actualizado_en timestamptz not null default now()
);

insert into configuracion_global (clave, valor) values
  ('empresa_nombre', '"TuBoda Platform"'),
  ('whatsapp', '"50431626792"'),
  ('correo', '"contacto@tubodahn.com"'),
  ('redes_sociales', '{"instagram":"", "facebook":"", "tiktok":""}'),
  ('moneda', '"HNL"'),
  ('idioma', '"es"'),
  ('zona_horaria', '"America/Tegucigalpa"'),
  ('cloudinary_cloud_name', '"PEGAR_CLOUD_NAME"'),
  ('cloudinary_upload_preset', '"PEGAR_UPLOAD_PRESET"');

-- ============================================================================
-- 10. PERFILES DE ADMINISTRADOR
-- ============================================================================

create table perfiles_admin (
  id            uuid primary key references auth.users(id) on delete cascade,
  nombre        text,
  rol           text not null default 'admin',
  permisos      jsonb not null default '{}',
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- 11. FUNCIÓN: CONFIG BUILDER — arma window.CONFIG en una sola llamada
-- ============================================================================

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

  if not found then
    return null;
  end if;

  select jsonb_build_object(
    'eventoId', v_evento.id,
    'pareja', jsonb_build_object(
      'nombreA', v_evento.novio_a_nombre,
      'nombreB', v_evento.novio_b_nombre,
      'apellidoA', v_evento.novio_a_apellido,
      'apellidoB', v_evento.novio_b_apellido,
      'iniciales', left(coalesce(v_evento.novio_a_nombre,''),1) || '·' || left(coalesce(v_evento.novio_b_nombre,''),1)
    ),
    'fecha', v_evento.fecha,
    'fechaTexto', to_char(v_evento.fecha, 'FMDay, DD "de" FMMonth "de" YYYY'),
    'hora', v_evento.hora,
    'lugar', jsonb_build_object(
      'nombre', v_evento.lugar_nombre,
      'direccion', v_evento.lugar_direccion,
      'mapsUrl', v_evento.lugar_maps_url
    ),
    'tema', v_evento.tema,
    'colorAcento', v_evento.color_acento,
    'fotos', jsonb_build_object('hero', v_evento.foto_hero_url, 'footer', v_evento.foto_footer_url),
    'video', v_evento.video_intro_url,
    'whatsapp', jsonb_build_object('novio', v_evento.whatsapp_a, 'novia', v_evento.whatsapp_b),
    'publico', v_evento.publico,

    'modules', (
      select coalesce(jsonb_object_agg(m.slug, em.activo), '{}'::jsonb)
      from evento_modulo em
      join modulos m on m.id = em.modulo_id
      where em.evento_id = v_evento.id
    ),

    'historia', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'titulo', h.titulo, 'texto', h.descripcion, 'foto', h.imagen_url
      ) order by h.orden), '[]'::jsonb)
      from historia h where h.evento_id = v_evento.id
    ),

    'timeline', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'hora', t.hora, 'titulo', t.titulo, 'nivel', t.nivel
      ) order by t.orden), '[]'::jsonb)
      from timeline t where t.evento_id = v_evento.id
    ),

    'galeriaMuestra', (
      select coalesce(jsonb_agg(g.imagen_url order by g.orden), '[]'::jsonb)
      from galeria g where g.evento_id = v_evento.id
    ),

    'mensajes', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'texto', ms.texto, 'referencia', ms.referencia
      ) order by ms.orden), '[]'::jsonb)
      from mensajes ms where ms.evento_id = v_evento.id
    )

  ) into v_config;

  return v_config;
end;
$$;

-- ============================================================================
-- 12. FUNCIÓN AUXILIAR: identificador único de invitado (RSVP Premium)
-- ============================================================================

create or replace function generar_identificador_invitado(p_nombre text)
returns text
language plpgsql
as $$
declare
  v_base text;
  v_sufijo text;
begin
  v_base := lower(regexp_replace(unaccent(p_nombre), '[^a-zA-Z0-9]+', '-', 'g'));
  v_base := trim(both '-' from v_base);
  v_sufijo := substr(md5(random()::text || clock_timestamp()::text), 1, 4);
  return v_base || '-' || v_sufijo;
end;
$$;

-- ============================================================================
-- 13. ROW LEVEL SECURITY
-- ============================================================================

alter table eventos enable row level security;
alter table clientes enable row level security;
alter table historia enable row level security;
alter table timeline enable row level security;
alter table galeria enable row level security;
alter table mensajes enable row level security;
alter table invitados enable row level security;
alter table firmas enable row level security;
alter table canciones enable row level security;
alter table solicitudes enable row level security;
alter table logs enable row level security;
alter table notificaciones enable row level security;

-- Lectura pública solo de eventos publicados (usada por get_event_config vía SECURITY DEFINER,
-- pero se deja también por si se consulta la tabla directamente)
create policy "eventos publicados son consultables"
  on eventos for select
  using (publicado = true);

-- Firmas: lectura y escritura pública, pero solo para eventos publicados
create policy "lectura publica de firmas de eventos publicados"
  on firmas for select
  using (exists (select 1 from eventos e where e.id = firmas.evento_id and e.publicado = true));

create policy "invitados pueden firmar en eventos publicados"
  on firmas for insert
  with check (exists (select 1 from eventos e where e.id = firmas.evento_id and e.publicado = true));

-- Galería: mismo patrón
create policy "lectura publica de galeria de eventos publicados"
  on galeria for select
  using (exists (select 1 from eventos e where e.id = galeria.evento_id and e.publicado = true));

create policy "invitados pueden subir fotos en eventos publicados"
  on galeria for insert
  with check (exists (select 1 from eventos e where e.id = galeria.evento_id and e.publicado = true));

-- Canciones: mismo patrón
create policy "lectura publica de canciones de eventos publicados"
  on canciones for select
  using (exists (select 1 from eventos e where e.id = canciones.evento_id and e.publicado = true));

create policy "invitados pueden pedir canciones en eventos publicados"
  on canciones for insert
  with check (exists (select 1 from eventos e where e.id = canciones.evento_id and e.publicado = true));

-- Plantillas y catálogo: lectura pública total (para el catálogo público)
alter table plantillas enable row level security;
create policy "plantillas activas son publicas" on plantillas for select using (estado = 'activa');

alter table paquetes enable row level security;
create policy "paquetes son publicos" on paquetes for select using (activo = true);

alter table modulos enable row level security;
create policy "modulos son publicos" on modulos for select using (true);

alter table paquete_modulo enable row level security;
create policy "paquete_modulo es publico" on paquete_modulo for select using (true);

-- Administradores: acceso total (ajustar tabla por tabla si se requiere más granularidad)
create policy "admins acceso total eventos" on eventos for all
  using (exists (select 1 from perfiles_admin where id = auth.uid() and activo = true));
create policy "admins acceso total clientes" on clientes for all
  using (exists (select 1 from perfiles_admin where id = auth.uid() and activo = true));
create policy "admins acceso total historia" on historia for all
  using (exists (select 1 from perfiles_admin where id = auth.uid() and activo = true));
create policy "admins acceso total timeline" on timeline for all
  using (exists (select 1 from perfiles_admin where id = auth.uid() and activo = true));
create policy "admins acceso total galeria" on galeria for all
  using (exists (select 1 from perfiles_admin where id = auth.uid() and activo = true));
create policy "admins acceso total mensajes" on mensajes for all
  using (exists (select 1 from perfiles_admin where id = auth.uid() and activo = true));
create policy "admins acceso total invitados" on invitados for all
  using (exists (select 1 from perfiles_admin where id = auth.uid() and activo = true));
create policy "admins acceso total firmas" on firmas for all
  using (exists (select 1 from perfiles_admin where id = auth.uid() and activo = true));
create policy "admins acceso total canciones" on canciones for all
  using (exists (select 1 from perfiles_admin where id = auth.uid() and activo = true));
create policy "admins acceso total solicitudes" on solicitudes for all
  using (exists (select 1 from perfiles_admin where id = auth.uid() and activo = true));
create policy "admins acceso total logs" on logs for all
  using (exists (select 1 from perfiles_admin where id = auth.uid() and activo = true));
create policy "admins acceso total notificaciones" on notificaciones for all
  using (exists (select 1 from perfiles_admin where id = auth.uid() and activo = true));
create policy "admins acceso total plantillas" on plantillas for all
  using (exists (select 1 from perfiles_admin where id = auth.uid() and activo = true));
create policy "admins acceso total paquetes" on paquetes for all
  using (exists (select 1 from perfiles_admin where id = auth.uid() and activo = true));
create policy "admins acceso total modulos" on modulos for all
  using (exists (select 1 from perfiles_admin where id = auth.uid() and activo = true));

-- IMPORTANTE: el portal del cliente (sin login de Supabase Auth) no puede
-- usar estas políticas de admin. El acceso del portal se resuelve mediante
-- funciones RPC con SECURITY DEFINER que validan el codigo_portal manualmente
-- (ver 0002_portal_functions.sql).

-- ============================================================================
-- 14. TRIGGERS: updated_at automático
-- ============================================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_clientes_updated before update on clientes
  for each row execute function set_updated_at();
create trigger trg_eventos_updated before update on eventos
  for each row execute function set_updated_at();
create trigger trg_plantillas_updated before update on plantillas
  for each row execute function set_updated_at();

-- ============================================================================
-- 15. DATOS INICIALES
-- ============================================================================

insert into tipos_evento (nombre, icono, color, orden) values
  ('Boda', 'heart', '#C9A25A', 1);

insert into estados (nombre, color, orden) values
  ('Esperando Información', '#9CA3AF', 1),
  ('Información Incompleta', '#F59E0B', 2),
  ('En Revisión', '#3B82F6', 3),
  ('Lista para Publicar', '#8B5CF6', 4),
  ('Publicada', '#10B981', 5),
  ('Archivada', '#6B7280', 6);

insert into paquetes (nombre, precio, descripcion, orden) values
  ('Básico', 2500, 'Plantilla + música + countdown + RSVP + mapa', 1),
  ('Estándar', 3300, 'Todo lo Básico + historia + itinerario + galería', 2),
  ('Premium', 4200, 'Todo lo Estándar + libro de firmas + video + dominio propio', 3);

insert into modulos (nombre, slug, descripcion, precio, categoria) values
  ('Cuenta regresiva', 'countdown', 'Contador hacia la fecha del evento', 0, 'contenido'),
  ('Historia', 'historia', 'Historia de la pareja con fotos', 300, 'contenido'),
  ('Itinerario', 'timeline', 'Programa del evento', 300, 'contenido'),
  ('Galería', 'galeria', 'Fotos subidas por invitados', 0, 'interactivo'),
  ('Libro de firmas', 'firmas', 'Mensajes de los invitados', 500, 'interactivo'),
  ('RSVP', 'rsvp', 'Confirmación de asistencia', 0, 'interactivo'),
  ('RSVP Premium', 'rsvp_premium', 'Links únicos por invitado vía Excel', 600, 'interactivo'),
  ('Video de apertura', 'video', 'Video personalizado en la apertura', 800, 'multimedia'),
  ('Pedir canción', 'cancion', 'Los invitados piden canciones al DJ', 200, 'interactivo'),
  ('Mapa', 'mapa', 'Ubicación con link a Google Maps', 0, 'contenido'),
  ('Dominio propio', 'dominio', 'Dominio .com propio en vez de subdominio', 350, 'contenido');

-- vincular módulos base a cada paquete
insert into paquete_modulo (paquete_id, modulo_id)
select p.id, m.id from paquetes p, modulos m
where p.nombre = 'Básico' and m.slug in ('countdown','rsvp','mapa');

insert into paquete_modulo (paquete_id, modulo_id)
select p.id, m.id from paquetes p, modulos m
where p.nombre = 'Estándar' and m.slug in ('countdown','rsvp','mapa','historia','timeline','galeria');

insert into paquete_modulo (paquete_id, modulo_id)
select p.id, m.id from paquetes p, modulos m
where p.nombre = 'Premium' and m.slug in ('countdown','rsvp','mapa','historia','timeline','galeria','firmas','video','dominio');

-- Fin de la migración 0001
