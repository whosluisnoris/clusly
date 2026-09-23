# Componentes de interfaz (`@/components/ui`)

La landing es la referencia visual de Clusly: títulos grandes en Bricolage
extrabold, superficies `rounded-2xl` con borde fino, **un solo botón naranja por
pantalla**, el ámbar para detalles y el color de cada temática como brillo. Estos
componentes empaquetan ese lenguaje para que cualquier página nueva se vea igual
sin copiar clases.

```tsx
import { Page, PageHeader, Button, ButtonLink, Card } from "@/components/ui";
```

- **Catálogo vivo**: con `npm run dev`, abre **`/es/ui`**. Ahí están todos los
  componentes con sus variantes; cambia el tema (luna/sol) y el ancho de la
  ventana para revisarlos. En producción esa ruta da 404.
- **Código**: [`src/components/ui/`](../src/components/ui), un archivo por
  componente, cada uno con un comentario de para qué sirve.

## Reglas de uso

1. **Server y Client por igual.** Ningún componente usa hooks ni lleva
   `"use client"`, así que se usan desde un Server Component (una `page.tsx`)
   o desde uno de cliente (un formulario). Los manejadores (`onClick`,
   `onChange`) solo se pueden pasar desde un Client Component, igual que con
   un `<button>` normal.
2. **Tokens, no colores fijos.** Todo usa los tokens de
   [`globals.css`](../src/app/globals.css) (`bg-surface`, `text-muted`,
   `text-accent-ink`, `text-danger-ink`…), por eso funciona en claro y oscuro sin
   hacer nada. Si escribes marcado propio, usa esos mismos tokens (nunca
   `text-red-400`, `bg-white`, etc.).
3. **Las props primero; `className` para ajustar.** El tamaño, la variante y el
   relleno se eligen con props (`size`, `variant`, `padding`). `className` sirve
   para añadir (márgenes, anchos, posición en un grid) y, si hace falta, para
   pisar algo: `cn()` usa `tailwind-merge`, así que en un conflicto gana la clase
   que pasas.
   > Ojo con los prefijos: `className="p-4"` en una `Card` (que trae
   > `p-5 sm:p-6`) solo cambia el móvil, porque `sm:p-6` sigue aplicando. Para
   > un relleno propio usa `padding="none"` y pon el tuyo.
4. **Mobile-first.** Los componentes ya se adaptan (títulos, rellenos y
   márgenes crecen con `sm`/`lg`; las acciones se apilan en móvil). Al
   combinarlos, piensa primero en 390 px de ancho.
5. **Accesibilidad incluida.** Foco visible en naranja, `aria-pressed` en los
   chips, `role="alert"` en los errores, `aria-busy` al cargar y animaciones que
   se apagan con "reducir movimiento". No los desactives.
