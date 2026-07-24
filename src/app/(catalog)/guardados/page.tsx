import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserVotes } from "@/lib/votes";
import { getFavoriteResources } from "@/lib/favorites";
import { getCategoriesForResources } from "@/lib/catalog";
import { ResourceGrid } from "@/components/ResourceGrid";

export const dynamic = "force-dynamic";

export const metadata = { title: "Guardados" };

// Lista personal: los videos y playlists a los que el usuario le dio corazón,
// del guardado más reciente al más antiguo. Al quitar el corazón aquí la
// tarjeta desaparece (ResourceGrid con removeOnUnsave).
export default async function GuardadosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/guardados");

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
              Guardados
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              {resources.length === 0
                ? "Aquí se juntan los videos y playlists que marques con el corazón."
                : `${resources.length} ${resources.length === 1 ? "recurso guardado" : "recursos guardados"} · solo tú los ves.`}
            </p>
          </div>
        </div>
        <Link
          href="/todo"
          className="rounded-full bg-fill px-5 py-2.5 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-fill-strong"
        >
          Explorar catálogo
        </Link>
      </div>

      {resources.length === 0 ? (
        <div className="rounded-2xl bg-surface p-10 text-center ring-1 ring-border">
          <p className="text-sm text-muted">
            Todavía no has guardado nada. Pasa el cursor sobre cualquier tarjeta y
            toca el <span aria-hidden="true">♥</span> corazón para dejarlo aquí.
          </p>
          <Link
            href="/todo"
            className="mt-3 inline-block text-sm font-semibold text-accent-ink underline decoration-2 underline-offset-4"
          >
            Ir a explorar →
          </Link>
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
          empty="Todavía no has guardado nada."
        />
      )}
    </main>
  );
}
