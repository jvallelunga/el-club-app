import { notFound } from "next/navigation";
import { FormularioNuevoClubReal } from "@/ui/features/admin/formulario-nuevo-club";
import {
  CLUB_CREADO_EJEMPLO,
  PERSONA_LUCIA,
  PERSONA_MARTIN,
  PERSONA_SOFIA,
  RUTAS_MOCK,
  clubPorSlug,
} from "@/ui/features/mocks-roles/datos-ejemplo";
import { ShellAdmin } from "@/ui/features/mocks-roles/shell-admin";

const PERSONAS = {
  [PERSONA_LUCIA.id]: PERSONA_LUCIA,
  [PERSONA_MARTIN.id]: PERSONA_MARTIN,
  [PERSONA_SOFIA.id]: PERSONA_SOFIA,
};

export default async function PaginaDatosDelClubMock({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ como?: string }>;
}) {
  const { slug } = await params;
  const { como } = await searchParams;
  const club = clubPorSlug(slug);
  if (!club) notFound();

  const esSuperAdmin = como === "super-admin";
  const persona = como && !esSuperAdmin ? PERSONAS[como] : undefined;
  const esMultiClub = persona?.id === PERSONA_MARTIN.id;
  const slugClub = club.slug;
  const destino = `${RUTAS_MOCK.club(slugClub)}${como ? `?como=${como}` : ""}`;

  async function guardar(formData: FormData) {
    "use server";
    void formData;
    return { ok: true as const, slug: slugClub };
  }

  return (
    <ShellAdmin
      titulo="Datos del club"
      subtitulo={club.nombre}
      atras={{
        href: esSuperAdmin
          ? RUTAS_MOCK.superAdmin
          : `${RUTAS_MOCK.inicioClub(club.slug)}${como ? `?como=${como}` : ""}`,
        etiqueta: esSuperAdmin ? "Volver a clubes" : "Volver al inicio",
      }}
      club={club}
      rol={esSuperAdmin ? "super-admin" : "admin"}
      activo="club"
      como={como}
      esMultiClub={esMultiClub}
      salirEnMobile={false}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {esSuperAdmin ? (
            <>
              Podés cambiar el nombre, el escudo, la paleta (el principal es
              obligatorio; 2 y 3 son opcionales) y el dominio del sitio web. El
              identificador no se modifica. Si no cargás un escudo nuevo, se
              mantiene el actual.
            </>
          ) : (
            <>
              Podés cambiar el nombre, el escudo y la paleta (el principal es
              obligatorio; 2 y 3 son opcionales) de tu club. El identificador y
              el dominio no se modifican acá: solo el Super Admin puede
              cambiarlos. Si no cargás un escudo nuevo, se mantiene el actual.
            </>
          )}
        </p>
        <FormularioNuevoClubReal
          modo="editar"
          crear={guardar}
          puedeEditarRutas={esSuperAdmin}
          despuesDeGuardar={destino}
          inicial={{
            nombre: club.nombre,
            slug: club.slug,
            escudo: club.escudo,
            colorPrincipal: CLUB_CREADO_EJEMPLO.marca,
            colorClaro: CLUB_CREADO_EJEMPLO.claro,
            color2: CLUB_CREADO_EJEMPLO.color2,
            color3: CLUB_CREADO_EJEMPLO.color3,
            dominioBase: CLUB_CREADO_EJEMPLO.dominioBase,
          }}
        />
      </div>
    </ShellAdmin>
  );
}
