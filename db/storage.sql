-- =========================================================
-- Storage — correr DESPUÉS de rls_policies.sql
-- =========================================================
-- Bucket `vehicle-files`: fotos de documentación (cédula, seguro, VTV) y
-- facturas. Privado — se accede vía URL firmada, no público.
-- Convención de ruta obligatoria: vehicle-files/{user_id}/{archivo}
-- (las policies dependen de que el primer segmento del path sea el user_id).

insert into storage.buckets (id, name, public)
values ('vehicle-files', 'vehicle-files', false)
on conflict (id) do nothing;

create policy "Ver mis propios archivos"
  on storage.objects for select
  using (bucket_id = 'vehicle-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Subir mis propios archivos"
  on storage.objects for insert
  with check (bucket_id = 'vehicle-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Editar mis propios archivos"
  on storage.objects for update
  using (bucket_id = 'vehicle-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Borrar mis propios archivos"
  on storage.objects for delete
  using (bucket_id = 'vehicle-files' and auth.uid()::text = (storage.foldername(name))[1]);
