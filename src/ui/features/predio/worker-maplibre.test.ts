import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("worker de MapLibre en public/", () => {
  it("es el de la versión instalada de maplibre-gl", () => {
    // Si falla tras actualizar maplibre-gl: copiar
    // node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs a public/maplibre/.
    const raiz = process.cwd();
    const publicado = readFileSync(path.join(raiz, "public/maplibre/maplibre-gl-worker.mjs"));
    const instalado = readFileSync(
      path.join(raiz, "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs"),
    );
    expect(publicado.equals(instalado)).toBe(true);
  });
});
