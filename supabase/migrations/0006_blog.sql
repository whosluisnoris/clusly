-- Clusly — blog (solo lo escribe el staff: owner / admin)
-- Migración aditiva y reversible: crea una tabla nueva, no toca ninguna existente.
--
-- Cómo aplicar: pégalo en Supabase → SQL Editor y ejecútalo, o deja que Claude
-- lo aplique con la herramienta de migraciones (requiere tu aprobación).

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) between 3 and 160),
  excerpt text check (excerpt is null or char_length(excerpt) <= 300),
  content text not null default '',
  -- El autor apunta a `profiles` para poder embeber su nombre en una consulta.
  -- Si se borra la cuenta, el artículo se queda sin firma en vez de perderse.
  author_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

-- Lectura pública **solo de lo publicado**. Los borradores quedan fuera del
-- alcance de la anon key; el staff los ve vía service role en /api/admin/blog.
drop policy if exists "blog published read" on public.blog_posts;
create policy "blog published read" on public.blog_posts
  for select using (status = 'published');

-- Sin políticas de escritura: publicar, editar y borrar pasa siempre por
-- /api/admin/blog, que exige rol owner/admin (ver src/lib/admin-auth.ts).

create index if not exists idx_blog_posts_published
  on public.blog_posts (published_at desc) where status = 'published';
create index if not exists idx_blog_posts_created
  on public.blog_posts (created_at desc);
