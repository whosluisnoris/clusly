import { getSupabaseAdmin } from "@/lib/supabase";
import type { ResourceRow } from "@/lib/types";

// Videos y playlists guardados por el usuario. Igual que los votos, la tabla
// `resource_favorites` no tiene políticas públicas: se lee con el cliente
// service-role y siempre acotada por user_id.

// Cuáles de estos recursos tiene guardados el usuario (para pintar el corazón
// de cada tarjeta del grid).
export async function getUserFavorites(
  userId: string,
  resourceIds: string[]
): Promise<Set<string>> {
  if (resourceIds.length === 0) return new Set();
  const { data } = await getSupabaseAdmin()
    .from("resource_favorites")
    .select("resource_id")
    .eq("user_id", userId)
    .in("resource_id", resourceIds);

  return new Set(
    ((data as { resource_id: string }[] | null) ?? []).map((r) => r.resource_id)
  );
}

// ¿El usuario guardó este recurso? (para la página de detalle)
export async function isFavorite(userId: string, resourceId: string): Promise<boolean> {
  const { data } = await getSupabaseAdmin()
    .from("resource_favorites")
    .select("resource_id")
    .eq("user_id", userId)
    .eq("resource_id", resourceId)
    .maybeSingle();
  return data !== null;
}

interface FavoriteJoinRow {
  created_at: string;
  resources: ResourceRow | null;
}

// Recursos guardados por el usuario, del más reciente al más antiguo. El
// service-role se salta la RLS, así que se descartan a mano los que no están
// publicados (ocultos por moderación o pendientes de aprobación).
export async function getFavoriteResources(userId: string): Promise<ResourceRow[]> {
  const { data } = await getSupabaseAdmin()
    .from("resource_favorites")
    .select("created_at, resources(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return ((data as unknown as FavoriteJoinRow[] | null) ?? [])
    .map((row) => row.resources)
    .filter((r): r is ResourceRow => r !== null && (r.status ?? "published") === "published");
}
