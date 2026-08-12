# QA review — pre-lanzamiento

_Hecha 2026-08-12, contra el estado del MVP en `development`. Repasar de
nuevo antes de abrir beta pública (no solo cerrada) y cada vez que se
toque `db/schema.sql` / `db/rls_policies.sql`._

Metodología: lectura de `docs/plan-app-mantenimiento-auto.md`,
`docs/roadmap.md`, `db/schema.sql`, `db/rls_policies.sql`,
`db/storage.sql`, `db/functions.sql` y el código relevante
(`src/hooks`, `src/screens`, `src/lib/ocr.ts`).

## Arreglado en esta pasada

Cambios ya hechos en `db/schema.sql` / `db/functions.sql` (local, git).
**Sin aplicar todavía a `auto-app-staging`** — correr contra el proyecto
real antes de que importen (ver sección "Falta correr en staging").

| Problema | Dónde | Fix |
|---|---|---|
| **Auto-destacado gratis de talleres.** Las policies de update de `workshops` (`rls_policies.sql`) solo validan `claimed_by_user_id`, no restringen qué otras columnas cambian. Un usuario con taller reclamado podía pegarle directo a la API REST (`update workshops set is_promoted = true`) y destacar su ficha sin pagar — bypassea por completo el modelo de ingresos de Etapa 4. | `db/functions.sql` | Trigger `protect_workshop_admin_columns`: fuerza `is_promoted` de vuelta a su valor previo salvo que el rol sea `service_role`. |
| **Reviews duplicadas.** El límite "1 reseña por usuario por taller" solo estaba en la UI (`WorkshopDetailScreen`), no en la base. Una llamada directa a la API permitía cargar N reseñas del mismo usuario en el mismo taller — rompe la señal de confianza que es el diferencial del directorio. | `db/schema.sql` (tabla `reviews`) | `unique (workshop_id, user_id)`. |
| **Recordatorio sin fecha ni km.** `AddReminderScreen`/`EditReminderScreen` ya validan que haya al menos uno de los dos antes de guardar, pero nada lo exigía en la base — un insert directo a la API podía crear un recordatorio que nunca dispara. | `db/schema.sql` (tabla `reminders`) | `check (due_date is not null or due_km is not null)` como backstop server-side, mismo patrón que el límite de 1 vehículo free. |
| **Patente sin normalizar.** `AddVehicleScreen`/`EditVehicleScreen` ya mandan la patente en mayúsculas, pero `unique (user_id, plate)` compara texto crudo — "AB123CD" y "ab 123 cd" no colisionan sin normalizar, y cualquier código nuevo que inserte sin pasar por esas pantallas rompe la dedupe. | `db/functions.sql` | Trigger `normalize_vehicle_plate`: `upper(trim(...))` + saca espacios internos, antes de insert/update. |

### Aplicado a staging

Corrido en `auto-app-staging` (proyecto `euoujzxrulpcyfponxun`) vía MCP
de Supabase el 2026-08-12, migración `qa_fixes_workshop_promoted_reviews_
reminders_plate`. Verificado antes de aplicar que no había reviews
duplicadas ni reminders con `due_date`/`due_km` ambos `null` (0 filas en
ambos casos), así que el `unique`/`check` entraron sin romper data
existente. `get_advisors` (security) después de aplicar no mostró
hallazgos nuevos — todo lo listado (`spatial_ref_sys`, extensión
`postgis` en `public`, funciones `st_estimatedextent`, leaked password
protection) es preexistente y no relacionado a este cambio.

## Verificado, ya está bien (no era bug)

Cosas que en la primera pasada parecían riesgo y, al leer el código,
ya están cubiertas:

- **Storage de documentación sensible**: `db/storage.sql` — bucket
  `vehicle-files` privado (no público), policies por
  `storage.foldername(name)[1] = auth.uid()`, acceso solo vía URL
  firmada. Bien.
- **Parseo de montos OCR**: `src/lib/ocr.ts` ya maneja formato AR
  ("1.234,56") correctamente (`toAmount` saca puntos, cambia coma por
  punto). No hay bug de locale.
