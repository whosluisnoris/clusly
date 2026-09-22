"use client";

import { useEffect, useState } from "react";
import type { Category, ResourceLanguage } from "@/lib/types";
import { CategoryMultiSelect } from "@/components/CategoryMultiSelect";
import { getSessionId } from "@/lib/analytics";
import { useT } from "@/components/I18nProvider";
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  Chip,
  Field,
  Input,
  TextLink,
  textLinkClasses,
} from "@/components/ui";

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
  language: ResourceLanguage;
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
      language: parsed.language === "en" ? "en" : "es",
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
  // Idioma hablado del video (no el de la interfaz).
  const [language, setLanguage] = useState<ResourceLanguage>("es");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  // "form" es el formulario; "cuenta" es el paso que pide sesión antes de
  // publicar (solo aparece cuando no hay usuario).
  const [step, setStep] = useState<"form" | "cuenta">("form");
  const t = useT();

  // Recupera el borrador al montar (en efecto, para no divergir del SSR).
  useEffect(() => {
    const draft = readDraft();
    if (draft) {
      setUrl(draft.url);
      setSelected(draft.categoryIds);
      setLanguage(draft.language);
    }
  }, []);

  function updateUrl(value: string) {
    setUrl(value);
    writeDraft({ url: value, categoryIds: selected, language });
  }

  function updateCategories(ids: string[]) {
    setSelected(ids);
    writeDraft({ url, categoryIds: ids, language });
  }

  function updateLanguage(value: ResourceLanguage) {
    setLanguage(value);
    writeDraft({ url, categoryIds: selected, language: value });
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
          language,
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
        setLanguage("es");
      } else if (!res.ok) {
        setResult({ kind: "error", message: data.error ?? t.submit.genericError });
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
        setLanguage("es");
      }
    } catch {
      setResult({ kind: "error", message: t.common.noConnection });
    } finally {
      setLoading(false);
      setStep("form");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Sin sesión, primero se ofrece entrar; el borrador ya está guardado.
    if (!loggedIn) {
      writeDraft({ url, categoryIds: selected, language });
      setStep("cuenta");
      return;
    }
    publish();
  }

  if (step === "cuenta") {
    return (
      <Card padding="lg">
        <h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
          {t.submit.accountTitle}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t.submit.accountBody}</p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <ButtonLink href="/registro?next=/enviar">{t.submit.accountSignUp}</ButtonLink>
          <ButtonLink href="/entrar?next=/enviar" variant="secondary">
            {t.submit.accountSignIn}
          </ButtonLink>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <button
            type="button"
            onClick={publish}
            disabled={loading}
            className={textLinkClasses("accent", "text-sm")}
          >
            {loading ? t.common.sending : t.submit.accountAnon}
          </button>
          <p className="mt-1.5 text-xs text-muted">{t.submit.accountAnonHint}</p>
        </div>

        <button
          type="button"
          onClick={() => setStep("form")}
          className={textLinkClasses("muted", "mt-5 text-xs no-underline")}
        >
          {t.submit.keepEditing}
        </button>

        {result?.kind === "error" && (
          <Alert tone="error" className="mt-4">
            {result.message}
          </Alert>
        )}
      </Card>
    );
  }

  return (
    <div>
      <Card as="form" padding="lg" onSubmit={handleSubmit} className="flex flex-col gap-7">
        <Field label={t.submit.urlLabel} hint={t.submit.urlHint}>
          <Input
            type="url"
            required
            value={url}
            onChange={(e) => updateUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=…"
          />
        </Field>

        <Field group label={t.submit.categoriesLabel}>
          <CategoryMultiSelect
            categories={categories}
            selected={selected}
            onChange={updateCategories}
          />
        </Field>

        {/* Idioma hablado del video: alimenta el filtro de la exploración */}
        <Field group label={t.language.videoLabel} hint={t.submit.languageHint}>
          <div className="flex gap-2">
            {(["es", "en"] as const).map((value) => (
              <Chip
                key={value}
                pressed={language === value}
                onClick={() => updateLanguage(value)}
              >
                {value === "es" ? t.language.videoEs : t.language.videoEn}
              </Chip>
            ))}
          </div>
        </Field>

        <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={!url.trim()}
            loading={loading}
            loadingText={t.submit.submitting}
          >
            {t.submit.submitButton}
          </Button>
          {!loggedIn && (
            <span className="text-xs text-muted">{t.submit.guestHint}</span>
          )}
        </div>
      </Card>

      {result && (
        <div className="mt-6">
          {result.kind === "success" &&
            (result.pending ? (
              <Alert
                tone="success"
                title={t.submit.pendingTitle}
                action={
                  <TextLink href="/registro?next=/enviar" className="text-sm">
                    {t.submit.pendingCta}
                  </TextLink>
                }
              >
                {t.submit.pendingBody}
              </Alert>
            ) : (
              <Alert
                tone="success"
                title={t.submit.successTitle}
                action={
                  result.youtubeId && (
                    <TextLink href={`/recurso/${result.youtubeId}`} className="text-sm">
                      {t.submit.successLink}
                    </TextLink>
                  )
                }
              >
                {result.warning}
              </Alert>
            ))}

          {result.kind === "duplicate" && (
            <Alert
              title={t.submit.duplicateTitle}
              action={
                result.youtubeId && (
                  <TextLink href={`/recurso/${result.youtubeId}`} className="text-sm">
                    {t.submit.duplicateLink}
                  </TextLink>
                )
              }
            >
              {t.submit.duplicateBody}
            </Alert>
          )}

          {result.kind === "error" && <Alert tone="error">{result.message}</Alert>}
        </div>
      )}
    </div>
  );
}
