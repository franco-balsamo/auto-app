<!-- BORRADOR — falta: (1) revisión de un abogado, (2) publicar en una URL
     estable fuera del repo (ej. GitHub Pages, Notion, landing propia) y
     (3) completar los datos de contacto/razón social antes de enviar a
     las stores. -->

# Política de Privacidad — auto-app

**Última actualización:** [completar fecha de publicación]

## 1. Quiénes somos

auto-app ("la app", "nosotros") es una aplicación para el registro de
mantenimiento de vehículos y búsqueda de talleres en Argentina.
Responsable del tratamiento de datos: [completar razón social / nombre y
CUIT/DNI del titular]. Contacto: [completar email de contacto].

## 2. Qué datos recolectamos

- **Cuenta**: tu email, usado para el login por magic link (sin
  contraseña).
- **Datos de tus vehículos**: marca, modelo, año, patente, kilometraje.
- **Gastos y service**: montos, fechas, categoría, kilometraje al momento
  de la carga.
- **Documentación**: fotos que subís de cédula, seguro, VTV, licencia u
  otros documentos, y sus fechas de vencimiento.
- **Ubicación**: tu posición GPS aproximada, solo mientras usás la
  pantalla de directorio de talleres, para calcular cercanía. No se
  almacena un historial de ubicaciones.
- **Reseñas**: comentarios y calificaciones que publiques sobre talleres.

No recolectamos datos de pago (la app no procesa cobros en esta etapa).

## 3. Para qué usamos tus datos

- Darte acceso a tu cuenta y a tus propios datos (nunca a los de otro
  usuario — ver sección 5).
- Calcular vencimientos y recordatorios de mantenimiento.
- Mostrarte talleres cercanos a tu ubicación.
- Comunicarte cambios importantes del servicio.

No vendemos tus datos a terceros ni los usamos para publicidad.

## 4. Dónde se almacenan

Tus datos se almacenan en Supabase (Postgres + Storage), con
infraestructura provista por Supabase Inc. Las fotos de documentación se
guardan en un bucket privado, accesible únicamente por vos.

## 5. Seguridad

Cada usuario solo puede leer y modificar sus propios vehículos, gastos,
documentos y recordatorios — esto se aplica a nivel de base de datos
(Row Level Security), no solo en la app. El directorio de talleres y las
reseñas son de lectura pública.

## 6. Tus derechos

Podés pedirnos en cualquier momento:

- Acceder a los datos que tenemos sobre vos.
- Corregir datos incorrectos.
- Eliminar tu cuenta y todos tus datos asociados.

Escribinos a [completar email de contacto] para ejercer estos derechos,
conforme a la Ley 25.326 de Protección de Datos Personales de Argentina.

## 7. Retención de datos

Conservamos tus datos mientras tu cuenta esté activa. Si eliminás tu
cuenta, tus vehículos, gastos, documentos y recordatorios se borran de
forma permanente.

## 8. Menores de edad

La app no está dirigida a menores de 13 años.

## 9. Cambios a esta política

Si cambiamos esta política de forma sustancial, te avisaremos dentro de
la app antes de que el cambio entre en vigencia.
