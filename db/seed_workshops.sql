-- =========================================================
-- Seed manual de talleres (datos de prueba, Palermo/Almagro) — DEV only
-- =========================================================
-- Para la carga real usar scripts/fetch_workshops.mjs (Google Places API,
-- ver README). Este archivo queda como fixture rápido para tener el
-- directorio no-vacío en desarrollo local sin pegarle a la API externa.

insert into workshops (name, category, address, lat, lng, phone, source) values
  ('Lubricentro Palermo',        'lubricentro',    'Av. Santa Fe 3450, CABA',        -34.5875, -58.4225, '011 4821-0001', 'manual'),
  ('Lubricentro Almagro Norte',  'lubricentro',    'Av. Rivadavia 4120, CABA',       -34.6091, -58.4270, '011 4958-0002', 'manual'),
  ('Taller Mecánico Fitz Roy',   'mecanico',       'Fitz Roy 1780, CABA',            -34.5820, -58.4360, '011 4772-0003', 'manual'),
  ('Mecánica Integral Almagro',  'mecanico',       'Av. Medrano 650, CABA',          -34.6035, -58.4180, '011 4863-0004', 'manual'),
  ('AutoLavado Express Palermo', 'lavadero',       'Av. Cabildo 1450, CABA',         -34.5620, -58.4520, '011 4780-0005', 'manual'),
  ('Lavadero Don Julio',         'lavadero',       'Av. Corrientes 5200, CABA',      -34.5990, -58.4480, '011 4855-0006', 'manual'),
  ('Gomería 24hs Santa Fe',      'gomeria',        'Av. Santa Fe 2890, CABA',        -34.5920, -58.4085, '011 4821-0007', 'manual'),
  ('Gomería Almagro',            'gomeria',        'Av. Medrano 200, CABA',          -34.6070, -58.4145, '011 4863-0008', 'manual'),
  ('Escapes Palermo',            'casa_de_escape', 'Av. Juan B. Justo 2200, CABA',   -34.5960, -58.4390, '011 4772-0009', 'manual'),
  ('Escapes y Silenciadores Sur','casa_de_escape', 'Av. Rivadavia 4800, CABA',       -34.6110, -58.4330, '011 4958-0010', 'manual');
