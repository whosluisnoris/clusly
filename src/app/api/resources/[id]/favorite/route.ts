import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST /api/resources/[id]/favorite — guarda o quita un recurso de la lista del
// usuario. body: { saved: boolean }. Idempotente: guardar dos veces no duplica
// (upsert por la clave primaria) y quitar algo no guardado no falla.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Inicia sesión para guardar videos." },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { saved?: unknown };
  const saved = body.saved === true;

  const admin = getSupabaseAdmin();

  const { error } = saved
    ? await admin
        .from("resource_favorites")
        .upsert(
          { resource_id: id, user_id: user.id },
          { onConflict: "resource_id,user_id" }
        )
    : await admin
        .from("resource_favorites")
        .delete()
        .eq("resource_id", id)
        .eq("user_id", user.id);

  if (error) {
    // 23503 = FK rota (recurso borrado); 22P02 = id que no es un uuid válido.
    const notFound = error.code === "23503" || error.code === "22P02";
    return NextResponse.json(
      {
        error: notFound
          ? "Ese recurso ya no existe."
          : "No se pudo guardar el video.",
      },
      { status: notFound ? 404 : 400 }
    );
  }

  return NextResponse.json({ ok: true, saved });
}
