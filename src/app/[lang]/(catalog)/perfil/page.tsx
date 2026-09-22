import { redirect } from "next/navigation";
import { getCurrentUser, type Role } from "@/lib/auth";
import { getProfile, getProfileStats } from "@/lib/profile";
import { ProfileCard } from "@/components/ProfileCard";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import { ButtonLink, GlowCard, Page, SectionHeader } from "@/components/ui";

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
    <Page size="content">
      <ProfileCard
        profile={profile}
        email={user.email}
        roleLabel={ROLE_LABEL[user.role]}
      />

      <section aria-labelledby="actividad" className="mt-10">
        <SectionHeader size="sm" id="actividad" title={t.profile.activityTitle} />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {cards.map((c) => (
            <GlowCard key={c.label} href={c.href} title={c.hint} className="p-4 sm:p-5">
              <p className="font-display text-3xl font-extrabold tabular-nums text-foreground">
                {c.value}
              </p>
              <p className="mt-1 text-xs font-semibold text-muted sm:text-[13px]">{c.label}</p>
            </GlowCard>
          ))}
        </div>
      </section>

      <section
        aria-label={t.profile.shortcutsLabel}
        className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap"
      >
        <ButtonLink href="/enviar">{t.profile.shortcutSubmit}</ButtonLink>
        <ButtonLink href="/guardados" variant="secondary">
          {t.profile.shortcutSaved}
        </ButtonLink>
        <ButtonLink href="/opiniones" variant="secondary">
          {t.profile.shortcutOpinion}
        </ButtonLink>
      </section>
    </Page>
  );
}
