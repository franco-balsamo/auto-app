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
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, plate)       -- evita cargar el mismo auto dos veces; no global porque un auto puede compartirse entre cuentas familiares
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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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
  status text not null default 'pending' check (status in ('pending', 'done', 'dismissed')),
  source text not null default 'manual' check (source in ('manual', 'document', 'preset')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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
  source text not null default 'osm', -- osm | manual
  claimed_by_user_id uuid references auth.users(id) on delete set null, -- null = sin reclamar
  is_promoted boolean default false, -- ficha destacada (paga)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- índice espacial para búsquedas por cercanía
create extension if not exists postgis;

-- Nota: postgis trae spatial_ref_sys sin RLS (tabla de referencia de
-- sistemas de coordenadas, de solo lectura) — el linter de Supabase la
-- marca ERROR ("RLS Disabled in Public"). No se puede corregir desde acá:
-- la tabla pertenece a la extensión y ni el owner del proyecto tiene
-- permiso para alterarla (`must be owner of table spatial_ref_sys`).
-- Limitación conocida de postgis en Supabase managed, no de este schema.

alter table workshops add column geog geography(Point, 4326)
  generated always as (ST_MakePoint(lng, lat)::geography) stored;

create index workshops_geog_idx on workshops using gist (geog);

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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table quote_responses (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references quote_requests(id) on delete cascade,
  workshop_id uuid not null references workshops(id) on delete cascade,
  price_estimate numeric(12,2),
  message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------
-- SUSCRIPCIONES (fase 3 — monetización usuario)
-- ---------------------------------------------------------
-- Sin fila = plan free (1 vehículo, historial básico). Una fila con
-- status = 'active' habilita el plan pago (multi-vehículo, backup,
-- reporte de reventa). No hay columna "plan": solo existe un tier pago
-- hoy, agregar la columna el día que haya un segundo.
--
-- Esta tabla NO tiene policy de insert/update/delete para
-- authenticated/anon (ver rls_policies.sql) — a propósito: si el cliente
-- pudiera escribir su propio status, cualquier usuario logueado podría
-- insertarse 'active' y destrabar el plan pago gratis. Solo se escribe
-- desde el backend (service_role) al procesar el webhook de Mercado
-- Pago — ese backend todavía no existe, es el próximo paso de esta etapa.
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due')),
  mp_preapproval_id text, -- id de la suscripción recurrente en Mercado Pago
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Export de historial a PDF: gratis la primera vez por cuenta, pago las
-- siguientes (decisión de producto — el export en sí ya es gratis desde
-- Etapa 2, esto es el límite de "una vez sin plan pago"). Fila presente
-- = ya usó su export gratis; sin fila = todavía lo tiene disponible.
-- A diferencia de "subscriptions", esta tabla SÍ tiene policy de insert
-- para el cliente (ver rls_policies.sql) — no hay plata de por medio,
-- solo una bandera de uso, así que no hace falta pasar por el backend.
-- Sin policy de update/delete: el cliente no puede borrar su propia fila
-- para resetear el freebie llamando directo a la API.
create table pdf_export_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  used_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- ÍNDICES — columnas que las subqueries `exists` de las policies RLS
-- evalúan en cada request, más las FKs que el advisor de Supabase marca
-- sin índice.
-- ---------------------------------------------------------
create index vehicles_user_id_idx on vehicles (user_id);
create index expenses_vehicle_id_idx on expenses (vehicle_id);
create index documents_vehicle_id_idx on documents (vehicle_id);
create index reminders_vehicle_id_idx on reminders (vehicle_id);
create index workshops_claimed_by_user_id_idx on workshops (claimed_by_user_id);
create index reviews_user_id_idx on reviews (user_id);
create index reviews_workshop_id_idx on reviews (workshop_id);
create index quote_requests_user_id_idx on quote_requests (user_id);
create index quote_requests_vehicle_id_idx on quote_requests (vehicle_id);
create index quote_responses_quote_request_id_idx on quote_responses (quote_request_id);
create index quote_responses_workshop_id_idx on quote_responses (workshop_id);

-- ---------------------------------------------------------
-- Notas de diseño
-- ---------------------------------------------------------
-- 1. "reminders" se puede poblar automático: al cargar un expense de
--    categoría 'service' con odometer_km, generar el próximo reminder
--    sumando el intervalo (ej. +10.000km) via trigger o desde el backend.
-- 2. "workshops" arranca poblada con datos de OpenStreetMap (source =
--    'osm', ver scripts/fetch_workshops.mjs), y se van "reclamando"
--    (claimed_by_user_id) a medida que los dueños de talleres se registran.
-- 3. RLS (Row Level Security) en Supabase: vehicles/expenses/documents
--    solo visibles para su user_id. workshops/reviews públicas de lectura.
