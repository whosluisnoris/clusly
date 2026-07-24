import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createResourceFromUrl, cleanCategoryIds } from "@/lib/resources";
import { parseYouTubeUrl } from "@/lib/youtube-url";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SESSION_RE = /^[A-Za-z0-9-]{8,64}$/;

// Antiflood de los aportes sin cuenta: como máximo estos por hora y navegador.
const MAX_ANON_PER_HOUR = 3;

// POST /api/resources — envío de un video por la comunidad.
//
//   · Con sesión: aparece público de inmediato (status='published') con
//     submitted_by = usuario.
//   · Sin sesión: se guarda igual, pero como 'pending' — invisible en el
//     catálogo (la política de lectura pública solo deja pasar 'published')
//     hasta que el staff lo apruebe desde /admin. Así nadie pierde su aporte
//     por no querer crear una cuenta.
//
// Si el video ya existe, la restricción UNIQUE(kind, youtube_id) devuelve 409 y
// el cliente muestra "ya está en Clusly" con enlace al existente.
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const url = typeof body.url === "string" ? body.url : "";
  const target = parseYouTubeUrl(url);
  const categoryIds = cleanCategoryIds(body.categoryIds);
  const session =
    typeof body.sessionId === "string" && SESSION_RE.test(body.sessionId)
      ? body.sessionId
      : null;

  const admin = getSupabaseAdmin();

  if (!user) {
    if (!session) {
      return NextResponse.json(
        {
          error:
            "No pudimos identificar tu navegador. Entra a tu cuenta para aportar el video.",
        },
        { status: 400 }
      );
    }

    const sinceIso = new Date(Date.now() - 3_600_000).toISOString();
    const { count } = await admin
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("submitted_session", session)
      .gte("added_at", sinceIso);

    if ((count ?? 0) >= MAX_ANON_PER_HOUR) {
      return NextResponse.json(
        { error: "Ya mandaste varios aportes seguidos. Vuelve en un rato 🙌" },
        { status: 429 }
      );
    }
  }

  const result = await createResourceFromUrl(admin, {
    url,
    categoryIds,
    manualTitle: null,
    submittedBy: user?.id ?? null,
    submittedSession: user ? null : session,
    status: user ? "published" : "pending",
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        // En un duplicado, deja que el cliente enlace al recurso existente.
        youtubeId: result.status === 409 ? target?.id : undefined,
      },
      { status: result.status }
    );
  }

  return NextResponse.json({
    ok: true,
    kind: result.kind,
    youtubeId: target?.id,
    warning: result.warning,
    pending: !user,
  });
}
