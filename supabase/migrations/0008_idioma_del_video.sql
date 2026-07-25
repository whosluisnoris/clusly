-- Clusly — idioma del video (para poder filtrar el catálogo por idioma)
-- Migración aditiva y reversible. Segura sobre datos existentes: todo lo que ya
-- está en el catálogo queda como español, que es lo que se ha curado hasta hoy.
--
-- Cómo aplicar: pégalo en Supabase → SQL Editor y ejecútalo, o deja que Claude
-- lo aplique con la herramienta de migraciones (requiere tu aprobación).

alter table public.resources
  add column if not exists language text not null default 'es'
  check (language in ('es', 'en'));

-- La exploración filtra por idioma junto con el orden por votos.
create index if not exists idx_resources_language
  on public.resources (language, vote_count desc);
