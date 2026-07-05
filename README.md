# TuBoda Platform

Plataforma de invitaciones digitales — arquitectura escalable basada en Supabase.

## Estructura del proyecto

```
tuboda-platform/
├── supabase/migrations/     → Scripts SQL (correr en orden en Supabase)
├── shared/js/backend.js     → Módulo de referencia (se copia dentro de cada plantilla)
├── templates/                → Las 12 plantillas + starter (base para plantillas nuevas)
│   ├── elegante/ ... roatan/  → Cada una 100% independiente (index.html, css/, js/)
│   └── starter/               → Punto de partida para crear una plantilla nueva
├── catalogo/                 → Sitio público que lista las plantillas (lee de Supabase)
├── admin/                    → Panel administrativo (login, invitaciones, wizard)
└── portal/                   → Portal del cliente (acceso por código, sin login)
```

## 1. Configurar Supabase (una sola vez)

1. Entra a tu proyecto → **SQL Editor** → *New query*.
2. Pega y ejecuta, **en este orden**:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_portal_functions.sql`
   - `supabase/migrations/0003_seed_plantillas.sql`
3. Crea tu usuario administrador: **Authentication → Users → Add user** (tu correo y una contraseña). Luego en **SQL Editor** corre:
   ```sql
   insert into perfiles_admin (id, nombre, rol)
   select id, 'Bryan', 'admin' from auth.users where email = 'tu-correo@ejemplo.com';
   ```
   (Sin este paso, el login del panel funcionará pero no tendrás permisos para editar nada — las políticas de RLS lo exigen.)

## 2. Configurar Cloudinary

Faltan tus credenciales reales en 3 lugares (busca `PEGAR_CLOUD_NAME` y `PEGAR_UPLOAD_PRESET`):
- `shared/js/backend.js` (y su copia dentro de cada `templates/*/js/backend.js`)
- `portal/js/app.js`

Recomendación: una sola cuenta de Cloudinary para toda la plataforma (no una por cliente), con las fotos organizadas por evento (`tuboda/{eventoId}/...`) — ya está armado así.

## 3. Subir a GitHub Pages

Sube esta carpeta completa a un repositorio y activa GitHub Pages (Settings → Pages → rama `main`, carpeta raíz). Con eso:

- Catálogo público: `tudominio.com/catalogo/`
- Panel admin: `tudominio.com/admin/`
- Portal cliente: `tudominio.com/portal/?codigo=XXXX`
- Una invitación real: `tudominio.com/templates/elegante/index.html?evento=bryan-stefany`
- Una plantilla en modo demo (sin `?evento=`): `tudominio.com/templates/elegante/index.html`

## 4. Probar una plantilla sin tener un evento real en Supabase

Cada plantilla, si abres su `index.html` **sin** `?evento=` en la URL, usa el `config-demo.js` que ya trae dentro (los mismos datos con los que las diseñamos). Así puedes revisar el diseño en cualquier momento sin necesidad de crear el evento en la base de datos primero.

## 5. Crear tu primera invitación real

1. Entra a `admin/`, inicia sesión.
2. "+ Nueva invitación" → sigue el asistente de 5 pasos.
3. Al terminar, te da el link del **Portal del Cliente** — se lo mandas al cliente (o lo llenas tú mismo si por ahora todo lo manejas tú).
4. El cliente (o tú) llena el Portal.
5. Vuelves al panel → esa invitación → pestaña Módulos, ajustas lo que haga falta → **Publicar**.
6. El link público (`templates/{plantilla}/index.html?evento={slug}`) ya está activo — sin compilar nada, sin hacer commit.

## Cosas que quedan pendientes (a propósito, para no sobre-construir de una vez)

- **Reportes avanzados** (plantilla más vendida, ingresos mensuales con gráficas) — el dashboard actual solo trae conteos básicos.
- **Gestión de clientes independiente** (todavía se edita desde dentro de cada evento).
- **Múltiples administradores con roles** — la tabla `perfiles_admin` ya lo soporta, falta la pantalla para gestionarlo.
- **Duplicar invitación** — mencionado en la nota técnica, no implementado todavía.
- **Notificaciones en tiempo real** (ahorita se ven en el dashboard, pero hay que refrescar la página).

Todo esto se puede ir agregando sin tocar el núcleo — es justo el punto de la arquitectura.
