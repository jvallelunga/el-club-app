# Reglas para agentes

El punto de entrada para entender el producto es el [mapa de features](features/README.md). Cargá una feature por vez, no el README entero.

## Modelo de datos y DER

Cada vez que cambia el modelo de datos, en el mismo commit se actualiza el DER. Cuenta como cambio de modelo tocar la migración, una tabla, una columna, una relación, un check o una vista.

1. Editá `docs/der-el-club.mmd`. Dentro de `erDiagram` no van comentarios `%%`.
2. Regenerá `docs/der-el-club.png` con Kroki. Kroki a veces responde con error al primer intento: reintentá y copiá el resultado solo si es un PNG válido.

```bash
for i in $(seq 1 15); do
  curl -s -m 40 -o /tmp/der.png -X POST https://kroki.io/mermaid/png \
    -H "Content-Type: text/plain" --data-binary @docs/der-el-club.mmd
  if head -c 8 /tmp/der.png | od -An -tx1 | grep -q "89 50 4e 47"; then
    cp /tmp/der.png docs/der-el-club.png && echo "PNG ok (intento $i)" && break
  fi
  sleep 2
done
```

3. Mirá el PNG antes de commitear.

Las migraciones son idempotentes. Se aplican primero en desarrollo y después en producción, cuando existan esos ambientes (hace falta el OK de Jerónimo para crearlos).

## Decisiones

- Cada decisión se anota en español en la feature que corresponde, dentro de `features/`, y en la sección Decisiones del [README](README.md), agrupada por feature.
- Se escribe lo que sí se hace. Lo que falta definir queda como `[completar]`.

## Cuenta de GitHub

Solo la cuenta personal `jvallelunga`. Commits con `git -c core.hooksPath=/dev/null`, sin Co-authored-by ni crédito a un agente. Merge normal, nunca squash.
