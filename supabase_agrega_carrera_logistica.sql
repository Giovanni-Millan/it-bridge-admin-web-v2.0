-- Agrega la carrera de Logistica (universidad) al catalogo "carrera",
-- con las mismas 4 modalidades que el resto de carreras de universidad.
-- Ya aplicado en la instancia de Supabase autoalojada en produccion (2026-07-30).

insert into carrera (nombre) values
  ('Logística - Escolarizado'),
  ('Logística - Sabatino'),
  ('Logística - Dominical'),
  ('Logística - Virtual')
on conflict do nothing;
