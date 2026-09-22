import { Page, Skeleton, cn, containerClasses } from "@/components/ui";

// Esqueletos de carga para los `loading.tsx`. Imitan la forma de cada página
// (título + grid, reproductor, artículo) para que al navegar la pantalla cambie
// al instante en vez de quedarse congelada esperando al servidor. Sin texto: los
// `loading.tsx` no reciben el idioma, y solo son bloques grises.
//
// Usan el mismo <Page> y las mismas medidas que PageHeader, así que al llegar
// la página real nada salta de sitio.

// Título grande + descripción, como PageHeader.
function HeaderSkeleton() {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:mb-10">
      <Skeleton className="h-9 w-64 max-w-full sm:h-11 lg:h-12" />
      <Skeleton className="h-4 w-96 max-w-full sm:h-5" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-surface ring-1 ring-border">
      <div className="aspect-video w-full animate-pulse bg-elevated motion-reduce:animate-none" />
      <div className="flex flex-col gap-2 p-3.5">
        <div className="h-3.5 w-11/12 animate-pulse rounded bg-elevated" />
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-elevated" />
        <div className="mt-1 h-3 w-1/3 animate-pulse rounded bg-elevated" />
      </div>
    </div>
  );
}

// Título + cuadrícula de tarjetas (exploración, categorías, guardados…).
export function GridPageSkeleton() {
  return (
    <Page aria-busy="true">
      <HeaderSkeleton />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </Page>
  );
}

// Detalle de un recurso: enlace de volver, votos y reproductor.
export function DetailPageSkeleton() {
  return (
    <Page aria-busy="true">
      <Skeleton className="mb-5 h-5 w-40" />
      <div className="mb-5 flex items-center gap-3">
        <Skeleton className="h-11 w-32 rounded-full" />
        <Skeleton className="h-11 w-28 rounded-full" />
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="mt-5 h-7 w-3/4" />
        <Skeleton className="mt-3 h-4 w-1/3" />
      </div>
    </Page>
  );
}

// Un artículo del blog.
export function ArticlePageSkeleton() {
  return (
    <Page size="narrow" aria-busy="true">
      <Skeleton className="mb-5 h-5 w-32" />
      <Skeleton className="h-10 w-full sm:h-12" />
      <Skeleton className="mt-2 h-10 w-2/3 sm:h-12" />
      <Skeleton className="mt-4 h-3 w-48" />
      <Skeleton className="mt-6 aspect-[16/9] w-full rounded-2xl" />
      <div className="mt-8 flex flex-col gap-3">
        {["w-full", "w-11/12", "w-full", "w-4/5", "w-full", "w-2/3"].map((w, i) => (
          <Skeleton key={i} className={`h-4 ${w}`} />
        ))}
      </div>
    </Page>
  );
}

// La landing: hero (título, texto, botón) y la cuadrícula de temáticas.
export function HomePageSkeleton() {
  return (
    <div aria-busy="true" className="flex-1">
      <section
        className={cn(
          containerClasses(),
          "grid items-center gap-10 pb-4 pt-10 sm:pt-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-20 lg:pb-16 lg:pt-24"
        )}
      >
        <div className="flex flex-col">
          <Skeleton className="h-12 w-full sm:h-16" />
          <Skeleton className="mt-3 h-12 w-3/4 sm:h-16" />
          <Skeleton className="mt-6 h-5 w-full max-w-md" />
          <Skeleton className="mt-2 h-5 w-2/3 max-w-md" />
          <Skeleton className="mt-8 h-13 w-56 rounded-full" />
        </div>
        <Skeleton className="hidden h-80 w-full rounded-2xl lg:block" />
      </section>
      <section className={cn(containerClasses(), "pt-12 lg:pt-4")}>
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl sm:h-32 sm:rounded-2xl" />
          ))}
        </div>
      </section>
    </div>
  );
}

// Formularios de acceso (entrar / registro), dentro de la tarjeta del layout.
export function FormSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-64 max-w-full" />
      <Skeleton className="mt-3 h-11 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="mt-2 h-11 w-full rounded-full" />
    </div>
  );
}
