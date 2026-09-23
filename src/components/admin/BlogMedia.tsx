"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { timeAgo, formatDate } from "@/lib/dates";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  MetaLine,
  SectionHeader,
  textLinkClasses,
} from "@/components/ui";

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
    <section className="mt-14">
      <SectionHeader
        title={
          <>
            Imágenes del bucket
            {open && files.length > 0 && (
              <span className="ml-2 font-sans text-xs font-normal tracking-normal text-faint">
                {files.length} en total · {enUso} en uso
              </span>
            )}
          </>
        }
        action={
          <div className="flex shrink-0 gap-2">
            {open && (
              <Button variant="secondary" size="xs" onClick={load} loading={loading} loadingText="Cargando…">
                Actualizar
              </Button>
            )}
            <Button variant="soft" size="xs" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              {open ? "Ocultar" : "Ver imágenes subidas"}
            </Button>
          </div>
        }
      />

      {!open ? null : (
        <>
          {message && (
            <Alert tone={message.ok ? "success" : "error"} className="mb-3">
              {message.text}
            </Alert>
          )}

          {loading && files.length === 0 ? (
            <p className="text-sm text-muted">Cargando el bucket…</p>
          ) : files.length === 0 ? (
            <EmptyState description="El bucket está vacío. Las imágenes que subas aparecerán aquí." />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {files.map((f) => (
                <Card as="li" key={f.path} padding="none" className="flex flex-col overflow-hidden">
                  <div className="relative aspect-video w-full bg-elevated">
                    <Image
                      src={f.url}
                      alt={f.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 320px"
                      className="object-contain"
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-1.5 p-3.5">
                    <p className="truncate text-xs font-semibold text-foreground" title={f.name}>
                      {f.name}
                    </p>
                    <MetaLine
                      className="text-[11px]"
                      items={[
                        formatSize(f.size),
                        f.createdAt && (timeAgo(f.createdAt) ?? formatDate(f.createdAt)),
                      ]}
                    />

                    {f.usedBy.length > 0 ? (
                      <p
                        className="truncate text-[11px] text-accent-ink"
                        title={f.usedBy.map((u) => u.title).join(", ")}
                      >
                        En uso: {f.usedBy.map((u) => u.title).join(", ")}
                      </p>
                    ) : (
                      <Badge className="self-start">Sin usar</Badge>
                    )}

                    <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-2 text-xs">
                      <button type="button" onClick={() => onUseAsCover(f.url)} className={textLinkClasses("accent")}>
                        Portada
                      </button>
                      <button type="button" onClick={() => onInsert(f.url)} className={textLinkClasses("accent")}>
                        Insertar
                      </button>
                      <button type="button" onClick={() => copy(f.url)} className={textLinkClasses("muted")}>
                        Copiar URL
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(f)}
                        disabled={busyPath === f.path}
                        className={textLinkClasses("danger")}
                      >
                        {busyPath === f.path ? "Borrando…" : "Borrar"}
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
