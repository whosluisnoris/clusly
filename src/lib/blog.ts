import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";

// Blog de Clusly. Solo lo escribe el staff (owner/admin) desde /admin → Blog;
// el público únicamente lee lo publicado. La RLS de `blog_posts` deja pasar el
// SELECT cuando `status = 'published'`, así que las páginas públicas usan el
// cliente anon y los borradores nunca salen de la base.

export type PostStatus = "draft" | "published";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  authorName: string | null;
  status: PostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  status: PostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  profiles: { display_name: string | null } | null;
}

const POST_COLS =
  "id, slug, title, excerpt, content, status, published_at, created_at, updated_at, profiles(display_name)";

function toPost(row: PostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    authorName: row.profiles?.display_name?.trim() || null,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Artículos publicados, del más reciente al más antiguo.
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const { data } = await getSupabase()
    .from("blog_posts")
    .select(POST_COLS)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return ((data as unknown as PostRow[] | null) ?? []).map(toPost);
}

// Un artículo publicado por su slug (null si no existe o sigue en borrador).
export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  const { data } = await getSupabase()
    .from("blog_posts")
    .select(POST_COLS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  const row = data as unknown as PostRow | null;
  return row ? toPost(row) : null;
}

// Todos los artículos, incluidos los borradores. Solo para /api/admin/blog,
// que ya verificó el rol de staff.
export async function getAllPosts(): Promise<BlogPost[]> {
  const { data } = await getSupabaseAdmin()
    .from("blog_posts")
    .select(POST_COLS)
    .order("created_at", { ascending: false });

  return ((data as unknown as PostRow[] | null) ?? []).map(toPost);
}

// Título → slug legible en la URL. Quita acentos y deja letras, números y
// guiones. Si el título no aporta nada usable, cae en "articulo".
export function slugify(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
  return base || "articulo";
}

// Slug libre: si ya existe, le añade -2, -3… hasta encontrar hueco.
// `ignoreId` evita que un artículo choque consigo mismo al renombrarse.
export async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const admin = getSupabaseAdmin();
  let candidate = base;

  for (let n = 2; n < 50; n++) {
    let query = admin.from("blog_posts").select("id").eq("slug", candidate);
    if (ignoreId) query = query.neq("id", ignoreId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${n}`;
  }
  // Caso extremo: se desempata con la marca de tiempo.
  return `${base}-${Date.now()}`;
}

// Minutos de lectura aproximados (200 palabras por minuto).
export function readingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
