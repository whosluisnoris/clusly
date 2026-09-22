"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT, useLocalePath } from "@/components/I18nProvider";
import { localizeCategory } from "@/lib/i18n";
import type { Category, ResourceLanguage } from "@/lib/types";
import type { ResourceSort } from "@/lib/catalog";
import { Chip } from "@/components/ui";

// Barra de filtros de la exploración. El estado vive en la URL
// (?cat=slug,slug&sort=top|new&lang=es|en) para que sea compartible y el
// servidor consulte con ese filtro. Cambiar un filtro navega a la nueva URL.
//
// La navegación va dentro de una transición con estado optimista: el chip o
// botón pulsado cambia en el acto y la cuadrícula (`children`) se atenúa
// mientras llega la página filtrada, en vez de no reaccionar hasta que responde
// el servidor.
//
// Ojo con los dos "idiomas" que conviven aquí: `lang` en la URL es el idioma
// **hablado del video**, no el de la interfaz (ese va en el prefijo /es o /en).
export function ExploreFilters({
  categories,
  selected,
  sort,
  language,
  children,
}: {
  categories: Category[];
  selected: string[];
  sort: ResourceSort;
  language: ResourceLanguage | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filters, setOptimisticFilters] = useOptimistic({ selected, sort, language });
  const t = useT();
  const localePath = useLocalePath();

  function pushState(
    nextSlugs: string[],
    nextSort: ResourceSort,
    nextLanguage: ResourceLanguage | null
  ) {
    const params = new URLSearchParams();
    if (nextSlugs.length > 0) params.set("cat", nextSlugs.join(","));
    if (nextSort !== "top") params.set("sort", nextSort);
    if (nextLanguage) params.set("lang", nextLanguage);
    const qs = params.toString();
    const base = localePath("/todo");
    startTransition(() => {
      setOptimisticFilters({ selected: nextSlugs, sort: nextSort, language: nextLanguage });
      router.push(qs ? `${base}?${qs}` : base, { scroll: false });
    });
  }

  const { selected: sel, sort: srt, language: lng } = filters;

  function toggle(slug: string) {
    const next = sel.includes(slug) ? sel.filter((s) => s !== slug) : [...sel, slug];
    pushState(next, srt, lng);
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:mb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
          <FilterGroup label={t.explore.sortLabel}>
            <Chip variant="soft" pressed={srt === "top"} onClick={() => pushState(sel, "top", lng)}>
              {t.explore.sortTop}
            </Chip>
            <Chip variant="soft" pressed={srt === "new"} onClick={() => pushState(sel, "new", lng)}>
              {t.explore.sortNew}
            </Chip>
          </FilterGroup>

          {/* Idioma hablado del video */}
          <FilterGroup label={t.explore.languageLabel}>
            <Chip variant="soft" pressed={lng === null} onClick={() => pushState(sel, srt, null)}>
              {t.language.filterAll}
            </Chip>
            <Chip variant="soft" pressed={lng === "es"} onClick={() => pushState(sel, srt, "es")}>
              {t.language.videoEs}
            </Chip>
            <Chip variant="soft" pressed={lng === "en"} onClick={() => pushState(sel, srt, "en")}>
              {t.language.videoEn}
            </Chip>
          </FilterGroup>
        </div>

        {/* En móvil cada grupo de chips va en una sola fila que se desliza de
            lado (llega hasta el borde de la pantalla); desde `sm` los de
            categoría se acomodan en varias líneas. */}
        <div className="no-scrollbar -mx-4 -my-1 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <Chip pressed={sel.length === 0} onClick={() => pushState([], srt, lng)}>
            {t.explore.allCategories}
          </Chip>
          {categories.map((c) => (
            <Chip key={c.id} pressed={sel.includes(c.slug)} onClick={() => toggle(c.slug)}>
              {localizeCategory(c, t).name}
            </Chip>
          ))}
        </div>
      </div>

      <div
        aria-busy={pending}
        className={`transition-opacity duration-200 ${pending ? "pointer-events-none opacity-50" : ""}`}
      >
        {children}
      </div>
    </>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="no-scrollbar -mx-4 -my-1 flex items-center gap-1.5 overflow-x-auto px-4 py-1 sm:mx-0 sm:overflow-visible sm:px-0"
    >
      <span aria-hidden="true" className="mr-1 shrink-0 text-xs font-semibold uppercase tracking-wide text-faint">
        {label}
      </span>
      {children}
    </div>
  );
}
