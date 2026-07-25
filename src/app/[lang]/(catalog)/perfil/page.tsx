import { LocaleLink } from "@/components/LocaleLink";
import { redirect } from "next/navigation";
import { getCurrentUser, type Role } from "@/lib/auth";
import { getProfile, getProfileStats } from "@/lib/profile";
import { ProfileCard } from "@/components/ProfileCard";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-dynamic";


const ROLE_LABEL: Record<Role, string | null> = {
  owner: "Owner",
  admin: "Admin",
  user: null, // la cuenta normal no lleva distintivo
};

// Perfil propio: los datos de la cuenta, la biografía y los enlaces (editables
// en el sitio) más un resumen de la actividad, con atajos a cada sección.
export default async function PerfilPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const uiLang = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const t = getDictionary(uiLang);

  const user = await getCurrentUser();
  if (!user) redirect(`/${uiLang}/entrar?next=/${uiLang}/perfil`);

  const [profile, stats] = await Promise.all([
    getProfile(user.id, user.displayName),
    getProfileStats(user.id),
  ]);

  const cards: { label: string; value: number; href: string; hint: string }[] = [
    {
      label: t.profile.statContributions,
      value: stats.aportes,
      href: "/mis-videos",
      hint: t.profile.statContributionsHint,
    },
    {
      label: t.profile.statSaved,
      value: stats.guardados,
      href: "/guardados",
      hint: t.profile.statSavedHint,
    },
    {
      label: t.profile.statVotes,
      value: stats.votos,
      href: "/todo",
      hint: t.profile.statVotesHint,
    },
    {
      label: t.profile.statOpinions,
      value: stats.opiniones,
      href: "/opiniones",
      hint: t.profile.statOpinionsHint,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-8">
      <ProfileCard
        profile={profile}
        email={user.email}
        roleLabel={ROLE_LABEL[user.role]}
      />

      <section aria-label="Tu actividad" className="mt-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
          {t.profile.activityTitle}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cards.map((c) => (
            <LocaleLink
              key={c.label}
              href={c.href}
              title={c.hint}
              className="rounded-xl bg-surface p-4 ring-1 ring-border transition hover:ring-accent/40"
            >
              <p className="text-2xl font-black tabular-nums text-foreground">
                {c.value}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-muted">{c.label}</p>
            </LocaleLink>
          ))}
        </div>
      </section>

      <section aria-label="Atajos" className="mt-6 flex flex-wrap gap-3">
        <LocaleLink
          href="/enviar"
          className="brand-gradient rounded-full px-5 py-2.5 text-sm font-bold text-on-accent shadow-lg shadow-black/20 transition hover:brightness-110 active:scale-95"
        >
          {t.profile.shortcutSubmit}
        </LocaleLink>
        <LocaleLink
          href="/guardados"
          className="rounded-full bg-fill px-5 py-2.5 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-fill-strong"
        >
          {t.profile.shortcutSaved}
        </LocaleLink>
        <LocaleLink
          href="/opiniones"
          className="rounded-full bg-fill px-5 py-2.5 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-fill-strong"
        >
          {t.profile.shortcutOpinion}
        </LocaleLink>
      </section>
    </main>
  );
}
