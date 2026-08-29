-- Agrega la categoria de grupo "Autoplaneado" (universidad), con sus 3
-- modalidades (Escolarizado, Sabatino, Dominical). El plan de 6/12/18
-- meses NO va en la carrera: varia por alumno dentro de un mismo grupo,
-- asi que se guarda en alumnos.plan_meses.

-- 1. Nuevo tipo de grupo valido
alter table public.grupos drop constraint if exists grupos_tipo_check;
alter table public.grupos add constraint grupos_tipo_check
  check (tipo in ('universidad', 'bachillerato', 'autoplaneado'));

-- 2. Nuevo tipo de alumno valido (para poder marcar alumnos como autoplaneado)
alter table public.alumnos drop constraint if exists alumnos_tipo_check;
alter table public.alumnos add constraint alumnos_tipo_check
  check (tipo in ('universidad', 'bachillerato', 'autoplaneado'));

-- 3. Catalogo de carreras de Autoplaneado (por modalidad)
insert into public.carrera (nombre) values
  ('Autoplaneado - Escolarizado'),
  ('Autoplaneado - Sabatino'),
  ('Autoplaneado - Dominical')
on conflict do nothing;

-- 4. Plan individual (6/12/18 meses) por alumno, solo aplica a autoplaneado
alter table public.alumnos add column if not exists plan_meses smallint
  check (plan_meses in (6, 12, 18));

-- NOTA: historial_academico.tipo solo acepta 'Bachillerato'/'Universidad'.
-- Los alumnos de Autoplaneado se califican con la misma pantalla de
-- Universidad, asi que su historial academico queda registrado con
-- tipo='Universidad' (no se creo una categoria aparte ahi).
