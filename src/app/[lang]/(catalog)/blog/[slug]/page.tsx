import { LocaleLink } from "@/components/LocaleLink";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublishedPost, readingMinutes } from "@/lib/blog";
import { Markdown } from "@/lib/markdown";
import { formatDate } from "@/lib/dates";
import { getDictionary, isLocale, fmt, DEFAULT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Metadatos por artículo, para que al compartirlo salga su propio título y
// resumen en vez de los genéricos del sitio.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; lang: string }>;
}): Promise<Metadata> {
  const { slug, lang } = await params;
  const t = getDictionary(isLocale(lang) ? lang : DEFAULT_LOCALE);
  const post = await getPublishedPost(slug);
  if (!post) return { title: t.blog.notFound };

  const description = post.excerpt ?? undefined;
  // Si el artículo tiene portada, es la imagen que sale al compartirlo; si no,
  // se hereda la del sitio (/og.png) del layout raíz.
  const images = post.coverUrl ? [post.coverUrl] : undefined;

  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt ?? undefined,
      authors: post.authorName ? [post.authorName] : undefined,
      ...(images && { images }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      ...(images && { images }),
    },
  };
}

// Un artículo publicado. Los borradores devuelven 404 al público: la consulta
// filtra por status y la RLS tampoco los deja pasar.
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string; lang: string }>;
}) {
  const { slug, lang } = await params;
  const t = getDictionary(isLocale(lang) ? lang : DEFAULT_LOCALE);
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-8">
      <LocaleLink
        href="/blog"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-accent-ink"
      >
        {t.blog.back}
      </LocaleLink>

      <article>
        <header className="border-b border-border pb-6">
          <h1 className="text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
            {post.authorName && (
              <>
                <span className="font-semibold text-muted">{post.authorName}</span>
                <span>·</span>
              </>
            )}
            {post.publishedAt && (
              <>
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                <span>·</span>
              </>
            )}
            <span>{fmt(t.blog.readingTime, { n: readingMinutes(post.content) })}</span>
          </p>
          {post.excerpt && (
            <p className="mt-4 text-base leading-relaxed text-muted">{post.excerpt}</p>
          )}
          {post.coverUrl && (
            <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-elevated ring-1 ring-border">
              <Image
                src={post.coverUrl}
                alt=""
                fill
                priority
                sizes="(max-width: 768px) 100vw, 672px"
                className="object-cover"
              />
            </div>
          )}
        </header>

        <div className="text-[15px]">
          <Markdown>{post.content}</Markdown>
        </div>
      </article>

      <div className="mt-12 rounded-2xl bg-surface p-6 text-center ring-1 ring-border">
        <p className="text-sm text-muted">{t.blog.ctaTitle}</p>
        <LocaleLink
          href="/enviar"
          className="brand-gradient mt-3 inline-block rounded-full px-5 py-2.5 text-sm font-bold text-on-accent shadow-lg shadow-black/20 transition hover:brightness-110 active:scale-95"
        >
          {t.blog.ctaButton}
        </LocaleLink>
      </div>
    </main>
  );
}
