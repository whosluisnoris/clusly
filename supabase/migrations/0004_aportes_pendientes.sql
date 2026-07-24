-- Clusly — aportes sin cuenta, pendientes de aprobación
-- Migración aditiva y reversible. Segura sobre datos existentes: las filas
-- actuales siguen en 'published' y el CHECK solo se amplía (nunca se restringe).
--
-- Cómo aplicar: pégalo en Supabase → SQL Editor y ejecútalo, o deja que Claude
-- lo aplique con la herramienta de migraciones (requiere tu aprobación).

-- 1. Nuevo estado 'pending' en resources ------------------------------------
-- Un aporte enviado sin iniciar sesión entra como 'pending': la política de
-- lectura pública ya filtra `status = 'published'`, así que no se ve en el
-- catálogo hasta que el staff lo apruebe desde /admin.
alter table public.resources drop constraint if exists resources_status_check;
alter table public.resources
  add constraint resources_status_check
  check (status in ('published', 'pending', 'hidden'));

create index if not exists idx_resources_status on public.resources (status);

-- 2. Sesión del navegador que envió un aporte anónimo -----------------------
-- Sin cuenta no hay `submitted_by`; se guarda la sesión anónima (la misma de la
-- analítica) solo para limitar cuántos aportes por hora puede mandar alguien.
alter table public.resources
  add column if not exists submitted_session text;

create index if not exists idx_resources_submitted_session
  on public.resources (submitted_session, added_at desc);