- **Retroceso de odómetro**: `handle_expense_insert` (`db/functions.sql`)
  usa `greatest(current_km, new.odometer_km)` — un km cargado mal/menor
  nunca hace retroceder `vehicles.current_km`.
- **Recordatorio sin fecha/km**: ya validado client-side en ambas
  pantallas (ver arriba — se agregó el backstop de DB igual, por
  consistencia con el resto de los límites).
- **Doble tap en "Guardar vehículo"**: `AddVehicleScreen` ya deshabilita
  el botón mientras `saving` es `true`. Mitiga el caso más común de la
  race condition de abajo.

## Pendiente — necesita más que un fix puntual

No tocado en esta pasada: son cambios más grandes (schema nuevo,
backend nuevo, o decisión de producto) y no algo para meter sin avisar
en una tabla con datos reales.

- **Race condition real del límite de 1 vehículo free**: el `count(*) <
  1` de la policy de insert (`rls_policies.sql`) no es atómico —
  técnicamente, dos inserts concurrentes desde dos sesiones/dispositivos
  distintos (no bloqueado por el `disabled={saving}` de un solo botón)
  podrían colar 2 vehículos free. Fix correcto necesita una columna
  `is_primary` + unique index parcial (los unique index sí serializan
  bien inserts concurrentes, a diferencia de un `count` en una
  subquery) — cambio de schema real, no un one-liner. Impacto acotado
  (peor caso: 1 vehículo free de más, no es plata perdida ni dato
  expuesto), no justifica tocar `vehicles` en vivo sin planearlo.
- **Keys client-side expuestas**: `EXPO_PUBLIC_GOOGLE_VISION_API_KEY` y
  la de Google Maps viajan en el bundle. Alguien que decompila el APK
  puede extraerlas y drenar cuota. Fix real es un proxy server-side para
  el OCR (Edge Function de Supabase) — bastante más que este PR.
- **`quote_responses` sin validar categoría/cercanía**: cualquier
  taller reclamado puede responder cualquier `quote_request`, aunque no
  matchee rubro. Baja prioridad: el cotizador (Etapa 4) todavía tiene
  0% de UI construida del lado app, se puede resolver junto con esa
  feature.
- **Sin cola offline**: cargar un gasto sin señal (garage, subsuelo,
  común en AR) puede perderse en vez de encolarse. Requiere trabajo de
  UX + storage local, no es un fix de una línea.
- **Compresión de imágenes antes de subir**: fotos de factura/documento/
  reseña se suben a resolución completa de cámara. Afecta costo de
  storage y velocidad de listados con conexión mala. Necesita
  `expo-image-manipulator` (no instalado) + tocar 3 flujos de subida.
- **Verificación de reclamo de taller**: ya marcado en
  `docs/roadmap.md` como aceptable para beta cerrada — cualquier
  usuario logueado puede reclamar una ficha sin dueño sin probar que es
  el dueño real. Revisar antes de abrir a público, como ya dice el
  roadmap.
- **Riesgo legal de datos sensibles (Ley 25.326)**: ya marcado en
  `docs/roadmap.md` — evaluar formalmente antes de beta pública, más
  allá de "está cifrado y hay política de privacidad".
- **VTV por terminación de patente**: la funcionalidad de calcular
  vencimiento automático por patente todavía no está construida (hoy
  `documents.expiration_date` es carga manual) — cuando se construya,
  ojo con Mercosur (AB123CD) vs formato viejo (ABC123), la regla de
  terminación no es la misma.

## Usabilidad (sin fix de código, son decisiones de producto/diseño)

- Umbral de "por vencer" (semáforo amarillo) no está definido en
  ningún lado — hay que fijar un número de días antes de cerrar el
  diseño de la ficha del auto.
- El alert "Función paga próximamente" (gate de PDF y de 2do vehículo)
  es un callejón sin salida mientras no exista paywall real de
  RevenueCat — ajustar copy para que no lea como feature rota en la
  beta cerrada.
- Sin fallback si el usuario niega el permiso de ubicación en el
  directorio (búsqueda por dirección/zona manual).
- Contraste de la paleta grafito/papel-crudo/ámbar sin verificar contra
  WCAG — público objetivo (25-55 años) incluye rango con problemas de
  vista.
