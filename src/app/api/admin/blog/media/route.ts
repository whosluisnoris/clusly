import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { authorizeAdmin } from "@/lib/admin-auth";
import { BLOG_BUCKET } from "@/lib/blog";

export const dynamic = "force-dynamic";

// Carpeta donde /api/admin/blog/upload deja todo. Se fija aquí para que ni
// listar ni borrar puedan salirse de ella.
const FOLDER = "posts";
const MAX_FILES = 200;

interface StorageEntry {
  name: string;
  id: string | null;
  created_at: string | null;
  metadata: { size?: number; mimetype?: string } | null;
}

interface PostUsage {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  content: string;
}

// GET /api/admin/blog/media — contenido del bucket `blog`, con el detalle de
// qué artículos usan cada imagen (para no borrar algo que sigue publicado).
export async function GET(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  const [listRes, postsRes] = await Promise.all([
    admin.storage.from(BLOG_BUCKET).list(FOLDER, {
      limit: MAX_FILES,
      sortBy: { column: "created_at", order: "desc" },
    }),
    admin.from("blog_posts").select("id, slug, title, cover_url, content"),
  ]);

  if (listRes.error) {
    return NextResponse.json(
      { error: "No se pudo leer el bucket." },
      { status: 500 }
    );
  }

  const posts = (postsRes.data as PostUsage[] | null) ?? [];

  const files = ((listRes.data as StorageEntry[] | null) ?? [])
    // `list` incluye carpetas (id null) y el marcador de carpeta vacía.
    .filter((entry) => entry.id !== null && entry.name !== ".emptyFolderPlaceholder")
    .map((entry) => {
      const path = `${FOLDER}/${entry.name}`;
      const { data } = admin.storage.from(BLOG_BUCKET).getPublicUrl(path);

      // El nombre del archivo es único e irrepetible, así que buscar la ruta
      // dentro del texto basta para saber si el artículo la usa.
      const usedBy = posts
        .filter(
          (p) => (p.cover_url ?? "").includes(path) || (p.content ?? "").includes(path)
        )
        .map((p) => ({ id: p.id, slug: p.slug, title: p.title }));

      return {
        path,
        name: entry.name,
        url: data.publicUrl,
        size: entry.metadata?.size ?? null,
        mimeType: entry.metadata?.mimetype ?? null,
        createdAt: entry.created_at,
        usedBy,
      };
    });

  return NextResponse.json({ files });
}

// DELETE /api/admin/blog/media — borra una imagen del bucket.
// body: { path, force? }. Si la imagen está en uso, se rechaza salvo que se
// mande `force: true` (el panel lo pide con una confirmación aparte).
export async function DELETE(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const path = typeof body.path === "string" ? body.path : "";

  // Solo se puede borrar dentro de la carpeta del blog, y sin trucos de ruta.
  if (!path.startsWith(`${FOLDER}/`) || path.includes("..") || path.length > 300) {
    return NextResponse.json({ error: "Ruta no válida." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  if (body.force !== true) {
    const { data } = await admin.from("blog_posts").select("id, title, cover_url, content");
    const usedBy = ((data as PostUsage[] | null) ?? [])
      .filter(
        (p) => (p.cover_url ?? "").includes(path) || (p.content ?? "").includes(path)
      )
      .map((p) => p.title);

    if (usedBy.length > 0) {
      return NextResponse.json(
        {
          error: `Esa imagen se usa en: ${usedBy.join(", ")}.`,
          usedBy,
        },
        { status: 409 }
      );
    }
  }

  const { error } = await admin.storage.from(BLOG_BUCKET).remove([path]);
  if (error) {
    return NextResponse.json(
      { error: "No se pudo borrar la imagen." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
