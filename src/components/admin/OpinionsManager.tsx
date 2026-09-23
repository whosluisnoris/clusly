"use client";

import { useCallback, useEffect, useState } from "react";
import { timeAgo, formatDate } from "@/lib/dates";
import { SENTIMENTS, SENTIMENT_META, isSentiment } from "@/lib/opinions";
import {
  Alert,
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  MetaLine,
  SectionHeader,
  cn,
  textLinkClasses,
} from "@/components/ui";

interface AdminOpinion {
  id: string;
  sentiment: string;
  message: string;
  hidden: boolean;
  authorName: string;
  createdAt: string;
}

type Filter = "todas" | "pendientes" | "archivadas";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "pendientes", label: "Sin archivar" },
  { key: "archivadas", label: "Archivadas" },
];

// Buzón de opiniones: lo que la gente escribe en /opiniones llega aquí y solo
// aquí (la página pública no muestra nada). Archivar es para marcar las que ya
// leíste, sin borrarlas; borrar sí es definitivo.
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
      setError("No se pudo archivar la opinión.");
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

  const activas = opinions.filter((o) => !o.hidden);
  const shown = opinions.filter((o) =>
    filter === "todas" ? true : filter === "pendientes" ? !o.hidden : o.hidden
  );

  return (
    <section>
      <SectionHeader
        title="Opiniones de los usuarios"
        action={
          <Button variant="secondary" size="sm" onClick={load}>
            Actualizar
          </Button>
        }
      />

      {/* Reparto de sentimientos entre las opiniones sin archivar */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SENTIMENTS.map((value) => {
          const { emoji, label } = SENTIMENT_META[value];
          const count = activas.filter((o) => o.sentiment === value).length;
          const pct =
            activas.length > 0 ? Math.round((count / activas.length) * 100) : 0;
          return (
            <Card key={value} padding="sm" className="sm:p-5">
              <p className="text-xs font-semibold text-muted">
                <span aria-hidden="true">{emoji}</span> {label}
              </p>
              <p className="font-display mt-1 text-3xl font-extrabold tabular-nums text-foreground">
                {count}
                <span className="ml-1.5 font-sans text-sm font-semibold text-faint">{pct}%</span>
              </p>
            </Card>
          );
        })}
      </div>

      <div role="group" aria-label="Filtrar opiniones" className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Chip key={f.key} size="sm" pressed={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      {shown.length === 0 ? (
        <EmptyState
          description={
            opinions.length === 0
              ? "Todavía nadie ha dejado su opinión."
              : "No hay opiniones con ese filtro."
          }
        />
      ) : (
        <ul className="flex max-w-3xl flex-col gap-3">
          {shown.map((o) => {
            const meta = isSentiment(o.sentiment) ? SENTIMENT_META[o.sentiment] : null;
            return (
              <Card as="li" key={o.id} padding="sm" className={cn(o.hidden && "opacity-60")}>
                <div className="flex flex-wrap items-center gap-2">
                  <span aria-hidden="true">{meta?.emoji ?? ""}</span>
                  <MetaLine
                    items={[
                      <span key="a" className="font-bold text-foreground">{o.authorName}</span>,
                      <span key="s" className="text-muted">{meta?.label ?? o.sentiment}</span>,
                      timeAgo(o.createdAt) ?? formatDate(o.createdAt),
                    ]}
                  />
                  {o.hidden && <Badge>Archivada</Badge>}
                </div>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                  {o.message}
                </p>

                <div className="mt-3 flex gap-4 text-xs">
                  <button
                    type="button"
                    onClick={() => setHidden(o.id, !o.hidden)}
                    disabled={busyId === o.id}
                    className={textLinkClasses("accent")}
                  >
                    {o.hidden ? "Restaurar" : "Archivar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(o.id)}
                    disabled={busyId === o.id}
                    className={textLinkClasses("danger")}
                  >
                    Borrar
                  </button>
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </section>
  );
}
