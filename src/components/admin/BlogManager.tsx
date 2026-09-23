"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { timeAgo, formatDate } from "@/lib/dates";
import type { BlogPost } from "@/lib/blog";
import { BlogMedia } from "@/components/admin/BlogMedia";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  MetaLine,
  SectionHeader,
  Textarea,
  buttonClasses,
} from "@/components/ui";

// Editor del blog. Solo llega aquí quien tiene rol owner/admin (el panel lo
// resuelve el Server Component de /admin) y, además, todas las llamadas van a
// /api/admin/blog, que vuelve a exigir el rol. Un artículo nace como borrador:
// nadie lo ve hasta que se pulsa "Publicar".
export function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
  // Cambia con cada subida para que la vista del bucket se recargue sola.
  const [mediaToken, setMediaToken] = useState(0);

  // Un input de archivo por destino: portada e imagen dentro del texto.
  const coverInput = useRef<HTMLInputElement>(null);
  const inlineInput = useRef<HTMLInputElement>(null);
  const contentArea = useRef<HTMLTextAreaElement>(null);

  const headers = { "Content-Type": "application/json" };

  // Sube al bucket `blog` y devuelve la URL pública (o null si algo falló).
  async function upload(file: File): Promise<string | null> {
    setUploading(true);
    setStatus(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/blog/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ text: data.error ?? "No se pudo subir la imagen.", ok: false });
        return null;
      }
      setMediaToken((n) => n + 1);
      return data.url as string;
    } catch {
      setStatus({ text: "No se pudo subir la imagen, revisa tu conexión.", ok: false });
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function pickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!file) return;
    const url = await upload(file);
    if (url) {
      setCoverUrl(url);
      setStatus({ text: "Portada subida ✓", ok: true });
    }
  }

  // Pega la imagen como Markdown donde esté el cursor del editor. Lo usan tanto
  // el botón de subir como la vista del bucket (reutilizar una ya subida).
  function insertImage(url: string) {
    const markdown = `\n\n![](${url})\n\n`;
    const at = contentArea.current?.selectionStart ?? content.length;
    setContent((prev) => prev.slice(0, at) + markdown + prev.slice(at));
    setStatus({
      text: "Imagen insertada ✓ — escribe el texto alternativo entre los corchetes.",
      ok: true,
    });
  }

  async function pickInline(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = await upload(file);
    if (url) insertImage(url);
  }

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/blog", { headers });
    if (res.ok) setPosts((await res.json()).posts ?? []);
    else setStatus({ text: "No se pudieron cargar los artículos.", ok: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setExcerpt("");
    setContent("");
    setCoverUrl("");
  }

  function startEdit(post: BlogPost) {
    setEditingId(post.id);
    setTitle(post.title);
    setExcerpt(post.excerpt ?? "");
    setContent(post.content);
    setCoverUrl(post.coverUrl ?? "");
    setStatus(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) {
      setStatus({ text: "El título necesita al menos 3 caracteres.", ok: false });
      return;
    }
    setBusy(true);
    setStatus(null);

    const res = await fetch("/api/admin/blog", {
      method: editingId ? "PATCH" : "POST",
      headers,
      body: JSON.stringify({
        ...(editingId ? { id: editingId } : {}),
        title,
        excerpt,
        content,
        coverUrl,
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      setStatus({
        text: editingId ? "Cambios guardados ✓" : "Borrador creado ✓",
        ok: true,
      });
      resetForm();
      await load();
    } else {
      setStatus({ text: data.error ?? "No se pudo guardar.", ok: false });
    }
    setBusy(false);
  }

  async function changeStatus(id: string, next: "published" | "draft") {
    setBusy(true);
    const res = await fetch("/api/admin/blog", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id, status: next }),
    });
    if (res.ok) {
      setStatus({
        text: next === "published" ? "Artículo publicado ✓" : "Vuelto a borrador ✓",
        ok: true,
      });
      await load();
    } else {
      setStatus({ text: "No se pudo cambiar el estado.", ok: false });
    }
    setBusy(false);
  }

  async function remove(id: string, postTitle: string) {
    if (!window.confirm(`¿Borrar "${postTitle}"? Esta acción no se puede deshacer.`))
      return;
    setBusy(true);
    const res = await fetch("/api/admin/blog", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      if (editingId === id) resetForm();
      await load();
    } else {
      setStatus({ text: "No se pudo borrar el artículo.", ok: false });
    }
    setBusy(false);
  }

  const drafts = posts.filter((p) => p.status === "draft");
  const published = posts.filter((p) => p.status === "published");

  return (
    <section>
      <SectionHeader
        title="Blog de Clusly"
        action={
          <span className="text-xs text-muted">
            {published.length} {published.length === 1 ? "publicado" : "publicados"} ·{" "}
            {drafts.length} {drafts.length === 1 ? "borrador" : "borradores"}
          </span>
        }
      />

      {/* Editor */}
      <Card as="form" onSubmit={save} className="mb-4 flex flex-col gap-6">
        <SectionHeader
          size="sm"
          as="h3"
          className="mb-0 sm:mb-0"
          title={editingId ? "Editando artículo" : "Nuevo artículo"}
        />

        <Field label="Título" counter={`${title.length}/160`}>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={160}
            placeholder="Título del artículo"
            className="font-semibold"
          />
        </Field>

        <Field
          label="Resumen"
          hint="Aparece en la lista del blog y al compartir."
          counter={`${excerpt.length}/300`}
        >
          <Textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Una o dos frases que inviten a leerlo"
          />
        </Field>

        {/* Portada */}
        <Field
          group
          label="Portada"
          hint={
            <>
              Se guarda en el bucket <code>blog</code> de Supabase. Máx. 5 MB · PNG, JPG,
              WEBP, GIF o AVIF.
            </>
          }
        >
          {coverUrl ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-xl bg-elevated ring-1 ring-border">
                <Image
                  src={coverUrl}
                  alt="Portada del artículo"
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => coverInput.current?.click()}
                loading={uploading}
                loadingText="Subiendo…"
              >
                Cambiar
              </Button>
              <Button variant="ghost" size="xs" onClick={() => setCoverUrl("")}>
                Quitar
              </Button>
            </div>
          ) : (
            <Button
              variant="soft"
              size="sm"
              onClick={() => coverInput.current?.click()}
              loading={uploading}
              loadingText="Subiendo…"
              className="self-start border border-dashed border-border-strong ring-0"
            >
              ⬆ Subir portada
            </Button>
          )}
          <input
            ref={coverInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            onChange={pickCover}
            className="hidden"
          />
        </Field>

        <Field
          group
          label="Contenido"
          counter={
            <Button
              variant="secondary"
              size="xs"
              onClick={() => inlineInput.current?.click()}
              loading={uploading}
              loadingText="Subiendo…"
              className="normal-case tracking-normal"
            >
              🖼 Insertar imagen
            </Button>
          }
        >
          <input
            ref={inlineInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            onChange={pickInline}
            className="hidden"
          />
          <Textarea
            ref={contentArea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={14}
            aria-label="Contenido del artículo"
            placeholder={
              "Contenido del artículo.\n\nAcepta Markdown básico:\n# Título   ## Subtítulo\n- viñetas   1. numeradas\n> cita\n**negrita**, *cursiva*, `código`, [enlace](https://…)\n![texto alternativo](url de la imagen)\n```\nbloque de código\n```"
            }
            className="font-mono"
          />
        </Field>

        <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
          <Button
            type="submit"
            loading={busy}
            loadingText="Guardando…"
          >
            {editingId ? "Guardar cambios" : "Crear borrador"}
          </Button>
          {editingId && (
            <Button variant="secondary" onClick={resetForm}>
              Cancelar
            </Button>
          )}
          <span className="text-xs text-faint">
            Se crea como borrador; nadie lo ve hasta que lo publiques.
          </span>
        </div>
      </Card>

      {status && (
        <Alert tone={status.ok ? "success" : "error"} className="mb-4">
          {status.text}
        </Alert>
      )}

      {/* Listado */}
      {posts.length === 0 ? (
        <EmptyState description="Todavía no hay artículos. Escribe el primero arriba." />
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((p) => (
            <Card
              as="li"
              key={p.id}
              padding="sm"
              className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <Badge tone={p.status === "published" ? "accent" : "complement"}>
                  {p.status === "published" ? "Publicado" : "Borrador"}
                </Badge>
                <p className="font-display mt-2 truncate text-[15px] font-bold text-foreground">
                  {p.title}
                </p>
                <MetaLine
                  className="mt-0.5"
                  items={[
                    `/blog/${p.slug}`,
                    p.authorName,
                    p.status === "published" && p.publishedAt
                      ? `publicado ${timeAgo(p.publishedAt) ?? formatDate(p.publishedAt)}`
                      : `editado ${timeAgo(p.updatedAt) ?? formatDate(p.updatedAt)}`,
                  ]}
                />
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {p.status === "published" && (
                  <Link
                    href={`/blog/${p.slug}`}
                    target="_blank"
                    className={buttonClasses({ variant: "ghost", size: "xs" })}
                  >
                    Ver ↗
                  </Link>
                )}
                <Button variant="secondary" size="xs" onClick={() => startEdit(p)}>
                  Editar
                </Button>
                <Button
                  variant={p.status === "published" ? "secondary" : "primary"}
                  size="xs"
                  onClick={() =>
                    changeStatus(p.id, p.status === "published" ? "draft" : "published")
                  }
                  disabled={busy}
                >
                  {p.status === "published" ? "Despublicar" : "Publicar"}
                </Button>
                <Button variant="danger" size="xs" onClick={() => remove(p.id, p.title)} disabled={busy}>
                  Borrar
                </Button>
              </div>
            </Card>
          ))}
        </ul>
      )}

      <BlogMedia
        onUseAsCover={(url) => {
          setCoverUrl(url);
          setStatus({ text: "Portada actualizada ✓", ok: true });
        }}
        onInsert={insertImage}
        reloadToken={mediaToken}
      />
    </section>
  );
}
