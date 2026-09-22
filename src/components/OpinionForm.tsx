"use client";

import { useState } from "react";
import { getSessionId } from "@/lib/analytics";
import { SENTIMENTS, MAX_MESSAGE, type Sentiment } from "@/lib/opinions";
import { useT } from "@/components/I18nProvider";
import { fmt } from "@/lib/i18n";
import { Alert, Button, Card, Chip, Field, Textarea, TextLink, textLinkClasses } from "@/components/ui";

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
      <Card padding="lg" className="text-center">
        <p className="font-display text-lg font-bold text-foreground">
          {t.opinions.thanksTitle}
        </p>
        <p className="mt-1.5 text-sm text-muted">{t.opinions.thanksBody}</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className={textLinkClasses("accent", "mt-4 text-sm")}
        >
          {t.opinions.writeAnother}
        </button>
      </Card>
    );
  }

  return (
    <Card as="form" onSubmit={submit} className="flex flex-col gap-6">
      <Field group label={t.opinions.sentimentQuestion}>
        <div className="flex flex-wrap gap-2">
          {SENTIMENTS.map((value) => {
            const { emoji, label } = labels[value];
            return (
              <Chip
                key={value}
                pressed={sentiment === value}
                onClick={() => setSentiment(value)}
              >
                <span aria-hidden="true">{emoji}</span> {label}
              </Chip>
            );
          })}
        </div>
      </Field>

      <Field label={t.opinions.messageLabel} counter={`${message.length}/${MAX_MESSAGE}`}>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={MAX_MESSAGE}
          placeholder={t.opinions.messagePlaceholder}
        />
      </Field>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-muted">
          {displayName ? (
            fmt(t.opinions.signedAs, { name: displayName })
          ) : (
            <>
              {t.opinions.anonAs}{" "}
              <TextLink href="/entrar?next=/opiniones">{t.opinions.signInToSign}</TextLink>{" "}
              {t.opinions.signInToSignAfter}
            </>
          )}
        </p>
        <Button
          type="submit"
          loading={sending}
          loadingText={t.common.sending}
          className="w-full sm:w-auto"
        >
          {t.opinions.submit}
        </Button>
      </div>
    </Card>
  );
}
