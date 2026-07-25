import { LocaleLink } from "@/components/LocaleLink";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getUserVotes } from "@/lib/votes";
import { getUserFavorites } from "@/lib/favorites";
import { ResourceGrid } from "@/components/ResourceGrid";
import { getCategoriesForResources } from "@/lib/catalog";
import type { ResourceRow } from "@/lib/types";
import { getDictionary, isLocale, plural, fmt, DEFAULT_LOCALE } from "@/lib/i18n";

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
    <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-8 sm:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          <span
            className="brand-gradient mt-1.5 h-10 w-1.5 shrink-0 rounded-full"
            aria-hidden="true"
          />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              {t.myVideos.title}
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              {all.length === 0 ? t.myVideos.empty : plural(t.myVideos.count, all.length)}
            </p>
          </div>
        </div>
        <LocaleLink
          href="/enviar"
          className="brand-gradient rounded-full px-5 py-2.5 text-sm font-bold text-on-accent shadow-lg shadow-black/20 transition hover:brightness-110 active:scale-95"
        >
          {t.myVideos.cta}
        </LocaleLink>
      </div>

      {all.length === 0 ? (
        <div className="rounded-2xl bg-surface p-10 text-center ring-1 ring-border">
          <p className="text-sm text-muted">{t.myVideos.emptyBody}</p>
          <LocaleLink
            href="/enviar"
            className="mt-3 inline-block text-sm font-semibold text-accent-ink underline decoration-2 underline-offset-4"
          >
            {t.myVideos.emptyLink}
          </LocaleLink>
        </div>
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
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">
            {fmt(t.myVideos.hiddenTitle, { n: hidden.length })}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {hidden.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-surface px-4 py-3 ring-1 ring-border"
              >
                <span className="truncate text-sm text-muted">{r.title}</span>
                <span className="shrink-0 rounded-full bg-fill px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-faint">
                  {t.myVideos.hiddenBadge}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
