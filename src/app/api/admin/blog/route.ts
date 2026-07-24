import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { authorizeAdmin } from "@/lib/admin-auth";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { getAllPosts, slugify, uniqueSlug } from "@/lib/blog";

export const dynamic = "force-dynamic";

const MAX_TITLE = 160;
const MAX_EXCERPT = 300;

// El blog lo escribe únicamente el staff: todas las rutas de aquí pasan por
// `authorizeAdmin` (rol owner/admin en la sesión, o el ADMIN_SECRET como
// respaldo programático). La tabla no tiene políticas de escritura, así que no
// hay forma de publicar sin pasar por aquí.

// GET /api/admin/blog — todos los artículos, incluidos los borradores
export async function GET(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ posts: await getAllPosts() });
}

// POST /api/admin/blog — crea un artículo (nace como borrador)
// body: { title, excerpt?, content?, status? }
export async function POST(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim().slice(0, MAX_TITLE) : "";
  if (title.length < 3) {
    return NextResponse.json(
      { error: "El título necesita al menos 3 caracteres." },
      { status: 400 }
    );
  }

  const status = body.status === "published" ? "published" : "draft";
  const slug = await uniqueSlug(slugify(title));

  // La firma es de quien lo escribe; con ADMIN_SECRET (sin sesión) va sin autor.
  const user = await getCurrentUser();
  const authorId = user && isStaff(user.role) ? user.id : null;

  const { data, error } = await getSupabaseAdmin()
    .from("blog_posts")
    .insert({
      slug,
      title,
      excerpt:
        typeof body.excerpt === "string" && body.excerpt.trim()
          ? body.excerpt.trim().slice(0, MAX_EXCERPT)
          : null,
      content: typeof body.content === "string" ? body.content : "",
      author_id: authorId,
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id, slug: data.slug });
}

// PATCH /api/admin/blog — edita un artículo o cambia su estado.
// body: { id, title?, excerpt?, content?, status? }
export async function PATCH(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "Falta el id" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: current } = await admin
    .from("blog_posts")
    .select("title, status, published_at")
    .eq("id", id)
    .maybeSingle();
  if (!current) {
    return NextResponse.json({ error: "Ese artículo ya no existe." }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.title === "string") {
    const title = body.title.trim().slice(0, MAX_TITLE);
    if (title.length < 3) {
      return NextResponse.json(
        { error: "El título necesita al menos 3 caracteres." },
        { status: 400 }
      );
    }
    updates.title = title;
    // El slug sigue al título, pero solo mientras el artículo es borrador: una
    // vez publicado, cambiar la URL rompería los enlaces que ya circulan.
    if (current.status === "draft" && title !== current.title) {
      updates.slug = await uniqueSlug(slugify(title), id);
    }
  }

  if (typeof body.excerpt === "string") {
    updates.excerpt = body.excerpt.trim().slice(0, MAX_EXCERPT) || null;
  }
  if (typeof body.content === "string") {
    updates.content = body.content;
  }

  if (body.status === "published" || body.status === "draft") {
    updates.status = body.status;
    // La fecha de publicación se fija la primera vez y ya no se mueve.
    if (body.status === "published" && !current.published_at) {
      updates.published_at = new Date().toISOString();
    }
  }

  const { error } = await admin.from("blog_posts").update(updates).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/blog — borra un artículo definitivamente
export async function DELETE(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "Falta el id" }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin().from("blog_posts").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
