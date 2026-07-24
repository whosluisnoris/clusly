"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSessionId } from "@/lib/analytics";
import { SENTIMENTS, SENTIMENT_META, MAX_MESSAGE, type Sentiment } from "@/lib/opinions";

// Formulario de la sección de opiniones: cómo te sientes + qué quieres contar.
// Funciona sin cuenta (la opinión sale como "Anónimo"); con sesión va firmada
// con el nombre visible. Tras publicar, refresca la página para que la opinión
// recién enviada aparezca en la lista (que se pinta en el servidor).
export function OpinionForm({
  displayName,
}: {
  displayName?: string | null;
}) {
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sentiment) {
      setError("Elige cómo te sientes con Clusly.");
      return;
    }
    if (message.trim().length < 3) {
      setError("Cuéntanos un poco más (mínimo 3 caracteres).");
      return;
    }

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/opinions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentiment,
          message: message.trim(),
          sessionId: getSessionId(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo publicar tu opinión.");
        return;
      }
      setSent(true);
      setMessage("");
      setSentiment(null);
      router.refresh();
    } catch {
      setError("No se pudo publicar tu opinión, revisa tu conexión.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="glass backdrop-blur-md rounded-2xl p-6 text-center">
        <p className="text-sm font-semibold text-foreground">
          ¡Gracias por escribir! 💚
        </p>
        <p className="mt-1.5 text-sm text-muted">
          Tu opinión ya está abajo y la leemos toda.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 text-sm font-semibold text-accent-ink underline decoration-2 underline-offset-4"
        >
          Escribir otra
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass backdrop-blur-md rounded-2xl p-5 sm:p-6">
      <fieldset>
        <legend className="text-sm font-bold text-foreground">
          ¿Cómo te sientes con Clusly?
        </legend>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {SENTIMENTS.map((value) => {
            const { emoji, label } = SENTIMENT_META[value];
            const active = sentiment === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSentiment(value)}
                aria-pressed={active}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition active:scale-95 ${
                  active
                    ? "bg-accent text-on-accent"
                    : "bg-fill text-foreground ring-1 ring-border hover:bg-accent/15 hover:text-accent-ink"
                }`}
              >
                {emoji} {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label
        htmlFor="opinion-message"
        className="mt-5 block text-sm font-bold text-foreground"
      >
        ¿Qué nos quieres contar?
      </label>
      <textarea
        id="opinion-message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={MAX_MESSAGE}
        rows={4}
        placeholder="Qué te sirve, qué te falta, qué agregarías…"
        className="mt-2 w-full resize-y rounded-xl bg-fill px-3.5 py-2.5 text-sm text-foreground placeholder-faint ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-accent/50"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {displayName ? (
            <>
              Se publicará como <b className="text-foreground">{displayName}</b>.
            </>
          ) : (
            <>
              Se publicará como <b className="text-foreground">Anónimo</b>.{" "}
              <Link
                href="/entrar?next=/opiniones"
                className="text-accent-ink underline underline-offset-2"
              >
                Entra
              </Link>{" "}
              si quieres firmarla.
            </>
          )}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-faint">
            {message.length}/{MAX_MESSAGE}
          </span>
          <button
            type="submit"
            disabled={sending}
            className="brand-gradient rounded-full px-5 py-2.5 text-sm font-bold text-on-accent shadow-lg shadow-black/20 transition hover:brightness-110 active:scale-95 disabled:opacity-60"
          >
            {sending ? "Publicando…" : "Publicar opinión"}
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </form>
  );
}
