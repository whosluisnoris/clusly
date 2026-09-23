"use client";

import { useState, useCallback, useEffect } from "react";
import type { LiveStream } from "@/lib/invidious";
import { formatDate } from "@/lib/dates";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  MetaLine,
  SectionHeader,
} from "@/components/ui";

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

function extractVideoId(input: string): string | null {
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtube.com")) return url.searchParams.get("v");
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("?")[0];
  } catch {
    /* not a URL */
  }
  const clean = input.trim();
  return VIDEO_ID_RE.test(clean) ? clean : null;
}

// Gestión de los lives de Platzi (extraída tal cual del panel original): agregar
// pegando URL/ID de YouTube y quitar. La detección automática sigue en /api/live.
export function StreamsManager() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const headers = { "Content-Type": "application/json" };

  const loadStreams = useCallback(async () => {
    const res = await fetch("/api/live");
    const data = await res.json();
    setStreams(data.streams ?? []);
  }, []);

  useEffect(() => {
    // El setState ocurre tras await dentro de loadStreams (no es síncrono).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStreams();
  }, [loadStreams]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const videoId = extractVideoId(input.trim());
    if (!videoId) {
      setStatus({ text: "URL de YouTube o ID de video no válido", ok: false });
      return;
    }

    setLoading(true);
    setStatus(null);

    const oEmbed = await fetch(`/api/oembed?videoId=${videoId}`)
      .then((r) => r.json())
      .catch(() => ({}));

    const res = await fetch("/api/admin/streams", {
      method: "POST",
      headers,
      body: JSON.stringify({
        videoId,
        title: oEmbed.title ?? "Platzi Live",
        channelTitle: oEmbed.channelTitle ?? "Platzi",
      }),
    });

    if (res.ok) {
      setInput("");
      setStatus({ text: "Video agregado ✓", ok: true });
      await loadStreams();
    } else {
      const data = await res.json();
      setStatus({ text: data.error ?? "No se pudo agregar el video", ok: false });
    }
    setLoading(false);
  }

  async function handleRemove(videoId: string) {
    const confirmed = window.confirm(
      "¿Seguro que quieres quitar este video de la plataforma? Esta acción no se puede deshacer."
    );
    if (!confirmed) return;
    await fetch("/api/admin/streams", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ videoId }),
    });
    await loadStreams();
    setStatus({ text: "Video eliminado", ok: true });
  }

  return (
    <section>
      <SectionHeader title="Lives de Platzi" />
      <p className="-mt-2 mb-6 max-w-2xl text-sm leading-relaxed text-muted">
        Los lives se detectan y guardan automáticamente. Aquí puedes agregar uno a
        mano o quitar los que no quieras mostrar.
      </p>

      {/* Formulario para agregar */}
      <Card as="form" onSubmit={handleAdd} className="mb-4">
        <Field label="URL o ID del video">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pega una URL de YouTube o un ID de video…"
              className="flex-1"
            />
            <Button type="submit" disabled={!input.trim()} loading={loading} loadingText="Agregando…">
              Agregar
            </Button>
          </div>
        </Field>
      </Card>

      {status && (
        <Alert tone={status.ok ? "success" : "error"} className="mb-4">
          {status.text}
        </Alert>
      )}

      {/* Lista de videos guardados */}
      {streams.length === 0 ? (
        <EmptyState description="No hay videos guardados." />
      ) : (
        <ul className="flex flex-col gap-2">
          {streams.map((s) => (
            <Card
              as="li"
              key={s.videoId}
              padding="none"
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-display truncate text-[15px] font-bold text-foreground">
                  {s.title}
                </p>
                <MetaLine
                  className="mt-0.5"
                  items={[s.videoId, s.liveStartedAt && formatDate(s.liveStartedAt)]}
                />
              </div>
              <Button variant="danger" size="xs" onClick={() => handleRemove(s.videoId)}>
                Quitar
              </Button>
            </Card>
          ))}
        </ul>
      )}
    </section>
  );
}
