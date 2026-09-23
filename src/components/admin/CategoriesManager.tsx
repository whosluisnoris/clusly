"use client";

import { useState, useCallback, useEffect } from "react";
import type { Category } from "@/lib/types";
import { topicColor } from "@/lib/color";
import { CategoryIcon } from "@/components/CategoryIcon";
import {
  Alert,
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  IconTile,
  Input,
  SectionHeader,
  cn,
  inputClasses,
} from "@/components/ui";

// Genera un slug kebab-case a partir del nombre (sin acentos ni símbolos).
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoriesManager({
  onChange,
}: {
  onChange?: () => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#fb62f6");
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const headers = { "Content-Type": "application/json" };

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/categories", { headers });
    if (!res.ok) return;
    const data = await res.json();
    setCategories(data.categories ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function refresh() {
    await load();
    onChange?.();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const finalSlug = slugTouched ? slug.trim() : slugify(name);
    if (!name.trim() || !finalSlug) {
      setStatus({ text: "Nombre y slug son obligatorios", ok: false });
      return;
    }
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: name.trim(), slug: finalSlug, description, color }),
    });
    if (res.ok) {
      setName("");
      setSlug("");
      setSlugTouched(false);
      setDescription("");
      setColor("#fb62f6");
      setStatus({ text: "Categoría creada ✓", ok: true });
      await refresh();
    } else {
      const data = await res.json();
      setStatus({ text: data.error ?? "No se pudo crear", ok: false });
    }
    setLoading(false);
  }

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch("/api/admin/categories", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id, ...body }),
    });
    await refresh();
  }

  // Reordena intercambiando sort_order con el vecino.
  async function move(index: number, dir: -1 | 1) {
    const a = categories[index];
    const b = categories[index + dir];
    if (!a || !b) return;
    await Promise.all([
      fetch("/api/admin/categories", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ id: a.id, sortOrder: b.sort_order }),
      }),
      fetch("/api/admin/categories", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ id: b.id, sortOrder: a.sort_order }),
      }),
    ]);
    await refresh();
  }

  async function remove(id: string, catName: string) {
    if (
      !window.confirm(
        `¿Borrar la categoría "${catName}"? Los recursos no se borran, solo pierden esta categoría.`
      )
    )
      return;
    await fetch("/api/admin/categories", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ id }),
    });
    await refresh();
  }

  return (
    <section>
      <SectionHeader title="Categorías del catálogo" />

      <Card
        as="form"
        onSubmit={handleCreate}
        className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.3fr_auto_auto] lg:items-end"
      >
        <Field label="Nombre">
          <Input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            placeholder="p. ej. Visión por computadora"
          />
        </Field>
        <Field label="Slug (URL)">
          <Input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            placeholder="vision-por-computadora"
          />
        </Field>
        <Field label="Descripción (opcional)" className="sm:col-span-2 lg:col-span-1">
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripción de la temática"
          />
        </Field>
        <Field label="Color">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-label="Color de la categoría"
            className={inputClasses({ className: "h-11 w-16 cursor-pointer p-1.5" })}
          />
        </Field>
        <Button
          type="submit"
          disabled={!name.trim()}
          loading={loading}
          loadingText="Creando…"
          className="sm:justify-self-start"
        >
          Crear
        </Button>
      </Card>

      {status && (
        <Alert tone={status.ok ? "success" : "error"} className="mb-4">
          {status.text}
        </Alert>
      )}

      {categories.length === 0 ? (
        <EmptyState description="Aún no hay categorías." />
      ) : (
        <ul className="flex flex-col gap-2">
          {categories.map((c, i) => (
            <Card
              as="li"
              key={c.id}
              padding="none"
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
                !c.is_active && "opacity-60"
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`Subir ${c.name}`}
                    className="h-6 w-7 px-0"
                  >
                    ▲
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => move(i, 1)}
                    disabled={i === categories.length - 1}
                    aria-label={`Bajar ${c.name}`}
                    className="h-6 w-7 px-0"
                  >
                    ▼
                  </Button>
                </div>
                <input
                  type="color"
                  value={c.color ?? "#fb62f6"}
                  onChange={(e) => patch(c.id, { color: e.target.value })}
                  aria-label={`Color de ${c.name}`}
                  title="Cambiar color de la categoría"
                  className="h-8 w-8 shrink-0 cursor-pointer rounded-lg bg-transparent ring-1 ring-inset ring-border"
                />
                <IconTile size="sm" color={topicColor(c.slug)}>
                  <CategoryIcon slug={c.slug} />
                </IconTile>
                <div className="min-w-0">
                  <p className="font-display text-[15px] font-bold text-foreground">
                    {c.name} <span className="font-sans text-xs font-normal text-faint">/{c.slug}</span>
                  </p>
                  {c.description && (
                    <p className="truncate text-xs text-faint">{c.description}</p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Chip
                  size="sm"
                  variant="soft"
                  pressed={c.is_active}
                  onClick={() => patch(c.id, { isActive: !c.is_active })}
                  title={c.is_active ? "Pulsa para desactivarla" : "Pulsa para activarla"}
                >
                  {c.is_active ? "Activa" : "Inactiva"}
                </Chip>
                <Button variant="danger" size="xs" onClick={() => remove(c.id, c.name)}>
                  Borrar
                </Button>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </section>
  );
}
