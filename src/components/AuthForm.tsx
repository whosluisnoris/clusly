"use client";

import { useState } from "react";
import { useT } from "@/components/I18nProvider";
import { fmt } from "@/lib/i18n";
import { Alert, Button, Field, IconTile, Input, PageHeader, TextLink } from "@/components/ui";

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
      <div className="flex flex-col items-center text-center">
        <IconTile size="lg" className="mb-5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </IconTile>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          {t.auth.checkEmailTitle}
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
          {fmt(t.auth.checkEmailBody, { email })}
        </p>
        <TextLink href="/entrar" className="mt-6 text-sm">
          {t.auth.backToSignIn}
        </TextLink>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        size="md"
        className="mb-7"
        title={isSignup ? t.auth.signUpTitle : t.auth.signInTitle}
        description={isSignup ? t.auth.signUpSubtitle : t.auth.signInSubtitle}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {isSignup && (
          <Field label={t.auth.nameLabel}>
            <Input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t.auth.namePlaceholder}
              autoComplete="name"
            />
          </Field>
        )}

        <Field label={t.auth.emailLabel}>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.auth.emailPlaceholder}
            autoComplete="email"
          />
        </Field>

        <Field label={t.auth.passwordLabel}>
          <Input
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
          />
        </Field>

        {error && <Alert tone="error">{error}</Alert>}

        <Button type="submit" block loading={loading} loadingText={t.auth.submitting}>
          {isSignup ? t.auth.submitSignUp : t.auth.submitSignIn}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        {isSignup ? t.auth.haveAccount : t.auth.noAccount}{" "}
        <TextLink href={isSignup ? "/entrar" : "/registro"}>
          {isSignup ? t.auth.haveAccountLink : t.auth.noAccountLink}
        </TextLink>
      </p>
    </div>
  );
}
