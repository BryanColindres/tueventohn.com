# Sincronización con Google Sheets — guía de instalación

Esto conecta `invitados` (Supabase) con un Google Sheet por evento, usando la
cuenta `nubeeventos01@gmail.com`. Son pasos de configuración, no requieren
tocar código.

## 1. Crear credenciales de Google (una sola vez)

1. Entra a https://console.cloud.google.com con `nubeeventos01@gmail.com`.
2. Crea un proyecto nuevo (ej. "Nube Eventos").
3. **APIs y servicios → Biblioteca** → activa:
   - Google Sheets API
   - Google Drive API
4. **APIs y servicios → Pantalla de consentimiento OAuth**:
   - Tipo: Externo. Nombre de la app: "Nube Eventos". Correo: el mismo.
   - En "Alcances" no hace falta agregar nada todavía.
   - En "Usuarios de prueba" agrega `nubeeventos01@gmail.com`.
5. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente OAuth**:
   - Tipo de aplicación: **Aplicación web**.
   - En "URI de redirección autorizados" agrega:
     `https://developers.google.com/oauthplayground`
   - Guarda el **Client ID** y **Client Secret** — los vas a necesitar abajo.

## 2. Obtener el refresh token de nubeeventos01@gmail.com

1. Ve a https://developers.google.com/oauthplayground
2. Clic en el engranaje (⚙️, arriba a la derecha) → marca **"Use your own
   OAuth credentials"** → pega el Client ID y Client Secret del paso anterior.
3. En la lista de la izquierda, busca **Google Sheets API v4** y
   **Drive API v3**, y selecciona estos dos scopes:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.file`
4. Clic en **"Authorize APIs"** → inicia sesión con `nubeeventos01@gmail.com`
   → acepta.
5. Clic en **"Exchange authorization code for tokens"**.
6. Copia el **Refresh token** que aparece — es el único que necesitas guardar
   (el access token expira en 1 hora y la función lo renueva sola).

`drive.file` (en vez de acceso completo a Drive) es a propósito: solo le da
permiso sobre los archivos que la propia app crea, no sobre todo tu Drive.

## 3. Guardar los secretos en Supabase

Con el CLI de Supabase instalado y logueado (`supabase login`) desde la raíz
del proyecto:

```bash
supabase secrets set GOOGLE_CLIENT_ID="tu-client-id"
supabase secrets set GOOGLE_CLIENT_SECRET="tu-client-secret"
supabase secrets set GOOGLE_REFRESH_TOKEN="el-refresh-token-del-paso-2"
```

## 4. Desplegar la función

```bash
supabase functions deploy sheets-sync
```

## 5. Conectar el disparador automático

Dashboard de Supabase → **Database → Webhooks → Create a new hook**:

- Nombre: `sync-invitados-a-sheets`
- Tabla: `invitados`
- Eventos: `Insert`, `Update`, `Delete`
- Tipo: `Supabase Edge Functions`
- Función: `sheets-sync`

Con esto, cada vez que se agregue, edite o borre un invitado, el Sheet del
evento se actualiza solo — sin que el panel tenga que llamar nada a mano.

## 6. Probar

```sql
insert into invitados (evento_id, codigo, nombre, familia)
values ('<uuid-de-un-evento-real>', 'TEST-01', 'Invitado de Prueba', 'Prueba');
```

Revisa en unos segundos: la fila `eventos.google_sheet_url` de ese evento
debería llenarse, y al abrirla debería existir la hoja con el invitado.

## Si algo falla

La función nunca deja caer la escritura en Supabase por un error de Google
(por ejemplo, si Google está caído). En vez de eso, registra el problema en
la tabla `sync_errors` con el detalle, y lo intenta de nuevo automáticamente
la próxima vez que algo cambie en `invitados`. El panel puede leer esa tabla
para mostrar un aviso tipo *"no se pudo sincronizar con Google Sheets,
reintentando"* en vez de fallar en silencio o mostrarle al cliente un error
técnico.

Para forzar un reintento manual (por ejemplo, desde un botón en el panel
admin), llama la función directamente:

```js
fetch('https://<tu-proyecto>.supabase.co/functions/v1/sheets-sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
  body: JSON.stringify({ evento_id: '...' })
});
```
