# Roadmap — estado actual y próximas etapas

Consolida `docs/plan-app-mantenimiento-auto.md` (sección 5, plan de
producto) y `README.md` (checklist técnico) contra el estado real de
avance. Actualizar cuando se cierre algún ítem grande.

_Última actualización: 2026-08-12._

## Dónde está parado el proyecto

A caballo entre Etapa 0 y Etapa 1: el MVP funcional ya existe y corre en
Expo Go, pero le faltan pasos de "hardening" antes de considerarse
cerrado y publicable.

## Etapa 0 — Validación

**Salteada, superada por la implementación.** No hubo landing ni
validación formal con 5-10 usuarios, pero ya hay una app funcional en su
lugar. Gap de validación de mercado, no técnico.

## Etapa 1 — MVP (lo que falta para cerrarla)

Ya construido: alta de vehículo, gastos, recordatorios, documentación
(fotos + vencimientos), directorio geolocalizado con RPC real
(`useNearbyWorkshops` + `nearby_workshops`), auth por magic link, CRUD
completo con editar/eliminar desde listados, calendario propio para
fechas, CI (`typecheck` → `lint` → `test`) en PR/push a
`main`/`development`. Backend en Supabase (`auto-app-staging`,
sa-east-1) corriendo con RLS optimizada (`(select auth.uid())` en vez de
`auth.uid()` por fila, ver advisory de performance de Supabase).

Pendiente, en orden de bloqueo real:

1. ~~**Correr los scripts SQL en Supabase**~~ — hecho: proyecto
   `auto-app-staging` (sa-east-1) tiene `schema.sql`, `functions.sql`,
   `rls_policies.sql` y `storage.sql` corridos, con datos reales (2
   vehículos, 3 gastos, 13 talleres). Advisory pendiente y no bloqueante:
   `spatial_ref_sys` (tabla interna de PostGIS) sin RLS — bajo riesgo, no
   es dato de usuario.
2. ~~**Reemplazar `seed_workshops.sql`**~~ — hecho: `scripts/fetch_workshops.mjs`
   genera el SQL real de talleres por zona (`node
   scripts/fetch_workshops.mjs "<zona>"`, ver README). App pensada para
   toda Argentina, no una sola ciudad fija — el script toma la zona como
   argumento en vez de tenerla hardcodeada. Usa OpenStreetMap (Nominatim +
   Overpass), no Google Places — se probó con Google Places primero pero
   pide billing/tarjeta incluso para el free tier, se descartó. Probado
   en vivo contra San Vicente (Partido de San Vicente, Buenos Aires): 8
   talleres reales — corrido contra San Vicente (Partido de San Vicente,
   Buenos Aires) y cargado a `auto-app-staging`: VTV/service, Lubricentro,
   Electricidad del Automotor, Taller Mecánico, Taller de Radiadores,
   Neumáticos del Sur, Neumáticos EZE, Gomería Korn (`source = 'osm'`,
   conviven con los 13 `manual` de Palermo/Almagro, sin overlap de
   nombres). `seed_workshops.sql` (fixture Palermo/Almagro) queda solo
   para desarrollo local.
3. ~~**Bundle identifier real + `eas init`**~~ — hecho:
   `com.balsamote96.autoapp` (iOS y Android) y proyecto EAS creado
   (`@fbalsamo/auto-app`, ver `app.json` → `extra.eas.projectId`).
4. ~~**Sentry DSN + Google Maps API key (Android)**~~ — hecho:
   `EXPO_PUBLIC_SENTRY_DSN` cargado y `trackEvent` confirmado llegando
   a Sentry (proyecto `auto-app`, org `cg-consulting`); Google Maps API
   key restringida solo a "Maps SDK for Android" (sin restricción de
   package/SHA-1 todavía, no hay build Android generado aún — restringir
   bien cuando exista un `eas build` de Android real) en
   `app.json` → `android.config.googleMaps.apiKey`.
5. ~~**OCR de factura**~~ — armado con Google Vision API (anda en Expo
   Go, a diferencia de ML Kit que pide dev build): `src/lib/ocr.ts`
   (parser + llamada a Vision), `useExpenses.createExpense` sube la foto
   a `vehicle-files` y guarda `receipt_photo_url`, `AddExpenseScreen`
   saca la foto y autocompleta monto/fecha. Sin
   `EXPO_PUBLIC_GOOGLE_VISION_API_KEY` en `.env`, sacar foto sigue
   andando pero no autocompleta (mismo patrón que Sentry sin DSN) —
   **falta que definas y cargues esa key para activar el autocompletado**.
