/** El resultado de un comando: lo devuelven los comandos de `datos` y lo reciben los componentes de `ui`. */

export type ResultadoSimple = { ok: true } | { ok: false; error: string };

export type ResultadoConId = { ok: true; id: string } | { ok: false; error: string };
