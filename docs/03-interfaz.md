# Interfaz (estilo YouTube, en español)

## Estructura

```
┌──────────────────────────────────────────────────────────────┐
│ Platzi Live   [EN VIVO]                        [Actualizar]  │  ← header sticky
├──────────────────────────────────┬───────────────────────────┤
│                                  │ ● EN VIVO AHORA           │
│        Reproductor               │  ▸ live de Platzi (si hay)│
│        (iframe de YouTube)       │  ▸ Radio lofi 24/7        │
│                                  ├───────────────────────────┤
│  Título del video                │ LIVES ANTERIORES  [orden▾]│
│  Canal · EN VIVO / fecha         │  ▸ tarjeta (mini+título+  │
│                 [Ver en YouTube] │    "hace 3 semanas")      │
│                                  │  ▸ …                      │
└──────────────────────────────────┴───────────────────────────┘
```

En móvil las columnas se apilan (reproductor arriba). Rejilla:
`lg:grid-cols-[minmax(0,1fr)_400px]`.

## Componentes ([`src/components/`](../src/components))

| Componente | Rol |
|---|---|
| `PlayerPanel` | Iframe del video + título, canal, insignia EN VIVO o fecha ("Transmitido hace 3 semanas · 11 de junio de 2026") y botón "Ver en YouTube" |
| `VideoListItem` | Tarjeta horizontal de la lista (miniatura 160px con fallback a `hqdefault`, título 2 líneas, canal, fecha relativa); resalta el video activo; insignias "EN VIVO" (rojo) y "24/7" (verde) |
| `StatusBadge` | Insignia "EN VIVO" (roja, convención universal; el verde Platzi queda para acciones) |
| `FeedbackPoll` | Encuesta flotante en la esquina inferior derecha, con cierre y pastilla "📊 Encuesta" para reabrir (ver [04-analitica.md](04-analitica.md)) |
| `FavoriteButton` | Corazón para guardar un video/playlist. En la tarjeta flota en la esquina y solo aparece al pasar el cursor (en móvil siempre, porque no hay hover); en el detalle es una pastilla "Guardar/Guardado" |
| `OpinionForm` | Formulario de `/opiniones`: sentimiento (😍/🤔/😕) + texto libre. Funciona sin cuenta (se publica como "Anónimo") |
| `DailyChart` | Gráfica SVG de barras apiladas por día, usada en `/admin` |

Las tarjetas muestran "hace 3 semanas · 3 h 58 min" (fecha relativa + duración del
video); el reproductor añade además la fecha absoluta.

## Catálogo, navegación y responsive

- **`SiteHeader`** ([componente](../src/components/SiteHeader.tsx)): barra del catálogo
  con marca + enlaces (Explorar, Platzi Lives, y **Admin** solo para staff) + tema +
  sesión (`AuthNav`). En **móvil** los enlaces se mueven a un **menú lateral (drawer)**
  con hamburguesa ([`MobileMenu`](../src/components/MobileMenu.tsx)); la barra deja solo
  el CTA de sesión y el toggle de tema. El drawer se renderiza con un **portal** a
  `document.body` para escapar del `backdrop-filter` del header (que, si no, atraparía a
  los elementos `fixed`). `body` usa `overflow-x-clip` como red de seguridad.
- **`ResourceCard`** ([componente](../src/components/ResourceCard.tsx)): tarjeta del
  catálogo (miniatura + título + canal). Al pie muestra **las categorías** del recurso
  (hasta 2, con "+N" si hay más); los datos los inyecta cada página vía
  `getCategoriesForResources` (`src/lib/catalog.ts`) y `ResourceGrid`.
- **`AuthNav`**: sin sesión muestra "Aportar video", "Entrar" y "Crear cuenta" (CTA);
  con sesión, botón "Aportar video" + menú con "Guardados", "Mis videos" y "Cerrar
  sesión".
- **`ExploreFilters`** (`/todo`): filtros de categoría (chips) + orden (más votados /
  recientes), con el estado en la URL (`?cat=…&sort=…`).

## Guardados (favoritos)

Cada tarjeta lleva un **corazón** en la esquina superior derecha
([`FavoriteButton`](../src/components/FavoriteButton.tsx)): aparece al pasar el cursor
sobre la tarjeta y se queda fijo si el recurso ya está guardado. Vive **fuera** del
`<Link>` de la tarjeta (nunca un `<button>` dentro de un `<a>`) y actualiza optimista,
revirtiendo si el servidor falla. Sin sesión, el clic lleva a `/entrar?next=…`.

