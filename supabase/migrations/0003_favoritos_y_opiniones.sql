-- Clusly — videos guardados (favoritos) y sección de opiniones
-- Migración aditiva y reversible. Segura de correr sobre datos existentes:
-- solo crea tablas nuevas, no toca las que ya existen.
--
-- Cómo aplicar: pégalo en Supabase → SQL Editor y ejecútalo, o deja que Claude
-- lo aplique con la herramienta de migraciones (requiere tu aprobación).

-- 1. resource_favorites (un guardado por usuario por recurso) ----------------
create table if not exists public.resource_favorites (
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (resource_id, user_id)
);
alter table public.resource_favorites enable row level security;
-- Sin políticas públicas: igual que resource_votes, todo el acceso pasa por el
-- cliente service-role después de verificar la sesión en el servidor.

-- Para listar "Guardados" del usuario, de lo más reciente a lo más antiguo.
create index if not exists idx_resource_favorites_user
  on public.resource_favorites (user_id, created_at desc);

-- 2. site_feedback (opiniones sobre la plataforma) --------------------------
-- user_id apunta a `profiles` (no a auth.users) para que PostgREST pueda
-- embeber el nombre visible del autor. profiles.id ya cae en cascada con la
-- cuenta, así que borrar el usuario deja la opinión como anónima.
create table if not exists public.site_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  session_id text,
  sentiment text not null check (sentiment in ('me_encanta', 'puede_mejorar', 'no_me_convence')),
  message text not null check (char_length(message) between 1 and 1000),
  hidden_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.site_feedback enable row level security;
-- Sin políticas públicas: las opiniones se leen y escriben desde el servidor
-- con el cliente service-role (la lectura pública filtra hidden_at is null).

create index if not exists idx_site_feedback_created
  on public.site_feedback (created_at desc);
-- Ventana de antiflood: cuántas opiniones mandó una sesión/usuario hace poco.
create index if not exists idx_site_feedback_session
  on public.site_feedback (session_id, created_at desc);
create index if not exists idx_site_feedback_user
  on public.site_feedback (user_id, created_at desc);
