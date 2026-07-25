import { LocaleLink } from "@/components/LocaleLink";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserVotes } from "@/lib/votes";
import { getFavoriteResources } from "@/lib/favorites";
import { getCategoriesForResources } from "@/lib/catalog";
import { ResourceGrid } from "@/components/ResourceGrid";
import { getDictionary, isLocale, plural, DEFAULT_LOCALE } from "@/lib/i18n";

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
    <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-8 sm:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          <span
            className="brand-gradient mt-1.5 h-10 w-1.5 shrink-0 rounded-full"
            aria-hidden="true"
          />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              {t.saved.title}
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              {resources.length === 0
                ? t.saved.empty
                : plural(t.saved.count, resources.length)}
            </p>
          </div>
        </div>
        <LocaleLink
          href="/todo"
          className="rounded-full bg-fill px-5 py-2.5 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-fill-strong"
        >
          {t.saved.exploreCta}
        </LocaleLink>
      </div>

      {resources.length === 0 ? (
        <div className="rounded-2xl bg-surface p-10 text-center ring-1 ring-border">
          <p className="text-sm text-muted">{t.saved.emptyBody}</p>
          <LocaleLink
            href="/todo"
            className="mt-3 inline-block text-sm font-semibold text-accent-ink underline decoration-2 underline-offset-4"
          >
            {t.saved.emptyLink}
          </LocaleLink>
        </div>
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
    </main>
  );
}
