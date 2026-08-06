# auto-app

App de mantenimiento de auto para Argentina: registro de gastos/service,
documentación (cédula, seguro, VTV, patente) y directorio geolocalizado de
lubricentros, mecánicos, gomerías, lavaderos y casas de escape.

## Stack
- Expo (React Native) + TypeScript
- Supabase (auth con magic link, Postgres, storage)
- React Navigation (stack + tabs)

## Contexto de producto
Ver `docs/plan-app-mantenimiento-auto.md` para visión, funcionalidades por
fase, monetización y roadmap completo antes de proponer features nuevas.

## Modelo de datos
Ver `db/schema.sql` (tablas) y `db/rls_policies.sql` (seguridad por usuario).
Cualquier tabla nueva necesita su policy de RLS correspondiente — no lo
saltees aunque sea "solo para probar".

## Diseño
Ver `docs/wireframes.html` para el criterio visual de las 3 pantallas core
(paleta grafito/papel crudo/ámbar, tipografía Oswald + Inter + JetBrains Mono,
motivo del "sello de taller" para estados).

## Reglas
- No tocar `.env` ni pedir que se suba al repo — tiene credenciales
- Antes de agregar una tabla nueva, actualizar `db/schema.sql` y agregar su
  policy en `db/rls_policies.sql`
- Seguir la convención de nombres en inglés para el código (variables,
  funciones) aunque los textos de la UI estén en español
