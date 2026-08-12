# Arquitectura técnica

_Escrito 2026-08-12. Documenta la arquitectura ya elegida y construida
(no una propuesta desde cero — ver `CLAUDE.md` y `docs/roadmap.md` para
el estado real de avance) y qué hace falta para que escale más allá de
la beta cerrada._

## Por qué no se propone un stack distinto

El MVP ya está construido y corriendo contra un backend real
(`auto-app-staging`). Recomendar otro frontend/backend acá significaría
tirar semanas de trabajo funcionando para resolver un problema que no
existe todavía (escala). La pregunta correcta a esta altura no es "¿cuál
es el mejor stack en abstracto?" sino "¿este stack aguanta crecer, y qué
hay que sumarle antes de que sea un problema real". Eso es lo que
responde este documento.

## Vista general

```
┌─────────────────────────────┐
│   App (Expo / React Native) │
│   iOS · Android · (web)     │
└───────────────┬─────────────┘
                │ HTTPS (supabase-js)
                ▼
┌─────────────────────────────────────────────┐
│              Supabase (sa-east-1)            │
│  ┌─────────┐ ┌────────────┐ ┌─────────────┐  │
│  │PostgREST│ │ Edge Funcs │ │   Storage   │  │
│  │(API auto│ │  (Deno —   │ │ (privado +  │  │
│  │generada)│ │  webhooks) │ │ URL firmada)│  │
│  └────┬────┘ └─────┬──────┘ └─────────────┘  │
│       │            │                          │
│  ┌────▼────────────▼─────┐   ┌─────────────┐ │
│  │  Postgres + PostGIS    │   │  Auth (GoTrue│ │
│  │  RLS por fila en TODAS │   │  magic link) │ │
│  │  las tablas de usuario │   └─────────────┘ │
│  └────────────────────────┘                   │
└─────────────────────────────────────────────┘
        │                    │                │
        ▼                    ▼                ▼
   OpenStreetMap        Google Vision      RevenueCat
  (Nominatim/Overpass    (OCR factura)    (IAP, webhook
   → seed talleres)                        → subscriptions)
        │
        ▼
   Sentry (crashes/eventos) · Expo Push (notificaciones)
```

## Frontend — Expo (React Native) + TypeScript

**Ya decidido, correcto para el caso de uso.** Un solo codebase para
iOS/Android (y web si hace falta), sin mantener 2 apps nativas
separadas — para un equipo chico/solo esto es lo que hace viable el
roadmap completo. React Navigation (stack + tabs) es standard, sin
lock-in raro.

Qué falta para escalar el frontend, en orden de impacto:

1. **`expo-updates` (OTA)** — no está instalado (`package.json`). Sin
   esto, cualquier fix de bug menor requiere pasar por review de
   Apple/Google (días). Con OTA, un fix de JS se empuja en minutos sin
   tocar el binario. Es la mejora de mayor impacto/costo de esta lista.
2. **New Architecture / Fabric** — Expo 54 + RN 0.81 ya la soportan.
   Confirmar que está habilitada (`newArchEnabled` en `app.json`) antes
   de escalar mapas/listas largas (directorio con cientos de talleres),
   donde el bridge viejo es el cuello de botella típico.
3. **Listas largas** (`react-native-maps` + directorio): si el
   directorio crece a miles de talleres por zona, pasar de
   `FlatList`/mapeo directo a `FlashList` cuando se note jank — no antes
   (hoy son ~13-21 talleres, no es el problema actual).
4. **Offline** (ya en `docs/qa-review.md`): cargar gasto sin señal se
   pierde en vez de encolarse. Es un problema de UX, no de arquitectura
   de infra — resolver con una cola local (AsyncStorage/MMKV +
   reintento) antes de escalar a más usuarios en zonas con mala
   cobertura (la mayoría de Argentina fuera de CABA).

## Backend — Supabase (Postgres + PostgREST + Edge Functions)

**Ya decidido, correcto.** La alternativa real (backend custom en
Node/NestJS + Postgres propio) significa mantener servidores, auth,
storage y RLS a mano — trabajo que Supabase ya resuelve, y que para el
tamaño de equipo actual (1 dev) sería puro overhead sin beneficio real.
El patrón usado — RLS como capa de autorización, RPC (`nearby_workshops`)
para lo que Postgres hace mejor que el cliente, triggers para invariantes
de negocio (`handle_expense_insert`, los agregados en la última QA) — es
el patrón correcto de Supabase, no una salida de emergencia.

Dónde meter Edge Functions (Deno) cuando toque, en vez de lógica en el
cliente:

- **Webhook de RevenueCat** (Etapa 3, pendiente): único lugar donde debe
  escribirse `subscriptions.status` — ya diseñado así en el schema.
- **Proxy de Google Vision OCR** (ver `docs/qa-review.md`): hoy la key
  viaja en el bundle del cliente (`EXPO_PUBLIC_GOOGLE_VISION_API_KEY`).
  Una Edge Function que reciba la imagen, llame a Vision con la key
  guardada como secret de Supabase, y le pegue rate-limit por
  `user_id`, saca la key del cliente y evita drenaje de cuota.
- **Cotizador (Etapa 4)**: notificar a los talleres cercanos cuando
  entra un `quote_request` — trabajo async, no bloquea al usuario.

## Base de datos — Postgres (Supabase) + PostGIS

**Ya decidido, correcto** — un dato geoespacial (talleres cerca del
usuario) en un motor sin soporte geo nativo sería reinventar PostGIS
peor. `sa-east-1` (São Paulo) es la región correcta para latencia desde
Argentina — no hay región de Supabase en AR, San Pablo es la más
cercana.

