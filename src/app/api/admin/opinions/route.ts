import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { authorizeAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

interface AdminOpinionRow {
  id: string;
  sentiment: string;
  message: string;
  hidden_at: string | null;
  created_at: string;
  profiles: { display_name: string | null } | null;
}

// GET /api/admin/opinions — el buzón completo, incluidas las archivadas
export async function GET(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("site_feedback")
    .select("id, sentiment, message, hidden_at, created_at, profiles(display_name)")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const opinions = ((data as unknown as AdminOpinionRow[] | null) ?? []).map((row) => ({
    id: row.id,
    sentiment: row.sentiment,
    message: row.message,
    hidden: row.hidden_at !== null,
    authorName: row.profiles?.display_name?.trim() || "Anónimo",
    createdAt: row.created_at,
  }));

  return NextResponse.json({ opinions });
}

// PATCH /api/admin/opinions — archiva una opinión ya leída, o la restaura.
// body: { id, hidden: boolean }
export async function PATCH(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "Falta el id" }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("site_feedback")
    .update({ hidden_at: body.hidden === true ? new Date().toISOString() : null })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/opinions — borra una opinión definitivamente
export async function DELETE(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "Falta el id" }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin().from("site_feedback").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
