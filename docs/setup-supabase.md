# Setup de Supabase — paso a paso

## 1. Crear el proyecto
1. Andá a [supabase.com](https://supabase.com) → **New project**
2. Elegí una región cercana (São Paulo, si está disponible, da menor latencia desde Argentina que EE.UU.)
3. Guardá la **contraseña de la base** que te pide al crear el proyecto (la vas a necesitar si algún día te conectás por `psql` directo)

## 2. Correr el schema
1. En el panel del proyecto, andá a **SQL Editor** → **New query**
2. Pegá el contenido completo de `schema.sql` y ejecutá (▶ Run)
3. Verificá en **Table Editor** que aparecieron: `vehicles`, `expenses`, `documents`, `reminders`, `workshops`, `reviews`, `quote_requests`, `quote_responses`

## 3. Activar RLS (Row Level Security)
1. En el mismo **SQL Editor**, corré ahora `rls_policies.sql`
2. Confirmá en **Authentication → Policies** que cada tabla tiene sus policies listadas (no debería quedar ninguna tabla "sin RLS" salvo que sea intencional)

> Sin este paso, cualquier usuario logueado podría leer o modificar los datos de otro usuario — no te saltees el paso 3 aunque quieras probar rápido.

## 4. Obtener las credenciales para la app
1. **Project Settings → API**
2. Copiá:
   - `Project URL` → va en `EXPO_PUBLIC_SUPABASE_URL`
   - `anon public key` → va en `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. En el scaffold del proyecto: `cp .env.example .env` y completá esos dos valores

## 5. Activar el método de auth
1. **Authentication → Providers**
2. Para arrancar simple: activá **Email** (magic link, sin contraseña) — menos fricción para el usuario y menos código en el cliente que armar login/registro con password
3. Si preferís email + contraseña de una, también está soportado; es un poco más de pantallas (registro, "olvidé mi contraseña")

## 6. Bucket de storage para fotos (documentos y facturas)
1. **Storage → New bucket**, nombre sugerido: `vehicle-files`
2. Marcalo como **privado** (no público) — son documentos personales
3. Vas a necesitar una policy de storage similar a las de las tablas, algo como:
   ```sql
   create policy "Los usuarios acceden solo a sus propios archivos"
   on storage.objects for all
   using (auth.uid()::text = (storage.foldername(name))[1]);
   ```
   Esto asume que subís los archivos con una ruta tipo `vehicle-files/{user_id}/{archivo}` — conviene mantener esa convención desde el código.

## 7. Probar la conexión
Con el `.env` completo, corré:
```bash
npx expo start
```
Si `useVehicles` devuelve un array vacío sin error, la conexión está bien (todavía no hay datos porque no hay usuario logueado ni vehículos cargados).

---

**Siguiente paso lógico:** armar las pantallas de login/registro (magic link) para que `auth.uid()` exista y las policies de arriba tengan sentido — hoy el scaffold asume que ya hay una sesión activa.
