# Servidor MCP

Deuda traída de copa-raices [#77](https://github.com/jvallelunga/copa-raices/issues/77) (épica) y [#78](https://github.com/jvallelunga/copa-raices/issues/78). Todavía no implementado.

El cuerpo original de esos issues no se pudo releer desde un dump local; este resumen sale del README y de `features/arquitectura.md` de copa-raices, que fueron la fuente de esos issues.

## Objetivo

Exponer el backend de la app como herramientas MCP (Model Context Protocol), en Node.js, para que un administrador la gestione hablando con un agente, sin navegar la web.

## Alcance

- El servidor traduce las instrucciones en llamadas a los mismos comandos del admin (`src/datos/comandos` + `src/dominio`), no a una API paralela.
- Escrituras solo con JWT de Clerk de admin. Lecturas acotadas por RLS de Supabase.
- Herramientas previstas, al menos: crear y editar torneos, dar de alta equipos, cargar resultados (tries, conversiones, penales, tarjetas, cambios), gestionar canchas y sedes, y consultar el cronograma.
- Hosting y autenticación del cliente MCP: `[completar]`. Opciones ya contempladas: un route handler `/api/mcp` en la misma app, o un proceso aparte que llame a endpoints HTTP.

## Criterios de aceptación

- Usa los mismos comandos que las server actions del admin.
- Una escritura sin JWT de admin se rechaza.
- Hosting y autenticación del cliente quedan decididos antes de publicarlo.

## Decisiones

- En copa-raices quedó como P2, para después del torneo del 14/11. Sigue siendo deuda, no entra al paso 1.
