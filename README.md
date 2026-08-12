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
  seed_workshops.sql  # fixture DEV (Palermo/Almagro) — no usar para carga real

scripts/
  fetch_workshops.mjs # genera el SQL real de talleres vía Google Places API

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

## Talleres reales (OpenStreetMap)

`db/seed_workshops.sql` es solo fixture de desarrollo. Para poblar el
directorio con talleres reales de una zona:

```bash
node scripts/fetch_workshops.mjs "San Vicente, Partido de San Vicente, Buenos Aires, Argentina" > /tmp/workshops.sql
# revisar /tmp/workshops.sql y correrlo en el SQL editor de Supabase
```

Usa Nominatim (geocoding) + Overpass (POIs) de OpenStreetMap — gratis, sin
API key ni billing (a diferencia de Google Places, que pide tarjeta
incluso para el free tier). Requiere `curl` instalado (transporte HTTP del
script; el `fetch` nativo de Node falló contra `overpass-api.de` en algunos
entornos sandboxeados). Nombres de zona ambiguos existen (ej. "San
Vicente" aparece 5 veces en la provincia de Buenos Aires) — el script
imprime en stderr qué lugar resolvió Nominatim; si no es el esperado, pasar
el nombre completo del partido/localidad. Teléfono solo si está cargado en
OSM (frecuentemente no); queda `null` si falta.

## Pendiente

Ver `docs/roadmap.md` — es la fuente única del estado real y próximos
pasos, en orden de bloqueo. Este README no duplica esa lista para no
desincronizarse.

Para correr los SQL desde cero, orden fijo: `schema.sql` →
`functions.sql` → `rls_policies.sql` → `storage.sql` → talleres reales
(`scripts/fetch_workshops.mjs`, ver arriba) o `seed_workshops.sql` si es
solo desarrollo local.
