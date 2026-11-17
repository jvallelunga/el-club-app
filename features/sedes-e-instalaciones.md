# Sedes e instalaciones (y datos de contacto del club)

Implementado el 17/11/2026 14:54, a partir de los mocks y el modelo que Jerónimo aprobó.

## Objetivo

Que un club pueda cargar sus datos de contacto (teléfono, email, dirección, web y redes sociales) y sus sedes, con las instalaciones de cada una. Lo editan el Admin del club y el Super Admin.

## App real

| Pantalla | Ruta |
| --- | --- |
| Datos del club (estética + contacto y redes) | `/c/<slug>/admin/club` (`#contacto`) |
| Lista de sedes | `/c/<slug>/admin/sedes` |
| Nueva sede | `/c/<slug>/admin/sedes/nueva` |
| Detalle / edición de una sede (mapa e instalaciones) | `/c/<slug>/admin/sedes/<sedeId>` |
| Agregar instalación | `/c/<slug>/admin/sedes/<sedeId>/instalaciones/nueva` |
| Editar instalación | `/c/<slug>/admin/sedes/<sedeId>/instalaciones/<instalacionId>` |

El menú del admin del club suma el ítem «Sedes» (junto a Club y Admins). El cajón ☰ se usa por debajo de `lg`. Las pantallas llevan el tema del club. El Super Admin entra por las mismas rutas.

La vista previa del mapa parsea las coordenadas del `maps_url` y muestra un pin estático, sin API ni claves. Un link corto (maps.app.goo.gl) no se resuelve sin red.

Al agregar o editar una instalación se puede elegir un tipo de base o «Otra» para crear un tipo propio del club (queda disponible después). Eliminar una instalación pide confirmación.

## Mocks (aprobados)

Siguen en `/mocks/roles`, con datos de ejemplo genéricos (Club de ejemplo del Norte). Ningún club real —tampoco Los Cardos— aparece fijo.

| Pantalla | Ruta |
| --- | --- |
| Datos del club (estética + contacto y redes) | `/mocks/roles/clubes/[slug]/club` |
| Contacto vacío | `/mocks/roles/clubes/[slug]/club?vacio=1#contacto` |
| Lista de sedes | `/mocks/roles/clubes/[slug]/sedes` |
| Lista de sedes vacía | `/mocks/roles/clubes/[slug]/sedes?vacio=1` |
| Nueva sede | `/mocks/roles/clubes/[slug]/sedes/nueva` |
| Detalle / edición de una sede (mapa e instalaciones) | `/mocks/roles/clubes/[slug]/sedes/[sedeId]` |
| Agregar instalación | `/mocks/roles/clubes/[slug]/sedes/[sedeId]/instalaciones/nueva` |

## Decisiones

- El 17/11/2026 14:39–14:43 Jerónimo pidió los datos de contacto del club y las sedes con instalaciones. Todos los campos de contacto son opcionales y los editan el Admin del club y el Super Admin: teléfono, email, dirección, web y una lista dinámica de redes sociales. En las redes se elige la red (Instagram, Facebook, X, YouTube, TikTok, WhatsApp, LinkedIn u otra, con URL o usuario), y se pueden agregar, quitar y reordenar (17/11/2026 14:39–14:43).
- Un club tiene muchas sedes. Cada sede tiene nombre, dirección y ubicación por un link de Google Maps. La vista previa del mapa lee las coordenadas del link y muestra un pin; el mapa es un placeholder estático, sin API ni claves. Un link corto (maps.app.goo.gl) no se puede resolver sin red (17/11/2026 14:39–14:43).
- Cada sede tiene instalaciones. Cada una tiene un tipo, un nombre (por ejemplo «Cancha 1») y notas opcionales. Hay una lista de tipos de base (cancha de rugby, cancha de hockey, cancha de tenis, cancha de fútbol, house, pileta, gym, vestuario, quincho, salón y otra) y el club puede agregar tipos propios (17/11/2026 14:39–14:43).
- El 17/11/2026 14:39–14:43 se publicaron los mocks y el DER propuesto, sin migración ni implementación real, a la espera de aprobación (17/11/2026 14:39–14:43).
- El 17/11/2026 14:54 Jerónimo aprobó los mocks y el modelo. Se implementó en la app real: columnas de contacto en `club` (`telefono`, `email`, `direccion`, `web`, nullable), `club_red_social` (`red` con check que incluye `otra`, `etiqueta`, `valor`, `orden`), `sede` (`club_id`, `nombre`, `direccion`, `maps_url`), `tipo_instalacion` (`club_id` nullable = tipos de base, sembrados) e `instalacion` (`sede_id`, `tipo_instalacion_id`, `nombre`, `notas`). La migración es idempotente y se aplicó solo en desarrollo. El [DER oficial](../docs/der-el-club.mmd) se actualizó en el mismo commit. El Admin solo opera sobre su club; el Super Admin, sobre todos. Un Admin puede crear tipos propios solo de su club; los tipos de base son de solo lectura para todos salvo el Super Admin (17/11/2026 14:54).

## Modelo aplicado

Quedó en el [DER oficial](../docs/der-el-club.mmd). Resumen:

- `club.telefono`, `club.email`, `club.direccion` y `club.web`: todos nullable.
- `club_red_social.red`: `instagram`, `facebook`, `x`, `youtube`, `tiktok`, `whatsapp`, `linkedin` u `otra`. `etiqueta` se usa cuando la red es `otra`. `valor` es la URL, el usuario o el número. `orden` define la lista.
- `sede.maps_url`: el link de Google Maps. Las coordenadas se parsean al mostrar. No se guarda una clave de API.
- `tipo_instalacion.club_id` es **nullable**: `null` son los tipos de base (compartidos por todos los clubes); un `club_id` indica un tipo propio de ese club.
- `instalacion` pertenece a una sede y apunta a un tipo. `nombre` distingue, por ejemplo, «Cancha 1». `notas` es opcional.
- Permisos: el Admin solo opera sobre su club; el Super Admin, sobre cualquiera. Un Admin del club A no edita el club B. Los tipos de base no los modifica un Admin.

## Criterios de aceptación

- Un Admin o un Super Admin puede cargar y editar el contacto y las redes de su club, todos opcionales, con redes de la lista o «Otra», y reordenarlas.
- Un club puede tener varias sedes, cada una con nombre, dirección, link de Maps y vista previa del pin cuando hay coordenadas.
- Cada sede lista sus instalaciones; se puede agregar, editar o eliminar (con confirmación) una, eligiendo un tipo de base o uno propio (creado en el momento si se elige «Otra»), con nombre y notas opcionales.
- La migración es idempotente, se aplica solo en desarrollo, y el DER oficial se actualiza en el mismo commit.
- No hay clubes reales hardcodeados ni claves de Google Maps en el repo.
