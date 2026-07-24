import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  sanitizeLinks,
  MAX_BIO,
  MAX_LOCATION,
  MAX_NAME,
} from "@/lib/profile";

export const dynamic = "force-dynamic";

// PATCH /api/profile — edita el perfil de quien tiene la sesión abierta.
// body: { displayName?, bio?, location?, links? }
//
// El nombre visible vive en dos sitios: `profiles.display_name` (lo que ve el
// resto, p. ej. en las opiniones) y los metadatos de la cuenta (de donde lo lee
// `getCurrentUser`). Se actualizan los dos para que no se desincronicen.
export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Inicia sesión para editar tu perfil." },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  let displayName: string | null = null;
  if (typeof body.displayName === "string") {
    displayName = body.displayName.trim().slice(0, MAX_NAME);
    if (displayName.length < 2) {
      return NextResponse.json(
        { error: "Tu nombre necesita al menos 2 caracteres." },
        { status: 400 }
      );
    }
    updates.display_name = displayName;
  }

  if (typeof body.bio === "string") {
    const bio = body.bio.trim().slice(0, MAX_BIO);
    updates.bio = bio || null;
  }

  if (typeof body.location === "string") {
    const location = body.location.trim().slice(0, MAX_LOCATION);
    updates.location = location || null;
  }

  if (body.links !== undefined) {
    // Descarta lo que no sea http/https antes de guardarlo.
    const links = sanitizeLinks(body.links);
    if (Array.isArray(body.links) && links.length < body.links.length) {
      return NextResponse.json(
        { error: "Revisa tus enlaces: deben empezar con http:// o https://" },
        { status: 400 }
      );
    }
    updates.links = links;
  }

  const admin = getSupabaseAdmin();

  const { error } = await admin.from("profiles").update(updates).eq("id", user.id);
  if (error) {
    return NextResponse.json(
      { error: "No se pudo guardar tu perfil, inténtalo de nuevo." },
      { status: 500 }
    );
  }

  if (displayName) {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, display_name: displayName },
    });
  }

  return NextResponse.json({ ok: true });
}
