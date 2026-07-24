import Link from "next/link";
import Image from "next/image";
import { getPublishedPosts, readingMinutes } from "@/lib/blog";
import { formatDate, timeAgo } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog",
  description:
    "Artículos del equipo de Clusly: cómo aprender tecnología con criterio, novedades de la plataforma y lo que vamos encontrando.",
};

// Índice del blog: solo artículos publicados (la RLS de blog_posts ya filtra los
// borradores, así que ni siquiera salen de la base).
export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-8">
      <div className="mb-8 flex items-start gap-4">
        <span
          className="brand-gradient mt-1.5 h-10 w-1.5 shrink-0 rounded-full"
          aria-hidden="true"
        />
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Blog
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Lo que vamos aprendiendo mientras construimos Clusly: cómo estudiar con
            criterio, novedades de la plataforma y hallazgos del catálogo.
          </p>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-2xl bg-surface p-10 text-center text-sm text-muted ring-1 ring-border">
          Todavía no hay artículos publicados. Pronto escribimos el primero.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/blog/${post.slug}`}
                className="block overflow-hidden rounded-2xl bg-surface ring-1 ring-border transition hover:ring-2 hover:ring-accent/40"
              >
                {post.coverUrl && (
                  <div className="relative aspect-[21/9] w-full bg-elevated">
                    <Image
                      src={post.coverUrl}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 768px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                <h2 className="text-xl font-black leading-snug text-foreground">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 line-clamp-3 text-sm text-muted">{post.excerpt}</p>
                )}
                <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
                  {post.authorName && (
                    <>
                      <span className="font-semibold text-muted">{post.authorName}</span>
                      <span>·</span>
                    </>
                  )}
                  {post.publishedAt && (
                    <>
                      <time dateTime={post.publishedAt}>
                        {timeAgo(post.publishedAt) ?? formatDate(post.publishedAt)}
                      </time>
                      <span>·</span>
                    </>
                  )}
                  <span>{readingMinutes(post.content)} min de lectura</span>
                </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
