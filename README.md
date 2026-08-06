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
src/
  lib/supabase.ts          # cliente de Supabase
  types/database.ts        # tipos TS que reflejan schema.sql
  hooks/
    useVehicles.ts         # trae los vehículos del usuario logueado
    useNearbyWorkshops.ts  # trae talleres cercanos usando GPS (expo-location)
  navigation/RootNavigator.tsx
  screens/
    HomeScreen.tsx
    VehicleDetailScreen.tsx
    AddExpenseScreen.tsx
    DirectoryScreen.tsx
    ProfileScreen.tsx
```

## Pendiente (siguiente paso lógico)
1. Correr `schema.sql` en el proyecto de Supabase (SQL editor)
2. Activar RLS (Row Level Security) en `vehicles`, `expenses`, `documents`
   — política básica: `user_id = auth.uid()`
3. Armar el flujo de auth (magic link o email/password con Supabase Auth)
4. Poblar `workshops` con un script que pegue contra Google Places API
   por zona (arranque del directorio sin depender de que los talleres
   se registren)
5. `react-native-maps` para reemplazar el listado del Directorio por
   mapa + lista combinados, como en el wireframe 03
