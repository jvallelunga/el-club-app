/**
 * PROTOTIPO (#54): mocks de «Deportes del club».
 * Aprobada (19/11/2026): D = A con la columna «Condición» del catálogo de C.
 * Variantes ?variant=D|A|B|C, cada una con tres pantallas
 * (?pantalla=catalogo|club|jugadores). Datos de ejemplo, nada se guarda.
 * Se tira cuando se aprueben los mocks.
 */

import { notFound } from "next/navigation";
import { ShellAdmin } from "@/ui/compartidos/shell-admin";
import { SelectorPrototipo } from "@/ui/features/deportes-prototipo/comunes";
import { VarianteA, VarianteD } from "@/ui/features/deportes-prototipo/variante-a";
import { VarianteB } from "@/ui/features/deportes-prototipo/variante-b";
import { VarianteC } from "@/ui/features/deportes-prototipo/variante-c";

const VARIANTES = [
  { clave: "D", nombre: "Aprobada: A con columna Condición", C: VarianteD },
  { clave: "A", nombre: "Lista y panel lateral", C: VarianteA },
  { clave: "B", nombre: "Mosaico y página completa", C: VarianteB },
  { clave: "C", nombre: "Tabla y asistente", C: VarianteC },
];

const PANTALLAS = [
  { clave: "catalogo", nombre: "Catálogo (Super Admin)" },
  { clave: "club", nombre: "Deportes del club (Admin)" },
  { clave: "jugadores", nombre: "Jugadores en conflicto (Admin)" },
];

const CLUB = { slug: "los-cardos", nombre: "Los Cardos Rugby Club", iniciales: "LC" };

export default async function MockDeportes({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string; pantalla?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { variant, pantalla: p } = await searchParams;
  const v = VARIANTES.find((x) => x.clave === variant) ?? VARIANTES[0];
  const pantalla = PANTALLAS.find((x) => x.clave === p)?.clave ?? "catalogo";
  const Variante = v.C;
  const esCatalogo = pantalla === "catalogo";

  return (
    <ShellAdmin
      titulo={esCatalogo ? "Deportes" : pantalla === "club" ? "Deportes" : "Rugby masculino"}
      subtitulo={esCatalogo ? "Super Admin · catálogo" : pantalla === "club" ? "Deportes del club" : "Jugadores del deporte"}
      club={esCatalogo ? undefined : CLUB}
      rol={esCatalogo ? "super-admin" : "admin"}
      salirEnMobile={false}
      pie={<SelectorPrototipo variantes={VARIANTES.map(({ clave, nombre }) => ({ clave, nombre }))} pantallas={PANTALLAS} />}
    >
      <Variante pantalla={pantalla} />
    </ShellAdmin>
  );
}
