import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getUserVotes } from "@/lib/votes";
import { getUserFavorites } from "@/lib/favorites";
import { ResourceGrid } from "@/components/ResourceGrid";
import { getCategoriesForResources } from "@/lib/catalog";
import type { ResourceRow } from "@/lib/types";
import { getDictionary, isLocale, plural, fmt, DEFAULT_LOCALE } from "@/lib/i18n";
import {
  Badge,
  ButtonLink,
  EmptyState,
  Page,
  PageHeader,
  SectionHeader,
} from "@/components/ui";

export const dynamic = "force-dynamic";


// Videos aportados por el usuario. Se leen con el cliente service-role para
// incluir también los ocultados por moderación (no visibles para el público).
export default async function MisVideosPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const uiLang = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const t = getDictionary(uiLang);

  const user = await getCurrentUser();
  if (!user) redirect(`/${uiLang}/entrar?next=/${uiLang}/mis-videos`);

  const { data } = await getSupabaseAdmin()
    .from("resources")
    .select("*")
    .eq("submitted_by", user.id)
    .order("added_at", { ascending: false });

  const all = (data as ResourceRow[] | null) ?? [];
  const published = all.filter((r) => r.status !== "hidden");
  const hidden = all.filter((r) => r.status === "hidden");
  const publishedIds = published.map((r) => r.id);
  const [userVotes, categoriesByResource, favorites] = await Promise.all([
    getUserVotes(user.id, publishedIds),
    getCategoriesForResources(publishedIds),
    getUserFavorites(user.id, publishedIds),
  ]);

  return (
    <Page>
      <PageHeader
        title={t.myVideos.title}
        description={
          all.length === 0 ? t.myVideos.empty : plural(t.myVideos.count, all.length)
        }
        actions={
          all.length > 0 && <ButtonLink href="/enviar">{t.myVideos.cta}</ButtonLink>
        }
      />

      {all.length === 0 ? (
        <EmptyState
          description={t.myVideos.emptyBody}
          action={<ButtonLink href="/enviar">{t.myVideos.emptyLink}</ButtonLink>}
        />
      ) : (
        <ResourceGrid
          resources={published}
          from="mis-videos"
          userVotes={userVotes}
          categoriesByResource={categoriesByResource}
          favorites={favorites}
          canVote
          empty={t.myVideos.allHidden}
        />
      )}

      {hidden.length > 0 && (
        <section className="mt-12">
          <SectionHeader size="sm" title={fmt(t.myVideos.hiddenTitle, { n: hidden.length })} />
          <ul className="flex flex-col gap-2">
            {hidden.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 ring-1 ring-border"
              >
                <span className="truncate text-sm text-muted">{r.title}</span>
                <Badge>{t.myVideos.hiddenBadge}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Page>
  );
}
