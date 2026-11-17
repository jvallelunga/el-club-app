"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/ui/nativos/input";
import { Label } from "@/ui/nativos/label";
import { BotonPrincipal } from "./marco-mock";
import { RUTAS_MOCK } from "./datos-ejemplo";
import { slugDesdeNombre } from "@/dominio/slug";
import { validarDominioBase } from "@/dominio/host";

const CLAVE_ESCUDO = "mock-nuevo-club-escudo";

const PRIMARIO_VACIO = "#1c1917";
const SECUNDARIO_VACIO = "#a8a29e";

export type ErroresNuevoClub = {
  nombre?: string;
  slug?: string;
  dominioBase?: string;
};

function validar(valores: {
  nombre: string;
  slug: string;
  slugManual: boolean;
  dominioBase: string;
}): ErroresNuevoClub {
  const errores: ErroresNuevoClub = {};
  if (!valores.nombre.trim()) {
    errores.nombre = "Escribí el nombre del club.";
  }
  const slug = valores.slugManual
    ? valores.slug.trim()
    : slugDesdeNombre(valores.nombre);
  if (!slug) {
    errores.slug = "El identificador se arma con el nombre, o lo podés escribir vos.";
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errores.slug =
      "Usá solo letras minúsculas, números y guiones, sin guión al inicio o al final.";
  }
  const errorDominio = validarDominioBase(valores.dominioBase);
  if (errorDominio) errores.dominioBase = errorDominio;
  return errores;
}

