import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, type Role } from "@/lib/auth";
import { getProfile, getProfileStats } from "@/lib/profile";
import { ProfileCard } from "@/components/ProfileCard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mi perfil" };

const ROLE_LABEL: Record<Role, string | null> = {
  owner: "Owner",
  admin: "Admin",
  user: null, // la cuenta normal no lleva distintivo
};

// Perfil propio: los datos de la cuenta, la biografía y los enlaces (editables
// en el sitio) más un resumen de la actividad, con atajos a cada sección.
export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/perfil");

  const [profile, stats] = await Promise.all([
    getProfile(user.id, user.displayName),
    getProfileStats(user.id),
  ]);

  const cards: { label: string; value: number; href: string; hint: string }[] = [
    {
      label: "Aportes",
      value: stats.aportes,
      href: "/mis-videos",
      hint: "videos y playlists que subiste",
    },
    {
      label: "Guardados",
      value: stats.guardados,
      href: "/guardados",
      hint: "tu lista privada",
    },
    {
      label: "Votos",
      value: stats.votos,
      href: "/todo",
      hint: "recursos que has votado",
    },
    {
      label: "Opiniones",
      value: stats.opiniones,
      href: "/opiniones",
      hint: "lo que nos has contado",
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
          Tu actividad
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cards.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              title={c.hint}
              className="rounded-xl bg-surface p-4 ring-1 ring-border transition hover:ring-accent/40"
            >
              <p className="text-2xl font-black tabular-nums text-foreground">
                {c.value}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-muted">{c.label}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Atajos" className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/enviar"
          className="brand-gradient rounded-full px-5 py-2.5 text-sm font-bold text-on-accent shadow-lg shadow-black/20 transition hover:brightness-110 active:scale-95"
        >
          + Aportar video
        </Link>
        <Link
          href="/guardados"
          className="rounded-full bg-fill px-5 py-2.5 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-fill-strong"
        >
          Ver guardados
        </Link>
        <Link
          href="/opiniones"
          className="rounded-full bg-fill px-5 py-2.5 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-fill-strong"
        >
          Dejar una opinión
        </Link>
      </section>
    </main>
  );
}