6. ~~**`assets/` con icon/splash reales**~~ — hecho en versión
   placeholder: `icon.png`, `adaptive-icon.png`, `splash.png` y
   `favicon.png` generados con el motivo de "sello de taller" (paleta
   grafito/papel/ámbar de `docs/wireframes.html`), referenciados en
   `app.json`. Son diseño genérico, no de marca — reemplazar antes de
   publicar en stores si se define identidad visual definitiva.
7. ~~**Subir cobertura de tests** más allá de vehículos/auth~~ — hecho:
   `useExpenses`, `useDocuments`, `useReminders`, `useVehicle`,
   `useNearbyWorkshops` y `DateField` ya tienen tests (9 suites / 35 tests).
8. **Ticket a support.github.com** por el bloqueo de GitHub Actions a
   nivel de cuenta (permisos ok, pero `/actions/runs` no corre nada) —
   sin esto, CI no protege ningún merge real todavía.
9. Beta cerrada con grupo chico de usuarios reales (cierre formal de la
   etapa).

## Etapa 2 — Directorio propio + reseñas (4-6 semanas estimadas)

- ~~**Reseñas de usuarios**~~ — hecho: `useReviews` (CRUD) +
  `WorkshopDetailScreen` (ficha de taller nueva, con promedio, reseña
  propia editable/borrable y listado de otras). `DirectoryScreen` ahora
  navega ahí desde cada card (requirió meter Directorio en su propio
  stack de navegación, antes era una tab plana sin detalle). Un usuario
  no puede cargar más de una reseña por taller (enforced en la UI, no
  hay constraint de unicidad en el schema). Pendiente menor: `photo_url`
  de `reviews` sigue sin usarse (plan de producto pide "con foto del
  trabajo hecho").
- ~~**Flujo "reclamar ficha" de taller**~~ — hecho en su versión MVP:
  `useWorkshop` (`claimWorkshop`/`updateWorkshop`) + botón "Reclamar este
  taller" y edición básica (nombre/dirección/teléfono) en
  `WorkshopDetailScreen`, todo apoyado en las policies RLS existentes
  (`claimed_by_user_id is null` para reclamar, `= auth.uid()` para
  editar). Sin verificación real (no hay servicio de verificación de
  identidad/negocio) — el reclamo es directo, cualquier usuario logueado
  puede tocar "Reclamar" en una ficha sin dueño. Aceptable para dev/beta
  cerrada, revisar antes de abrir a público.
- **Exportar historial de vehículo a PDF**: no iniciado, ninguna
  dependencia instalada todavía.

## Etapa 3 — Monetización usuario (3-4 semanas estimadas)

- Suscripción freemium: gratis 1 vehículo/historial básico, pago
  multi-vehículo + export PDF + backup + reporte de reventa.
- Integrar Mercado Pago (pasarela sugerida para el mercado argentino).
- Nada de esto tiene aún ni modelo de datos (falta tabla de
  suscripciones/planes) ni código.

## Etapa 4 — Lado talleres (6-8 semanas estimadas)

- Modo Taller: dashboard básico + carga de service vía QR directo al
  historial del cliente.
- Fichas destacadas pagas (`is_promoted` ya existe en `workshops`, falta
  el flujo de cobro y la lógica de priorización en el directorio).
- Cotizador rápido: el schema (`quote_requests`, `quote_responses`) ya
  existe — falta 100% del lado app, igual que reseñas.

## Etapa 5 — Escala

- Expansión geográfica (VTV varía por jurisdicción — hay que abstraer
  esa regla desde el modelo de datos antes de escalar a otra provincia).
- Métricas, ASO, campañas de adquisición. Sin trabajo técnico concreto
  todavía, es la etapa de negocio pura.

## Próximo paso concreto

Directorio de San Vicente ya cargado (8 talleres reales de OSM en
`auto-app-staging`) — el "huevo-gallina" del directorio está resuelto para
la primera zona. Falta correr `scripts/fetch_workshops.mjs` por cada nueva
zona a medida que la app se expanda a otras localidades. Lo único que
queda en Etapa 1 es el ticket a support.github.com por CI (#8) y la beta
cerrada (#9, cierre formal de la etapa) — ninguno de los dos bloquea tener
una build interna compartible.
