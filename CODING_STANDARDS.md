# Estándares de código

Reglas de criterio para el review (`/matt-code-review`). Lo que una herramienta puede chequear (capas, tipos, formato) va al lint, al typecheck o a un test, no acá.

Cada regla dice qué se espera y cómo se ve en un diff.

## Un tipo que cruza capas se define una sola vez, en `src/dominio`

Si un tipo lo usan `datos` y `ui` (o más de un archivo de `ui`), se exporta desde el módulo de `src/dominio` del concepto y se importa en todos lados. `ui` puede importar de `dominio` pero no de `datos`, así que `dominio` es el lugar que todas las capas comparten.

- **Bien:** `OrigenInicial` y `DatosPredio` en `src/dominio/predio.ts`, importados por la consulta, el comando y el editor.
- **Mal:** el mismo `{ coordenadas: Coordenadas; desde: DesdeOrigen }` escrito inline en la consulta, en el editor y en la sección del predio.

## El resultado de un comando usa el tipo compartido

Un comando (`src/datos/comandos/*`) devuelve `{ ok: true } | { ok: false; error: string }`, o la variante con `id`. Ese tipo se escribe una vez y se reutiliza; un comando nuevo o un componente que recibe un comando como prop no declara su propia copia.

- **Dónde:** `ResultadoSimple` y `ResultadoConId` viven en `src/dominio/resultado.ts`, y `datos` y `ui` los importan de ahí.
- **En el review:** se marca cada copia nueva, también la escrita inline en un prop.
