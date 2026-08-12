-- =========================================================
-- Row Level Security — correr DESPUÉS de schema.sql
-- =========================================================
-- auth.uid() va envuelto en (select auth.uid()) en toda policy: Postgres
-- cachea el resultado del subquery una vez por statement en vez de
-- re-evaluarlo por fila (ver advisory "Auth RLS Initialization Plan" de
-- Supabase). Semántica idéntica, sólo cambia el plan de ejecución.

-- ---------- VEHICLES ----------
alter table vehicles enable row level security;

create policy "Los usuarios ven sus propios vehículos"
  on vehicles for select
  using ((select auth.uid()) = user_id);

-- Plan free: máximo 1 vehículo por cuenta. El conteo excluye la fila que
-- se está por insertar (no es visible todavía para la subquery dentro
-- del mismo INSERT), así que "< 1" permite exactamente el primero.
-- Backstop server-side del límite que ya se avisa en HomeScreen — sin
-- esto, cualquiera podría pegarle directo a la API REST de Supabase y
-- saltearse el chequeo del cliente.
create policy "Los usuarios crean sus propios vehículos"
  on vehicles for insert
  with check (
    (select auth.uid()) = user_id
    and (
      (select count(*) from vehicles v where v.user_id = (select auth.uid())) < 1
      or exists (
        select 1 from subscriptions s
        where s.user_id = (select auth.uid()) and s.status = 'active'
      )
    )
  );

create policy "Los usuarios editan sus propios vehículos"
  on vehicles for update
  using ((select auth.uid()) = user_id);

create policy "Los usuarios borran sus propios vehículos"
  on vehicles for delete
  using ((select auth.uid()) = user_id);

-- ---------- EXPENSES (via vehicle_id -> vehicles.user_id) ----------
alter table expenses enable row level security;

create policy "Ver gastos de mis vehículos"
  on expenses for select
  using (exists (
    select 1 from vehicles v
    where v.id = expenses.vehicle_id and v.user_id = (select auth.uid())
  ));

create policy "Crear gastos en mis vehículos"
  on expenses for insert
  with check (exists (
    select 1 from vehicles v
    where v.id = expenses.vehicle_id and v.user_id = (select auth.uid())
  ));

create policy "Editar gastos de mis vehículos"
  on expenses for update
  using (exists (
    select 1 from vehicles v
    where v.id = expenses.vehicle_id and v.user_id = (select auth.uid())
  ));

create policy "Borrar gastos de mis vehículos"
  on expenses for delete
  using (exists (
    select 1 from vehicles v
    where v.id = expenses.vehicle_id and v.user_id = (select auth.uid())
  ));

-- ---------- DOCUMENTS (mismo patrón que expenses) ----------
alter table documents enable row level security;

create policy "Ver documentos de mis vehículos"
  on documents for select
  using (exists (
    select 1 from vehicles v
    where v.id = documents.vehicle_id and v.user_id = (select auth.uid())
  ));

create policy "Crear documentos en mis vehículos"
  on documents for insert
  with check (exists (
    select 1 from vehicles v
    where v.id = documents.vehicle_id and v.user_id = (select auth.uid())
  ));

create policy "Editar documentos de mis vehículos"
  on documents for update
  using (exists (
    select 1 from vehicles v
    where v.id = documents.vehicle_id and v.user_id = (select auth.uid())
  ));

create policy "Borrar documentos de mis vehículos"
  on documents for delete
  using (exists (
    select 1 from vehicles v
    where v.id = documents.vehicle_id and v.user_id = (select auth.uid())
  ));

-- ---------- REMINDERS (mismo patrón) ----------
alter table reminders enable row level security;

create policy "Ver recordatorios de mis vehículos"
  on reminders for select
  using (exists (
    select 1 from vehicles v
    where v.id = reminders.vehicle_id and v.user_id = (select auth.uid())
  ));

create policy "Crear recordatorios en mis vehículos"
  on reminders for insert
  with check (exists (
    select 1 from vehicles v
    where v.id = reminders.vehicle_id and v.user_id = (select auth.uid())
  ));

create policy "Editar recordatorios de mis vehículos"
  on reminders for update
  using (exists (
    select 1 from vehicles v
    where v.id = reminders.vehicle_id and v.user_id = (select auth.uid())
  ));

