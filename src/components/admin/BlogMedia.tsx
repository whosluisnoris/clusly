"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { timeAgo, formatDate } from "@/lib/dates";

interface MediaUsage {
  id: string;
  slug: string;
  title: string;
}

interface MediaFile {
  path: string;
  name: string;
  url: string;
  size: number | null;
  mimeType: string | null;
  createdAt: string | null;
  usedBy: MediaUsage[];
}

function formatSize(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Vista del bucket `blog`: todo lo que se ha subido, con su tamaño, fecha y en
// qué artículos se usa. Desde aquí se puede reutilizar una imagen (portada o
// dentro del texto) y borrarla a mano.
//
// El borrado avisa si la imagen está en uso: la API responde 409 y solo la
// repite con `force` tras una segunda confirmación explícita.
export function BlogMedia({
  onUseAsCover,
  onInsert,
  reloadToken,
}: {
  onUseAsCover: (url: string) => void;
  onInsert: (url: string) => void;
  reloadToken: number;
}) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const headers = { "Content-Type": "application/json" };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog/media", { headers });
      if (res.ok) setFiles((await res.json()).files ?? []);
      else setMessage({ text: "No se pudo leer el bucket.", ok: false });
    } catch {
      setMessage({ text: "No se pudo leer el bucket.", ok: false });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carga al abrir la sección y cada vez que se sube algo nuevo.
  useEffect(() => {
    if (open) load();
  }, [open, reloadToken, load]);

  async function remove(file: MediaFile) {
    const enUso = file.usedBy.length > 0;
    const warning = enUso
      ? `"${file.name}" se usa en ${file.usedBy.length} ${
          file.usedBy.length === 1 ? "artículo" : "artículos"
        }. ¿Borrarla de todas formas? Se romperá donde aparezca.`
      : `¿Borrar "${file.name}" del bucket? Esta acción no se puede deshacer.`;
    if (!window.confirm(warning)) return;

    setBusyPath(file.path);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/blog/media", {
        method: "DELETE",
        headers,
        // Con `force` solo cuando ya se confirmó a sabiendas; si no, la API
        // vuelve a comprobar el uso por si cambió desde que se listó.
        body: JSON.stringify({ path: file.path, force: enUso }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.path !== file.path));
        setMessage({ text: "Imagen borrada ✓", ok: true });
      } else {
        setMessage({ text: data.error ?? "No se pudo borrar la imagen.", ok: false });
      }
    } catch {
      setMessage({ text: "No se pudo borrar la imagen.", ok: false });
    } finally {
      setBusyPath(null);
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setMessage({ text: "URL copiada ✓", ok: true });
    } catch {
      setMessage({ text: "El navegador no dejó copiar la URL.", ok: false });
    }
  }

  const enUso = files.filter((f) => f.usedBy.length > 0).length;

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold text-foreground">
          Imágenes <span className="text-accent-ink">del bucket</span>
          {open && files.length > 0 && (
            <span className="ml-2 text-xs font-normal text-faint">
              {files.length} en total · {enUso} en uso
            </span>
          )}
        </h3>
        <div className="flex gap-2">
          {open && (
            <button
              onClick={load}
              disabled={loading}
              className="rounded-lg border border-accent/30 px-3 py-1.5 text-xs font-medium text-accent-ink transition hover:bg-accent/10 disabled:opacity-50"
            >
              {loading ? "Cargando…" : "Actualizar"}
            </button>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-fill hover:text-foreground"
          >
            {open ? "Ocultar" : "Ver imágenes subidas"}
          </button>
        </div>
      </div>

      {!open ? null : (
        <>
          {message && (
            <p
              className={`mb-3 text-sm ${message.ok ? "text-accent-ink" : "text-red-400"}`}
            >
              {message.text}
            </p>
          )}

          {loading && files.length === 0 ? (
            <p className="text-sm text-muted">Cargando el bucket…</p>
          ) : files.length === 0 ? (
            <p className="text-sm text-muted">
              El bucket está vacío. Las imágenes que subas aparecerán aquí.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {files.map((f) => (
                <li
                  key={f.path}
                  className="flex flex-col overflow-hidden rounded-xl bg-surface ring-1 ring-border"
                >
                  <div className="relative aspect-video w-full bg-elevated">
                    <Image
                      src={f.url}
                      alt={f.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 320px"
                      className="object-contain"
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <p className="truncate text-xs font-medium text-foreground" title={f.name}>
                      {f.name}
                    </p>
                    <p className="text-[11px] text-faint">
                      {formatSize(f.size)}
                      {f.createdAt && ` · ${timeAgo(f.createdAt) ?? formatDate(f.createdAt)}`}
                    </p>

                    {f.usedBy.length > 0 ? (
                      <p
                        className="truncate text-[11px] text-accent-ink"
                        title={f.usedBy.map((u) => u.title).join(", ")}
                      >
                        En uso: {f.usedBy.map((u) => u.title).join(", ")}
                      </p>
                    ) : (
                      <p className="text-[11px] text-faint">Sin usar</p>
                    )}

                    <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[11px]">
                      <button
                        onClick={() => onUseAsCover(f.url)}
                        className="font-semibold text-accent-ink transition hover:underline"
                      >
                        Portada
                      </button>
                      <button
                        onClick={() => onInsert(f.url)}
                        className="font-semibold text-accent-ink transition hover:underline"
                      >
                        Insertar
                      </button>
                      <button
                        onClick={() => copy(f.url)}
                        className="text-muted transition hover:text-foreground hover:underline"
                      >
                        Copiar URL
                      </button>
                      <button
                        onClick={() => remove(f)}
                        disabled={busyPath === f.path}
                        className="font-semibold text-red-400 transition hover:underline disabled:opacity-50"
                      >
                        {busyPath === f.path ? "Borrando…" : "Borrar"}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
