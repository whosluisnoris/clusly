# Base de datos (Supabase / Postgres)

Proyecto Supabase: `platzi-live` (`ozkmxovmdognljtsvhrl`).

## Tabla `streams` — histórico de lives

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | Autogenerado |
| `video_id` | text (único) | ID de YouTube (11 caracteres) |
| `title` | text | Título del video |
| `channel_title` | text | Canal (default `Platzi`) |
| `added_at` | timestamptz | Cuándo lo detectó/guardó la plataforma |
| `published_at` | timestamptz | Fecha de publicación según YouTube |
| `live_started_at` | timestamptz | **Inicio real de la transmisión** (fecha principal para mostrar/ordenar) |
| `live_ended_at` | timestamptz | Fin de la transmisión (`null` mientras siga en vivo) |
| `is_live` | boolean | `true` mientras el live está activo |
| `thumbnail_url` | text | Miniatura (`i.ytimg.com/vi/<id>/maxresdefault.jpg`) |
| `enriched_at` | timestamptz | Cuándo se scrapearon los metadatos (`null` = pendiente de auto-reparación) |
| `duration_seconds` | integer | Duración del video (`null` mientras el live sigue activo; se captura al terminar) |

> ¿Por qué `live_started_at` y no `published_at`? Los lives se programan con antelación:
> hay casos reales donde `published_at` es semanas anterior (o incluso posterior) al live.
> `live_started_at` refleja cuándo ocurrió de verdad.

## Tabla `watch_events` — analítica anónima

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | Autogenerado |
| `video_id` | text | Video sobre el que ocurrió el evento |
| `event_type` | text | `play` \| `open_youtube` \| `autoplay_default` (CHECK en DB) |
| `session_id` | text | UUID anónimo del navegador (localStorage), puede ser `null` |
| `created_at` | timestamptz | Momento del evento |

Índice: `(video_id, created_at)`.

## Tabla `feedback_votes` — encuesta de la plataforma

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | Autogenerado |
| `question_id` | text | Pregunta (hoy: `live_platform_v1`) |
| `answer` | text | `si` \| `puede_mejorar` \| `no` (CHECK en DB) |
| `session_id` | text | Misma sesión anónima de la analítica |
| `comment` | text | Comentario opcional (máx. 500 caracteres, solo visible en /admin) |
| `created_at` | timestamptz | Momento del voto |

`UNIQUE (question_id, session_id)`: un voto por sesión; volver a votar **actualiza** la
respuesta (upsert). Si el navegador bloquea localStorage, el voto entra sin sesión (los
`NULL` no chocan con la restricción). RLS activo sin políticas públicas, igual que
`watch_events`.

## Catálogo de recursos (IA/Datos)

El pivot a centro de recursos añade cuatro tablas nuevas (todas aditivas, sin tocar
`streams`/`watch_events`/`feedback_votes`). Detalle completo en
[07-catalogo-de-recursos.md](07-catalogo-de-recursos.md).

### Tabla `categories` — taxonomía extensible

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | Autogenerado |
| `slug` | text (único) | Identificador en la URL (`ia`, `agentes`, `datos`) |
| `name` | text | Etiqueta visible ("IA") |
| `description` | text | Opcional, para landing y encabezado de la pestaña |
| `sort_order` | integer | Orden de las pestañas (editable en `/admin`) |
| `is_active` | boolean | Ocultar sin borrar (default `true`) |
| `color` | text | Color predominante (hex, p. ej. `#FB62F6`); la UI cae al acento si es `null` |
| `created_at` | timestamptz | |

> "Platzi Lives" y "Todo" **no** son filas de esta tabla: son pestañas fijas en código.

### Tabla `resources` — video suelto o playlist

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | Autogenerado |
| `kind` | text | `video` \| `playlist` (CHECK en DB) |
| `youtube_id` | text | ID de video (11) o de playlist (`PL…`) |
| `title` | text | Título del recurso |
| `channel_title` | text | Canal o curador |
| `description` | text | Opcional |
| `thumbnail_url` | text | Miniatura |
| `video_count` | integer | Solo `kind='playlist'`: nº de videos importados |
| `duration_seconds` | integer | Solo `kind='video'` |
| `published_at` | timestamptz | Fecha de publicación (videos) |
| `added_at` | timestamptz | Cuándo se curó en la plataforma |
| `synced_at` | timestamptz | Última importación/resync exitosa |
| `source` | text | `manual` \| `playlist_import` (CHECK en DB) |

