import {
  getActiveCategories,
  getResourcesFiltered,
  getCategoriesForResources,
  type ResourceSort,
} from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth";
import { getUserVotes } from "@/lib/votes";
import { getUserFavorites } from "@/lib/favorites";
import { ResourceGrid } from "@/components/ResourceGrid";
import { ExploreFilters } from "@/components/ExploreFilters";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import type { ResourceLanguage } from "@/lib/types";

export const dynamic = "force-dynamic";

// Exploración: recursos de todas las categorías con filtros (categoría, orden e
// idioma hablado del video). Por defecto muestra los más votados. El estado del
// filtro vive en la URL.
//
// Cuidado con los dos idiomas: `lang` en la ruta es el de la interfaz; `lang` en
// la query es el idioma del video.
export default async function TodoPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ cat?: string; sort?: string; lang?: string }>;
}) {
  const { lang } = await params;
  const uiLang = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const t = getDictionary(uiLang);

  const { cat, sort: sortParam, lang: langParam } = await searchParams;
  const selectedSlugs = (cat ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const sort: ResourceSort = sortParam === "new" ? "new" : "top";
  const language: ResourceLanguage | null =
    langParam === "es" || langParam === "en" ? langParam : null;

  const [categories, resources, user] = await Promise.all([
    getActiveCategories(),
    getResourcesFiltered({ categorySlugs: selectedSlugs, sort, language }),
    getCurrentUser(),
  ]);
  const resourceIds = resources.map((r) => r.id);
  const [userVotes, categoriesByResource, favorites] = await Promise.all([
    user ? getUserVotes(user.id, resourceIds) : Promise.resolve<Record<string, number>>({}),
    getCategoriesForResources(resourceIds),
    user ? getUserFavorites(user.id, resourceIds) : Promise.resolve(new Set<string>()),
  ]);

  const filtering = selectedSlugs.length > 0 || language !== null;

  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-8 sm:px-8">
      <div className="mb-8 flex items-start gap-4">
        <span
          className="brand-gradient mt-1.5 h-10 w-1.5 shrink-0 rounded-full"
          aria-hidden="true"
        />
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {t.explore.title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">{t.explore.subtitle}</p>
        </div>
      </div>

      <ExploreFilters
        categories={categories}
        selected={selectedSlugs}
        sort={sort}
        language={language}
      />

      <ResourceGrid
        resources={resources}
        from="todo"
        userVotes={userVotes}
        categoriesByResource={categoriesByResource}
        favorites={favorites}
        canVote={!!user}
        empty={filtering ? t.explore.emptyFiltered : t.explore.empty}
      />
    </main>
  );
}
