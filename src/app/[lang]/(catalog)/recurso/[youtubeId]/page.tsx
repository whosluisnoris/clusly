import { LocaleLink } from "@/components/LocaleLink";
import { notFound } from "next/navigation";
import {
  getResourceByYoutubeId,
  getPlaylistItems,
  getCategoryBySlug,
} from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth";
import { getUserVote } from "@/lib/votes";
import { isFavorite } from "@/lib/favorites";
import { resourceToPlayable, playlistItemToPlayable } from "@/lib/playable";
import { ResourceDetail } from "@/components/ResourceDetail";
import { VoteControl } from "@/components/VoteControl";
import { FavoriteButton } from "@/components/FavoriteButton";
import type { Playable } from "@/lib/types";
import { getDictionary, isLocale, fmt, DEFAULT_LOCALE, type Dictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Etiqueta y destino del enlace "volver", según el origen (?from=slug|todo|…).
async function backTarget(from: string | undefined, t: Dictionary) {
  // Orígenes que no son una categoría (páginas propias del usuario).
  const ownPages: Record<string, { href: string; label: string }> = {
    guardados: { href: "/guardados", label: t.nav.saved },
    "mis-videos": { href: "/mis-videos", label: t.nav.myVideos },
  };
  if (from && ownPages[from]) return ownPages[from];
  if (from && from !== "todo") {
    const cat = await getCategoryBySlug(from);
    if (cat) return { href: `/categoria/${cat.slug}`, label: cat.name };
  }
  return { href: "/todo", label: t.resource.backAll };
}

export default async function ResourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ youtubeId: string; lang: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { youtubeId, lang } = await params;
  const t = getDictionary(isLocale(lang) ? lang : DEFAULT_LOCALE);
  const { from } = await searchParams;

  const resource = await getResourceByYoutubeId(youtubeId);
  if (!resource) notFound();

  let episodes: Playable[] | null = null;
  if (resource.kind === "playlist") {
    const items = await getPlaylistItems(resource.id);
    episodes = items.map((it) => playlistItemToPlayable(it, resource.channel_title));
  }
  const main = resourceToPlayable(resource);
  const back = await backTarget(from, t);
  const user = await getCurrentUser();
  const [userVote, saved] = user
    ? await Promise.all([
        getUserVote(user.id, resource.id),
        isFavorite(user.id, resource.id),
      ])
    : [0, false];

  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-8">
      <LocaleLink
        href={back.href}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-accent-ink"
      >
        {fmt(t.resource.backTo, { target: back.label })}
      </LocaleLink>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <VoteControl
          resourceId={resource.id}
          score={resource.vote_count}
          initialVote={userVote}
          canVote={!!user}
          size="lg"
        />
        <FavoriteButton
          resourceId={resource.id}
          initialSaved={saved}
          canSave={!!user}
          variant="inline"
        />
        <span className="text-sm text-muted">{t.resource.voteHint}</span>
      </div>

      {resource.kind === "playlist" && (
        <div className="mb-5">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">{resource.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {resource.channel_title ? `${resource.channel_title} · ` : ""}
            {fmt(t.resource.playlistMeta, {
              n: resource.video_count ?? episodes?.length ?? 0,
            })}
          </p>
        </div>
      )}

      {resource.kind === "playlist" && (episodes?.length ?? 0) === 0 ? (
        <p className="py-16 text-center text-sm text-faint">
          {t.resource.emptyPlaylist}
        </p>
      ) : (
        <ResourceDetail main={main} episodes={episodes} />
      )}
    </main>
  );
}
