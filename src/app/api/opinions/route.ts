import { NextRequest, NextResponse } from "next/server";
import { tryGetSupabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { isSentiment, MAX_MESSAGE, MIN_MESSAGE } from "@/lib/opinions";

export const dynamic = "force-dynamic";

const SESSION_RE = /^[A-Za-z0-9-]{8,64}$/;

// Antiflood: como máximo estas opiniones por hora y por usuario (o por sesión
// del navegador si no hay cuenta).
const MAX_PER_HOUR = 3;

// POST /api/opinions — publica una opinión sobre la plataforma.
// body: { sentiment, message, sessionId }. Funciona con o sin cuenta: con
// sesión la opinión va firmada con el nombre visible; sin ella, anónima.
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const { sentiment, message, sessionId } = body;

  if (!isSentiment(sentiment)) {
    return NextResponse.json(
      { error: "Elige cómo te sientes con Clusly." },
      { status: 400 }
    );
  }

  const text = typeof message === "string" ? message.trim() : "";
  if (text.length < MIN_MESSAGE) {
    return NextResponse.json(
      { error: "Cuéntanos un poco más (mínimo 3 caracteres)." },
      { status: 400 }
    );
  }

  const session =
    typeof sessionId === "string" && SESSION_RE.test(sessionId) ? sessionId : null;

  const admin = tryGetSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Las opiniones no están disponibles ahora mismo." },
      { status: 503 }
    );
  }

  const user = await getCurrentUser();
  if (!user && !session) {
    return NextResponse.json(
      {
        error:
          "No pudimos identificar tu navegador. Entra a tu cuenta para dejar tu opinión.",
      },
      { status: 400 }
    );
  }

  // Cuenta lo que esta persona publicó en la última hora. Con cuenta manda el
  // user_id (el navegador no importa); sin ella, la sesión del navegador.
  const sinceIso = new Date(Date.now() - 3_600_000).toISOString();
  const recent = admin
    .from("site_feedback")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sinceIso);
  const { count } = await (user
    ? recent.eq("user_id", user.id)
    : recent.eq("session_id", session!));

  if ((count ?? 0) >= MAX_PER_HOUR) {
    return NextResponse.json(
      { error: "Ya nos dejaste varias opiniones seguidas. Vuelve en un rato 🙌" },
      { status: 429 }
    );
  }

  const { error } = await admin.from("site_feedback").insert({
    user_id: user?.id ?? null,
    session_id: session,
    sentiment,
    message: text.slice(0, MAX_MESSAGE),
  });

  if (error) {
    return NextResponse.json(
      { error: "No se pudo publicar tu opinión, inténtalo de nuevo." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
