-- =========================================================
-- Funciones y triggers — correr DESPUÉS de schema.sql
-- =========================================================

-- ---------- set_updated_at ----------
-- Trigger genérico para mantener updated_at al día en cualquier tabla.
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on vehicles;
create trigger set_updated_at before update on vehicles for each row execute function set_updated_at();
drop trigger if exists set_updated_at on expenses;
create trigger set_updated_at before update on expenses for each row execute function set_updated_at();
drop trigger if exists set_updated_at on documents;
create trigger set_updated_at before update on documents for each row execute function set_updated_at();
drop trigger if exists set_updated_at on reminders;
create trigger set_updated_at before update on reminders for each row execute function set_updated_at();
drop trigger if exists set_updated_at on workshops;
create trigger set_updated_at before update on workshops for each row execute function set_updated_at();
drop trigger if exists set_updated_at on reviews;
create trigger set_updated_at before update on reviews for each row execute function set_updated_at();
drop trigger if exists set_updated_at on quote_requests;
create trigger set_updated_at before update on quote_requests for each row execute function set_updated_at();
drop trigger if exists set_updated_at on quote_responses;
create trigger set_updated_at before update on quote_responses for each row execute function set_updated_at();

-- ---------- normalize_vehicle_plate ----------
-- La UI ya manda la patente en mayúsculas y sin espacios (AddVehicleScreen/
-- EditVehicleScreen), pero eso no lo garantiza el `unique (user_id, plate)`
-- de schema.sql contra un insert/update directo a la API ("AB123CD" vs
-- "ab 123 cd" no colisionan sin normalizar). Backstop server-side.
create or replace function normalize_vehicle_plate()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.plate := upper(regexp_replace(trim(new.plate), '\s+', '', 'g'));
  return new;
end;
$$;

drop trigger if exists normalize_vehicle_plate on vehicles;
create trigger normalize_vehicle_plate
  before insert or update on vehicles
  for each row execute function normalize_vehicle_plate();

-- ---------- protect_workshop_admin_columns ----------
-- Las policies "Reclamar un taller sin dueño" / "Editar mi taller
-- reclamado" (rls_policies.sql) solo validan `claimed_by_user_id` — no
-- restringen qué otras columnas cambian en el mismo update. Sin este
-- trigger, un usuario que reclama su propio taller puede pegarle directo
-- a la API REST (`update workshops set is_promoted = true`) y
-- autodestacar su ficha gratis, saltando el cobro de Etapa 4. Solo el
-- backend (service_role, al procesar el pago) puede tocar is_promoted.
create or replace function protect_workshop_admin_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    new.is_promoted := old.is_promoted;
  end if;
  return new;
end;
$$;

drop trigger if exists workshops_protect_admin_columns on workshops;
create trigger workshops_protect_admin_columns
  before update on workshops
  for each row execute function protect_workshop_admin_columns();

-- ---------- nearby_workshops ----------
-- Reemplaza el filtrado por distancia hecho en el cliente
-- (ver src/hooks/useNearbyWorkshops.ts). Usa el índice gist sobre
-- workshops.geog para no traer la tabla completa.
create or replace function nearby_workshops(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision default 5,
  filter_category workshop_category default null
)
returns table (
  id uuid,
  name text,
  category workshop_category,
  address text,
  lat double precision,
  lng double precision,
  phone text,
  hours jsonb,
  source text,
  claimed_by_user_id uuid,
  is_promoted boolean,
  created_at timestamptz,
  distance_km double precision
)
language sql
stable
set search_path = public
as $$
  select
    w.id, w.name, w.category, w.address, w.lat, w.lng, w.phone, w.hours,
    w.source, w.claimed_by_user_id, w.is_promoted, w.created_at,
    ST_Distance(w.geog, ST_MakePoint(user_lng, user_lat)::geography) / 1000 as distance_km
  from workshops w
  where ST_DWithin(w.geog, ST_MakePoint(user_lng, user_lat)::geography, radius_km * 1000)
    and (filter_category is null or w.category = filter_category)
  order by distance_km asc;
$$;

-- ---------- handle_expense_insert ----------
-- Al cargar un expense con odometer_km: sincroniza vehicles.current_km
-- (nunca lo hace retroceder) y, si es un service, genera el próximo
-- recordatorio de cambio de aceite a +10.000km. Ver "Notas de diseño"
-- en schema.sql.
create or replace function handle_expense_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.odometer_km is not null then
    update vehicles
    set current_km = greatest(current_km, new.odometer_km)
    where id = new.vehicle_id;
  end if;

  if new.category = 'service' and new.odometer_km is not null then
    insert into reminders (vehicle_id, title, due_km, source)
    values (new.vehicle_id, 'Cambio de aceite y filtro', new.odometer_km + 10000, 'preset');
  end if;

  return new;
end;
$$;

drop trigger if exists expenses_after_insert on expenses;

create trigger expenses_after_insert
  after insert on expenses
  for each row
  execute function handle_expense_insert();
