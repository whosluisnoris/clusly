"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveStreams } from "@/hooks/useLiveStreams";
import { PlayerPanel } from "@/components/PlayerPanel";
import { VideoListItem } from "@/components/VideoListItem";
import { FeedbackPoll } from "@/components/FeedbackPoll";
import { useT } from "@/components/I18nProvider";
import { fmt } from "@/lib/i18n";
import { LOFI_STREAM } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";
import type { LiveStream } from "@/lib/invidious";
import {
  Alert,
  Badge,
  Button,
  Card,
  Page,
  PageHeader,
  SectionHeader,
  Select,
  Skeleton,
} from "@/components/ui";

type SortOrder = "desc" | "asc";

// Fecha para ordenar: el inicio real de la transmisión
const sortKey = (s: LiveStream) => s.liveStartedAt ?? "";

// Pestaña "Platzi Lives": el histórico de lives con detección automática, tal
// como funcionaba en la home original. La marca y las pestañas viven ahora en el
// layout compartido del catálogo; aquí queda su barra propia (EN VIVO / Actualizar).
export default function PlatziLivesPage() {
  const t = useT();
  const { streams, loading, error, refresh } = useLiveStreams();
  const [chosen, setChosen] = useState<LiveStream | null>(null);
  const [order, setOrder] = useState<SortOrder>("desc");
  const [requestedId] = useState(() =>
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("v")
  );

  const liveNow = useMemo(() => streams.filter((s) => s.isLive), [streams]);

  const past = useMemo(() => {
    const rest = streams.filter((s) => !s.isLive);
    return [...rest].sort((a, b) =>
      order === "desc"
        ? sortKey(b).localeCompare(sortKey(a))
        : sortKey(a).localeCompare(sortKey(b))
    );
  }, [streams, order]);

  const displayed = useMemo(() => {
    const live = liveNow[0] ?? null;
    if (chosen) {
      if (live && chosen.videoId === LOFI_STREAM.videoId) return live;
      return chosen;
    }
    if (loading && streams.length === 0) return null;
    if (requestedId) {
      if (requestedId === LOFI_STREAM.videoId) return live ?? LOFI_STREAM;
      const match = streams.find((s) => s.videoId === requestedId);
      if (match) return match;
    }
    return live ?? LOFI_STREAM;
  }, [chosen, loading, streams, liveNow, requestedId]);

  const lastTracked = useRef<string | null>(null);
  useEffect(() => {
    if (!displayed || lastTracked.current === displayed.videoId) return;
    const isFirst = lastTracked.current === null;
    lastTracked.current = displayed.videoId;
    if (chosen) return;
    trackEvent(
      displayed.videoId,
      isFirst && requestedId === displayed.videoId ? "play" : "autoplay_default"
    );
  }, [displayed, chosen, requestedId]);

  function handleSelect(stream: LiveStream) {
    setChosen(stream);
    trackEvent(stream.videoId, "play");
    const url = new URL(window.location.href);
    url.searchParams.set("v", stream.videoId);
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <Page>
      {/* Cabecera compacta: aquí el protagonista es el reproductor */}
      <PageHeader
        size="md"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {t.lives.title}
            {liveNow.length > 0 && (
              <Badge tone="live" size="md" dot="pulse">
                {t.lives.liveNow}
              </Badge>
            )}
          </span>
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={refresh}
            loading={loading}
            loadingText={t.lives.searching}
          >
            {t.lives.refresh}
          </Button>
        }
      />

      {error && (
        <Alert tone="error" className="mb-5">
          {fmt(t.lives.error, { message: error })}
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_430px]">
        {/* Reproductor principal */}
        <div>
          {displayed ? (
            <PlayerPanel stream={displayed} autoplay={chosen !== null} />
          ) : (
            <Skeleton className="aspect-video w-full rounded-2xl" />
          )}
        </div>

        {/* Lista lateral */}
        <Card
          as="aside"
          variant="glass"
          padding="none"
          className="custom-scroll flex flex-col gap-10 p-4 sm:p-5 lg:max-h-[80vh] lg:overflow-y-auto"
        >
          <section aria-label={t.lives.liveNowSection}>
            <SectionHeader
              size="sm"
              title={
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-danger motion-reduce:animate-none" />
                  {t.lives.liveNowSection}
                </span>
              }
            />
            <div className="flex flex-col gap-3">
              {liveNow.map((s) => (
                <VideoListItem
                  key={s.videoId}
                  stream={s}
                  active={displayed?.videoId === s.videoId}
                  onSelect={handleSelect}
                  badge="EN VIVO"
                />
              ))}
              <VideoListItem
                stream={LOFI_STREAM}
                active={displayed?.videoId === LOFI_STREAM.videoId}
                onSelect={handleSelect}
                badge="24/7"
              />
            </div>
          </section>

          <section aria-label={t.lives.pastSection}>
            <SectionHeader
              size="sm"
              title={t.lives.pastSection}
              action={
                <Select
                  compact
                  value={order}
                  onChange={(e) => setOrder(e.target.value as SortOrder)}
                  aria-label={t.lives.sortLabel}
                >
                  <option value="desc">{t.lives.sortNewest}</option>
                  <option value="asc">{t.lives.sortOldest}</option>
                </Select>
              }
            />

            {loading && streams.length === 0 ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : past.length === 0 ? (
              <p className="text-sm text-faint">
                {t.lives.empty}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {past.map((s) => (
                  <VideoListItem
                    key={s.videoId}
                    stream={s}
                    active={displayed?.videoId === s.videoId}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}
          </section>
        </Card>
      </div>

      {/* Encuesta flotante: su pregunta es sobre Platzi Lives, así que solo
          se muestra en esta ruta (no en el resto del catálogo). */}
      <FeedbackPoll />
    </Page>
  );
}
