# Dominio propio del club

Noveno ítem del paso 1. El modelo de resolución ya quedó definido; la
configuración concreta de un dominio de club (DNS, certificados) se hace
cuando un club lo tenga.

## Objetivo

Cada club puede tener un dominio propio. El dominio raíz es el **sitio web**
del club, no la app. La app vive en subdominios por superficie (admin, vivo, y
otras más adelante). El link viejo de copa-raices redirige para no romper los
que ya circularon (por ejemplo por Instagram).

## Alcance

- Guardar en `club.dominio_base` el dominio base del club, nullable y único
  (por ejemplo `clubejemplo.com.ar`), sin esquema, sin `www` y en minúsculas.
- Resolver el host `<superficie>.<dominio_base>` a `(club, superficie)`. Las
  superficies conocidas viven en código: `admin` (administrador) y `vivo`
  (partidos en vivo / tablero). Se pueden sumar después sin cambiar el
  modelo.
- El dominio raíz (`clubejemplo.com.ar`) y `www.` no se interpretan como app:
  son el sitio web del club.
- Si un club todavía no tiene dominio propio, el fallback es
  `/c/<slug>/admin` y `/c/<slug>/vivo`.
- `copa-raices.vercel.app` redirige al destino nuevo, sin romper los links
  que ya se compartieron. `[completar: cuándo se configura esa redirección]`.
- El nombre del host no cambia las funcionalidades; es parte de la
  [personalización por club](personalizacion-por-club.md).

## Criterios de aceptación

- El modelo y la resolución por host y por slug están documentados y
  cubiertos por tests.
- No se sirve la app en el dominio raíz del club.
- Un club sin `dominio_base` se administra en `/c/<slug>/admin`.
- La configuración DNS de un club concreto se hace cuando Jerónimo lo pida.

## Por qué `club.dominio_base` y no una tabla `club_dominio`

Se eligió una columna nullable y única en `club`, no una tabla
`club_dominio(host, club_id, superficie)`. Un club tiene un solo dominio
base; las superficies no se configuran una por una, se derivan en código
(`admin.<dominio_base>`, `vivo.<dominio_base>`). Así no quedan filas
inconsistentes (un admin en un host y el vivo en otro sin querer). Si más
adelante hace falta un alias o un host suelto, se puede sumar una tabla
entonces.

## Decisiones

- Tiene que haber un dominio nuevo, de la app del club, no del torneo (15/11/2026).
- El link viejo de copa-raices redirige (15/11/2026).
- El dominio raíz del club es el sitio web del club, no la app. La app usa
  subdominios por superficie: `admin.<dominio_base>` (administrador) y
  `vivo.<dominio_base>` (partidos en vivo / tablero), extensible en código.
  En la base se guarda `club.dominio_base` (nullable, único), no cada host.
  Sin dominio propio, el fallback es `/c/<slug>/<superficie>`
  (16/11/2026 17:43).
