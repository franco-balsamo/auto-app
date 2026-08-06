-- =========================================================
-- Modelo de datos v1 — App de mantenimiento de auto
-- Postgres / Supabase
-- =========================================================

-- Auth la maneja Supabase (auth.users). Referenciamos user_id a ese id.

-- ---------------------------------------------------------
-- VEHÍCULOS
-- ---------------------------------------------------------
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand text not null,
  model text not null,
  year int,
  plate text not null,          -- patente, sirve para calcular mes de VTV
  current_km int default 0,
  photo_url text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- GASTOS / SERVICE
-- ---------------------------------------------------------
create type expense_category as enum (
  'service', 'nafta', 'seguro', 'patente', 'lavado', 'gomas', 'otro'
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  category expense_category not null,
  amount numeric(12,2) not null,
  odometer_km int,
  expense_date date not null default current_date,
  note text,
  receipt_photo_url text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- DOCUMENTACIÓN
-- ---------------------------------------------------------
create type document_type as enum (
  'cedula', 'seguro', 'vtv', 'licencia', 'otro'
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  type document_type not null,
  file_url text not null,
  expiration_date date,          -- null = no vence (ej. cédula)
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- RECORDATORIOS (derivados de expenses/documents o manuales)
-- ---------------------------------------------------------
create table reminders (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  title text not null,           -- ej. "Cambio de aceite"
  due_date date,
  due_km int,
  status text not null default 'pending', -- pending | done | dismissed
  source text not null default 'manual',  -- manual | document | preset
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- TALLERES / SERVICIOS (directorio geolocalizado)
-- ---------------------------------------------------------
create type workshop_category as enum (
  'lubricentro', 'mecanico', 'lavadero', 'gomeria', 'casa_de_escape'
);

create table workshops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category workshop_category not null,
  address text,
  lat double precision not null,
  lng double precision not null,
  phone text,
  hours jsonb,                    -- horarios por día
  source text not null default 'google_places', -- google_places | manual
  claimed_by_user_id uuid references auth.users(id), -- null = sin reclamar
  is_promoted boolean default false, -- ficha destacada (paga)
  created_at timestamptz default now()
);

-- índice espacial para búsquedas por cercanía (requiere extensión postgis)
-- create extension if not exists postgis;
-- alter table workshops add column geog geography(Point, 4326)
--   generated always as (ST_MakePoint(lng, lat)::geography) stored;
-- create index workshops_geog_idx on workshops using gist (geog);

-- ---------------------------------------------------------
-- RESEÑAS
-- ---------------------------------------------------------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references workshops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  photo_url text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- COTIZACIONES (fase 4 — cotizador rápido)
-- ---------------------------------------------------------
create table quote_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  description text not null,      -- ej. "cambio de embrague"
  category workshop_category,
  status text not null default 'open', -- open | closed
  created_at timestamptz default now()
);

create table quote_responses (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references quote_requests(id) on delete cascade,
  workshop_id uuid not null references workshops(id) on delete cascade,
  price_estimate numeric(12,2),
  message text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- Notas de diseño
-- ---------------------------------------------------------
-- 1. "reminders" se puede poblar automático: al cargar un expense de
--    categoría 'service' con odometer_km, generar el próximo reminder
--    sumando el intervalo (ej. +10.000km) via trigger o desde el backend.
-- 2. "workshops" arranca poblada con datos de Google Places API (source
--    = 'google_places'), y se van "reclamando" (claimed_by_user_id) a
--    medida que los dueños de talleres se registran.
-- 3. RLS (Row Level Security) en Supabase: vehicles/expenses/documents
--    solo visibles para su user_id. workshops/reviews públicas de lectura.
