"use client";

import { useCallback, useEffect, useState } from "react";
import { timeAgo, formatDate } from "@/lib/dates";
import { SENTIMENTS, SENTIMENT_META, isSentiment } from "@/lib/opinions";

interface AdminOpinion {
  id: string;
  sentiment: string;
  message: string;
  hidden: boolean;
  authorName: string;
  createdAt: string;
}

type Filter = "todas" | "visibles" | "ocultas";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "visibles", label: "Visibles" },
  { key: "ocultas", label: "Ocultas" },
];

// Panel de opiniones: lee lo que escribe la gente en /opiniones y modera lo que
// no deba mostrarse (ocultar la quita de la página pública sin borrarla).
export function OpinionsManager() {
  const [opinions, setOpinions] = useState<AdminOpinion[]>([]);
  const [filter, setFilter] = useState<Filter>("todas");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const headers = { "Content-Type": "application/json" };

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/opinions", { headers });
    if (!res.ok) {
      setError("No se pudieron cargar las opiniones.");
      return;
    }
    setError(null);
    setOpinions((await res.json()).opinions ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setHidden(id: string, hidden: boolean) {
    setBusyId(id);
    const res = await fetch("/api/admin/opinions", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id, hidden }),
    });
    if (res.ok) {
      setOpinions((prev) =>
        prev.map((o) => (o.id === id ? { ...o, hidden } : o))
      );
    } else {
      setError("No se pudo actualizar la opinión.");
    }
    setBusyId(null);
  }

  async function remove(id: string) {
    if (!confirm("¿Borrar esta opinión definitivamente?")) return;
    setBusyId(id);
    const res = await fetch("/api/admin/opinions", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setOpinions((prev) => prev.filter((o) => o.id !== id));
    } else {
      setError("No se pudo borrar la opinión.");
    }
    setBusyId(null);
  }

  const visible = opinions.filter((o) => !o.hidden);
  const shown = opinions.filter((o) =>
    filter === "todas" ? true : filter === "visibles" ? !o.hidden : o.hidden
  );

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">
          Opiniones <span className="text-accent-ink">de los usuarios</span>
        </h2>
        <button
          onClick={load}
          className="rounded-lg border border-accent/30 px-3 py-1.5 text-xs font-medium text-accent-ink transition hover:bg-accent/10"
        >
          Actualizar
        </button>
      </div>

      {/* Reparto de sentimientos entre las opiniones visibles */}
      <div className="mb-6 flex flex-wrap gap-3">
        {SENTIMENTS.map((value) => {
          const { emoji, label } = SENTIMENT_META[value];
          const count = visible.filter((o) => o.sentiment === value).length;
          const pct =
            visible.length > 0 ? Math.round((count / visible.length) * 100) : 0;
          return (
            <div
              key={value}
              className="min-w-[150px] flex-1 rounded-xl bg-surface p-4 ring-1 ring-border"
            >
              <p className="text-xs text-muted">
                {emoji} {label}
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-foreground">
                {count}
                <span className="ml-1.5 text-sm font-semibold text-faint">{pct}%</span>
              </p>
            </div>
          );
        })}
      </div>

      <div className="mb-4 flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === f.key
                ? "bg-accent text-on-accent"
                : "bg-fill text-muted ring-1 ring-border hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {shown.length === 0 ? (
        <p className="text-sm text-muted">
          {opinions.length === 0
            ? "Todavía nadie ha dejado su opinión."
            : "No hay opiniones con ese filtro."}
        </p>
      ) : (
        <ul className="flex max-w-3xl flex-col gap-3">
          {shown.map((o) => {
            const meta = isSentiment(o.sentiment) ? SENTIMENT_META[o.sentiment] : null;
            return (
              <li
                key={o.id}
                className={`glass backdrop-blur-md rounded-xl p-4 ${
                  o.hidden ? "opacity-60" : ""
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <span aria-hidden="true">{meta?.emoji ?? ""}</span>
                  <span className="font-bold text-foreground">{o.authorName}</span>
                  <span className="text-faint">·</span>
                  <span className="text-muted">{meta?.label ?? o.sentiment}</span>
                  <span className="text-faint">·</span>
                  <span className="text-faint">
                    {timeAgo(o.createdAt) ?? formatDate(o.createdAt)}
                  </span>
                  {o.hidden && (
                    <span className="rounded-full bg-fill px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-faint">
                      Oculta
                    </span>
                  )}
                </div>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">
                  {o.message}
                </p>

                <div className="mt-3 flex gap-3 text-xs">
                  <button
                    onClick={() => setHidden(o.id, !o.hidden)}
                    disabled={busyId === o.id}
                    className="font-semibold text-accent-ink transition hover:underline disabled:opacity-50"
                  >
                    {o.hidden ? "Mostrar" : "Ocultar"}
                  </button>
                  <button
                    onClick={() => remove(o.id)}
                    disabled={busyId === o.id}
                    className="font-semibold text-red-400 transition hover:underline disabled:opacity-50"
                  >
                    Borrar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
