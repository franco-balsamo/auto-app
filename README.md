# auto-app — scaffold inicial

## Stack
- Expo (React Native) + TypeScript
- Supabase (auth, Postgres, storage)
- React Navigation (stack + tabs)

## Setup

```bash
npm install
cp .env.example .env   # completar con tu URL y anon key de Supabase
npx expo start
```

## Estructura

```
db/
  schema.sql          # tablas + extensión postgis + constraints/índices
  functions.sql       # RPC nearby_workshops + triggers (sync km/reminders, updated_at)
  rls_policies.sql    # seguridad por usuario (CRUD completo por tabla)
  storage.sql         # bucket vehicle-files + policies de storage.objects
  seed_workshops.sql  # carga manual de talleres para no lanzar con el directorio vacío

src/
  lib/supabase.ts          # cliente de Supabase
  types/database.ts        # tipos TS que reflejan schema.sql
  hooks/
    useVehicles.ts         # trae vehículos del usuario logueado + createVehicle
    useVehicle.ts          # trae un vehículo puntual por id
    useExpenses.ts         # gastos de un vehículo
    useDocuments.ts        # documentos de un vehículo + uploadDocument (Storage)
    useReminders.ts        # recordatorios de un vehículo + createReminder/markDone
    useNearbyWorkshops.ts  # trae talleres cercanos vía RPC nearby_workshops
  navigation/RootNavigator.tsx
  screens/
    HomeScreen.tsx
    VehicleDetailScreen.tsx
    AddVehicleScreen.tsx
    AddExpenseScreen.tsx
    AddReminderScreen.tsx
    UploadDocumentScreen.tsx
    DirectoryScreen.tsx
    ProfileScreen.tsx
```

## Release (EAS)

`eas.json` define los profiles `development`/`preview`/`production`. Las
env vars de Supabase (`EXPO_PUBLIC_SUPABASE_URL`/`ANON_KEY`) no van en este
archivo ni en el repo — se configuran por environment en el dashboard de
EAS o con `eas env:create --environment production --name
EXPO_PUBLIC_SUPABASE_URL --value ...` (repetir por variable y por
environment). `bundleIdentifier`/`package` en `app.json` siguen siendo el
placeholder `com.tuempresa.autoapp` — reemplazar antes del primer build de
store. `eas.projectId` todavía no está seteado — lo genera `eas init`
(requiere login a una cuenta Expo).

## Pendiente (siguiente paso lógico)
1. Correr, en orden, en el SQL editor de Supabase: `schema.sql` →
   `functions.sql` → `rls_policies.sql` → `storage.sql` →
   `seed_workshops.sql` (funciones y policies dependen de columnas/tablas
   del schema; storage depende de que `rls_policies.sql` ya haya corrido)
2. Reemplazar `seed_workshops.sql` por un script contra Google Places API
   por zona cuando se defina la zona real de lanzamiento
3. Definir bundle identifier real, correr `eas init` y completar las env
   vars de Supabase por environment en EAS
4. Completar DSN de Sentry (`EXPO_PUBLIC_SENTRY_DSN`) y API key de Google
   Maps para Android antes del primer build de store
5. Una vez que exista una organización/proyecto en Sentry: agregar el
   plugin `@sentry/react-native` a `app.json` (config plugin nativo, hoy
   deliberadamente no incluido para no romper `eas build` sin
   `SENTRY_AUTH_TOKEN`/org/project) para crash reporting nativo y upload
   de source maps
6. Foto de factura + OCR en `AddExpenseScreen.tsx` — requiere elegir
   proveedor: ML Kit on-device (necesita build nativo, no anda en Expo Go)
   o Google Vision API (necesita API key, sí anda en Expo Go)
7. `app.json` no tiene `icon`/`splash` ni existe carpeta `assets/` — falta
   el arte real (paleta grafito/papel crudo/ámbar del wireframe). Sin esto
   `eas build` usa el ícono default de Expo, no es bloqueante pero no
   queda para publicar en stores
8. GitHub Actions no corre ningún workflow en este repo (permisos
   `enabled: true`, workflow indexado como `active`, pero
   `/actions/runs` siempre da 0 y no se crea check-suite de la app
   `github-actions` ni con push ni con PR/merge) — parece un bloqueo a
   nivel de cuenta de GitHub, no del repo. Pendiente ticket a
   support.github.com
