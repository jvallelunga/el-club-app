import { describe, expect, it } from "vitest";
import { emailValido, normalizarEmail } from "./email";

describe("normalizarEmail", () => {
  it("recorta y pasa a minúsculas", () => {
    expect(normalizarEmail("  Ana@Ejemplo.com  ")).toBe("ana@ejemplo.com");
  });

  it("conserva el alias de Gmail (+) y lo deja en minúsculas", () => {
    expect(normalizarEmail("  Lucia.Fernandez+Admin@Ejemplo.com  ")).toBe(
      "lucia.fernandez+admin@ejemplo.com",
    );
    expect(
      normalizarEmail("lucia.fernandez+admin@ejemplo.com"),
    ).not.toBe(normalizarEmail("lucia.fernandez@ejemplo.com"));
  });
});

describe("emailValido", () => {
  it("acepta un email simple", () => {
    expect(emailValido("lucia.fernandez@ejemplo.com")).toBe(true);
  });

  it("acepta un email con alias +", () => {
    expect(emailValido("lucia.fernandez+admin@ejemplo.com")).toBe(true);
  });

  it("rechaza valores vacíos o sin dominio", () => {
    expect(emailValido("")).toBe(false);
    expect(emailValido("hola")).toBe(false);
    expect(emailValido("hola@club")).toBe(false);
  });
});
