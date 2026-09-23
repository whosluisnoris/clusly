"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  Category,
  ResourceRow,
  PlaylistItemRow,
  ResourceLanguage,
} from "@/lib/types";
import { parseYouTubeUrl } from "@/lib/youtube-url";
import { CategoryMultiSelect } from "@/components/CategoryMultiSelect";
import {
  Alert,
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Input,
  SectionHeader,
  textLinkClasses,
} from "@/components/ui";

type AdminResource = ResourceRow & {
  resource_categories: { category_id: string }[];
};

export function ResourcesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [url, setUrl] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  // Idioma hablado del video que se está dando de alta.
  const [language, setLanguage] = useState<ResourceLanguage>("es");
  const [manualTitle, setManualTitle] = useState("");
  const [showTitle, setShowTitle] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  // Edición de categorías por fila
  const [editId, setEditId] = useState<string | null>(null);
  const [editCats, setEditCats] = useState<string[]>([]);

  // Gestión de episodios de una playlist
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Moderación: la cola de aportes que llegaron sin cuenta
  const [onlyPending, setOnlyPending] = useState(false);

  const headers = { "Content-Type": "application/json" };

  const load = useCallback(async () => {
    const [catRes, resRes] = await Promise.all([
      fetch("/api/admin/categories", { headers }),
      fetch("/api/admin/resources", { headers }),
    ]);
    if (catRes.ok) setCategories((await catRes.json()).categories ?? []);
    if (resRes.ok) setResources((await resRes.json()).resources ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "?";
  const detected = parseYouTubeUrl(url);
  const pending = resources.filter((r) => r.status === "pending");
  const shown = onlyPending ? pending : resources;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!detected) {
      setStatus({ text: "Pega una URL de YouTube (video o playlist) válida", ok: false });
      return;
    }
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/admin/resources", {
      method: "POST",
      headers,
      body: JSON.stringify({
        url,
        categoryIds: selectedCats,
        language,
        title: manualTitle.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setUrl("");
      setSelectedCats([]);
      setLanguage("es");
      setManualTitle("");
      setShowTitle(false);
      setStatus({
        text: data.warning ?? `${data.kind === "playlist" ? "Playlist" : "Video"} agregado ✓`,
        ok: true,
      });
      await load();
    } else {
      if (data.needsTitle) setShowTitle(true);
      setStatus({ text: data.error ?? "No se pudo agregar", ok: false });
    }
    setLoading(false);
  }

  async function saveCats(id: string) {
    await fetch("/api/admin/resources", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id, categoryIds: editCats }),
    });
    setEditId(null);
    await load();
  }

  // Cambia el idioma hablado de un recurso ya guardado.
  async function changeLanguage(id: string, next: ResourceLanguage) {
    await fetch("/api/admin/resources", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id, language: next }),
    });
    await load();
  }

  // Aprobar / ocultar / devolver a la cola un recurso.
  async function changeStatus(id: string, next: "published" | "pending" | "hidden") {
    await fetch("/api/admin/resources", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id, status: next }),
    });
    await load();
  }

  async function remove(id: string, title: string) {
    if (!window.confirm(`¿Quitar "${title}" del catálogo? Esta acción no se puede deshacer.`))
      return;
    await fetch("/api/admin/resources", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ id }),
    });
    await load();
  }

  return (
    <section>
      <SectionHeader title="Recursos del catálogo" />

      {/* Alta de recurso */}
      <Card as="form" onSubmit={handleAdd} className="mb-4 flex flex-col gap-5">
        <Field
          label="URL de YouTube"
          hint={
            url.trim()
              ? detected
                ? `Detectado: ${detected.kind === "playlist" ? "📚 Playlist" : "🎬 Video"} (${detected.id})`
                : "No se reconoce como video ni playlist de YouTube"
              : "Un video suelto o una playlist (/playlist?list=…)."
          }
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Pega una URL de video o de playlist de YouTube…"
              aria-invalid={url.trim() !== "" && !detected}
              className="flex-1"
            />
            <Button type="submit" disabled={!detected} loading={loading} loadingText="Agregando…">
              Agregar
            </Button>
          </div>
        </Field>

        {showTitle && (
          <Field label="Título de la playlist" hint="No se pudo leer de YouTube: escríbelo a mano.">
            <Input
              type="text"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="Título de la playlist…"
              className="ring-complement/50"
            />
          </Field>
        )}

        <Field group label="Categorías">
          <CategoryMultiSelect
            categories={categories}
            selected={selectedCats}
            onChange={setSelectedCats}
          />
        </Field>

        <Field group label="Idioma del video">
          <div className="flex gap-2">
            {(["es", "en"] as const).map((value) => (
              <Chip
                key={value}
                size="sm"
                pressed={language === value}
                onClick={() => setLanguage(value)}
              >
                {value === "es" ? "Español" : "Inglés"}
              </Chip>
            ))}
          </div>
        </Field>
      </Card>

      {status && (
        <Alert tone={status.ok ? "success" : "error"} className="mb-4">
          {status.text}
        </Alert>
      )}

      {/* Cola de moderación: aportes enviados sin cuenta */}
      {pending.length > 0 && (
        <Alert
          tone="warning"
          className="mb-4"
          title={`${pending.length} ${pending.length === 1 ? "aporte pendiente" : "aportes pendientes"} de aprobación`}
          action={
            <Button variant="secondary" size="xs" onClick={() => setOnlyPending((v) => !v)}>
              {onlyPending ? "Ver todos" : "Revisar pendientes"}
            </Button>
          }
        >
          Llegaron sin cuenta y no se ven en el catálogo hasta que los apruebes.
        </Alert>
      )}

      {/* Lista de recursos */}
      {shown.length === 0 ? (
        <EmptyState
          description={
            resources.length === 0
              ? "Aún no hay recursos. Pega arriba la URL de un video o una playlist de YouTube."
              : "No hay aportes pendientes."
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((r) => (
            <Card as="li" key={r.id} padding="none" className="overflow-hidden">
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={r.kind === "playlist" ? "accent" : "neutral"}>
                      {r.kind === "playlist" ? `Playlist · ${r.video_count ?? 0}` : "Video"}
                    </Badge>
                    {r.status === "pending" && <Badge tone="complement">Pendiente</Badge>}
                    {r.status === "hidden" && <Badge>Oculto</Badge>}
                  </div>
                  <p className="font-display mt-2 line-clamp-2 text-[15px] font-bold leading-snug text-foreground">
                    {r.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
                    <span className="truncate">
                      {r.channel_title ? `${r.channel_title} · ` : ""}
                      {r.youtube_id}
                    </span>
                    <span aria-hidden="true">·</span>
                    <Chip
                      size="sm"
                      variant="soft"
                      pressed={false}
                      onClick={() => changeLanguage(r.id, r.language === "es" ? "en" : "es")}
                      title="Cambiar el idioma hablado del video"
                      className="h-6 px-2 text-[10px] uppercase tracking-wide ring-1 ring-inset ring-border"
                    >
                      {r.language === "en" ? "EN" : "ES"}
                    </Chip>
                  </div>

                  {/* Categorías del recurso */}
                  {editId === r.id ? (
                    <div className="mt-3 flex flex-col gap-3">
                      <CategoryMultiSelect
                        categories={categories}
                        selected={editCats}
                        onChange={setEditCats}
                      />
                      <div className="flex gap-2">
                        <Button size="xs" onClick={() => saveCats(r.id)}>
                          Guardar
                        </Button>
                        <Button variant="secondary" size="xs" onClick={() => setEditId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {r.resource_categories.length === 0 ? (
                        <Badge tone="complement">Sin categoría</Badge>
                      ) : (
                        r.resource_categories.map((rc) => (
                          <span
                            key={rc.category_id}
                            className="rounded-full bg-fill px-2 py-0.5 text-[11px] font-semibold text-muted ring-1 ring-inset ring-border"
                          >
                            {catName(rc.category_id)}
                          </span>
                        ))
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditId(r.id);
                          setEditCats(r.resource_categories.map((rc) => rc.category_id));
                        }}
                        className={textLinkClasses("accent", "ml-1 text-xs")}
                      >
                        editar
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
                  {r.status === "pending" ? (
                    <Button size="xs" onClick={() => changeStatus(r.id, "published")}>
                      Aprobar
                    </Button>
                  ) : r.status === "hidden" ? (
                    <Button variant="secondary" size="xs" onClick={() => changeStatus(r.id, "published")}>
                      Publicar
                    </Button>
                  ) : (
                    <Button variant="secondary" size="xs" onClick={() => changeStatus(r.id, "hidden")}>
                      Ocultar
                    </Button>
                  )}
                  {r.kind === "playlist" && (
                    <Button
                      variant="soft"
                      size="xs"
                      aria-expanded={expandedId === r.id}
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    >
                      {expandedId === r.id ? "Cerrar" : "Episodios"}
                    </Button>
                  )}
                  <Button variant="danger" size="xs" onClick={() => remove(r.id, r.title)}>
                    Quitar
                  </Button>
                </div>
              </div>

              {r.kind === "playlist" && expandedId === r.id && (
                <PlaylistItemsEditor resourceId={r.id} onCountChange={load} />
              )}
            </Card>
          ))}
        </ul>
      )}
    </section>
  );
}

// Editor de episodios de una playlist: lista, agregar por URL, quitar, resync.
function PlaylistItemsEditor({
  resourceId,
  onCountChange,
}: {
  resourceId: string;
  onCountChange: () => void;
}) {
  const [items, setItems] = useState<PlaylistItemRow[]>([]);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const headers = { "Content-Type": "application/json" };

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/resources/${resourceId}/items`, { headers });
    if (res.ok) setItems((await res.json()).items ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/resources/${resourceId}/items`, {
      method: "POST",
      headers,
      body: JSON.stringify({ url }),
    });
    if (res.ok) {
      setUrl("");
      await load();
      onCountChange();
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error ?? "No se pudo agregar");
    }
    setBusy(false);
  }

  async function removeItem(youtubeVideoId: string) {
    await fetch(`/api/admin/resources/${resourceId}/items`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ youtubeVideoId }),
    });
    await load();
    onCountChange();
  }

  async function resync() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/resources/${resourceId}/sync`, {
      method: "POST",
      headers,
    });
    const data = await res.json().catch(() => ({}));
    setMsg(
      res.ok
        ? `Sincronizado: ${data.total} videos${data.hasMore ? " (playlist larga, faltan algunos)" : ""}`
        : data.error ?? "No se pudo sincronizar"
    );
    await load();
    onCountChange();
    setBusy(false);
  }

  return (
    <div className="border-t border-border bg-background/60 p-4">
      <SectionHeader
        size="sm"
        title={`Episodios (${items.length})`}
        action={
          <Button variant="secondary" size="xs" onClick={resync} loading={busy} loadingText="Sincronizando…">
            Resincronizar con YouTube
          </Button>
        }
      />

      <form onSubmit={addItem} className="mb-3 flex gap-2">
        <Input
          compact
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Agregar un video por URL/ID…"
          aria-label="Agregar un video por URL o ID"
          className="flex-1"
        />
        <Button type="submit" variant="soft" size="sm" disabled={busy || !url.trim()}>
          Agregar
        </Button>
      </form>

      {msg && <p className="mb-2 text-xs text-muted">{msg}</p>}

      {items.length === 0 ? (
        <p className="text-xs text-faint">Sin episodios todavía.</p>
      ) : (
        <ol className="flex flex-col gap-0.5">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs transition hover:bg-fill"
            >
              <span className="min-w-0 truncate text-muted">
                <span className="tabular-nums text-faint">{it.position}.</span> {it.title}
              </span>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => removeItem(it.youtube_video_id)}
                aria-label={`Quitar episodio ${it.position}`}
                className="h-7 w-7 shrink-0 px-0 hover:text-danger-ink"
              >
                ✕
              </Button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
