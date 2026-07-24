import { tryGetSupabaseAdmin } from "@/lib/supabase";

// Opiniones de la sección /opiniones: qué piensan los usuarios de Clusly.
// Distinto de la encuesta flotante (`feedback_votes`, una pregunta cerrada por
// sesión): aquí el texto es lo importante y se publica firmado (o anónimo).
//
// La tabla `site_feedback` no tiene políticas públicas: se lee y escribe desde
// el servidor con el cliente service-role. La lectura pública siempre filtra
// `hidden_at is null` — el staff puede ocultar lo que no deba mostrarse.

export const SENTIMENTS = ["me_encanta", "puede_mejorar", "no_me_convence"] as const;
export type Sentiment = (typeof SENTIMENTS)[number];

export const SENTIMENT_META: Record<Sentiment, { emoji: string; label: string }> = {
  me_encanta: { emoji: "😍", label: "Me encanta" },
  puede_mejorar: { emoji: "🤔", label: "Puede mejorar" },
  no_me_convence: { emoji: "😕", label: "No me convence" },
};

export const MAX_MESSAGE = 1000;
export const MIN_MESSAGE = 3;

export function isSentiment(value: unknown): value is Sentiment {
  return typeof value === "string" && (SENTIMENTS as readonly string[]).includes(value);
}

export interface PublicOpinion {
  id: string;
  sentiment: Sentiment;
  message: string;
  authorName: string;
  createdAt: string;
}

export interface OpinionSummary {
  total: number;
  counts: Record<Sentiment, number>;
}

interface OpinionJoinRow {
  id: string;
  sentiment: string;
  message: string;
  created_at: string;
  profiles: { display_name: string | null } | null;
}

function emptyCounts(): Record<Sentiment, number> {
  return { me_encanta: 0, puede_mejorar: 0, no_me_convence: 0 };
}

// Opiniones visibles, de la más reciente a la más antigua.
export async function getPublicOpinions(limit = 40): Promise<PublicOpinion[]> {
  const admin = tryGetSupabaseAdmin();
  if (!admin) return [];

  const { data } = await admin
    .from("site_feedback")
    .select("id, sentiment, message, created_at, profiles(display_name)")
    .is("hidden_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data as unknown as OpinionJoinRow[] | null) ?? [])
    .filter((row): row is OpinionJoinRow & { sentiment: Sentiment } =>
      isSentiment(row.sentiment)
    )
    .map((row) => ({
      id: row.id,
      sentiment: row.sentiment,
      message: row.message,
      authorName: row.profiles?.display_name?.trim() || "Anónimo",
      createdAt: row.created_at,
    }));
}

// Reparto de sentimientos entre las opiniones visibles. Cuenta en JS sobre las
// filas de la tabla — suficiente a la escala actual de la plataforma.
export async function getOpinionSummary(): Promise<OpinionSummary> {
  const admin = tryGetSupabaseAdmin();
  if (!admin) return { total: 0, counts: emptyCounts() };

  const { data } = await admin
    .from("site_feedback")
    .select("sentiment")
    .is("hidden_at", null);

  const counts = emptyCounts();
  let total = 0;
  for (const row of (data as { sentiment: string }[] | null) ?? []) {
    if (isSentiment(row.sentiment)) {
      counts[row.sentiment] += 1;
      total += 1;
    }
  }
  return { total, counts };
}
