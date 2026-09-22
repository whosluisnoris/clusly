import { LocaleLink } from "@/components/LocaleLink";
import Image from "next/image";
import { getPublishedPosts, readingMinutes } from "@/lib/blog";
import { formatDate, timeAgo } from "@/lib/dates";
import { getDictionary, isLocale, fmt, DEFAULT_LOCALE } from "@/lib/i18n";
import { EmptyState, MetaLine, Page, PageHeader, cardClasses } from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = getDictionary(isLocale(lang) ? lang : DEFAULT_LOCALE);
  return { title: t.blog.title, description: t.blog.subtitle };
}

// Índice del blog: solo artículos publicados (la RLS de blog_posts ya filtra los
// borradores, así que ni siquiera salen de la base).
export default async function BlogPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = getDictionary(isLocale(lang) ? lang : DEFAULT_LOCALE);
  const posts = await getPublishedPosts();

  return (
    <Page size="content">
      <PageHeader title={t.blog.title} description={t.blog.subtitle} />

      {posts.length === 0 ? (
        <EmptyState description={t.blog.empty} />
      ) : (
        <ul className="flex flex-col gap-4">
          {posts.map((post) => (
            <li key={post.id}>
              <LocaleLink
                href={`/blog/${post.slug}`}
                className={cardClasses({
                  interactive: true,
                  padding: "none",
                  className: "group block overflow-hidden",
                })}
              >
                {post.coverUrl && (
                  <div className="relative aspect-[21/9] w-full bg-elevated">
                    <Image
                      src={post.coverUrl}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 768px"
                      className="object-cover transition duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
                    />
                  </div>
                )}
                <div className="p-5 sm:p-6">
                  <h2 className="text-xl font-extrabold leading-snug tracking-tight text-foreground sm:text-2xl">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted sm:text-[15px]">
                      {post.excerpt}
                    </p>
                  )}
                  <MetaLine
                    className="mt-4"
                    items={[
                      post.authorName && (
                        <span className="font-semibold text-muted">{post.authorName}</span>
                      ),
                      post.publishedAt && (
                        <time dateTime={post.publishedAt}>
                          {timeAgo(post.publishedAt) ?? formatDate(post.publishedAt)}
                        </time>
                      ),
                      fmt(t.blog.readingTime, { n: readingMinutes(post.content) }),
                    ]}
                  />
                </div>
              </LocaleLink>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
