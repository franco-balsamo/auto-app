-- =========================================================
-- Row Level Security — correr DESPUÉS de schema.sql
-- =========================================================

-- ---------- VEHICLES ----------
alter table vehicles enable row level security;

create policy "Los usuarios ven sus propios vehículos"
  on vehicles for select
  using (auth.uid() = user_id);

create policy "Los usuarios crean sus propios vehículos"
  on vehicles for insert
  with check (auth.uid() = user_id);

create policy "Los usuarios editan sus propios vehículos"
  on vehicles for update
  using (auth.uid() = user_id);

create policy "Los usuarios borran sus propios vehículos"
  on vehicles for delete
  using (auth.uid() = user_id);

-- ---------- EXPENSES (via vehicle_id -> vehicles.user_id) ----------
alter table expenses enable row level security;

create policy "Ver gastos de mis vehículos"
  on expenses for select
  using (exists (
    select 1 from vehicles v
    where v.id = expenses.vehicle_id and v.user_id = auth.uid()
  ));

create policy "Crear gastos en mis vehículos"
  on expenses for insert
  with check (exists (
    select 1 from vehicles v
    where v.id = expenses.vehicle_id and v.user_id = auth.uid()
  ));

create policy "Editar gastos de mis vehículos"
  on expenses for update
  using (exists (
    select 1 from vehicles v
    where v.id = expenses.vehicle_id and v.user_id = auth.uid()
  ));

create policy "Borrar gastos de mis vehículos"
  on expenses for delete
  using (exists (
    select 1 from vehicles v
    where v.id = expenses.vehicle_id and v.user_id = auth.uid()
  ));

-- ---------- DOCUMENTS (mismo patrón que expenses) ----------
alter table documents enable row level security;

create policy "Ver documentos de mis vehículos"
  on documents for select
  using (exists (
    select 1 from vehicles v
    where v.id = documents.vehicle_id and v.user_id = auth.uid()
  ));

create policy "Crear documentos en mis vehículos"
  on documents for insert
  with check (exists (
    select 1 from vehicles v
    where v.id = documents.vehicle_id and v.user_id = auth.uid()
  ));

create policy "Editar documentos de mis vehículos"
  on documents for update
  using (exists (
    select 1 from vehicles v
    where v.id = documents.vehicle_id and v.user_id = auth.uid()
  ));

create policy "Borrar documentos de mis vehículos"
  on documents for delete
  using (exists (
    select 1 from vehicles v
    where v.id = documents.vehicle_id and v.user_id = auth.uid()
  ));

-- ---------- REMINDERS (mismo patrón) ----------
alter table reminders enable row level security;

create policy "Ver recordatorios de mis vehículos"
  on reminders for select
  using (exists (
    select 1 from vehicles v
    where v.id = reminders.vehicle_id and v.user_id = auth.uid()
  ));

create policy "Crear recordatorios en mis vehículos"
  on reminders for insert
  with check (exists (
    select 1 from vehicles v
    where v.id = reminders.vehicle_id and v.user_id = auth.uid()
  ));

create policy "Editar recordatorios de mis vehículos"
  on reminders for update
  using (exists (
    select 1 from vehicles v
    where v.id = reminders.vehicle_id and v.user_id = auth.uid()
  ));

create policy "Borrar recordatorios de mis vehículos"
  on reminders for delete
  using (exists (
    select 1 from vehicles v
    where v.id = reminders.vehicle_id and v.user_id = auth.uid()
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
  with check (claimed_by_user_id = auth.uid());

create policy "Editar mi taller reclamado"
  on workshops for update
  using (claimed_by_user_id = auth.uid())
  with check (claimed_by_user_id = auth.uid());

-- ---------- REVIEWS ----------
alter table reviews enable row level security;

create policy "Cualquiera puede ver reseñas"
  on reviews for select
  using (true);

create policy "Un usuario logueado puede crear su reseña"
  on reviews for insert
  with check (auth.uid() = user_id);

create policy "Un usuario puede borrar su propia reseña"
  on reviews for delete
  using (auth.uid() = user_id);

create policy "Un usuario puede editar su propia reseña"
  on reviews for update
  using (auth.uid() = user_id);

-- ---------- QUOTE REQUESTS / RESPONSES ----------
alter table quote_requests enable row level security;

create policy "Ver mis propias cotizaciones"
  on quote_requests for select
  using (auth.uid() = user_id);

create policy "Crear mis propias cotizaciones"
  on quote_requests for insert
  with check (auth.uid() = user_id);

create policy "Editar mis propias cotizaciones"
  on quote_requests for update
  using (auth.uid() = user_id);

create policy "Borrar mis propias cotizaciones"
  on quote_requests for delete
  using (auth.uid() = user_id);

alter table quote_responses enable row level security;

create policy "Ver respuestas de mis cotizaciones"
  on quote_responses for select
  using (exists (
    select 1 from quote_requests q
    where q.id = quote_responses.quote_request_id and q.user_id = auth.uid()
  ));

create policy "Responder cotizaciones desde mi taller reclamado"
  on quote_responses for insert
  with check (exists (
    select 1 from workshops w
    where w.id = quote_responses.workshop_id and w.claimed_by_user_id = auth.uid()
  ));

create policy "Editar respuestas de mi taller reclamado"
  on quote_responses for update
  using (exists (
    select 1 from workshops w
    where w.id = quote_responses.workshop_id and w.claimed_by_user_id = auth.uid()
  ));

create policy "Borrar respuestas de mi taller reclamado"
  on quote_responses for delete
  using (exists (
    select 1 from workshops w
    where w.id = quote_responses.workshop_id and w.claimed_by_user_id = auth.uid()
  ));
