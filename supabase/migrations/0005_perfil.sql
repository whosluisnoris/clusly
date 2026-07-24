-- Clusly — perfil del usuario (biografía, ubicación y enlaces)
-- Migración aditiva y reversible. Segura sobre datos existentes: las filas
-- actuales de `profiles` quedan con los campos nuevos vacíos.
--
-- Cómo aplicar: pégalo en Supabase → SQL Editor y ejecútalo, o deja que Claude
-- lo aplique con la herramienta de migraciones (requiere tu aprobación).

-- 1. Campos nuevos en profiles ----------------------------------------------
-- `links` es un arreglo de objetos {label, url} (máx. 6, validados en la API).
alter table public.profiles
  add column if not exists bio text,
  add column if not exists location text,
  add column if not exists links jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz;

-- 2. Límites de tamaño en la base --------------------------------------------
-- La política "profiles self update" deja que el usuario edite su propia fila
-- desde el navegador, así que los topes se ponen también aquí y no solo en la
-- API. Los enlaces se vuelven a validar al pintarlos (solo http/https).
alter table public.profiles drop constraint if exists profiles_bio_len;
alter table public.profiles
  add constraint profiles_bio_len check (bio is null or char_length(bio) <= 300);

alter table public.profiles drop constraint if exists profiles_location_len;
alter table public.profiles
  add constraint profiles_location_len
  check (location is null or char_length(location) <= 80);

alter table public.profiles drop constraint if exists profiles_display_name_len;
alter table public.profiles
  add constraint profiles_display_name_len
  check (display_name is null or char_length(display_name) <= 60);

alter table public.profiles drop constraint if exists profiles_links_shape;
alter table public.profiles
  add constraint profiles_links_shape
  check (jsonb_typeof(links) = 'array' and jsonb_array_length(links) <= 6);
