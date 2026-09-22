import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserVotes } from "@/lib/votes";
import { getFavoriteResources } from "@/lib/favorites";
import { getCategoriesForResources } from "@/lib/catalog";
import { ResourceGrid } from "@/components/ResourceGrid";
import { getDictionary, isLocale, plural, DEFAULT_LOCALE } from "@/lib/i18n";
import { ButtonLink, EmptyState, Page, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";


// Lista personal: los videos y playlists a los que el usuario le dio corazón,
// del guardado más reciente al más antiguo. Al quitar el corazón aquí la
// tarjeta desaparece (ResourceGrid con removeOnUnsave).
export default async function GuardadosPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const uiLang = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const t = getDictionary(uiLang);

  const user = await getCurrentUser();
  if (!user) redirect(`/${uiLang}/entrar?next=/${uiLang}/guardados`);

  const resources = await getFavoriteResources(user.id);
  const resourceIds = resources.map((r) => r.id);
  const [userVotes, categoriesByResource] = await Promise.all([
    getUserVotes(user.id, resourceIds),
    getCategoriesForResources(resourceIds),
  ]);

  return (
    <Page>
      <PageHeader
        title={t.saved.title}
        description={
          resources.length === 0 ? t.saved.empty : plural(t.saved.count, resources.length)
        }
        actions={
          resources.length > 0 && (
            <ButtonLink href="/todo" variant="secondary">
              {t.saved.exploreCta}
            </ButtonLink>
          )
        }
      />

      {resources.length === 0 ? (
        <EmptyState
          description={t.saved.emptyBody}
          action={<ButtonLink href="/todo">{t.saved.emptyLink}</ButtonLink>}
        />
      ) : (
        <ResourceGrid
          resources={resources}
          from="guardados"
          userVotes={userVotes}
          categoriesByResource={categoriesByResource}
          favorites={new Set(resourceIds)}
          removeOnUnsave
          canVote
          empty={t.saved.emptyBody}
        />
      )}
    </Page>
  );
}
