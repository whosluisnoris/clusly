"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Category } from "@/lib/types";
import { CategoryMultiSelect } from "@/components/CategoryMultiSelect";
import { getSessionId } from "@/lib/analytics";

type Result =
  | { kind: "success"; youtubeId?: string; warning?: string; pending?: boolean }
  | { kind: "duplicate"; youtubeId?: string }
  | { kind: "error"; message: string };

// Borrador del aporte: sobrevive a irse a /entrar y volver, para que nadie
// pierda lo que ya escribió por tener que crear cuenta a la mitad.
const DRAFT_KEY = "clusly_envio_borrador";

interface Draft {
  url: string;
  categoryIds: string[];
}

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    if (typeof parsed.url !== "string") return null;
    return {
      url: parsed.url,
      categoryIds: Array.isArray(parsed.categoryIds)
        ? parsed.categoryIds.filter((c): c is string => typeof c === "string")
        : [],
    };
  } catch {
    return null;
  }
}

function writeDraft(draft: Draft | null) {
  try {
    if (draft === null) localStorage.removeItem(DRAFT_KEY);
    else localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* sin localStorage el formulario sigue funcionando, solo no se recuerda */
  }
}

// Formulario para aportar un video. Cualquiera puede llenarlo: pega una URL de
// YouTube y elige categorías. Al confirmar, si no hay sesión se ofrece entrar
// (el borrador queda guardado) o mandarlo sin cuenta, en cuyo caso el aporte
// entra como pendiente de aprobación. Detecta duplicados y enlaza al existente.
export function SubmitForm({
  categories,
  loggedIn,
}: {
  categories: Category[];
  loggedIn: boolean;
}) {
  const [url, setUrl] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  // "form" es el formulario; "cuenta" es el paso que pide sesión antes de
  // publicar (solo aparece cuando no hay usuario).
  const [step, setStep] = useState<"form" | "cuenta">("form");

  // Recupera el borrador al montar (en efecto, para no divergir del SSR).
  useEffect(() => {
    const draft = readDraft();
    if (draft) {
      setUrl(draft.url);
      setSelected(draft.categoryIds);
    }
  }, []);

  function updateUrl(value: string) {
    setUrl(value);
    writeDraft({ url: value, categoryIds: selected });
  }

  function updateCategories(ids: string[]) {
    setSelected(ids);
    writeDraft({ url, categoryIds: ids });
  }

  async function publish() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          categoryIds: selected,
          sessionId: getSessionId(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        youtubeId?: string;
        warning?: string;
        pending?: boolean;
      };

      if (res.status === 409) {
        setResult({ kind: "duplicate", youtubeId: data.youtubeId });
        writeDraft(null);
        setUrl("");
        setSelected([]);
      } else if (!res.ok) {
        setResult({ kind: "error", message: data.error ?? "No se pudo agregar el video." });
      } else {
        setResult({
          kind: "success",
          youtubeId: data.youtubeId,
          warning: data.warning,
          pending: data.pending,
        });
        writeDraft(null);
        setUrl("");
        setSelected([]);
      }
    } catch {
      setResult({ kind: "error", message: "No hay conexión. Intenta de nuevo." });
    } finally {
      setLoading(false);
      setStep("form");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Sin sesión, primero se ofrece entrar; el borrador ya está guardado.
    if (!loggedIn) {
      writeDraft({ url, categoryIds: selected });
      setStep("cuenta");
      return;
    }
    publish();
  }

  if (step === "cuenta") {
    return (
      <div className="glass backdrop-blur-md rounded-2xl p-5 sm:p-6">
        <h2 className="text-base font-bold text-foreground">
          Ya casi. ¿Lo publicamos a tu nombre?
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          Con cuenta, tu video <b className="text-foreground">aparece al instante</b> en
          el catálogo, queda en tus aportes y puedes votar y guardar. Tu borrador está
          guardado: si entras ahora, al volver lo encuentras tal cual.
        </p>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Link
            href="/registro?next=/enviar"
            className="brand-gradient rounded-full px-5 py-2.5 text-center text-sm font-bold text-on-accent shadow-lg shadow-black/20 transition hover:brightness-110 active:scale-95"
          >
            Crear cuenta y publicar
          </Link>
          <Link
            href="/entrar?next=/enviar"
            className="rounded-full bg-fill px-5 py-2.5 text-center text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-fill-strong"
          >
            Ya tengo cuenta
          </Link>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <button
            type="button"
            onClick={publish}
            disabled={loading}
            className="text-sm font-semibold text-accent-ink underline decoration-2 underline-offset-4 disabled:opacity-60"
          >
            {loading ? "Enviando…" : "Enviarlo sin cuenta"}
          </button>
          <p className="mt-1.5 text-xs text-muted">
            También sirve: guardamos tu aporte y queda{" "}
            <b className="text-foreground">pendiente de aprobación</b> del equipo antes
            de salir en el catálogo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setStep("form")}
          className="mt-4 text-xs text-muted transition hover:text-foreground"
        >
          ← Seguir editando
        </button>

        {result?.kind === "error" && (
          <p className="mt-3 text-sm text-red-400">{result.message}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Enlace de YouTube
          </span>
          <input
            type="url"
            required
            value={url}
            onChange={(e) => updateUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=…"
            className="rounded-lg bg-surface px-4 py-2.5 text-sm text-foreground ring-1 ring-border transition focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <span className="text-xs text-faint">
            Un video suelto, o una playlist con el link /playlist?list=…
          </span>
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Categorías
          </span>
          <CategoryMultiSelect
            categories={categories}
            selected={selected}
            onChange={updateCategories}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="brand-gradient rounded-full px-6 py-3 text-sm font-bold text-on-accent shadow-lg shadow-black/20 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Agregando…" : "Publicar en Clusly"}
          </button>
          {!loggedIn && (
            <span className="text-xs text-muted">
              No necesitas cuenta para empezar: te la pedimos al confirmar.
            </span>
          )}
        </div>
      </form>

      {result && (
        <div className="mt-6">
          {result.kind === "success" && (
            <div className="rounded-xl bg-accent/10 p-4 ring-1 ring-accent/25">
              {result.pending ? (
                <>
                  <p className="text-sm font-semibold text-foreground">
                    ¡Gracias! Tu aporte quedó guardado.
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Queda pendiente de aprobación: el equipo lo revisa y, si todo está
                    bien, aparece en el catálogo. Si creas una cuenta, tus próximos
                    aportes se publican al instante.
                  </p>
                  <Link
                    href="/registro?next=/enviar"
                    className="mt-2 inline-block text-sm font-semibold text-accent-ink underline decoration-2 underline-offset-4"
                  >
                    Crear cuenta →
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-foreground">
                    ¡Gracias! Tu aporte ya está en Clusly.
                  </p>
                  {result.warning && (
                    <p className="mt-1 text-xs text-muted">{result.warning}</p>
                  )}
                  {result.youtubeId && (
                    <Link
                      href={`/recurso/${result.youtubeId}`}
                      className="mt-2 inline-block text-sm font-semibold text-accent-ink underline decoration-2 underline-offset-4"
                    >
                      Ver el video →
                    </Link>
                  )}
                </>
              )}
            </div>
          )}

          {result.kind === "duplicate" && (
            <div className="rounded-xl bg-fill p-4 ring-1 ring-border">
              <p className="text-sm font-semibold text-foreground">
                Ese video ya está en Clusly.
              </p>
              <p className="mt-1 text-xs text-muted">
                Alguien se te adelantó. Puedes ir a votarlo para que suba.
              </p>
              {result.youtubeId && (
                <Link
                  href={`/recurso/${result.youtubeId}`}
                  className="mt-2 inline-block text-sm font-semibold text-accent-ink underline decoration-2 underline-offset-4"
                >
                  Verlo →
                </Link>
              )}
            </div>
          )}

          {result.kind === "error" && (
            <p className="text-sm text-red-400">{result.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
