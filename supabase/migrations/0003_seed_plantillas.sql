-- ============================================================================
-- TUBODA PLATFORM — CATÁLOGO DE PLANTILLAS
-- El catálogo público lee esta tabla directamente. Si agregas una plantilla
-- nueva más adelante, solo necesitas un INSERT aquí — nunca tocar catalogo/.
-- ============================================================================

insert into plantillas (nombre, slug, tipo_evento_id, descripcion, tagline, ruta_html, orden, estado)
select 'Elegante', 'elegante', te.id,
  'Crema, script y fotos con marco — minimalista y refinada.',
  'Crema, script y fotos con marco — minimalista y refinada',
  'templates/elegante/index.html', 1, 'activa'
from tipos_evento te where te.nombre = 'Boda';

insert into plantillas (nombre, slug, tipo_evento_id, descripcion, tagline, ruta_html, orden, estado)
select 'Señora Elegante', 'rojo', te.id,
  'Vino y rosa, tipografía formal, composición asimétrica.',
  'Vino y rosa, tipografía formal, composición asimétrica',
  'templates/rojo/index.html', 2, 'activa'
from tipos_evento te where te.nombre = 'Boda';

insert into plantillas (nombre, slug, tipo_evento_id, descripcion, tagline, ruta_html, orden, estado)
select 'Playa Kawaii', 'playa', te.id,
  'Turquesa y arena, navegación por capítulos, palmeras y sol.',
  'Turquesa y arena, navegación por capítulos, palmeras y sol',
  'templates/playa/index.html', 3, 'activa'
from tipos_evento te where te.nombre = 'Boda';

insert into plantillas (nombre, slug, tipo_evento_id, descripcion, tagline, ruta_html, orden, estado)
select 'Bosque Encantado', 'bosque', te.id,
  'Luciérnagas, luna y galería en carrusel infinito.',
  'Luciérnagas, luna y galería en carrusel infinito',
  'templates/bosque/index.html', 4, 'activa'
from tipos_evento te where te.nombre = 'Boda';

insert into plantillas (nombre, slug, tipo_evento_id, descripcion, tagline, ruta_html, orden, estado)
select 'Realeza', 'realeza', te.id,
  'Blanco y dorado, emblema con corona y laureles.',
  'Blanco y dorado, emblema con corona y laureles',
  'templates/realeza/index.html', 5, 'activa'
from tipos_evento te where te.nombre = 'Boda';

insert into plantillas (nombre, slug, tipo_evento_id, descripcion, tagline, ruta_html, orden, estado)
select 'Luces Cálidas', 'fiesta', te.id,
  'Noche con guirnalda de luces y sección para pedir canciones.',
  'Noche con guirnalda de luces y sección para pedir canciones',
  'templates/fiesta/index.html', 6, 'activa'
from tipos_evento te where te.nombre = 'Boda';

insert into plantillas (nombre, slug, tipo_evento_id, descripcion, tagline, ruta_html, orden, estado)
select 'Hotel de Lujo', 'hotelmarmol', te.id,
  'Mármol blanco, reservación tipo boarding pass, tiras de fotomatón.',
  'Mármol blanco, reservación tipo boarding pass, tiras de fotomatón',
  'templates/hotelmarmol/index.html', 7, 'activa'
from tipos_evento te where te.nombre = 'Boda';

insert into plantillas (nombre, slug, tipo_evento_id, descripcion, tagline, ruta_html, orden, estado)
select 'Retro Nostálgica', 'retro', te.id,
  'Postal antigua, Polaroids, carrete de película, carta con sello de cera.',
  'Postal antigua, Polaroids, carrete de película, carta con sello de cera',
  'templates/retro/index.html', 8, 'activa'
from tipos_evento te where te.nombre = 'Boda';

insert into plantillas (nombre, slug, tipo_evento_id, descripcion, tagline, ruta_html, orden, estado)
select 'Opuestos', 'opuestos', te.id,
  'Díptico editorial en blanco y negro, prosa tipo museo.',
  'Díptico editorial en blanco y negro, prosa tipo museo',
  'templates/opuestos/index.html', 9, 'activa'
from tipos_evento te where te.nombre = 'Boda';

insert into plantillas (nombre, slug, tipo_evento_id, descripcion, tagline, ruta_html, orden, estado)
select 'Mapa Celeste', 'celeste', te.id,
  'Astrolabio, constelación que serpentea, nebulosas de fondo.',
  'Astrolabio, constelación que serpentea, nebulosas de fondo',
  'templates/celeste/index.html', 10, 'activa'
from tipos_evento te where te.nombre = 'Boda';

insert into plantillas (nombre, slug, tipo_evento_id, descripcion, tagline, ruta_html, orden, estado)
select 'Pueblo Colonial', 'colonial', te.id,
  'Arcos, campanario, catedral de fondo, calle de puertas.',
  'Arcos, campanario, catedral de fondo, calle de puertas',
  'templates/colonial/index.html', 11, 'activa'
from tipos_evento te where te.nombre = 'Boda';

insert into plantillas (nombre, slug, tipo_evento_id, descripcion, tagline, ruta_html, orden, estado)
select 'Roatán', 'roatan', te.id,
  'Mapa del tesoro, tabla de mareas, suelta tu deseo al mar.',
  'Mapa del tesoro, tabla de mareas, suelta tu deseo al mar',
  'templates/roatan/index.html', 12, 'activa'
from tipos_evento te where te.nombre = 'Boda';

-- La plantilla "starter" NUNCA se inserta aquí: no es un producto, es la base
-- de desarrollo para crear plantillas nuevas.
