import { ResourceCard } from "./ResourceCard";
import type { ResourceRow } from "@/lib/types";
import type { CategoryTag } from "@/lib/catalog";

// Cuadrícula de tarjetas de recurso, compartida por las páginas de categoría y la
// de exploración. `userVotes` (resourceId → valor) y `canVote` alimentan el control
// de voto; `favorites` (ids guardados por el usuario) pinta el corazón de cada
// tarjeta; `categoriesByResource` muestra a qué filtro pertenece cada video.
// `removeOnUnsave` es para la página de guardados: al quitar el corazón, la
// tarjeta desaparece de la lista. Server Component (sin interactividad propia).
export function ResourceGrid({
  resources,
  from,
  empty,
  accent,
  userVotes,
  canVote = false,
  categoriesByResource,
  favorites,
  removeOnUnsave = false,
}: {
  resources: ResourceRow[];
  from?: string;
  empty: string;
  accent?: string | null;
  userVotes?: Record<string, number>;
  canVote?: boolean;
  categoriesByResource?: Record<string, CategoryTag[]>;
  favorites?: Set<string>;
  removeOnUnsave?: boolean;
}) {
  if (resources.length === 0) {
    return <p className="py-16 text-center text-sm text-faint">{empty}</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {resources.map((r) => (
        <ResourceCard
          key={r.id}
          resource={r}
          from={from}
          accent={accent}
          userVote={userVotes?.[r.id]}
          canVote={canVote}
          categories={categoriesByResource?.[r.id]}
          saved={favorites?.has(r.id) ?? false}
          removeOnUnsave={removeOnUnsave}
        />
      ))}
    </div>
  );
}