6. **Textos del diccionario.** Los componentes no traen texto propio: todo lo
   visible entra por props o `children` desde `t.*`
   ([i18n](03-interfaz.md#idiomas-español--inglés)).

## Estructura de una página

```tsx
// src/app/[lang]/(catalog)/mi-seccion/page.tsx
import { Page, PageHeader, ButtonLink, EmptyState } from "@/components/ui";

export default async function MiSeccionPage({ params }: { params: Promise<{ lang: string }> }) {
  const t = getDictionary(/* … */);
  const items = await getItems();

  return (
    <Page>
      <PageHeader
        title={t.miSeccion.title}
        description={t.miSeccion.subtitle}
        actions={<ButtonLink href="/enviar">{t.miSeccion.cta}</ButtonLink>}
      />

      {items.length === 0 ? (
        <EmptyState
          description={t.miSeccion.empty}
          action={<ButtonLink href="/todo">{t.miSeccion.emptyCta}</ButtonLink>}
        />
      ) : (
        <Lista items={items} />
      )}
    </Page>
  );
}
```

El layout del grupo (`SiteShell`) ya pone la barra y el pie; la página solo
aporta su `<Page>`.

## Referencia

### Layout

| Componente | Para qué | Props clave |
|---|---|---|
| `Page` | El `<main>` de cada página: ancho, márgenes laterales (16 px → 32 px) y aire vertical | `size`: `"wide"` (1500 px, cuadrículas), `"content"` (768 px, listas de lectura), `"narrow"` (672 px, formularios y artículos) |
| `Container` / `containerClasses()` | El mismo ancho y márgenes sin el `<main>` (secciones de la landing) | `size` |
| `PageHeader` | Título de página con la tipografía de la landing | `title`, `description`, `actions`, `back={{ href, label }}`, `icon` + `iconColor`, `size`: `"lg"` (por defecto) o `"md"` (cabeceras secundarias: Platzi Lives, admin, acceso), `children` (insignias bajo el texto) |
| `SectionHeader` | Título de sección | `title`, `action` (a la derecha), `size`: `"lg"` (como "Explora por temática") o `"sm"` (etiqueta en mayúsculas de paneles y listas), `as`, `id` |
| `BackLink` | "← Volver a …" | `href`, `children`. La flecha la pone el componente: **no** la escribas en el diccionario |

```tsx
<PageHeader
  title={name}
  description={description}
  icon={<CategoryIcon slug={slug} />}
  iconColor={topicColor(slug)}
  back={{ href: "/todo", label: t.nav.explore }}
/>

<SectionHeader
  title={t.landing.topicsTitle}
  action={<TextLink href="/todo" tone="complement">{t.landing.seeAll}</TextLink>}
/>
```

### Acciones

**`Button`** (`<button>`) y **`ButtonLink`** (enlace con forma de botón; las
rutas internas pasan por `LocaleLink` y llevan el idioma solas).

| `variant` | Cuándo |
|---|---|
| `primary` | La acción principal. **Una por pantalla**: es "el único botón naranja" |
| `contrast` | CTA fuerte que no compite con el naranja ("Crear cuenta" en la barra) |
| `secondary` | Contorno. La alternativa a la principal ("Aportar video" en la landing, "Cancelar") |
| `soft` | Fondo tenue. Atajos y acciones de apoyo |
| `ghost` | Solo texto. Acciones terciarias dentro de una lista ("Quitar") |
| `danger` | Contorno rojo. Acciones destructivas ("Borrar"), siempre tras un `confirm` |

`size`: `xs` (32 px, acciones dentro de filas de una lista, como en el panel
admin), `sm` (36 px, barras y paneles), `md` (44 px, por defecto), `lg` (52 px,
el CTA del hero y los envíos de formulario). `block` ocupa todo el ancho (útil en
móvil: `block className="sm:w-auto"`).

```tsx
<Button type="submit" loading={saving} loadingText={t.common.saving}>
  {t.profile.saveChanges}
</Button>

<ButtonLink href="/todo" size="lg">{t.landing.ctaPrimary} <span aria-hidden="true">→</span></ButtonLink>

<ButtonLink href={stream.watchUrl} external variant="secondary" size="sm" onClick={track}>
  Ver en YouTube ↗
</ButtonLink>
```

- `loading` deshabilita el botón, muestra un indicador y cambia el texto por
  `loadingText` (si lo das).
- `buttonClasses({ variant, size })` devuelve las clases, para algo que no sea
  botón ni enlace (un `<label>` de subida de archivos, por ejemplo).

**`TextLink`**: enlaces dentro del texto. `tone`:
`accent` (naranja subrayado, llamadas dentro de un párrafo), `complement` (ámbar,
el "Ver todo →" junto a un título) y `muted` (gris, enlaces secundarios).
`textLinkClasses(tone)` da las clases para un `<button>` que debe verse como
enlace ("Escribir otra"); para uno destructivo ("Borrar" en una lista) está el
tono `danger`.

**`Tabs`**: pestañas subrayadas para cambiar de vista dentro de una página (el
panel admin). El estado lo lleva quien las usa; en móvil la fila se desliza.
Si cada pestaña necesita su propia URL, usa enlaces en su lugar.

```tsx
<Tabs items={TABS} value={tab} onChange={setTab} label="Secciones del panel" />
```

**`Chip`**: píldora de alternar (`aria-pressed`) para filtros y selecciones.
`pressed` es obligatoria. `variant="solid"` (el elegido se rellena de naranja:
categorías, idioma del video, sentimiento) o `"soft"` (el elegido se tiñe: orden
e idioma en los filtros). `size`: `sm` / `md`.

```tsx
<Chip pressed={sel.includes(c.slug)} onClick={() => toggle(c.slug)}>
  {localizeCategory(c, t).name}
</Chip>
```

> Para una fila de chips en móvil, en vez de apilarlos en muchas líneas, hazla
> deslizable como en `ExploreFilters`:
> `className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"`.

### Superficies

| Componente | Para qué | Props clave |
|---|---|---|
| `Card` | Contenedor con superficie | `variant`: `surface` (por defecto), `glass` (paneles que flotan: lista del reproductor, menús), `outline`; `padding`: `none`/`sm`/`md`/`lg`; `interactive` (se levanta al pasar el cursor); `as`: `section`, `form`, `aside`, `article`… |
| `cardClasses()` | Las clases de `Card`, para un enlace con forma de tarjeta | las mismas |
| `GlowCard` | La tarjeta de temática de la landing: el color entra como brillo al pasar el cursor. Toda la tarjeta es un enlace | `href`, `color`, `title`; el layout interno va en `className` |
| `GlowFrame` | El mismo efecto en un `<div>`, para tarjetas con varias zonas clicables dentro (la de un video: enlace + voto + corazón) | `color`, más cualquier prop de `<div>` |
| `IconTile` | Cuadrito de color con ícono | `color`, `size`: `sm`/`md`/`lg`. Dimensiona el `<svg>` solo |
| `EmptyState` | Lista vacía | `title`, `description`, `action`, `icon` |

```tsx
<Card as="form" padding="lg" onSubmit={save} className="flex flex-col gap-6">…</Card>

<LocaleLink href={`/blog/${post.slug}`} className={cardClasses({ interactive: true, padding: "none" })}>…</LocaleLink>

<GlowCard href={`/categoria/${c.slug}`} color={topicColor(c.slug)} className="flex gap-3 p-4">
  <IconTile color={topicColor(c.slug)}><CategoryIcon slug={c.slug} /></IconTile>
  <span className="font-display font-bold text-foreground">{c.name}</span>
</GlowCard>
```

```tsx
// ResourceCard: el enlace, el voto y el corazón viven dentro del marco.
<GlowFrame color={topicColor(slug)} className="group flex flex-col overflow-hidden ring-1 ring-border">
  <FavoriteButton … />            {/* absolute: las utilidades ganan a .glow-card */}
  <LocaleLink href={href}>…</LocaleLink>
  <VoteControl … />
</GlowFrame>
```

Los dos usan las clases `.glow-*` de `globals.css` (en `@layer components`, así
que cualquier utilidad de Tailwind las puede ajustar); el color llega por la
variable `--line`, así que acepta cualquier valor CSS (`topicColor(slug)`,
`var(--accent)`, `var(--complement)`). **Toda tarjeta enlazada nueva debería
usar uno de los dos**, para que el gesto al pasar el cursor sea el mismo en todo
el sitio.

### Formularios

**`Field`** envuelve un control con su etiqueta (en mayúsculas), la pista o el
error debajo y, opcionalmente, un contador a la derecha. Como el control va
dentro de un `<label>`, clicar la etiqueta lo enfoca sin necesidad de `id`. Para
un grupo de controles (chips, radios) usa `group`: se convierte en
`<fieldset>`/`<legend>`.

**`Input`**, **`Textarea`**, **`Select`**: los controles con el estilo de la
marca (44 px de alto; en móvil el texto va a 16 px para que iOS no haga zoom).
`compact` los hace chicos (36 px) para barras y paneles. `inputClasses()` da las
clases para otro control.

```tsx
<Field label={t.submit.urlLabel} hint={t.submit.urlHint}>
  <Input type="url" required value={url} onChange={(e) => setUrl(e.target.value)} />
</Field>

<Field label={t.profile.bioLabel} counter={`${bio.length}/${MAX_BIO}`}>
  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={MAX_BIO} />
</Field>

<Field group label={t.language.videoLabel} hint={t.submit.languageHint}>
  <div className="flex gap-2">
    <Chip pressed={lang === "es"} onClick={() => setLang("es")}>{t.language.videoEs}</Chip>
    <Chip pressed={lang === "en"} onClick={() => setLang("en")}>{t.language.videoEn}</Chip>
  </div>
</Field>
```

- `error` sustituye a la pista y va en rojo. Marca además el control con
  `aria-invalid` para que su borde se ponga rojo.
- Patrón de formulario: `Card as="form" padding="lg"` con `flex flex-col gap-6`,
  y la fila de botones al final separada con `border-t border-border pt-6`.

### Mensajes y datos

| Componente | Para qué | Props clave |
|---|---|---|
| `Alert` | Resultado de un envío, error, nota | `tone`: `success`/`neutral`/`warning` (ámbar: algo pide atención, como la cola de pendientes)/`error`; `title`; `action`. Con `title` el cuerpo va en gris |
| `Badge` | Etiqueta corta en mayúsculas (rol, estado, EN VIVO) | `tone`: `neutral`/`accent`/`complement`/`live`; `dot` (`true` o `"pulse"`); `size` |
| `Avatar` | Círculo con la inicial | `name`, `size`: `sm`/`md`/`lg` |
| `MetaLine` | Metadatos separados por "·" | `items` (los vacíos se saltan) |
| `Skeleton` | Bloque gris de carga | la forma en `className` |

```tsx
{error && <Alert tone="error">{error}</Alert>}

<Alert
  tone="success"
  title={t.submit.successTitle}
  action={<TextLink href={`/recurso/${id}`}>{t.submit.successLink}</TextLink>}
>
  {warning}
</Alert>

<Badge tone="live" size="md" dot="pulse">{t.lives.liveNow}</Badge>

<MetaLine items={[post.authorName, formatDate(post.publishedAt), fmt(t.blog.readingTime, { n })]} />
```

## Paleta en una línea

| Token | Uso |
|---|---|
| `accent` / `accent-ink` / `on-accent` | Naranja: relleno de la acción principal / naranja como texto / texto sobre naranja |
| `complement` | Ámbar: detalles, íconos, "Ver todo →" |
| `danger` / `danger-ink` | Rojo: EN VIVO y errores (relleno / texto). Nuevo con estos componentes |
| `surface`, `background`, `fill`, `border`, `muted`, `faint` | Neutros de superficies, rellenos tenues, bordes y textos secundarios |
| `topicColor(slug)` | El color de cada temática (`src/lib/color.ts`) |

## Añadir un componente nuevo

1. Un archivo en `src/components/ui/` con un comentario arriba que diga **para
   qué** sirve y cuándo elegir cada variante.
2. Sin hooks ni `"use client"` si se puede (así sirve en ambos lados). Si
   necesita estado, que sea el mínimo y en su propio archivo.
3. Variantes como props con un mapa de clases (`Record<Variant, string>`) y
   `className` al final pasado por `cn()`.
4. Expórtalo en [`index.ts`](../src/components/ui/index.ts), añádelo a la página
   `/es/ui` (`src/app/[lang]/(catalog)/ui/page.tsx`) y a esta guía.

## Estado de la migración

Todo el sitio usa estos componentes: páginas públicas, barra, formularios y el
panel `/admin` completo (pestañas, catálogo, Platzi Lives, blog e imágenes del
bucket, estadísticas y opiniones).

El panel sigue el mismo patrón que el resto, en versión densa:

- Cada gestor abre con un `SectionHeader` (y `action` para "Actualizar").
- Los formularios de alta van en `Card as="form"` con `Field`.
- Cada elemento de una lista es un `Card as="li"` con botones `size="xs"`:
  la acción principal de la fila (`primary`, p. ej. "Aprobar", "Publicar"),
  las alternativas en `secondary` y la destructiva en `danger`.
- El resultado de cada acción va en un `Alert`; las listas vacías, en
  `EmptyState`.

Lo único con colores propios son las series de la gráfica de estadísticas
(`DailyChart`), que usan una paleta categórica validada aparte.
