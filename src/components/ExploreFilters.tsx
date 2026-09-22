"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT, useLocalePath } from "@/components/I18nProvider";
import { localizeCategory } from "@/lib/i18n";
import type { Category, ResourceLanguage } from "@/lib/types";
import type { ResourceSort } from "@/lib/catalog";

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
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-faint">
              {t.explore.sortLabel}
            </span>
            <SortButton
              active={srt === "top"}
              onClick={() => pushState(sel, "top", lng)}
            >
              {t.explore.sortTop}
            </SortButton>
            <SortButton
              active={srt === "new"}
              onClick={() => pushState(sel, "new", lng)}
            >
              {t.explore.sortNew}
            </SortButton>
          </div>

          {/* Idioma hablado del video */}
          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-faint">
              {t.explore.languageLabel}
            </span>
            <SortButton
              active={lng === null}
              onClick={() => pushState(sel, srt, null)}
            >
              {t.language.filterAll}
            </SortButton>
            <SortButton
              active={lng === "es"}
              onClick={() => pushState(sel, srt, "es")}
            >
              {t.language.videoEs}
            </SortButton>
            <SortButton
              active={lng === "en"}
              onClick={() => pushState(sel, srt, "en")}
            >
              {t.language.videoEn}
            </SortButton>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip
            active={sel.length === 0}
            onClick={() => pushState([], srt, lng)}
          >
            {t.explore.allCategories}
          </Chip>
          {categories.map((c) => (
            <Chip
              key={c.id}
              active={sel.includes(c.slug)}
              onClick={() => toggle(c.slug)}
            >
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

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition active:scale-95 ${
        active
          ? "bg-accent/15 text-accent-ink ring-1 ring-accent/40"
          : "text-muted hover:bg-fill hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition active:scale-95 ${
        active
          ? "bg-accent text-on-accent"
          : "bg-fill text-muted ring-1 ring-border hover:bg-fill-strong hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
