"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  hostOf,
  isSafeUrl,
  MAX_BIO,
  MAX_LINKS,
  MAX_LINK_LABEL,
  MAX_LOCATION,
  MAX_NAME,
  type Profile,
  type ProfileLink,
} from "@/lib/profile";
import { formatDate } from "@/lib/dates";

// Tarjeta del perfil propio: muestra los datos y, al pulsar "Editar perfil",
// se convierte en el formulario. Guarda con PATCH /api/profile y refresca para
// que el resto de la página (y la barra) vean el nombre nuevo.
export function ProfileCard({
  profile,
  email,
  roleLabel,
}: {
  profile: Profile;
  email: string;
  roleLabel: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [links, setLinks] = useState<ProfileLink[]>(profile.links);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function cancel() {
    setDisplayName(profile.displayName);
    setBio(profile.bio ?? "");
    setLocation(profile.location ?? "");
    setLinks(profile.links);
    setError(null);
    setEditing(false);
  }

  function updateLink(index: number, patch: Partial<ProfileLink>) {
    setLinks((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...patch } : l))
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    // Se descartan las filas vacías; las que tengan URL deben ser http/https.
    const filled = links.filter((l) => l.url.trim() !== "");
    const invalid = filled.find((l) => !isSafeUrl(l.url.trim()));
    if (invalid) {
      setError(`"${invalid.url}" no es un enlace válido: debe empezar con https://`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          location,
          links: filled.map((l) => ({ label: l.label.trim(), url: l.url.trim() })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar tu perfil.");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("No hay conexión. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const initial = displayName.charAt(0).toUpperCase();

  if (!editing) {
    return (
      <section className="rounded-2xl bg-surface p-6 ring-1 ring-border sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <span
              className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-accent/15 text-2xl font-black text-accent-ink ring-1 ring-accent/30"
              aria-hidden="true"
            >
              {initial}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                {profile.displayName}
              </h1>
              <p className="truncate text-sm text-muted">{email}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-faint">
                {roleLabel && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 font-bold uppercase tracking-wide text-accent-ink">
                    {roleLabel}
                  </span>
                )}
                {profile.location && <span>📍 {profile.location}</span>}
                {profile.createdAt && (
                  <span>Desde {formatDate(profile.createdAt)}</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full bg-fill px-5 py-2.5 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-fill-strong"
          >
            Editar perfil
          </button>
        </div>

        <p
          className={`mt-6 whitespace-pre-wrap break-words text-sm ${
            profile.bio ? "text-foreground" : "text-faint"
          }`}
        >
          {profile.bio ?? "Todavía no has escrito tu biografía."}
        </p>

        {profile.links.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {profile.links.map((l) => (
              <li key={l.url}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1.5 rounded-full bg-fill px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border transition hover:bg-fill-strong hover:text-accent-ink"
                >
                  🔗 {l.label || hostOf(l.url)}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <form
      onSubmit={save}
      className="flex flex-col gap-5 rounded-2xl bg-surface p-6 ring-1 ring-border sm:p-8"
    >
      <h2 className="text-lg font-bold text-foreground">Editar perfil</h2>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Nombre visible
        </span>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={MAX_NAME}
          required
          className="rounded-lg bg-background px-4 py-2.5 text-sm text-foreground ring-1 ring-border transition focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        <span className="text-xs text-faint">
          Es el nombre con el que firmas tus opiniones y tus aportes.
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted">
          Biografía
          <span className="tabular-nums font-normal normal-case text-faint">
            {bio.length}/{MAX_BIO}
          </span>
        </span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={MAX_BIO}
          rows={4}
          placeholder="Qué estás aprendiendo, en qué trabajas, qué te gusta compartir…"
          className="resize-y rounded-lg bg-background px-4 py-2.5 text-sm text-foreground placeholder-faint ring-1 ring-border transition focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Ubicación
        </span>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={MAX_LOCATION}
          placeholder="Ciudad de México, remoto…"
          className="rounded-lg bg-background px-4 py-2.5 text-sm text-foreground placeholder-faint ring-1 ring-border transition focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Enlaces <span className="font-normal normal-case text-faint">(hasta {MAX_LINKS})</span>
        </span>

        {links.length === 0 && (
          <p className="text-xs text-faint">
            Tu sitio, GitHub, LinkedIn, tu canal… lo que quieras compartir.
          </p>
        )}

        {links.map((link, i) => (
          <div key={i} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={link.label}
              onChange={(e) => updateLink(i, { label: e.target.value })}
              maxLength={MAX_LINK_LABEL}
              placeholder="Nombre (GitHub…)"
              className="rounded-lg bg-background px-3 py-2 text-sm text-foreground placeholder-faint ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-accent/50 sm:w-44"
            />
            <input
              type="url"
              value={link.url}
              onChange={(e) => updateLink(i, { url: e.target.value })}
              placeholder="https://…"
              className="flex-1 rounded-lg bg-background px-3 py-2 text-sm text-foreground placeholder-faint ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            <button
              type="button"
              onClick={() => setLinks((prev) => prev.filter((_, j) => j !== i))}
              aria-label={`Quitar enlace ${i + 1}`}
              className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs text-muted transition hover:bg-fill hover:text-foreground"
            >
              Quitar
            </button>
          </div>
        ))}

        {links.length < MAX_LINKS && (
          <button
            type="button"
            onClick={() => setLinks((prev) => [...prev, { label: "", url: "" }])}
            className="self-start text-sm font-semibold text-accent-ink underline decoration-2 underline-offset-4"
          >
            + Agregar enlace
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="brand-gradient rounded-full px-6 py-2.5 text-sm font-bold text-on-accent shadow-lg shadow-black/20 transition hover:brightness-110 active:scale-95 disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={cancel}
          className="rounded-full bg-fill px-6 py-2.5 text-sm font-semibold text-muted ring-1 ring-border transition hover:bg-fill-strong hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