La lista personal está en **`/guardados`**: es privada (nadie ve lo de los demás), no
afecta al puntaje del catálogo y se ordena por cuándo se guardó. Al quitar el corazón
ahí, la tarjeta desaparece de la cuadrícula (`ResourceGrid` con `removeOnUnsave`).

## Opiniones

**`/opiniones`** es un **buzón privado**, no un muro público: la página solo tiene el
formulario (sentimiento + texto libre) y nadie ve lo que escribieron los demás — ni los
mensajes ni los conteos. Se puede opinar **sin cuenta** (llega como "Anónimo") o con
sesión (firmada con el nombre visible, para poder dar seguimiento); hay un límite de 3
por hora y persona.

Todo se lee desde `/admin` → pestaña **Opiniones**, con el reparto de sentimientos
arriba. Ahí se puede **archivar** lo ya leído (`hidden_at`, reversible) o borrarlo
definitivamente. Enlazada desde la barra y el pie de página.

## Perfil

**`/perfil`** ([página](../src/app/(catalog)/perfil/page.tsx)) reúne la información de
la cuenta: avatar con la inicial, nombre, correo, distintivo de rol (solo staff),
ubicación y desde cuándo es miembro. Debajo, la biografía y los enlaces, y un resumen
de actividad (aportes, guardados, votos y opiniones) donde cada tarjeta lleva a su
sección.

[`ProfileCard`](../src/components/ProfileCard.tsx) alterna entre la vista y el
formulario en el mismo sitio: nombre visible, biografía (300 caracteres con contador),
ubicación y hasta 6 enlaces con etiqueta. Guarda con `PATCH /api/profile` y refresca la
página para que la barra y las opiniones firmadas vean el nombre nuevo. Los enlaces se
abren con `rel="noopener noreferrer nofollow"` y solo si son `http`/`https`.

## Blog

**`/blog`** lista los artículos publicados (título, resumen, firma, fecha y minutos de
lectura) y **`/blog/[slug]`** muestra uno, con `generateMetadata` propio para que al
compartirlo salgan su título y su resumen en vez de los genéricos del sitio.

**Escribirlo es exclusivo del staff**: la pestaña **Blog** de `/admin`
([`BlogManager`](../src/components/admin/BlogManager.tsx)) es el único punto de entrada
y todas sus llamadas van a `/api/admin/blog`, que vuelve a exigir rol `owner`/`admin`.
Un artículo **nace como borrador** y no lo ve nadie hasta pulsar "Publicar"; se puede
despublicar, editar y borrar desde la misma lista.

El cuerpo se escribe en Markdown básico — encabezados, listas, citas, separadores,
bloques de código, imágenes, **negrita**, *cursiva*, `código` y enlaces — y lo pinta
[`Markdown`](../src/lib/markdown.tsx), que genera nodos de React en vez de HTML crudo.

**Imágenes.** El editor tiene dos subidores, ambos contra el bucket `blog` de Supabase
Storage (ver [01-base-de-datos.md](01-base-de-datos.md)):

- **Portada**: se sube, se previsualiza y se puede cambiar o quitar. Sale en la lista
  del blog (recorte 21:9), arriba del artículo (16:9) y como imagen de Open Graph al
  compartirlo.
- **Insertar imagen**: sube el archivo y pega `![](url)` justo donde está el cursor del
  editor. Una imagen sola en su línea se pinta como figura y el texto alternativo hace
  de pie de foto.

## Aportar sin cuenta

`/enviar` ya no exige sesión para entrar. Se llena la URL y las categorías, y al
confirmar aparece un paso que ofrece crear cuenta (el aporte se publica al instante) o
mandarlo **sin cuenta**, en cuyo caso queda **pendiente de aprobación**. El borrador se
guarda en `localStorage`, así que irse a `/entrar` y volver no pierde nada.

## Paleta, tema claro/oscuro y color por categoría

Tras el pivot, la marca dejó el verde de Platzi por una paleta propia (definida en
[`globals.css`](../src/app/globals.css)). Esta rama usa la variante **carbon & flame**:
un esquema minimalista monocromo con un único acento — flame `#F15025`, blanco
`#FFFFFF`, alabastro `#E6E8E6`, gris polvo `#CED0CE` y carbón `#191919` — más un
**amarillo ámbar** (análogo del naranja en la rueda cromática, combinan de forma
natural) para detalles, íconos y acentos secundarios: `#FFC53D` en oscuro y dorado
profundo `#8A6100` en claro (5.5:1 sobre blanco).

