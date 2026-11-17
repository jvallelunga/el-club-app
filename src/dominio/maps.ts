/** Coordenadas geográficas en grados decimales. */
export type Coordenadas = {
  lat: number;
  lng: number;
};

function alNumero(valor: string): number | null {
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

function validar(lat: number, lng: number): Coordenadas | null {
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

/**
 * Lee latitud y longitud de un link de Google Maps (o un par suelto
 * "lat,lng"). No resuelve links cortos (maps.app.goo.gl) porque eso
 * pediría una red y no se usa ninguna API.
 */
export function coordenadasDesdeLinkMaps(valor: string): Coordenadas | null {
  const texto = valor.trim();
  if (!texto) return null;

  const desdeArroba = texto.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (desdeArroba) {
    const lat = alNumero(desdeArroba[1]);
    const lng = alNumero(desdeArroba[2]);
    if (lat !== null && lng !== null) return validar(lat, lng);
  }

  const desdePlace = texto.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (desdePlace) {
    const lat = alNumero(desdePlace[1]);
    const lng = alNumero(desdePlace[2]);
    if (lat !== null && lng !== null) return validar(lat, lng);
  }

  const desdeQuery = texto.match(
    /(?:[?&#](?:q|query|ll|destination|center)=)(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i,
  );
  if (desdeQuery) {
    const lat = alNumero(desdeQuery[1]);
    const lng = alNumero(desdeQuery[2]);
    if (lat !== null && lng !== null) return validar(lat, lng);
  }

  const suelto = texto.match(/^(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/);
  if (suelto) {
    const lat = alNumero(suelto[1]);
    const lng = alNumero(suelto[2]);
    if (lat !== null && lng !== null) return validar(lat, lng);
  }

  return null;
}

export function textoCoordenadas(coords: Coordenadas): string {
  const fmt = (n: number) => n.toFixed(5).replace(/0+$/, "").replace(/\.$/, "");
  return `${fmt(coords.lat)}, ${fmt(coords.lng)}`;
}