`UNIQUE (kind, youtube_id)`: evita duplicar el mismo recurso.

### Tabla `playlist_items` — videos ordenados de una playlist

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | Autogenerado |
| `playlist_resource_id` | uuid (FK → `resources`, ON DELETE CASCADE) | Playlist dueña |
| `position` | integer | Orden dentro de la playlist |
| `youtube_video_id` | text | ID del video |
| `title` | text | Título del video |
| `thumbnail_url` | text | Miniatura |
| `added_at` | timestamptz | |

`UNIQUE (playlist_resource_id, youtube_video_id)` + índice `(playlist_resource_id, position)`.

### Tabla `resource_categories` — relación N:N

| Columna | Tipo | Descripción |
|---|---|---|
| `resource_id` | uuid (FK → `resources`, ON DELETE CASCADE) | |
| `category_id` | uuid (FK → `categories`, ON DELETE CASCADE) | |
| `created_at` | timestamptz | |

PK `(resource_id, category_id)` + índice adicional en `category_id`. Un recurso puede
pertenecer a varias categorías.

## Cuentas, envíos y votación

Cuentas con **Supabase Auth** (email + contraseña, confirmación por correo). Detalle
de puesta en marcha en [08-cuentas-votacion-setup.md](08-cuentas-votacion-setup.md).

### Tabla `profiles` — perfil y rol por usuario

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK, FK → `auth.users`, ON DELETE CASCADE) | Mismo id que la cuenta |
| `display_name` | text | Nombre visible (de los metadatos del registro; máx. 60) |
| `role` | text | `owner` \| `admin` \| `user` (CHECK en DB, default `user`) |
| `bio` | text | Biografía del perfil (máx. 300) |
| `location` | text | Ubicación libre (máx. 80) |
| `links` | jsonb | Arreglo de `{label, url}` (máx. 6), solo http/https |
| `updated_at` | timestamptz | Última edición del perfil |
| `created_at` | timestamptz | |

Se crea sola al registrarse (trigger `on_auth_user_created` → `handle_new_user`). El
rol define el acceso al panel: `owner` y `admin` son "staff" (`isStaff()` en
`src/lib/auth.ts`). **Nadie puede auto-asignarse un rol**: se revocó el `UPDATE` de la
columna `role` a `anon`/`authenticated`; solo el service role (servidor) la cambia.

Los campos del perfil (`bio`, `location`, `links`) se editan en `/perfil` vía
`PATCH /api/profile`. Como la política `profiles self update` permite además editar la
fila desde el navegador, los topes de tamaño viven **también en la base** (CHECKs) y los
enlaces se validan dos veces: al guardar y al pintarlos (solo `http`/`https`, nunca
`javascript:`). El nombre visible se escribe en `profiles.display_name` **y** en los
metadatos de la cuenta, que es de donde lo lee `getCurrentUser`.

### Nuevas columnas en `resources`

| Columna | Tipo | Descripción |
|---|---|---|
| `submitted_by` | uuid (FK → `auth.users`, ON DELETE SET NULL) | Quién aportó el recurso (`null` = curado por el equipo o aporte sin cuenta) |
| `submitted_session` | text | Sesión anónima que mandó un aporte sin cuenta (solo para el antiflood) |
| `status` | text | `published` \| `pending` \| `hidden` (CHECK; default `published`). El catálogo público solo ve `published` |
| `vote_count` | integer | Suma de votos; la mantiene un trigger (default 0) |

**Aportes sin cuenta.** `/enviar` está abierto a todo el mundo: se llena la URL y las
categorías sin sesión y esta se pide al confirmar. Quien no quiera crear cuenta puede
mandarlo igual — el recurso entra con `status = 'pending'`, invisible en el catálogo
(la política pública filtra `published`), hasta que el staff lo apruebe desde `/admin`
→ **Catálogo** → "Revisar pendientes". Máximo 3 aportes anónimos por hora y navegador.

### Tabla `resource_votes` — un voto por usuario/recurso

