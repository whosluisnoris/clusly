"use client";

import { useState } from "react";
import { LocaleLink } from "@/components/LocaleLink";
import { getSessionId } from "@/lib/analytics";
import { SENTIMENTS, MAX_MESSAGE, type Sentiment } from "@/lib/opinions";
import { useT } from "@/components/I18nProvider";
import { fmt } from "@/lib/i18n";

// Formulario de la sección de opiniones: cómo te sientes + qué quieres contar.
// Funciona sin cuenta (llega como "Anónimo"); con sesión va firmada con el
// nombre visible para poder darle seguimiento. No se publica en ningún lado:
// el mensaje va directo al buzón del equipo (/admin → Opiniones).
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
  const t = useT();

  // Etiquetas traducidas de cada sentimiento (el emoji vive en el diccionario
  // de opiniones porque también lo usa el panel).
  const labels: Record<Sentiment, { emoji: string; label: string }> = {
    me_encanta: { emoji: "😍", label: t.opinions.sentimentLove },
    puede_mejorar: { emoji: "🤔", label: t.opinions.sentimentOk },
    no_me_convence: { emoji: "😕", label: t.opinions.sentimentBad },
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sentiment) {
      setError(t.opinions.errorSentiment);
      return;
    }
    if (message.trim().length < 3) {
      setError(t.opinions.errorShort);
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
        setError(data.error ?? t.opinions.errorGeneric);
        return;
      }
      setSent(true);
      setMessage("");
      setSentiment(null);
    } catch {
      setError(t.opinions.errorNetwork);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="glass backdrop-blur-md rounded-2xl p-6 text-center">
        <p className="text-sm font-semibold text-foreground">
          {t.opinions.thanksTitle}
        </p>
        <p className="mt-1.5 text-sm text-muted">{t.opinions.thanksBody}</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 text-sm font-semibold text-accent-ink underline decoration-2 underline-offset-4"
        >
          {t.opinions.writeAnother}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass backdrop-blur-md rounded-2xl p-5 sm:p-6">
      <fieldset>
        <legend className="text-sm font-bold text-foreground">
          {t.opinions.sentimentQuestion}
        </legend>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {SENTIMENTS.map((value) => {
            const { emoji, label } = labels[value];
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
        {t.opinions.messageLabel}
      </label>
      <textarea
        id="opinion-message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={MAX_MESSAGE}
        rows={4}
        placeholder={t.opinions.messagePlaceholder}
        className="mt-2 w-full resize-y rounded-xl bg-fill px-3.5 py-2.5 text-sm text-foreground placeholder-faint ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-accent/50"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {displayName ? (
            <>{fmt(t.opinions.signedAs, { name: displayName })}</>
          ) : (
            <>
              {t.opinions.anonAs}{" "}
              <LocaleLink
                href="/entrar?next=/opiniones"
                className="text-accent-ink underline underline-offset-2"
              >
                {t.opinions.signInToSign}
              </LocaleLink>{" "}
              {t.opinions.signInToSignAfter}
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
            {sending ? t.common.sending : t.opinions.submit}
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </form>
  );
}
