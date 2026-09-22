import { notFound } from "next/navigation";
import {
  getCategoryBySlug,
  getResourcesByCategory,
  getCategoriesForResources,
} from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth";
import { getUserVotes } from "@/lib/votes";
import { getUserFavorites } from "@/lib/favorites";
import { ResourceGrid } from "@/components/ResourceGrid";
import { catColor, topicColor } from "@/lib/color";
import { CategoryIcon } from "@/components/CategoryIcon";
import { getDictionary, isLocale, localizeCategory, DEFAULT_LOCALE } from "@/lib/i18n";
import { Page, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

// Grid de recursos de una categoría. La cabecera lleva el ícono en el color de
// la temática, igual que su tarjeta en la landing.
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string; lang: string }>;
}) {
  const { slug, lang } = await params;
  const t = getDictionary(isLocale(lang) ? lang : DEFAULT_LOCALE);
  // La sesión no depende de la categoría: se pide en paralelo.
  const [category, user] = await Promise.all([
    getCategoryBySlug(slug),
    getCurrentUser(),
  ]);
  if (!category) notFound();

  const resources = await getResourcesByCategory(category.id);
  const resourceIds = resources.map((r) => r.id);
  const [userVotes, categoriesByResource, favorites] = await Promise.all([
    user ? getUserVotes(user.id, resourceIds) : Promise.resolve<Record<string, number>>({}),
    getCategoriesForResources(resourceIds),
    user ? getUserFavorites(user.id, resourceIds) : Promise.resolve(new Set<string>()),
  ]);
  const color = catColor(category.color);
  const { name, description } = localizeCategory(category, t);

  return (
    <Page>
      <PageHeader
        title={name}
        description={description}
        icon={<CategoryIcon slug={slug} />}
        iconColor={topicColor(slug)}
        back={{ href: "/todo", label: t.nav.explore }}
      />
      <ResourceGrid
        resources={resources}
        from={slug}
        accent={color}
        userVotes={userVotes}
        categoriesByResource={categoriesByResource}
        favorites={favorites}
        canVote={!!user}
        empty={t.category.empty}
      />
    </Page>
  );
}