| Columna | Tipo | Descripción |
|---|---|---|
| `resource_id` | uuid (FK → `resources`, ON DELETE CASCADE) | |
| `user_id` | uuid (FK → `auth.users`, ON DELETE CASCADE) | |
| `value` | smallint | `+1` \| `-1` (CHECK en DB) |
| `created_at` | timestamptz | |

PK `(resource_id, user_id)`: un voto por usuario y recurso. Un trigger
(`sync_resource_vote_count`) mantiene `resources.vote_count` en INSERT/UPDATE/DELETE.
RLS activo **sin políticas públicas**: el voto se procesa con el service role tras
verificar la sesión en `/api/resources/[id]/vote`.

### Tabla `resource_favorites` — lista de guardados del usuario

| Columna | Tipo | Descripción |
|---|---|---|
| `resource_id` | uuid (FK → `resources`, ON DELETE CASCADE) | |
| `user_id` | uuid (FK → `auth.users`, ON DELETE CASCADE) | |
| `created_at` | timestamptz | Cuándo lo guardó (ordena `/guardados`) |

PK `(resource_id, user_id)`: guardar dos veces no duplica (upsert). Índice
`(user_id, created_at desc)` para listar la página de guardados. RLS activo **sin
políticas públicas**, igual que `resource_votes`: todo pasa por el service role tras
verificar la sesión en `/api/resources/[id]/favorite`. Es una lista **privada**: nadie
ve lo que guardaron los demás y no afecta al puntaje del catálogo.

### Tabla `site_feedback` — opiniones sobre la plataforma

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | Autogenerado |
| `user_id` | uuid (FK → `profiles`, ON DELETE SET NULL) | Autor (`null` = anónimo) |
| `session_id` | text | Misma sesión anónima de la analítica (antiflood sin cuenta) |
| `sentiment` | text | `me_encanta` \| `puede_mejorar` \| `no_me_convence` (CHECK en DB) |
| `message` | text | Texto de la opinión (CHECK: 1–1000 caracteres) |
| `hidden_at` | timestamptz | Si tiene valor, el staff ya la archivó (leída) |
| `created_at` | timestamptz | |

Es el buzón de `/opiniones` (ver [03-interfaz.md](03-interfaz.md)): **nada de esto se
publica**. Se escribe desde la página y solo se lee en `/admin` → Opiniones. Es distinta
de `feedback_votes`: aquella es una **pregunta cerrada** de una sola respuesta por
sesión; esta es texto libre, firmado con el `display_name` de quien lo escribe o como
"Anónimo".

`user_id` apunta a `profiles` (no a `auth.users`) para que PostgREST pueda embeber el
nombre del autor en una sola consulta; como `profiles.id` ya cae en cascada con la
cuenta, borrar un usuario deja sus opiniones como anónimas en vez de borrarlas.

RLS activo **sin políticas públicas**: se escribe en `/api/opinions` (máx. 3 opiniones
por hora y por usuario o sesión) y solo se lee con el service role en
`/api/admin/opinions`, que exige rol de staff. Desde `/admin` → pestaña **Opiniones** se
archiva lo ya leído o se borra.

## Vista `watch_stats`

Agregados por video: `plays`, `autoplays`, `youtube_opens`, `unique_sessions`,
`last_activity`. Creada con `security_invoker = true`.

## Seguridad (RLS)

| Objeto | Política |
|---|---|
| `streams` | RLS activo; `SELECT` público (la anon key solo lee) |
| `watch_events` | RLS activo **sin políticas públicas**: solo el service role (rutas API del servidor) puede leer/escribir |
| `watch_stats` | `security_invoker = true`: hereda las restricciones de `watch_events` (anon bloqueado) |
| `categories`, `resources`, `playlist_items`, `resource_categories` | RLS activo; `SELECT` público (contenido curado sin PII); el catálogo público solo ve `resources.status = 'published'`; escrituras solo vía service role |
| `profiles` | RLS activo; `SELECT` público; el usuario puede actualizar su fila (no la columna `role`, revocada); solo el service role cambia roles |
| `resource_votes` | RLS activo **sin políticas públicas**: el voto se procesa con el service role tras verificar la sesión |
| `resource_favorites` | RLS activo **sin políticas públicas**: lista privada, se lee/escribe con el service role acotada por `user_id` |
| `site_feedback` | RLS activo **sin políticas públicas**: se escribe desde `/api/opinions` y solo lo lee el staff vía `/api/admin/opinions` (buzón privado) |

