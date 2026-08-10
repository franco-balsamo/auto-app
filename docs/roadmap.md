# Roadmap — estado actual y próximas etapas

Consolida `docs/plan-app-mantenimiento-auto.md` (sección 5, plan de
producto) y `README.md` (checklist técnico) contra el estado real de
avance. Actualizar cuando se cierre algún ítem grande.

_Última actualización: 2026-08-10._

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
`main`/`development`.

Pendiente, en orden de bloqueo real:

1. **Correr los scripts SQL en Supabase** (si no se hizo ya en el
   proyecto real): `schema.sql` → `functions.sql` → `rls_policies.sql` →
   `storage.sql` → `seed_workshops.sql` (orden importa, hay
   dependencias).
2. **Reemplazar `seed_workshops.sql`** (10 talleres de prueba en
   Palermo/Almagro) por un script real contra Google Places API para la
   zona de lanzamiento — bloqueante para salir del "huevo-gallina" del
   directorio (sección 6 del plan de producto).
3. **Bundle identifier real + `eas init`** (hoy `com.tuempresa.autoapp`
   placeholder) — bloqueante para cualquier build de store.
4. **Sentry DSN + Google Maps API key (Android)** — antes del primer
   build de store.
5. ~~**OCR de factura**~~ — armado con Google Vision API (anda en Expo
   Go, a diferencia de ML Kit que pide dev build): `src/lib/ocr.ts`
   (parser + llamada a Vision), `useExpenses.createExpense` sube la foto
   a `vehicle-files` y guarda `receipt_photo_url`, `AddExpenseScreen`
   saca la foto y autocompleta monto/fecha. Sin
   `EXPO_PUBLIC_GOOGLE_VISION_API_KEY` en `.env`, sacar foto sigue
   andando pero no autocompleta (mismo patrón que Sentry sin DSN) —
   **falta que definas y cargues esa key para activar el autocompletado**.
6. **`assets/` con icon/splash reales** — hoy no existe la carpeta, EAS
   usa el ícono default de Expo. No bloquea desarrollo pero sí publicar
   en stores.
7. ~~**Subir cobertura de tests** más allá de vehículos/auth~~ — hecho:
   `useExpenses`, `useDocuments`, `useReminders`, `useVehicle`,
   `useNearbyWorkshops` y `DateField` ya tienen tests (9 suites / 35 tests).
8. **Ticket a support.github.com** por el bloqueo de GitHub Actions a
   nivel de cuenta (permisos ok, pero `/actions/runs` no corre nada) —
   sin esto, CI no protege ningún merge real todavía.
9. Beta cerrada con grupo chico de usuarios reales (cierre formal de la
   etapa).

## Etapa 2 — Directorio propio + reseñas (4-6 semanas estimadas)

- **Reseñas de usuarios**: el schema (`reviews`) y las policies RLS ya
  existen — falta 100% del lado app (hook `useReviews` + UI en
  `DirectoryScreen`/ficha de taller).
- **Flujo "reclamar ficha" de taller**: columna `claimed_by_user_id` ya
  existe en `workshops` — falta el flujo de reclamo (verificación +
  pantalla de gestión básica para el dueño del taller).
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

El primer bloqueador real para tener algo "productivo" en el sentido más
estricto (poder buildear y compartir un build de verdad) es el combo
**bundle identifier + `eas init` + correr los SQL en Supabase si no están
corridos**. Todo lo demás (OCR, assets, Sentry) es necesario antes de
subir a stores pero no bloquea tener una build interna compartible.
