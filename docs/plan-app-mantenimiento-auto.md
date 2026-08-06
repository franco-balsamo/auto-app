# [Nombre a definir] — App de Mantenimiento de Auto
### Documento de producto v1

---

## 1. Visión

Una app para dueños de auto en Argentina que centraliza tres cosas que hoy están dispersas: **cuánto gasto en mi auto**, **dónde tengo mi documentación al día** y **dónde llevo mi auto cerca de mí**. El diferencial no es competir con Mi Argentina (documentación oficial) ni con Google Maps (búsqueda de lugares), sino ser el punto de encuentro entre el dueño del auto y el ecosistema de talleres/servicios locales, con historial propio.

**Problema que resuelve:**
- La gente no lleva registro de service/gastos (o lo hace en un cuaderno o Excel que abandona)
- No sabe cuándo vence VTV/seguro/patente hasta que lo multan o lo paran
- No tiene forma rápida de encontrar un lubricentro/gomería/mecánico de confianza cerca, con precios y reseñas reales de otros usuarios de autos (no reseñas genéricas de Maps)

**Público objetivo:** dueños de auto particular en Argentina, 25-55 años, que valoran no perder plata por descuidos (multas, vencimientos, sobreprecios) y prefieren resolver todo desde el celular.

---

## 2. Funcionalidades

### 2.1 Núcleo (lado usuario)

| Módulo | Detalle |
|---|---|
| **Multi-vehículo** | Cada auto con ficha propia: marca, modelo, año, patente, km actual |
| **Registro de gastos/service** | Categorías: service, nafta, seguro, patente, lavado, gomas, otros. Foto de factura opcional |
| **Recordatorios inteligentes** | Por km o por fecha: próximo service, vencimiento VTV (según terminación de patente), seguro, patente. Push notification |
| **Documentación** | Fotos/PDF de cédula, seguro, VTV, licencia. Alertas de vencimiento. Botón "importar desde Mi Argentina" (deep link, no reinventamos lo oficial) |
| **Historial completo del vehículo** | Línea de tiempo tipo "bitácora": todo lo que se le hizo al auto, ordenado. Exportable a PDF — útil al vender el auto |
| **Directorio geolocalizado** | Buscador por GPS de lubricentros, mecánicos, gomerías, lavaderos, casas de escape. Filtro por rubro, distancia, rating, horario de apertura |
| **Reseñas propias** | Reseñas de usuarios reales de la app (no scrapeadas de Maps), con foto del trabajo hecho |

### 2.2 Diferenciales (fase 2+)

- **Cotizador rápido:** el usuario pide un presupuesto (ej. "cambio de embrague") y 3-4 talleres cercanos responden con precio estimado — genera actividad real en la app en vez de solo consulta pasiva
- **Modo Taller (B2B):** dashboard gratuito para que el taller cargue el service directamente al historial del cliente escaneando un QR — esto genera lock-in fuerte, porque el historial del auto queda completo sin que el usuario tipee nada
- **Reporte de reventa:** tipo "Carfax argento" — un PDF con todo el historial de mantenimiento para mostrarle al comprador cuando vendés el auto. Fuerte gancho de marketing ("vendé más rápido y mejor tu auto")
- **Presets por marca/modelo:** intervalos de mantenimiento sugeridos según el auto (correa de distribución, líquido de frenos, etc.) en vez de que el usuario tenga que saberlo
- **Compartir con un mecánico de confianza:** el usuario le da acceso de solo lectura al historial a su mecánico habitual
- **Alertas por normativa provincial:** VTV varía por provincia y por terminación de patente — la app puede automatizar esto mejor que un cuaderno
- **Gamificación liviana:** racha de "auto al día" (documentación + service sin vencimientos) — motiva a mantener el hábito de cargar datos

### 2.3 Lo que NO conviene construir
- No reemplazar Mi Argentina (documentación oficial) — integrar, no competir
- No arrancar con diagnóstico OBD-II (hardware) — es otro producto, otra inversión, y ya hay jugadores como FIXD/Carly

---

## 3. Diseño / UX — ideas

