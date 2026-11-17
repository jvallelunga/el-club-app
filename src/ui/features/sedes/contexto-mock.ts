import {
  PERSONA_LUCIA,
  PERSONA_MARTIN,
  PERSONA_SOFIA,
  RUTAS_MOCK,
  clubPorSlug,
} from "@/ui/features/mocks-roles/datos-ejemplo";

const PERSONAS = {
  [PERSONA_LUCIA.id]: PERSONA_LUCIA,
  [PERSONA_MARTIN.id]: PERSONA_MARTIN,
  [PERSONA_SOFIA.id]: PERSONA_SOFIA,
};

export function contextoMockClub(slug: string, como?: string) {
  const club = clubPorSlug(slug);
  if (!club) return null;
  const esSuperAdmin = como === "super-admin";
  const persona = como && !esSuperAdmin ? PERSONAS[como] : undefined;
  const esMultiClub = persona?.id === PERSONA_MARTIN.id;
  const q = como ? `?como=${como}` : "";
  return {
    club,
    esSuperAdmin,
    esMultiClub,
    rol: (esSuperAdmin ? "super-admin" : "admin") as "super-admin" | "admin",
    como,
    q,
    atrasInicio: {
      href: esSuperAdmin
        ? RUTAS_MOCK.superAdmin
        : `${RUTAS_MOCK.inicioClub(club.slug)}${q}`,
      etiqueta: esSuperAdmin ? "Volver a clubes" : "Volver al inicio",
    },
  };
}