Qué mirar a medida que crece:

- **Índices**: ya están los correctos (`workshops_geog_idx` gist,
  índices en FKs para las subqueries de RLS). Revisar `get_advisors`
  (performance) cada vez que se agregue una tabla nueva — ya es hábito
  en este proyecto, seguir así.
- **Connection pooling**: Supabase ya da pooler (Supavisor) por
  default vía el puerto de conexión pooled — usarlo desde cualquier
  cliente que no sea PostgREST/Edge Functions si en algún momento se
  suma un worker/cron externo.
- **Lecturas del directorio**: si el tráfico de "talleres cerca mío"
  crece mucho más rápido que las escrituras (esperable — buscar es más
  frecuente que cargar un taller), un read replica de Supabase es la
  palanca, no antes de tener el problema medido.
- **Multi-jurisdicción (Etapa 5)**: la regla de VTV por terminación de
  patente varía por provincia — ya está anotado en el roadmap como
  riesgo. Diseñarla como tabla de reglas (`provincia -> regla`) en vez
  de lógica hardcodeada, el día que se construya (hoy no existe
  todavía, es carga manual de fecha).

## Autenticación — Supabase Auth (magic link)

**Ya decidido, correcto para el público objetivo** (no todo el mundo en
Argentina de 25-55 años quiere manejar una contraseña más, y magic link
elimina la superficie de ataque de passwords débiles/reusadas). RLS
como autorización (no solo autenticación) es el patrón fuerte que ya
está aplicado en cada tabla de usuario.

Dos ajustes puntuales, chicos:

- **Habilitar "Leaked Password Protection"** — advisory de Supabase
  marcado `WARN`, hoy deshabilitado. No aplica directo hoy (no hay login
  con password), pero si en algún momento se suma login social/password
  como alternativa al magic link, activarlo antes.
- **MFA**: no hace falta para el público de esta app hoy. Sí sería
  relevante si "Modo Taller" (Etapa 4) maneja plata (cotizaciones,
  fichas pagas) — evaluar en ese momento, no antes (YAGNI).

## APIs externas

| API | Uso | Nota |
|---|---|---|
| OpenStreetMap (Nominatim + Overpass) | Poblar directorio de talleres por zona | Ya resuelto el huevo-gallina (San Vicente cargado). Gratis, sin billing — la decisión correcta vs. Google Places (pedía tarjeta hasta en free tier). |
| Google Vision API | OCR de factura | Mover detrás de Edge Function (ver arriba) antes de escalar tráfico. |
| Google Maps SDK (Android) | Mapa del directorio | Key ya restringida a Maps SDK, falta restricción por package+SHA-1 cuando exista build de Android real (ya anotado en roadmap). |
| RevenueCat | IAP nativo (suscripción) | Pendiente de integrar (Etapa 3) — reemplaza Mercado Pago para compra digital in-app por regla de Apple/Google, ya documentado. |
| Sentry | Crashes + eventos custom | Ya wireado (`trackEvent`), DSN cargado. |
| Expo Push Notification Service | Recordatorios push | Capa sobre FCM/APNs — no hace falta integrar FCM/APNs directo mientras se use Expo managed workflow. |

## Infraestructura en la nube

**Supabase managed (Postgres + Storage + Auth + Edge Functions) en
`sa-east-1`, más EAS (Expo Application Services) para build/submit de
la app.** No hay servidor propio que mantener — correcto para el
tamaño de equipo. La alternativa (AWS/GCP a mano, RDS + S3 + Cognito +
Lambda) es más flexible pero es semanas de trabajo de infra que hoy no
se necesitan; reconsiderar solo si Supabase se queda corto en algo
concreto (no como upgrade especulativo).

CI/CD:

- GitHub Actions ya configurado (`typecheck` → `lint` → `test`) pero
  bloqueado a nivel de cuenta (ticket pendiente a support.github.com,
  ver roadmap #8) — **esto es lo primero a resolver de esta sección**:
  sin CI corriendo, ningún merge está protegido de verdad.
  EAS Build para generar binarios iOS/Android — ya con proyecto creado
  (`@fbalsamo/auto-app`).
- Agregar `expo-updates` + canal de EAS Update para OTA una vez
  resuelto el punto anterior (mismo pipeline, un paso más).

## Qué hacer, en orden de impacto real

1. Resolver el ticket de GitHub Actions (bloquea que CI proteja algo).
2. ~~`expo-updates` + EAS Update~~ — hecho: `expo-updates` instalado,
   `app.json` con `runtimeVersion.policy: "appVersion"` y `updates.url`
   apuntando al proyecto EAS, canales `development`/`preview`/`production`
   en `eas.json` (uno por build profile). Falta: generar un build real
   con `eas build` (ninguno existe todavía para Android, ver roadmap) y
   publicar el primer `eas update --branch <canal>` de prueba contra ese
   build — sin un binario instalado no hay forma de verificar que el OTA
   realmente actualiza.
3. Edge Function proxy para Google Vision (saca la key del cliente).
4. Cola offline para carga de gastos sin señal.
5. Recién ahí: read replica / connection pooling explícito — hoy el
   volumen no lo justifica (13-21 talleres, 2 vehículos, 3 gastos en
   staging).

Todo lo de seguridad de datos/RLS específico (no de infraestructura)
está en `docs/qa-review.md` — este documento es la vista de arquitectura,
ese es el detalle de bugs/gaps encontrados.