- **Identidad:** algo cálido y confiable, no "corporate frío" — pensar en un tono de "el cuaderno del auto, pero digital". Colores sugeridos: azul petróleo + naranja/ámbar (asociación con herramientas/taller) o algo tipo "garage moderno"
- **Home:** lo primero que ve el usuario al abrir la app es el estado del auto: km actual, próximo vencimiento (el más urgente arriba), y accesos directos a "cargar gasto" y "buscar taller cerca"
- **Ficha del auto:** como una "tarjeta" visual (estilo carnet) con foto del auto, patente, y semáforo de estado (verde = todo al día, amarillo = por vencer, rojo = vencido)
- **Directorio:** mapa + lista combinados (como hace cualquier buscador de lugares), pero con badges tipo "recomendado por la comunidad" en vez de solo estrellas
- **Onboarding corto:** cargar 1 auto en menos de 1 minuto (patente + marca/modelo alcanza, el resto se completa después)
- **Carga de gastos ultra rápida:** foto de la factura + OCR que autocompleta monto y fecha (reduce fricción, que es la razón #1 por la que la gente abandona este tipo de apps)

---

## 4. Modelo de ingresos

| Fuente | Descripción |
|---|---|
| **Freemium usuario** | Gratis: 1 vehículo, historial básico. Pago (suscripción baja, ej. $ mensual): multi-vehículo, export PDF, backup en la nube, reporte de reventa |
| **Talleres — ficha destacada** | Los talleres pagan por aparecer arriba en el directorio o en un rubro específico ("gomería destacada cerca tuyo") |
| **Talleres — Modo Taller** | Versión gratuita básica (fideliza), versión paga con gestión de turnos y métricas de clientes |
| **Leads de cotización** | Cobrar por lead calificado a los talleres que reciben pedidos de presupuesto (modelo tipo marketplace) |
| **Lo que se descarta** | Vender datos de documentación/gastos a terceros — mata la confianza, no vale la pena |

**Nota realista:** al principio (fase 1-2) el ingreso real va a ser bajo o nulo — el objetivo temprano es adopción y data del directorio. La monetización fuerte llega cuando hay suficiente base de usuarios activos como para que a los talleres les convenga pagar por aparecer.

---

## 5. Etapas de desarrollo

### Etapa 0 — Validación (1-2 semanas)
- Definir nombre, identidad visual básica, y wireframes de las 4-5 pantallas core
- Armar un landing simple para captar interés / lista de espera
- Validar con 5-10 personas reales (no solo la idea, el flujo de pantallas)

### Etapa 1 — MVP (6-10 semanas)
- App con: alta de vehículo, carga de gastos, recordatorios básicos, documentación (fotos + vencimientos)
- Directorio geolocalizado alimentado con Google Places API (sin depender de que los talleres se registren)
- Auth + backend (Supabase: DB, storage de fotos, auth)
- Lanzamiento cerrado/beta con un grupo chico de usuarios reales

### Etapa 2 — Directorio propio + reseñas (4-6 semanas)
- Talleres pueden "reclamar" su ficha (perfil gratuito)
- Reseñas propias de usuarios de la app
- Export de historial a PDF

### Etapa 3 — Monetización usuario (3-4 semanas)
- Suscripción freemium (multi-vehículo, backup, reporte de reventa)
- Pasarela de pago (Mercado Pago, dado el mercado)

### Etapa 4 — Lado talleres (6-8 semanas)
- Modo Taller: dashboard básico, carga de service vía QR al historial del cliente
- Fichas destacadas pagas
- Cotizador rápido (pedir presupuesto a varios talleres)

### Etapa 5 — Escala
- Expansión a otras provincias/países si el modelo funciona (VTV varía por jurisdicción, hay que abstraerlo bien desde el modelo de datos)
- Métricas, ASO, campañas de adquisición

---

## 6. Riesgos a tener en cuenta

- **Huevo-gallina del directorio:** se resuelve arrancando con Google Places API en vez de esperar que los talleres se sumen solos
- **Retención:** una app de "cargar datos" tiene fricción — el OCR de facturas y el Modo Taller (que carga datos por el usuario) son las palancas más fuertes contra el abandono
- **Confianza con documentación sensible:** cifrado, política de privacidad clara, nunca vender datos
