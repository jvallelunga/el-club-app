# Los tipos de instalación viven en código

Los tipos de instalación dejan de ser filas editables por club (`tipo_instalacion`, con tipos propios) y pasan a estar definidos en código, porque cada tipo necesita un modelo 3D y una lista de medidas configurables que solo pueden existir en código. Un club ya no crea tipos: lo que no encaja usa «Otra», un bloque genérico, y la instalación lo explica con su nombre.

## Consequences

- La migración pasa las instalaciones con tipo propio a «Otra» y pone el nombre del tipo viejo al principio de sus notas («Tipo: Cantina»). Los tipos propios se borran.
- Agregar un tipo es un cambio de código (modelo 3D, medidas y migración), no una acción del Super Admin ni del Admin.

Decidido el 18/11/2026 con Jerónimo, en #26.