Las escrituras siempre pasan por rutas API del servidor con `SUPABASE_SERVICE_ROLE_KEY`
(nunca expuesta al navegador). Las rutas `/api/admin/*` autorizan por **rol de sesión**
(owner/admin) o, como respaldo programático, por `ADMIN_SECRET` (ver
`src/lib/admin-auth.ts`).

## Migraciones aplicadas

1. **`add_stream_metadata_and_watch_events`** (2026-07-16): columnas nuevas en `streams`
   (todas aditivas, `ADD COLUMN IF NOT EXISTS`), tabla `watch_events`, índice y vista
   `watch_stats`. **Sin ningún `DROP`/`DELETE`** — el código anterior siguió funcionando
   durante la transición.
2. **Backfill** (2026-07-16): las 23 filas existentes recibieron `published_at`,
   `live_started_at`, `live_ended_at` y `thumbnail_url` scrapeando la página watch de
   cada video (solo `UPDATE` de columnas nuevas; título y demás campos intactos).
3. **`add_feedback_votes`** (2026-07-17): tabla de la encuesta (aditiva), con RLS sin
   políticas públicas e índice por pregunta.
4. **`add_duration_seconds`** (2026-07-17): columna de duración en `streams` (aditiva)
   + backfill de las 23 filas scrapeando `lengthSeconds` de cada página watch.
5. **`add_resource_catalog`** (2026-07-23): cuatro tablas nuevas del catálogo
   (`categories`, `resources`, `playlist_items`, `resource_categories`) con índices y
   RLS (`SELECT` público). Todo `CREATE TABLE IF NOT EXISTS`, **sin ningún `DROP`/`DELETE`**;
   el código anterior sigue funcionando sin cambios.
6. **`seed_default_categories`** (2026-07-23): inserta las categorías iniciales (IA,
   Agentes, Datos) con `ON CONFLICT (slug) DO NOTHING` (idempotente).
7. **`add_category_color`** (2026-07-23): columna `color` en `categories` (aditiva) +
   asignación de la paleta de marca a IA (magenta), Agentes (rojo) y Datos (vino).
8. **`0001_users_submissions_voting`** (`supabase/migrations/`): cuentas y comunidad.
   Columnas nuevas en `resources` (`submitted_by`, `status`, `vote_count`), tabla
   `profiles` (+ trigger `handle_new_user`), tabla `resource_votes` (+ trigger
   `sync_resource_vote_count`), RLS, y **upsert de las 12 categorías** por defecto
   (Tecnología, Programación, Web, IA, Agentes, Datos, Diseño, Producto, DevOps,
   Ciberseguridad, Móvil, Carrera). Todo aditivo (`ADD COLUMN/CREATE ... IF NOT EXISTS`).
9. **`0002_roles`** (`supabase/migrations/`): columna `role` en `profiles`
   (`owner`/`admin`/`user`, default `user`), se revoca el `UPDATE` de `role` a los
   clientes (anti auto-escalada) y se asigna `owner` a la cuenta inicial.
10. **`0003_favoritos_y_opiniones`** (`supabase/migrations/`): tabla
   `resource_favorites` (lista privada de guardados, PK `(resource_id, user_id)`) y
   tabla `site_feedback` (opiniones publicables con moderación por `hidden_at`).
   Ambas con RLS sin políticas públicas. Todo `CREATE TABLE IF NOT EXISTS`, sin
   ningún `DROP`/`DELETE`.
11. **`0004_aportes_pendientes`** (`supabase/migrations/`): el CHECK de
   `resources.status` acepta además `pending` (solo se amplía) y se agrega la
   columna `submitted_session` para el antiflood de los aportes sin cuenta.
12. **`0005_perfil`** (`supabase/migrations/`): columnas `bio`, `location`, `links`
   (jsonb, default `[]`) y `updated_at` en `profiles`, con CHECKs de tamaño para
   que los límites se cumplan aunque se edite la fila desde el navegador.
