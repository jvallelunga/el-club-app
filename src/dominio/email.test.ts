import { describe, expect, it } from "vitest";
import { emailValido, normalizarEmail } from "./email";

describe("normalizarEmail", () => {
  it("recorta y pasa a minúsculas", () => {
    expect(normalizarEmail("  Ana@Ejemplo.com  ")).toBe("ana@ejemplo.com");
  });
});

describe("emailValido", () => {
  it("acepta un email simple", () => {
    expect(emailValido("lucia.fernandez@ejemplo.com")).toBe(true);
  });

  it("rechaza valores vacíos o sin dominio", () => {
    expect(emailValido("")).toBe(false);
    expect(emailValido("hola")).toBe(false);
    expect(emailValido("hola@club")).toBe(false);
  });
});
