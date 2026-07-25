"use client";

import { useState } from "react";
import { LocaleLink } from "@/components/LocaleLink";
import { useT } from "@/components/I18nProvider";
import { fmt } from "@/lib/i18n";

type Mode = "login" | "signup";

// Formulario de acceso (entrar / registro). POST a las rutas /api/auth/* y, al
// entrar con éxito, recarga a `next` para que toda la app (nav incluida) refleje
// la sesión. En el registro con confirmación por correo, muestra el aviso de
// "revisa tu correo" en lugar de redirigir.
export function AuthForm({
  mode,
  next = "/",
  initialError,
}: {
  mode: Mode;
  next?: string;
  initialError?: string;
}) {
  const isSignup = mode === "signup";
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError === "confirm"
      ? t.auth.confirmError
      : null
  );
  const [sent, setSent] = useState(false);

  const safeNext = next.startsWith("/") ? next : "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isSignup ? { email, password, displayName } : { email, password }
        ),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        needsConfirmation?: boolean;
      };

      if (!res.ok) {
        setError(data.error ?? t.auth.genericError);
        return;
      }

      if (isSignup && data.needsConfirmation) {
        setSent(true);
        return;
      }

      // Sesión iniciada: recarga completa para propagar la sesión al servidor.
      window.location.assign(safeNext);
    } catch {
      setError(t.auth.networkError);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-2xl">
          ✉️
        </div>
        <h1 className="font-display text-2xl font-black tracking-tight text-foreground">
          {t.auth.checkEmailTitle}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted">
          {fmt(t.auth.checkEmailBody, { email })}
        </p>
        <LocaleLink
          href="/entrar"
          className="mt-6 inline-block text-sm font-semibold text-accent-ink underline decoration-2 underline-offset-4"
        >
          {t.auth.backToSignIn}
        </LocaleLink>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-black tracking-tight text-foreground">
        {isSignup ? t.auth.signUpTitle : t.auth.signInTitle}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {isSignup ? t.auth.signUpSubtitle : t.auth.signInSubtitle}
      </p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
        {isSignup && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t.auth.nameLabel}
            </span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t.auth.namePlaceholder}
              autoComplete="name"
              className="rounded-lg bg-surface px-4 py-2.5 text-sm text-foreground ring-1 ring-border transition focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t.auth.emailLabel}
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.auth.emailPlaceholder}
            autoComplete="email"
            className="rounded-lg bg-surface px-4 py-2.5 text-sm text-foreground ring-1 ring-border transition focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t.auth.passwordLabel}
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={
              isSignup
                ? t.auth.passwordPlaceholderSignUp
                : t.auth.passwordPlaceholderSignIn
            }
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={isSignup ? 8 : undefined}
            className="rounded-lg bg-surface px-4 py-2.5 text-sm text-foreground ring-1 ring-border transition focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="brand-gradient mt-1 rounded-full px-6 py-3 text-sm font-bold text-on-accent shadow-lg shadow-black/20 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? t.auth.submitting
            : isSignup
              ? t.auth.submitSignUp
              : t.auth.submitSignIn}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        {isSignup ? (
          <>
            {t.auth.haveAccount}{" "}
            <LocaleLink
              href="/entrar"
              className="font-semibold text-accent-ink underline decoration-2 underline-offset-4"
            >
              {t.auth.haveAccountLink}
            </LocaleLink>
          </>
        ) : (
          <>
            {t.auth.noAccount}{" "}
            <LocaleLink
              href="/registro"
              className="font-semibold text-accent-ink underline decoration-2 underline-offset-4"
            >
              {t.auth.noAccountLink}
            </LocaleLink>
          </>
        )}
      </p>
    </div>
  );
}
