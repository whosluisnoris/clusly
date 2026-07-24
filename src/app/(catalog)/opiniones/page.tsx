import { getCurrentUser } from "@/lib/auth";
import {
  getPublicOpinions,
  getOpinionSummary,
  SENTIMENTS,
  SENTIMENT_META,
} from "@/lib/opinions";
import { OpinionForm } from "@/components/OpinionForm";
import { timeAgo, formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Opiniones",
  description:
    "Qué opina la comunidad de Clusly y qué le gustaría ver a continuación. Deja la tuya.",
};

// Sección de opiniones: el termómetro de la comunidad. Arriba, el reparto de
// sentimientos y el formulario; abajo, lo que ha escrito la gente (solo lo que
// no está oculto por moderación).
export default async function OpinionesPage() {
  const [user, summary, opinions] = await Promise.all([
    getCurrentUser(),
    getOpinionSummary(),
    getPublicOpinions(),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-8">
      <div className="mb-8 flex items-start gap-4">
        <span
          className="brand-gradient mt-1.5 h-10 w-1.5 shrink-0 rounded-full"
          aria-hidden="true"
        />
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Opiniones
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Clusly se construye con lo que dice quien la usa. Cuéntanos qué te
            sirve, qué te falta y qué agregarías.
          </p>
        </div>
      </div>

      {/* Termómetro: cómo se reparten las opiniones publicadas */}
      {summary.total > 0 && (
        <section
          aria-label="Resumen de opiniones"
          className="mb-6 flex flex-col gap-2.5 rounded-2xl bg-surface p-5 ring-1 ring-border"
        >
          <h2 className="text-sm font-bold text-foreground">
            Así se siente la comunidad{" "}
            <span className="font-normal text-faint">
              ({summary.total} {summary.total === 1 ? "opinión" : "opiniones"})
            </span>
          </h2>
          {SENTIMENTS.map((value) => {
            const { emoji, label } = SENTIMENT_META[value];
            const count = summary.counts[value];
            const pct = Math.round((count / summary.total) * 100);
            return (
              <div key={value} className="flex items-center gap-3 text-xs">
                <span className="w-36 shrink-0 text-muted">
                  {emoji} {label}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-fill">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right tabular-nums text-muted">
                  {count} · {pct}%
                </span>
              </div>
            );
          })}
        </section>
      )}

      <OpinionForm displayName={user?.displayName} />

      <section aria-label="Opiniones de la comunidad" className="mt-10">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">
          Lo que dice la comunidad{" "}
          {opinions.length > 0 && (
            <span className="text-faint">({opinions.length})</span>
          )}
        </h2>

        {opinions.length === 0 ? (
          <p className="rounded-2xl bg-surface p-8 text-center text-sm text-muted ring-1 ring-border">
            Todavía no hay opiniones publicadas. La tuya puede ser la primera.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {opinions.map((o) => {
              const { emoji, label } = SENTIMENT_META[o.sentiment];
              return (
                <li
                  key={o.id}
                  className="rounded-2xl bg-surface p-5 ring-1 ring-border"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <span className="text-base" aria-hidden="true">
                      {emoji}
                    </span>
                    <span className="font-bold text-foreground">{o.authorName}</span>
                    <span className="text-faint">·</span>
                    <span className="text-muted">{label}</span>
                    <span className="text-faint">·</span>
                    <time dateTime={o.createdAt} className="text-faint">
                      {timeAgo(o.createdAt) ?? formatDate(o.createdAt)}
                    </time>
                  </div>
                  <p className="mt-2.5 whitespace-pre-wrap break-words text-sm text-foreground">
                    {o.message}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
