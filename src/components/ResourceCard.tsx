"use client";

import { useState } from "react";
import Image from "next/image";
import { LocaleLink } from "@/components/LocaleLink";
import type { ResourceRow } from "@/lib/types";
import type { CategoryTag } from "@/lib/catalog";
import { formatDuration, timeAgo } from "@/lib/dates";
import { useT } from "@/components/I18nProvider";
import { plural, localizeCategory } from "@/lib/i18n";
import { VoteControl } from "@/components/VoteControl";
import { FavoriteButton } from "@/components/FavoriteButton";
import { topicColor } from "@/lib/color";
import { GlowFrame } from "@/components/ui";

// Tarjeta del catálogo (grid), con el mismo efecto que las temáticas de la
// landing (GlowFrame): al pasar el cursor el color entra como brillo detrás de
// la tarjeta, reflejo y borde, y se levanta un poco. El color es el de su
// temática: `accent` si la página es de una categoría, o la primera categoría
// del recurso.
//
// El enlace envuelve la miniatura y el título; el control de voto y el corazón
// de guardar viven fuera de él para no anidar botones dentro de un <a>.
// `categories` muestra a qué filtro(s) pertenece el video.
export function ResourceCard({
  resource,
  from,
  accent,
  userVote,
  canVote = false,
  categories,
  saved = false,
  removeOnUnsave = false,
}: {
  resource: ResourceRow;
  from?: string;
  accent?: string | null;
  userVote?: number;
  canVote?: boolean;
  categories?: CategoryTag[];
  saved?: boolean;
  removeOnUnsave?: boolean;
}) {
  const t = useT();
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = imgError
    ? `https://i.ytimg.com/vi/${resource.youtube_id}/hqdefault.jpg`
    : resource.thumbnail_url ??
      `https://i.ytimg.com/vi/${resource.youtube_id}/maxresdefault.jpg`;

  const isPlaylist = resource.kind === "playlist";
  const href = `/recurso/${resource.youtube_id}${from ? `?from=${encodeURIComponent(from)}` : ""}`;
  const line =
    accent || (categories?.[0] ? topicColor(categories[0].slug) : "var(--accent)");

  const videoCount = resource.video_count ?? 0;
  const meta = isPlaylist
    ? plural(t.card.videoCount, videoCount)
    : formatDuration(resource.duration_seconds) ?? timeAgo(resource.published_at) ?? "";

  return (
    <GlowFrame color={line} className="group flex flex-col overflow-hidden ring-1 ring-border">
      {/* Corazón de guardar: aparece al pasar el cursor sobre la tarjeta.
          `canVote` indica que hay sesión, así que sirve para ambas acciones. */}
      <FavoriteButton
        resourceId={resource.id}
        initialSaved={saved}
        canSave={canVote}
        removeOnUnsave={removeOnUnsave}
      />

      <LocaleLink href={href} className="flex flex-1 flex-col focus-visible:outline-none">
        <div className="relative aspect-video w-full overflow-hidden bg-elevated">
          {resource.thumbnail_url || resource.kind === "video" ? (
            <Image
              src={thumbnailUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
              className="object-cover transition duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              onError={() => setImgError(true)}
              unoptimized={imgError}
            />
          ) : (
            <div className="grid h-full place-items-center text-faint">
              <PlaylistIcon className="h-8 w-8" />
            </div>
          )}

          {/* Playlist: a un lado qué es, al otro cuántos videos trae */}
          {isPlaylist && (
            <>
              <span className={`${OVERLAY} bottom-2 left-2`}>
                <PlaylistIcon className="h-3.5 w-3.5" />
                {t.card.playlist}
              </span>
              <span className={`${OVERLAY} bottom-2 right-2 tabular-nums`}>
                <span className="sr-only">{plural(t.card.videoCount, videoCount)}</span>
                <span aria-hidden="true">{videoCount}</span>
                <PlayIcon className="h-3 w-3" />
              </span>
            </>
          )}

          {/* Idioma hablado del video: solo se marca el que no es español,
              porque el catálogo es mayoritariamente español. Va arriba a la
              izquierda: abajo están las leyendas de playlist y arriba a la
              derecha el corazón. */}
          {resource.language === "en" && (
            <span className={`${OVERLAY} left-2 top-2`}>EN</span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3.5 pb-2">
          <h3 className="font-display line-clamp-2 text-[15px] font-bold leading-snug text-foreground">
            {resource.title}
          </h3>
          {resource.channel_title && (
            <p className="truncate text-xs text-muted">{resource.channel_title}</p>
          )}
          {categories && categories.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {categories.slice(0, 2).map((c) => (
                <span
                  key={c.slug}
                  className="inline-flex items-center gap-1 rounded-full bg-fill px-2 py-0.5 text-[10px] font-semibold text-muted ring-1 ring-border"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: topicColor(c.slug) }}
                    aria-hidden="true"
                  />
                  {localizeCategory(c, t).name}
                </span>
              ))}
              {categories.length > 2 && (
                <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-faint">
                  +{categories.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </LocaleLink>

      <div className="flex items-center justify-between gap-2 px-3.5 pb-3">
        <VoteControl
          resourceId={resource.id}
          score={resource.vote_count}
          initialVote={userVote}
          canVote={canVote}
        />
        {meta && <span className="text-xs text-faint">{meta}</span>}
      </div>
    </GlowFrame>
  );
}

// Leyenda sobre la miniatura: oscura en ambos temas para leerse encima de
// cualquier imagen.
const OVERLAY =
  "absolute inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm";

function PlayIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M7 4.5v15l12.5-7.5z" />
    </svg>
  );
}

// Lista con una flecha de reproducir: el ícono habitual de "playlist".
function PlaylistIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 6h13M3 12h9M3 18h7" />
      <path d="M16 13.5v6l5-3z" fill="currentColor" />
    </svg>
  );
}