Todos los pares texto/fondo fueron verificados contra WCAG: los usos de texto normal
cumplen AA (≥4.5:1) en ambos temas; el naranja como texto usa variantes propias
(`--accent-ink`: `#FF6A42` en oscuro, `#C0370C` en claro) porque el flame puro no
alcanza el ratio sobre carbón/blanco — el flame puro queda para rellenos y titulares
grandes (donde AA pide ≥3:1).

**Tipografías**: [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque)
para títulos (`h1`–`h3` y `.font-display`, regla global en `globals.css`) y
[Roboto](https://fonts.google.com/specimen/Roboto) para el resto del texto, ambas vía
`next/font/google` en [`layout.tsx`](../src/app/layout.tsx).

**Íconos por categoría**: [`CategoryIcon`](../src/components/CategoryIcon.tsx) — SVGs
de línea (`currentColor`, trazo 1.7) que referencian cada temática: Tecnología →
microchip, Programación → `</>`, Web → globo, IA → destellos, Agentes → robot, Datos →
cilindro de base de datos, Diseño → pluma, Producto → caja, DevOps → bucle infinito,
Ciberseguridad → escudo, Móvil → smartphone, Carrera → maletín. Cae a una cuadrícula
genérica para categorías nuevas. Se muestran en discos en la landing y en la cabecera
de cada categoría.

- **Tokens semánticos** (`background`, `surface`, `foreground`, `muted`, `border`,
  `fill`, `accent`, …) mapeados en `@theme`. Los componentes usan estos tokens, no
  colores fijos, así que el mismo marcado sirve para ambos temas.
- **Tema claro/oscuro**: `[data-theme]` en `<html>`. Un script en el `<body>` lo fija
  antes del primer paint (elección guardada en `localStorage` o preferencia del sistema),
  sin parpadeo; `ThemeToggle` lo alterna. Por defecto: oscuro (base vino-negro).
- **Acento único**: al ser una paleta monocromo con un solo color, todo el acento
  (pestaña activa, cabecera de categoría, marco de tarjetas, CTAs) usa el flame. La
  columna `color` por categoría sigue existiendo en la DB, pero aquí `catColor()` la
  ignora y devuelve el acento para mantener la coherencia. La landing usa el degradado
  de la paleta completa (`--blend`) como firma.

## Estilo glass y barra de scroll

- Clase `.glass`: tinte sutil derivado del fondo + `backdrop-blur` + borde luminoso.
  Se usa en el header, el panel de la lista, la encuesta flotante y las tarjetas del
  admin. Adaptada a tokens para verse bien en claro y oscuro.
- Clase `.custom-scroll`: barra de 10px con degradado claro y carril tenue, uniforme
  en las dos zonas con scroll propio (más visible que la nativa).

## Zonas de scroll (escritorio, ≥1024px)

La página ocupa exactamente el viewport: **el reproductor queda fijo** y no hay scroll
de página. La lista lateral es un **panel con tono propio** (`bg-white/[0.03]` + borde
sutil) que scrollea por dentro — el cambio de tono marca visualmente qué zona se mueve.
La columna del reproductor solo scrollea si su contenido no cabe (ventanas bajitas).
En móvil todo se apila y la página scrollea normal.

## Selección del video en el reproductor

Prioridad (en [`src/app/page.tsx`](../src/app/page.tsx), derivada durante el render):

1. **Clic del usuario** (estado `chosen`) — nunca se interrumpe automáticamente.
2. **Deep-link `?v=VIDEO_ID`** — enlaces compartibles; al hacer clic en un video la URL
   se actualiza con `history.replaceState` sin recargar.
3. **Platzi Live activo** — si hay transmisión en este momento.
4. **Radio lofi 24/7** (`tRsQsTMvPNg`, constante en [`src/lib/constants.ts`](../src/lib/constants.ts)).

Mientras el usuario no haya hecho clic, si un Platzi Live comienza (lo detecta el polling
de 5 min), el reproductor **cambia solo al live**; al terminar, vuelve a la radio lofi.

El `autoplay` del iframe solo se activa tras un clic del usuario (los navegadores
bloquean el autoplay con sonido sin gesto previo).

## Orden de la lista

Selector con dos opciones: "Más recientes primero" (default) y "Más antiguos primero".
La clave de orden es `live_started_at ?? published_at`. Los lives activos no participan
del orden: van fijados en la sección "En vivo ahora".

## Fechas en español

[`src/lib/dates.ts`](../src/lib/dates.ts) — `Intl.RelativeTimeFormat("es-MX")` para
"hace 3 semanas" e `Intl.DateTimeFormat("es-MX")` para "11 de junio de 2026". Sin
librerías externas.