create policy "Borrar recordatorios de mis vehículos"
  on reminders for delete
  using (exists (
    select 1 from vehicles v
    where v.id = reminders.vehicle_id and v.user_id = (select auth.uid())
  ));

-- ---------- WORKSHOPS (público de lectura, escritura controlada) ----------
alter table workshops enable row level security;

create policy "Cualquiera puede ver talleres"
  on workshops for select
  using (true);

-- Insert de talleres se hace desde un rol de servicio (script que puebla
-- desde Google Places), no desde el cliente — por eso no hay policy de
-- insert para "authenticated".

create policy "Reclamar un taller sin dueño"
  on workshops for update
  using (claimed_by_user_id is null)
  with check (claimed_by_user_id = (select auth.uid()));

create policy "Editar mi taller reclamado"
  on workshops for update
  using (claimed_by_user_id = (select auth.uid()))
  with check (claimed_by_user_id = (select auth.uid()));

-- ---------- REVIEWS ----------
alter table reviews enable row level security;

create policy "Cualquiera puede ver reseñas"
  on reviews for select
  using (true);

create policy "Un usuario logueado puede crear su reseña"
  on reviews for insert
  with check ((select auth.uid()) = user_id);

create policy "Un usuario puede borrar su propia reseña"
  on reviews for delete
  using ((select auth.uid()) = user_id);

create policy "Un usuario puede editar su propia reseña"
  on reviews for update
  using ((select auth.uid()) = user_id);

-- ---------- SUBSCRIPTIONS (solo lectura desde el cliente) ----------
alter table subscriptions enable row level security;

create policy "Ver mi propia suscripción"
  on subscriptions for select
  using ((select auth.uid()) = user_id);

-- Sin policy de insert/update/delete para authenticated/anon: el status
-- de pago lo escribe únicamente el backend (service_role, bypassea RLS)
-- al procesar el webhook de Mercado Pago. Si el cliente pudiera
-- escribir su propio status, cualquier usuario logueado se destrabaría
-- el plan pago solo.

-- ---------- PDF EXPORT USAGE ----------
alter table pdf_export_usage enable row level security;

create policy "Ver mi propio uso del export gratis"
  on pdf_export_usage for select
  using ((select auth.uid()) = user_id);

create policy "Marcar mi export gratis como usado"
  on pdf_export_usage for insert
  with check ((select auth.uid()) = user_id);

-- Sin policy de update/delete: una vez insertada la fila, el cliente no
-- puede borrarla ni tocarla para resetear el freebie.

-- ---------- QUOTE REQUESTS / RESPONSES ----------
alter table quote_requests enable row level security;

create policy "Ver mis propias cotizaciones"
  on quote_requests for select
  using ((select auth.uid()) = user_id);

create policy "Crear mis propias cotizaciones"
  on quote_requests for insert
  with check ((select auth.uid()) = user_id);

create policy "Editar mis propias cotizaciones"
  on quote_requests for update
  using ((select auth.uid()) = user_id);

create policy "Borrar mis propias cotizaciones"
  on quote_requests for delete
  using ((select auth.uid()) = user_id);

alter table quote_responses enable row level security;

create policy "Ver respuestas de mis cotizaciones"
  on quote_responses for select
  using (exists (
    select 1 from quote_requests q
    where q.id = quote_responses.quote_request_id and q.user_id = (select auth.uid())
  ));

create policy "Responder cotizaciones desde mi taller reclamado"
  on quote_responses for insert
  with check (exists (
    select 1 from workshops w
    where w.id = quote_responses.workshop_id and w.claimed_by_user_id = (select auth.uid())
  ));

create policy "Editar respuestas de mi taller reclamado"
  on quote_responses for update
  using (exists (
    select 1 from workshops w
    where w.id = quote_responses.workshop_id and w.claimed_by_user_id = (select auth.uid())
  ));

create policy "Borrar respuestas de mi taller reclamado"
  on quote_responses for delete
  using (exists (
    select 1 from workshops w
    where w.id = quote_responses.workshop_id and w.claimed_by_user_id = (select auth.uid())
  ));
