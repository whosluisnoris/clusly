import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublishedPost, readingMinutes } from "@/lib/blog";
import { Markdown } from "@/lib/markdown";
import { formatDate } from "@/lib/dates";
import { getDictionary, isLocale, fmt, DEFAULT_LOCALE } from "@/lib/i18n";
import { BackLink, ButtonLink, Card, MetaLine, Page } from "@/components/ui";

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
    <Page size="narrow">
      <BackLink href="/blog" className="mb-5">
        {t.blog.back}
      </BackLink>

      <article>
        <header className="border-b border-border pb-8">
          <h1 className="text-[2rem] font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-[2.6rem]">
            {post.title}
          </h1>
          <MetaLine
            className="mt-4 text-[13px]"
            items={[
              post.authorName && (
                <span className="font-semibold text-muted">{post.authorName}</span>
              ),
              post.publishedAt && (
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              ),
              fmt(t.blog.readingTime, { n: readingMinutes(post.content) }),
            ]}
          />
          {post.excerpt && (
            <p className="mt-5 text-[17px] leading-relaxed text-muted">{post.excerpt}</p>
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

      <Card
        padding="lg"
        className="mt-14 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="font-display text-lg font-bold text-foreground">{t.blog.ctaTitle}</p>
        <ButtonLink href="/enviar">{t.blog.ctaButton}</ButtonLink>
      </Card>
    </Page>
  );
}
