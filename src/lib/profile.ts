import { getSupabaseAdmin } from "@/lib/supabase";

// Perfil del usuario: los datos editables de `profiles` (biografía, ubicación y
// enlaces) más los contadores de su actividad en la plataforma.

export const MAX_BIO = 300;
export const MAX_LOCATION = 80;
export const MAX_NAME = 60;
export const MAX_LINKS = 6;
export const MAX_LINK_LABEL = 40;

export interface ProfileLink {
  label: string;
  url: string;
}

export interface Profile {
  id: string;
  displayName: string;
  bio: string | null;
  location: string | null;
  links: ProfileLink[];
  createdAt: string | null;
}

export interface ProfileStats {
  aportes: number;
  guardados: number;
  votos: number;
  opiniones: number;
}

// Solo se aceptan (y se pintan) enlaces http/https: la política RLS deja que el
// usuario edite su propia fila desde el navegador, así que un `javascript:` no
// puede colarse ni al guardar ni al renderizar.
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// Normaliza lo que venga en `links` (de la API o de la base) a una lista segura.
export function sanitizeLinks(input: unknown): ProfileLink[] {
  if (!Array.isArray(input)) return [];
  const clean: ProfileLink[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const { label, url } = item as Record<string, unknown>;
    if (typeof url !== "string") continue;
    const trimmed = url.trim();
    if (!isSafeUrl(trimmed)) continue;
    const name =
      typeof label === "string" && label.trim()
        ? label.trim().slice(0, MAX_LINK_LABEL)
        : hostOf(trimmed);
    clean.push({ label: name, url: trimmed });
    if (clean.length >= MAX_LINKS) break;
  }
  return clean;
}

// Etiqueta por defecto de un enlace: su dominio, sin "www.".
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Enlace";
  }
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  links: unknown;
  created_at: string | null;
}

// Perfil guardado en `profiles`. `fallbackName` se usa si la fila todavía no
// tiene nombre (cuentas creadas antes del trigger, o metadatos vacíos).
export async function getProfile(
  userId: string,
  fallbackName: string
): Promise<Profile> {
  const { data } = await getSupabaseAdmin()
    .from("profiles")
    .select("id, display_name, bio, location, links, created_at")
    .eq("id", userId)
    .maybeSingle();

  const row = data as ProfileRow | null;
  return {
    id: userId,
    displayName: row?.display_name?.trim() || fallbackName,
    bio: row?.bio ?? null,
    location: row?.location ?? null,
    links: sanitizeLinks(row?.links),
    createdAt: row?.created_at ?? null,
  };
}

// Contadores de actividad. Se piden en paralelo con `head: true` (solo el total,
// sin traer filas).
export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const admin = getSupabaseAdmin();
  const [aportes, guardados, votos, opiniones] = await Promise.all([
    admin
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("submitted_by", userId),
    admin
      .from("resource_favorites")
      .select("resource_id", { count: "exact", head: true })
      .eq("user_id", userId),
    admin
      .from("resource_votes")
      .select("resource_id", { count: "exact", head: true })
      .eq("user_id", userId),
    admin
      .from("site_feedback")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  return {
    aportes: aportes.count ?? 0,
    guardados: guardados.count ?? 0,
    votos: votos.count ?? 0,
    opiniones: opiniones.count ?? 0,
  };
}
