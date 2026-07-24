-- Clusly — imágenes del blog (bucket de Supabase Storage)
-- Migración aditiva y reversible.
--
-- Cómo aplicar: pégalo en Supabase → SQL Editor y ejecútalo, o deja que Claude
-- lo aplique con la herramienta de migraciones (requiere tu aprobación).

-- 1. Bucket público `blog` ---------------------------------------------------
-- Público = las imágenes se sirven por URL sin firmar (es lo que se pega en el
-- artículo). Subir, en cambio, NO es público: no se crea ninguna política de
-- escritura sobre storage.objects, así que solo el service role puede escribir
-- — y solo lo hace /api/admin/blog/upload, que exige rol owner/admin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog',
  'blog',
  true,
  5242880, -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Imagen de portada del artículo -----------------------------------------
alter table public.blog_posts
  add column if not exists cover_url text;
