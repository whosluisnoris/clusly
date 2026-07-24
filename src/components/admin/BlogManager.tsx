"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { timeAgo, formatDate } from "@/lib/dates";
import type { BlogPost } from "@/lib/blog";

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
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);

  const headers = { "Content-Type": "application/json" };

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
  }

  function startEdit(post: BlogPost) {
    setEditingId(post.id);
    setTitle(post.title);
    setExcerpt(post.excerpt ?? "");
    setContent(post.content);
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">
          Blog <span className="text-accent-ink">de Clusly</span>
        </h2>
        <p className="text-xs text-muted">
          {published.length} {published.length === 1 ? "publicado" : "publicados"} ·{" "}
          {drafts.length} {drafts.length === 1 ? "borrador" : "borradores"}
        </p>
      </div>

      {/* Editor */}
      <form
        onSubmit={save}
        className="mb-6 flex flex-col gap-3 rounded-xl bg-surface p-4 ring-1 ring-border"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {editingId ? "Editando artículo" : "Nuevo artículo"}
        </p>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={160}
          placeholder="Título del artículo"
          className="rounded-lg bg-background px-4 py-2.5 text-sm font-semibold text-foreground ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-accent/50"
        />

        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          maxLength={300}
          rows={2}
          placeholder="Resumen (aparece en la lista del blog y al compartir)"
          className="resize-y rounded-lg bg-background px-4 py-2.5 text-sm text-foreground placeholder-faint ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-accent/50"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
          placeholder={
            "Contenido del artículo.\n\nAcepta Markdown básico:\n# Título   ## Subtítulo\n- viñetas   1. numeradas\n> cita\n**negrita**, *cursiva*, `código`, [enlace](https://…)\n```\nbloque de código\n```"
          }
          className="resize-y rounded-lg bg-background px-4 py-2.5 font-mono text-sm text-foreground placeholder-faint ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-accent/50"
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-on-accent transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Guardando…" : editingId ? "Guardar cambios" : "Crear borrador"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:bg-fill hover:text-foreground"
            >
              Cancelar
            </button>
          )}
          <span className="text-xs text-faint">
            Se crea como borrador; nadie lo ve hasta que lo publiques.
          </span>
        </div>
      </form>

      {status && (
        <p className={`mb-4 text-sm ${status.ok ? "text-accent-ink" : "text-red-400"}`}>
          {status.text}
        </p>
      )}

      {/* Listado */}
      {posts.length === 0 ? (
        <p className="text-sm text-muted">
          Todavía no hay artículos. Escribe el primero arriba.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-surface p-4 ring-1 ring-border"
            >
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      p.status === "published"
                        ? "bg-accent/20 text-accent-ink"
                        : "bg-amber-500/20 text-amber-500"
                    }`}
                  >
                    {p.status === "published" ? "Publicado" : "Borrador"}
                  </span>
                  <span className="truncate">{p.title}</span>
                </p>
                <p className="mt-0.5 truncate text-xs text-faint">
                  /blog/{p.slug}
                  {p.authorName ? ` · ${p.authorName}` : ""} ·{" "}
                  {p.status === "published" && p.publishedAt
                    ? `publicado ${timeAgo(p.publishedAt) ?? formatDate(p.publishedAt)}`
                    : `editado ${timeAgo(p.updatedAt) ?? formatDate(p.updatedAt)}`}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {p.status === "published" && (
                  <Link
                    href={`/blog/${p.slug}`}
                    target="_blank"
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition hover:bg-fill hover:text-foreground"
                  >
                    Ver
                  </Link>
                )}
                <button
                  onClick={() => startEdit(p)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition hover:bg-fill hover:text-foreground"
                >
                  Editar
                </button>
                <button
                  onClick={() =>
                    changeStatus(p.id, p.status === "published" ? "draft" : "published")
                  }
                  disabled={busy}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                    p.status === "published"
                      ? "border border-border text-muted hover:bg-fill hover:text-foreground"
                      : "bg-accent text-on-accent hover:opacity-90"
                  }`}
                >
                  {p.status === "published" ? "Despublicar" : "Publicar"}
                </button>
                <button
                  onClick={() => remove(p.id, p.title)}
                  disabled={busy}
                  className="rounded-lg border border-red-800/50 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-900/30 disabled:opacity-50"
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
