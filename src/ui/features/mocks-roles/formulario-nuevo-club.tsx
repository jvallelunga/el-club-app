"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/ui/nativos/input";
import { Label } from "@/ui/nativos/label";
import { BotonPrincipal } from "./marco-mock";
import { CLUB_CREADO_EJEMPLO, RUTAS_MOCK } from "./datos-ejemplo";
import { CampoColor } from "@/ui/features/club/campo-color";
import { VistaPreviaClub } from "@/ui/features/club/vista-previa-club";
import { slugDesdeNombre } from "@/dominio/slug";
import {
  COLOR_CLARO_DEFAULT,
  COLOR_MARCA_VACIO,
  derivarPaleta,
  esHexValido,
  normalizarHex,
} from "@/dominio/paleta";
import { validarDatosNuevoClub } from "@/dominio/nuevo-club";

const CLAVE_ESCUDO = "mock-nuevo-club-escudo";

export function FormularioNuevoClub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conDatos = searchParams.get("datos") === "1";
  const mostrarErroresIniciales = searchParams.get("errores") === "1";

  const [nombre, setNombre] = useState(conDatos ? CLUB_CREADO_EJEMPLO.nombre : "");
  const [slugManual, setSlugManual] = useState(
    conDatos ? CLUB_CREADO_EJEMPLO.slug : "",
  );
  const [editaSlug, setEditaSlug] = useState(conDatos);
  const [escudo, setEscudo] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [marca, setMarca] = useState<string>(
    conDatos ? CLUB_CREADO_EJEMPLO.marca : COLOR_MARCA_VACIO,
  );
  const [claro, setClaro] = useState<string>(
    conDatos ? CLUB_CREADO_EJEMPLO.claro : COLOR_CLARO_DEFAULT,
  );
  const [color2, setColor2] = useState(
    conDatos ? CLUB_CREADO_EJEMPLO.color2 : "",
  );
  const [color3, setColor3] = useState(
    conDatos ? CLUB_CREADO_EJEMPLO.color3 : "",
  );
  const [dominioBase, setDominioBase] = useState(
    conDatos
      ? CLUB_CREADO_EJEMPLO.dominioBase
      : mostrarErroresIniciales
        ? "www.ejemplo.com"
        : "",
  );
  const [intento, setIntento] = useState(mostrarErroresIniciales);
  const [previewAbierta, setPreviewAbierta] = useState(true);

  const slugSugerido = useMemo(() => slugDesdeNombre(nombre), [nombre]);
  const slug = editaSlug ? slugManual : slugSugerido;
  const paleta = useMemo(
    () => derivarPaleta(marca, claro, [color2, color3]),
    [marca, claro, color2, color3],
  );

  const errores = validarDatosNuevoClub({
    nombre,
    slug,
    slugManual: editaSlug,
    marca,
    claro,
    extras: [color2, color3],
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
      marca: paleta.marca,
      claro: paleta.claro,
    });
    const extra2 = normalizarHex(color2);
    const extra3 = normalizarHex(color3);
    if (extra2) params.set("color2", extra2);
    if (extra3) params.set("color3", extra3);
    if (dominioBase.trim()) params.set("dominio", dominioBase.trim().toLowerCase());
    router.push(`${RUTAS_MOCK.nuevoClubCreado}?${params.toString()}`);
  }

  return (
    <form
      onSubmit={enviar}
      className="flex flex-col gap-8 md:grid md:grid-cols-[minmax(0,1fr)_20rem] md:items-start md:gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"
      noValidate
    >
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
            Un archivo a color, PNG si podés. Si no hay escudo, se muestran las
            iniciales del nombre.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium">Paleta</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CampoColor
              id="color-1"
              etiqueta="Color 1 · principal"
              valor={marca}
              invalido={mostrarErrores && Boolean(errores.marca)}
              onChange={setMarca}
              ayuda="Obligatorio. Botones, header y acentos principales."
            />
            <CampoColor
              id="color-claro"
              etiqueta="Color claro"
              valor={claro}
              invalido={mostrarErrores && Boolean(errores.claro)}
              onChange={setClaro}
              ayuda="Fondo claro, aparte de la paleta. Si no lo cambiás, queda #ffffff."
            />
            <CampoColor
              id="color-2"
              etiqueta="Color 2"
              opcional
              valor={color2}
              sugerido={paleta.colores[1]}
              invalido={
                mostrarErrores &&
                Boolean(errores.extras) &&
                color2.trim() !== "" &&
                !esHexValido(color2)
              }
              onChange={setColor2}
              ayuda="Opcional. Insignias, líneas y destacados. Si lo dejás vacío, se deriva del principal."
            />
            <CampoColor
              id="color-3"
              etiqueta="Color 3"
              opcional
              valor={color3}
              sugerido={paleta.colores[2]}
              invalido={
                mostrarErrores &&
                Boolean(errores.extras) &&
                color3.trim() !== "" &&
                !esHexValido(color3)
              }
              onChange={setColor3}
              ayuda="Opcional. Indicador en vivo. Si lo dejás vacío, se deriva del principal."
            />
          </div>
          {mostrarErrores && (errores.marca || errores.claro || errores.extras) ? (
            <p className="text-sm text-destructive" role="alert">
              {errores.marca ?? errores.claro ?? errores.extras}
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Hasta 3 colores: el 1 es obligatorio; 2 y 3 son opcionales
              para detalles. Si los dejás vacíos, se derivan del principal.
              El hover, el pressed y el fondo oscuro también se calculan
              solos. El texto se elige para cumplir contraste AA. Los estados
              (ok, alerta, error) son del sistema y no cambian.
            </p>
          )}
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

      <div className="md:sticky md:top-24">
        <button
          type="button"
          className="mb-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium md:hidden"
          onClick={() => setPreviewAbierta((abierta) => !abierta)}
          aria-expanded={previewAbierta}
        >
          {previewAbierta ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
          {previewAbierta ? "Ocultar vista previa" : "Ver vista previa"}
        </button>
        <div className={previewAbierta ? "block" : "hidden md:block"}>
          <VistaPreviaClub
            nombre={nombre}
            slug={slug}
            escudo={escudo}
            paleta={paleta}
            dominioBase={dominioBase}
          />
        </div>
      </div>

      <div className="md:col-span-2">
        <BotonPrincipal type="submit">Crear club</BotonPrincipal>
      </div>
    </form>
  );
}


export { CLAVE_ESCUDO, VistaPreviaClub };
