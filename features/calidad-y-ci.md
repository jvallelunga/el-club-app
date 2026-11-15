# CI con pgTAP

Deuda traída de copa-raices [#82](https://github.com/jvallelunga/copa-raices/issues/82) («Calidad y CI»). Todavía no implementado el paso de pgTAP en GitHub Actions.

El cuerpo original del issue no se pudo releer desde un dump local; este resumen sale del plan de desarrollo y de `features/arquitectura.md` de copa-raices, que fueron la fuente de ese issue.

## Objetivo

Correr en CI, en cada push a `main` (y a `desarrollo`, cuando se defina), la calidad del código y los tests de la base, incluido pgTAP.

## Alcance

- Lint (ESLint de Next y reglas de capas), `tsc --noEmit`, Prettier y Vitest para `src/dominio`, como ya estaba pensado en copa-raices.
- pgTAP (`supabase test db`) para las vistas y para las funciones SQL de escritura: camino feliz, una falla a mitad que no deja filas a medias, y la prueba de que `anon` y `authenticated` no pueden ejecutarlas.
- Un E2E mínimo con Playwright sobre la base local con seed, cuando la app lo permita.
- GitHub Actions: un job con lint, typecheck, Vitest y `next build`; otro con `supabase start`, pgTAP y Playwright.

## Criterios de aceptación

- CI corre en cada push a `main` y se ve en el commit.
- El job de pgTAP corre y queda en verde con las pruebas de la base.
- Solo se promueve a producción un deploy con CI en verde, cuando existan ambientes separados.

## Decisiones

- En copa-raices el workflow de pgTAP nunca se llegó a agregar; Vitest y el build sí. Esta deuda se trae a El Club y se hace cuando la base del proyecto esté en el repo.
