import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  CLUB_NORTE,
  PERSONA_ANA,
  PERSONA_LUCIA,
  PERSONA_MARTIN,
  CLUB_CREADO_EJEMPLO,
  RUTAS_MOCK,
} from "@/ui/features/mocks-roles/datos-ejemplo";
import {
  ContenidoMock,
  MarcoPagina,
  PieMock,
} from "@/ui/features/mocks-roles/marco-mock";

const RECORRIDOS = [
  {
    titulo: "Ingreso con Google",
    detalle: "Pantalla de entrada y recorridos de ejemplo.",
    href: RUTAS_MOCK.ingreso,
  },
  {
    titulo: "Crear un club",
    detalle: "Formulario corto (6 campos) con vista previa en vivo de la app.",
    href: RUTAS_MOCK.nuevoClub,
  },
  {
    titulo: "Super Admin",
    detalle: "Lista de clubes, crear un club (formulario completo) y nombrar Admins.",
    href: RUTAS_MOCK.superAdmin,
  },
  {
    titulo: "Admin de un club",
    detalle: `${PERSONA_LUCIA.nombre} entra directo a ${CLUB_NORTE.nombre}.`,
    href: `${RUTAS_MOCK.inicioClub(CLUB_NORTE.slug)}?como=${PERSONA_LUCIA.id}`,
  },
  {
    titulo: "Admin de dos clubes",
    detalle: `${PERSONA_MARTIN.nombre} elige a cuál entrar.`,
    href: RUTAS_MOCK.elegirClub,
  },
  {
    titulo: "Sin acceso",
    detalle: `${PERSONA_ANA.nombre} entra con Google y no tiene rol.`,
    href: RUTAS_MOCK.sinAcceso,
  },
];

const PANTALLAS = [
  { nombre: "Ingreso", href: RUTAS_MOCK.ingreso },
  { nombre: "Sin acceso", href: RUTAS_MOCK.sinAcceso },
  { nombre: "Elegir club", href: RUTAS_MOCK.elegirClub },
  { nombre: "Clubes (Super Admin)", href: RUTAS_MOCK.superAdmin },
  { nombre: "Crear club", href: RUTAS_MOCK.nuevoClub },
  { nombre: "Crear club (con datos)", href: RUTAS_MOCK.nuevoClubDatos },
  { nombre: "Crear club (con errores)", href: RUTAS_MOCK.nuevoClubErrores },
  {
    nombre: "Club creado",
    href: `${RUTAS_MOCK.nuevoClubCreado}?nombre=${encodeURIComponent(CLUB_CREADO_EJEMPLO.nombre)}&slug=${CLUB_CREADO_EJEMPLO.slug}&marca=${encodeURIComponent(CLUB_CREADO_EJEMPLO.marca)}&claro=${encodeURIComponent(CLUB_CREADO_EJEMPLO.claro)}&dominio=${CLUB_CREADO_EJEMPLO.dominioBase}`,
  },
  {
    nombre: "Admins del club de ejemplo",
    href: RUTAS_MOCK.admins(CLUB_NORTE.slug),
  },
  {
    nombre: "Confirmar quitar Admin",
    href: `${RUTAS_MOCK.admins(CLUB_NORTE.slug)}?confirmar=lucia-fernandez`,
  },
  {
    nombre: "Inicio del admin (club de ejemplo)",
    href: `${RUTAS_MOCK.inicioClub(CLUB_NORTE.slug)}?como=${PERSONA_LUCIA.id}`,
  },
];

export default function IndiceMocksRoles() {
  return (
    <MarcoPagina>
      <ContenidoMock className="gap-8">
        <header className="flex flex-col gap-2 md:max-w-2xl">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Mocks de aprobación
          </p>
          <h1 className="text-2xl font-medium tracking-tight">
            Roles y permisos
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Estos mocks son para mirar y aprobar las pantallas. No hay login
            real ni migración: los nombres y emails son de ejemplo. El email
            del Super Admin no aparece acá.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start">
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">Recorridos</h2>
            <ul className="overflow-hidden rounded-xl border border-border bg-card">
              {RECORRIDOS.map((item) => (
                <li key={item.href} className="border-b border-border last:border-b-0">
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.titulo}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {item.detalle}
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">Todas las pantallas</h2>
            <ul className="overflow-hidden rounded-xl border border-border bg-card">
              {PANTALLAS.map((item) => (
                <li key={item.href} className="border-b border-border last:border-b-0">
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-muted/60"
                  >
                    <span className="min-w-0 flex-1">{item.nombre}</span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </ContenidoMock>
      <PieMock />
    </MarcoPagina>
  );
}
