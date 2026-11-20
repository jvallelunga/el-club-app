/** PROTOTIPO (#85): perfiles del mock, legibles desde el servidor. Se tira con los mocks. */

export type Perfil = "super-club" | "super-panel" | "multi" | "uno";

export const PERFILES: { clave: Perfil; nombre: string }[] = [
  { clave: "super-club", nombre: "Super Admin en un club" },
  { clave: "super-panel", nombre: "Super Admin en su panel" },
  { clave: "multi", nombre: "Admin de 3 clubes" },
  { clave: "uno", nombre: "Admin de un club" },
];
