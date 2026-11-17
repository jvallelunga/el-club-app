import { describe, expect, it } from "vitest";
import { coordenadasDesdeLinkMaps, textoCoordenadas } from "./maps";

describe("coordenadasDesdeLinkMaps", () => {
  it("lee un link con @lat,lng", () => {
    expect(
      coordenadasDesdeLinkMaps(
        "https://www.google.com/maps/@-34.6123,-58.4456,16z",
      ),
    ).toEqual({ lat: -34.6123, lng: -58.4456 });
  });

  it("lee un pin de lugar !3d !4d", () => {
    expect(
      coordenadasDesdeLinkMaps(
        "https://www.google.com/maps/place/Club/data=!3d-34.6123!4d-58.4456",
      ),
    ).toEqual({ lat: -34.6123, lng: -58.4456 });
  });

  it("lee q= y query=", () => {
    expect(
      coordenadasDesdeLinkMaps(
        "https://www.google.com/maps?q=-34.5980,-58.4210",
      ),
    ).toEqual({ lat: -34.598, lng: -58.421 });
    expect(
      coordenadasDesdeLinkMaps(
        "https://www.google.com/maps/search/?api=1&query=-34.5980,-58.4210",
      ),
    ).toEqual({ lat: -34.598, lng: -58.421 });
  });

  it("lee un par suelto y rechaza valores inválidos o links cortos", () => {
    expect(coordenadasDesdeLinkMaps("-34.6123, -58.4456")).toEqual({
      lat: -34.6123,
      lng: -58.4456,
    });
    expect(coordenadasDesdeLinkMaps("91,0")).toBeNull();
    expect(coordenadasDesdeLinkMaps("")).toBeNull();
    expect(
      coordenadasDesdeLinkMaps("https://maps.app.goo.gl/abc123"),
    ).toBeNull();
  });
});

describe("textoCoordenadas", () => {
  it("formatea sin ceros de más", () => {
    expect(textoCoordenadas({ lat: -34.6123, lng: -58.4456 })).toBe(
      "-34.6123, -58.4456",
    );
  });
});