export function FormularioNuevoClub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mostrarErroresIniciales = searchParams.get("errores") === "1";

  const [nombre, setNombre] = useState("");
  const [slugManual, setSlugManual] = useState("");
  const [editaSlug, setEditaSlug] = useState(false);
  const [escudo, setEscudo] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [primario, setPrimario] = useState(PRIMARIO_VACIO);
  const [secundario, setSecundario] = useState(SECUNDARIO_VACIO);
  const [dominioBase, setDominioBase] = useState("");
  const [intento, setIntento] = useState(mostrarErroresIniciales);

  const slugSugerido = useMemo(() => slugDesdeNombre(nombre), [nombre]);
  const slug = editaSlug ? slugManual : slugSugerido;

  const errores = validar({
    nombre,
    slug,
    slugManual: editaSlug,
    dominioBase,
  });
  const hayErrores = Object.keys(errores).length > 0;
  const mostrarErrores = intento;

  function elegirEscudo(archivo: File | undefined) {
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) return;
    setNombreArchivo(archivo.name);
    const lector = new FileReader();
    lector.onload = () => {
      if (typeof lector.result === "string") setEscudo(lector.result);
    };
    lector.readAsDataURL(archivo);
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    setIntento(true);
    if (hayErrores) return;

    try {
      if (escudo) sessionStorage.setItem(CLAVE_ESCUDO, escudo);
      else sessionStorage.removeItem(CLAVE_ESCUDO);
    } catch {
      // sessionStorage puede no estar disponible; el creado igual muestra iniciales.
    }

    const params = new URLSearchParams({
      nombre: nombre.trim(),
      slug,
      primario,
      secundario,
    });
    if (dominioBase.trim()) params.set("dominio", dominioBase.trim().toLowerCase());
    router.push(`${RUTAS_MOCK.nuevoClubCreado}?${params.toString()}`);
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-8" noValidate>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nombre-club" className="text-sm">
              Nombre
            </Label>
            <Input
              id="nombre-club"
              name="nombre"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder="Nombre del club"
              autoComplete="off"
              aria-invalid={mostrarErrores && Boolean(errores.nombre)}
              className="h-12 rounded-xl px-3 text-base"
            />
            {mostrarErrores && errores.nombre ? (
              <p className="text-sm text-destructive" role="alert">
                {errores.nombre}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="slug-club" className="text-sm">
              Identificador
            </Label>
            <Input
              id="slug-club"
              name="slug"
              value={slug}
              onChange={(evento) => {
                setEditaSlug(true);
                setSlugManual(evento.target.value.toLowerCase());
              }}
              placeholder="club-de-ejemplo"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={mostrarErrores && Boolean(errores.slug)}
              className="h-12 rounded-xl px-3 font-mono text-base"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Se sugiere a partir del nombre. Lo podés editar: aparece en las
              URLs, por ejemplo{" "}
              <span className="font-medium text-foreground">
                /c/{slug || "identificador"}/admin
              </span>
              .
            </p>
            {mostrarErrores && errores.slug ? (
              <p className="text-sm text-destructive" role="alert">
                {errores.slug}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="escudo-club" className="text-sm">
              Escudo
            </Label>
            <label
              htmlFor="escudo-club"
              className="flex h-12 cursor-pointer items-center gap-3 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <span className="rounded-lg bg-muted px-3 py-1.5 font-medium">
                Subir imagen
              </span>
              <span className="min-w-0 truncate text-muted-foreground">
                {nombreArchivo ?? "Ningún archivo elegido"}
              </span>
              <input
                id="escudo-club"
                name="escudo"
                type="file"
                accept="image/*"
                onChange={(evento) => elegirEscudo(evento.target.files?.[0])}
                className="sr-only"
              />
            </label>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Subí una imagen cuadrada, si la tenés. Si no, se muestran las
              iniciales del nombre.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Paleta</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="color-primario" className="text-sm">
                  Color primario
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    id="color-primario"
                    type="color"
                    value={primario}
                    onChange={(evento) => setPrimario(evento.target.value)}
                    className="size-11 cursor-pointer rounded-lg border border-border bg-background p-1"
                  />
                  <Input
                    value={primario}
                    onChange={(evento) => setPrimario(evento.target.value)}
                    spellCheck={false}
                    className="h-11 rounded-xl font-mono text-sm"
                    aria-label="Color primario en hexadecimal"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="color-secundario" className="text-sm">
                  Color secundario
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    id="color-secundario"
                    type="color"
                    value={secundario}
                    onChange={(evento) => setSecundario(evento.target.value)}
                    className="size-11 cursor-pointer rounded-lg border border-border bg-background p-1"
                  />
                  <Input
                    value={secundario}
                    onChange={(evento) => setSecundario(evento.target.value)}
                    spellCheck={false}
                    className="h-11 rounded-xl font-mono text-sm"
                    aria-label="Color secundario en hexadecimal"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dominio-base" className="text-sm">
              Dominio del sitio web{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="dominio-base"
              name="dominio"
              value={dominioBase}
              onChange={(evento) => setDominioBase(evento.target.value)}
              placeholder="clubejemplo.com.ar"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={mostrarErrores && Boolean(errores.dominioBase)}
              className="h-12 rounded-xl px-3 text-base"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              El dominio raíz es el sitio web del club, no la app. La app se
              sirve en subdominios:{" "}
              <span className="font-medium text-foreground">
                admin.{dominioBase.trim() || "dominio"}
              </span>{" "}
              (administrador) y{" "}
              <span className="font-medium text-foreground">
                vivo.{dominioBase.trim() || "dominio"}
              </span>{" "}
              (partidos en vivo). Si todavía no hay dominio, se entra por{" "}
              <span className="font-medium text-foreground">
                /c/{slug || "identificador"}/admin
              </span>
              .
            </p>
            {mostrarErrores && errores.dominioBase ? (
              <p className="text-sm text-destructive" role="alert">
                {errores.dominioBase}
              </p>
            ) : null}
          </div>
        </div>

        <VistaPreviaClub
          nombre={nombre}
          slug={slug}
          escudo={escudo}
          primario={primario}
          secundario={secundario}
          dominioBase={dominioBase}
        />
      </div>

      <BotonPrincipal type="submit">Crear club</BotonPrincipal>
    </form>
  );
}

export function VistaPreviaClub({
  nombre,
  slug,
  escudo,
  primario,
  secundario,
  dominioBase,
}: {
  nombre: string;
  slug: string;
  escudo: string | null;
  primario: string;
  secundario: string;
  dominioBase: string;
}) {
  const hayNombre = Boolean(nombre.trim());
  const visible = hayNombre ? nombre.trim() : "Nombre del club";
  const iniciales = hayNombre
    ? visible
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0] ?? "")
        .join("")
        .toUpperCase()
    : "?";

  return (
    <aside className="lg:sticky lg:top-24">
      <p className="mb-2 text-sm font-medium">Vista previa</p>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="h-2" style={{ background: primario }} />
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex size-14 shrink-0 items-center justify-center overflow-hidden bg-white ring-1 ring-foreground/10"
              style={{
                borderRadius: escudo ? "0.75rem" : "9999px",
              }}
            >
              {escudo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={escudo} alt="" className="size-full object-contain p-0.5" />
              ) : (
                <span className="text-sm font-medium" style={{ color: primario }}>
                  {iniciales || "?"}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{visible}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {slug || "identificador"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <span
              className="h-8 flex-1 rounded-lg"
              style={{ background: primario }}
              title="Primario"
            />
            <span
              className="h-8 flex-1 rounded-lg"
              style={{ background: secundario }}
              title="Secundario"
            />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {dominioBase.trim()
              ? `App: admin.${dominioBase.trim()} y vivo.${dominioBase.trim()}`
              : `Sin dominio: /c/${slug || "identificador"}/admin`}
          </p>
        </div>
        <div className="h-2" style={{ background: secundario }} />
      </div>
    </aside>
  );
}

export { CLAVE_ESCUDO };
