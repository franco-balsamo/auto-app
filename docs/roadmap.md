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
- ~~**Exportar historial de vehículo a PDF**~~ — hecho: `expo-print` +
  `expo-sharing` instalados, `src/lib/pdf.ts` arma el HTML (gastos +
  documentos + recordatorios) y dispara el share sheet nativo. Botón
  "Exportar PDF" en el header de `VehicleDetailScreen`. Sin probar en un
  device/simulador real todavía (entorno de desarrollo sin uno a mano) —
  solo verificado por typecheck/lint/tests (`buildVehicleHistoryHtml` sí
  tiene tests, la función que llama a `expo-print`/`expo-sharing` no,
  requiere runtime nativo).

## Etapa 3 — Monetización usuario (3-4 semanas estimadas)

**Cambio de pasarela: Mercado Pago → IAP nativo (RevenueCat).** El plan
original (`docs/plan-app-mantenimiento-auto.md`, desactualizado en este
punto) asumía Mercado Pago para la suscripción de usuario. No es viable
así: Apple (App Store Review Guideline 3.1.1) y Google Play exigen que
una suscripción digital que desbloquea funciones dentro de la app use su
sistema de pago nativo (StoreKit / Google Play Billing), no una pasarela
de terceros embebida — Mercado Pago ahí corre riesgo real de rechazo en
review. Mercado Pago sigue teniendo sentido para el lado talleres (Etapa
4: cobro B2B por fichas destacadas/leads, fuera del contexto de "compra
digital dentro de la app"), ahí no aplica la misma restricción.

Impacto en lo ya construido: `subscriptions.mp_preapproval_id` y los
comentarios de `db/schema.sql`/`db/rls_policies.sql` que hablan de
"webhook de Mercado Pago" quedan desactualizados — hay que renombrar la
columna (algo tipo `revenuecat_entitlement_id` o similar) y ajustar esos
comentarios cuando arranque la integración real. El resto del diseño
(sin fila = free, `status = 'active'` = pago, sin insert/update/delete
para el cliente) no cambia — el webhook de RevenueCat reemplaza al de
Mercado Pago en el mismo rol de "único escritor server-side".

- ~~**Modelo de datos de suscripción**~~ — hecho: tabla `subscriptions`
  (`db/schema.sql`, aplicada a `auto-app-staging`) — sin fila = plan
  free, fila con `status = 'active'` = plan pago. Sin columna `plan`
  (YAGNI: hoy hay un solo tier pago). RLS: `select` de la propia fila
  únicamente — **sin policy de insert/update/delete para el cliente a
  propósito** (si el usuario pudiera escribir su propio `status`, se
  destrabaría el plan pago gratis). Solo el backend (service_role) va a
  poder escribir acá, al procesar el webhook de Mercado Pago.
- ~~**Gate del export PDF**~~ — hecho, decisión de producto tomada:
  gratis la primera vez por cuenta (no por vehículo), pago las
  siguientes. Tabla `pdf_export_usage` (`db/schema.sql`, aplicada a
  `auto-app-staging`) — fila presente = ya usó su export gratis, sin
  fila = todavía lo tiene disponible. A diferencia de `subscriptions`,
  esta sí tiene policy de `insert` para el cliente (no hay plata de por
  medio, solo una bandera de uso) pero sin `update`/`delete` — no se
  puede resetear el freebie llamando directo a la API. `useEntitlements`
  (`isPro`, `canExportPdf`, `markPdfExportUsed`) conecta ambas tablas;
  `VehicleDetailScreen.handleExportPdf` bloquea con un alert ("Función
  paga próximamente") si `canExportPdf` es `false`. Con tests (5 casos:
  free sin usar, free ya usado, pro con freebie ya gastado, suscripción
  cancelada no cuenta como pro, insert de `markPdfExportUsed`).
- ~~**Límite de 1 vehículo en plan free**~~ — hecho, con backstop
  server-side real (no solo aviso en el cliente): policy RLS de `insert`
  en `vehicles` (`db/rls_policies.sql`, aplicada a `auto-app-staging`
  con `alter policy`) bloquea el 2º vehículo salvo suscripción activa —
  pegarle directo a la API REST de Supabase salteando el cliente no
  alcanza para saltear el límite, a diferencia del gate de PDF que hoy
  es solo UI. `HomeScreen` corta antes de navegar a `AddVehicle` con el
  mismo alert "Función paga próximamente" que el export de PDF. 3 tests
  nuevos (`HomeScreen.test.tsx`). Usuarios ya existentes con 2+
  vehículos quedan como estaban — la policy solo afecta inserts nuevos.
- ~~**Renombrar `mp_preapproval_id`**~~ — hecho: columna
  `revenuecat_entitlement_id` en `db/schema.sql` (aplicada a
  `auto-app-staging` con `alter table rename column`), tipo TS y
  comentarios de `db/rls_policies.sql` actualizados.
- Pendiente, en orden: (1) crear cuenta/proyecto en RevenueCat +
  configurar productos de suscripción en App Store Connect y Google
  Play Console (paso previo obligatorio, no técnico — requiere cuentas
  de developer de Apple/Google que todavía no están armadas); (2)
  backend que reciba el webhook de RevenueCat y escriba en
  `subscriptions` (Edge Function de Supabase, service_role); (3)
  integrar SDK de RevenueCat + paywall/flujo
  de alta de suscripción en la app (`expo install react-native-purchases`
  o el paquete Expo config plugin equivalente).

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

**Prioridad de secuencia:** cerrar la beta cerrada (#9) y confirmar
retención real (¿usuarios vuelven a cargar gasto semana 2? ¿usan el OCR?)
antes de invertir en Etapa 4 (Modo Taller/cotizador, 6-8 semanas
estimadas). Apps de registro manual de datos suelen tener retención floja
si el lock-in (OCR, Modo Taller) no funciona en la práctica — validarlo
es más barato que construir 6-8 semanas más sin esa confirmación.

**Riesgo legal pendiente:** documentación sensible (cédula, licencia,
seguro) en storage — evaluar si aplica el marco de la Ley 25.326
(protección de datos personales, Argentina) más formalmente antes de
escalar a beta pública, no solo cifrado + política de privacidad
genérica.
