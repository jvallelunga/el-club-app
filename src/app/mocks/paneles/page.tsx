/**
 * PROTOTIPO (#85): mocks del selector de panel en la cabecera del menú.
 * Tres variantes (?variant=A|B|C) y cuatro perfiles
 * (?pantalla=super-club|super-panel|multi|uno). Datos de ejemplo, nada se
 * guarda. Se tira cuando se aprueben los mocks.
 */

import { notFound } from "next/navigation";
import { SelectorPrototipo } from "@/ui/features/paneles-prototipo/comunes";
import { PERFILES, type Perfil } from "@/ui/features/paneles-prototipo/datos";
import { VarianteA } from "@/ui/features/paneles-prototipo/variante-a";
import { VarianteB } from "@/ui/features/paneles-prototipo/variante-b";
import { VarianteC } from "@/ui/features/paneles-prototipo/variante-c";

const VARIANTES = [
  { clave: "A", nombre: "Desplegable", C: VarianteA },
  { clave: "B", nombre: "Columna de escudos", C: VarianteB },
  { clave: "C", nombre: "El menú se da vuelta", C: VarianteC },
];

export default async function MockPaneles({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string; pantalla?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { variant, pantalla } = await searchParams;
  const v = VARIANTES.find((x) => x.clave === variant) ?? VARIANTES[0];
  const perfil: Perfil = PERFILES.find((x) => x.clave === pantalla)?.clave ?? "super-club";
  const Variante = v.C;

  return (
    <>
      <Variante key={perfil} perfil={perfil} />
      <SelectorPrototipo variantes={VARIANTES.map(({ clave, nombre }) => ({ clave, nombre }))} pantallas={PERFILES} />
    </>
  );
}
