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
import { useT } from "@/components/I18nProvider";
import { fmt } from "@/lib/i18n";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Field,
  Input,
  MetaLine,
  Textarea,
  buttonClasses,
  textLinkClasses,
} from "@/components/ui";

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
  const t = useT();

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
      setError(fmt(t.profile.errorLink, { url: invalid.url }));
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
        setError(data.error ?? t.profile.errorGeneric);
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError(t.common.noConnection);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <Card as="section" padding="lg">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <Avatar name={profile.displayName} size="lg" />
            <div className="min-w-0">
              <h1 className="truncate text-[1.75rem] font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
                {profile.displayName}
              </h1>
              <p className="truncate text-sm text-muted">{email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {roleLabel && <Badge tone="accent">{roleLabel}</Badge>}
                <MetaLine
                  items={[
                    profile.location && `📍 ${profile.location}`,
                    profile.createdAt &&
                      fmt(t.profile.memberSince, {
                        date: formatDate(profile.createdAt) ?? "",
                      }),
                  ]}
                />
              </div>
            </div>
          </div>

          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            {t.profile.editButton}
          </Button>
        </div>

        <p
          className={`mt-6 whitespace-pre-wrap break-words text-[15px] leading-relaxed ${
            profile.bio ? "text-foreground" : "text-faint"
          }`}
        >
          {profile.bio ?? t.profile.noBio}
        </p>

        {profile.links.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {profile.links.map((l) => (
              <li key={l.url}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className={buttonClasses({ variant: "soft", size: "sm", className: "h-8 px-3 text-xs" })}
                >
                  🔗 {l.label || hostOf(l.url)}
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    );
  }

  return (
    <Card as="form" padding="lg" onSubmit={save} className="flex flex-col gap-6">
      <h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
        {t.profile.editTitle}
      </h2>

      <Field label={t.profile.nameLabel} hint={t.profile.nameHint}>
        <Input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={MAX_NAME}
          required
        />
      </Field>

      <Field label={t.profile.bioLabel} counter={`${bio.length}/${MAX_BIO}`}>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={MAX_BIO}
          placeholder={t.profile.bioPlaceholder}
        />
      </Field>

      <Field label={t.profile.locationLabel}>
        <Input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={MAX_LOCATION}
          placeholder={t.profile.locationPlaceholder}
        />
      </Field>

      <Field
        group
        label={t.profile.linksLabel}
        counter={fmt(t.profile.linksHint, { n: MAX_LINKS })}
      >
        <div className="flex flex-col gap-2.5">
          {links.length === 0 && (
            <p className="text-xs text-faint">
              {t.profile.linksEmpty}
            </p>
          )}

          {links.map((link, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="text"
                value={link.label}
                onChange={(e) => updateLink(i, { label: e.target.value })}
                maxLength={MAX_LINK_LABEL}
                placeholder={t.profile.linkName}
                className="sm:w-44"
              />
              <Input
                type="url"
                value={link.url}
                onChange={(e) => updateLink(i, { url: e.target.value })}
                placeholder="https://…"
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLinks((prev) => prev.filter((_, j) => j !== i))}
                aria-label={`${t.profile.linkRemove} ${i + 1}`}
                className="self-end sm:h-11 sm:self-auto"
              >
                {t.profile.linkRemove}
              </Button>
            </div>
          ))}

          {links.length < MAX_LINKS && (
            <button
              type="button"
              onClick={() => setLinks((prev) => [...prev, { label: "", url: "" }])}
              className={textLinkClasses("accent", "self-start text-sm")}
            >
              {t.profile.linkAdd}
            </button>
          )}
        </div>
      </Field>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex flex-col gap-2.5 border-t border-border pt-6 sm:flex-row">
        <Button type="submit" loading={saving} loadingText={t.common.saving}>
          {t.profile.saveChanges}
        </Button>
        <Button variant="secondary" onClick={cancel}>
          {t.common.cancel}
        </Button>
      </div>
    </Card>
  );
}
