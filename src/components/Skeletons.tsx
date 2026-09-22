// Esqueletos de carga para los `loading.tsx`. Imitan la forma de cada página
// (título + grid, reproductor, artículo) para que al navegar la pantalla cambie
// al instante en vez de quedarse congelada esperando al servidor. Sin texto: los
// `loading.tsx` no reciben el idioma, y solo son bloques grises.

function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-surface ring-1 ring-border">
      <div className="aspect-video w-full animate-pulse bg-elevated" />
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
    <main
      aria-busy="true"
      className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-8 sm:px-8"
    >
      <div className="mb-8 flex items-center gap-4">
        <Block className="h-12 w-12 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Block className="h-8 w-64 max-w-full" />
          <Block className="h-4 w-96 max-w-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}

// Detalle de un recurso: enlace de volver, votos y reproductor.
export function DetailPageSkeleton() {
  return (
    <main
      aria-busy="true"
      className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-8"
    >
      <Block className="mb-5 h-4 w-40" />
      <div className="mb-5 flex items-center gap-3">
        <Block className="h-11 w-32 rounded-full" />
        <Block className="h-11 w-28 rounded-full" />
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <Block className="aspect-video w-full rounded-xl" />
        <Block className="mt-4 h-6 w-3/4" />
        <Block className="mt-2 h-4 w-1/3" />
      </div>
    </main>
  );
}

// Un artículo del blog.
export function ArticlePageSkeleton() {
  return (
    <main aria-busy="true" className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-8">
      <Block className="mb-6 h-4 w-24" />
      <Block className="h-9 w-full" />
      <Block className="mt-2 h-9 w-2/3" />
      <Block className="mt-4 h-3 w-48" />
      <Block className="mt-6 aspect-[16/9] w-full rounded-2xl" />
      <div className="mt-8 flex flex-col gap-3">
        {["w-full", "w-11/12", "w-full", "w-4/5", "w-full", "w-2/3"].map((w, i) => (
          <Block key={i} className={`h-4 ${w}`} />
        ))}
      </div>
    </main>
  );
}

// La landing: hero (título, texto, botón) y la cuadrícula de temáticas.
export function HomePageSkeleton() {
  return (
    <div aria-busy="true" className="flex-1">
      <section className="mx-auto grid w-full max-w-[1500px] items-center gap-10 px-4 pb-4 pt-10 sm:px-8 sm:pt-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-20 lg:pb-16 lg:pt-24">
        <div className="flex flex-col">
          <Block className="h-12 w-full sm:h-16" />
          <Block className="mt-3 h-12 w-3/4 sm:h-16" />
          <Block className="mt-6 h-5 w-full max-w-md" />
          <Block className="mt-2 h-5 w-2/3 max-w-md" />
          <Block className="mt-8 h-13 w-56 rounded-full" />
        </div>
        <Block className="hidden h-80 w-full rounded-2xl lg:block" />
      </section>
      <section className="mx-auto w-full max-w-[1500px] px-4 pt-12 sm:px-8 lg:pt-4">
        <Block className="mb-6 h-8 w-48" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }, (_, i) => (
            <Block key={i} className="h-16 rounded-xl sm:h-32 sm:rounded-2xl" />
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
      <Block className="h-8 w-40" />
      <Block className="h-4 w-64 max-w-full" />
      <Block className="mt-2 h-11 w-full" />
      <Block className="h-11 w-full" />
      <Block className="mt-2 h-11 w-full rounded-full" />
    </div>
  );
}
