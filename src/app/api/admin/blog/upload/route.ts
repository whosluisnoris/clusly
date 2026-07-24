import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { authorizeAdmin } from "@/lib/admin-auth";
import { BLOG_BUCKET } from "@/lib/blog";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Tipos aceptados y su extensión. El bucket repite estos límites del lado de
// Supabase (ver migración 0007), así que aunque alguien saltara esta ruta el
// almacenamiento seguiría rechazando lo que no sea una imagen.
const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// POST /api/admin/blog/upload — sube una imagen al bucket `blog` y devuelve su
// URL pública, lista para pegar en el artículo o usar como portada.
// Cuerpo: multipart/form-data con el campo `file`.
//
// Solo staff (owner/admin): el bucket no tiene políticas de escritura, así que
// esta ruta —con el service role— es la única forma de subir algo.
export async function POST(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Envío inválido." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
  }

  const ext = MIME_EXT[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Formato no admitido. Usa PNG, JPG, WEBP, GIF o AVIF." },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "La imagen pesa más de 5 MB. Compáctala e inténtalo de nuevo." },
      { status: 413 }
    );
  }

  // Nombre propio: nunca se reutiliza el del archivo original (podría traer
  // rutas, caracteres raros o pisar una imagen existente).
  const path = `posts/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const admin = getSupabaseAdmin();
  const { error } = await admin.storage
    .from(BLOG_BUCKET)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      cacheControl: "31536000", // inmutable: el nombre ya es único
      upsert: false,
    });

  if (error) {
    return NextResponse.json(
      { error: "No se pudo subir la imagen, inténtalo de nuevo." },
      { status: 500 }
    );
  }

  const { data } = admin.storage.from(BLOG_BUCKET).getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl, path });
}
