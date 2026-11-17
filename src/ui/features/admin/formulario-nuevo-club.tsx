"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/ui/nativos/input";
import { Label } from "@/ui/nativos/label";
import { BotonPrincipal } from "@/ui/compartidos/marco";
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
import {
  ESCUDO_ACCEPT,
  primerError,
  validarArchivoEscudo,
  validarDatosNuevoClub,
} from "@/dominio/nuevo-club";

export type ResultadoCrearClubCliente =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export type DatosInicialesClub = {
  nombre: string;
  slug: string;
  escudo: string | null;
  colorPrincipal: string;
  colorClaro: string;
  color2: string | null;
  color3: string | null;
  dominioBase: string | null;
};

export function FormularioNuevoClubReal({
  crear,
  inicial,
  modo = "crear",
  puedeEditarRutas = true,
  despuesDeGuardar = "/super-admin",
}: {
  crear: (formData: FormData) => Promise<ResultadoCrearClubCliente>;
  inicial?: DatosInicialesClub;
  modo?: "crear" | "editar";
  puedeEditarRutas?: boolean;
  despuesDeGuardar?: string;
}) {
  const esEdicion = modo === "editar";
  const dominioSoloLectura = esEdicion && !puedeEditarRutas;
  const router = useRouter();
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [slugManual, setSlugManual] = useState(inicial?.slug ?? "");
  const [editaSlug, setEditaSlug] = useState(esEdicion);
  const [escudoArchivo, setEscudoArchivo] = useState<File | null>(null);
  const [escudo, setEscudo] = useState<string | null>(inicial?.escudo ?? null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(
    esEdicion && inicial?.escudo ? "Escudo actual" : null,
  );
  const [errorEscudo, setErrorEscudo] = useState<string | null>(null);
  const [marca, setMarca] = useState<string>(
    inicial?.colorPrincipal ?? COLOR_MARCA_VACIO,
  );
  const [claro, setClaro] = useState<string>(
    inicial?.colorClaro ?? COLOR_CLARO_DEFAULT,
  );
  const [color2, setColor2] = useState(inicial?.color2 ?? "");
  const [color3, setColor3] = useState(inicial?.color3 ?? "");
  const [dominioBase, setDominioBase] = useState(inicial?.dominioBase ?? "");
  const [intento, setIntento] = useState(false);
  const [previewAbierta, setPreviewAbierta] = useState(true);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const slugSugerido = useMemo(() => slugDesdeNombre(nombre), [nombre]);
  const slug = esEdicion
    ? (inicial?.slug ?? slugManual)
    : editaSlug
      ? slugManual
      : slugSugerido;
  const paleta = useMemo(
    () => derivarPaleta(marca, claro, [color2, color3]),
    [marca, claro, color2, color3],
  );

  const errores = validarDatosNuevoClub({
    nombre,
    slug,
    slugManual: esEdicion || editaSlug,
    marca,
    claro,
    extras: [color2, color3],
    dominioBase,
  });
  if (errorEscudo) errores.escudo = errorEscudo;
  const hayErrores = Object.keys(errores).length > 0;
  const mostrarErrores = intento;

  function elegirEscudo(archivo: File | undefined) {
    if (!archivo) return;
    const error = validarArchivoEscudo(archivo.type, archivo.size);
    if (error) {
      setEscudoArchivo(null);
      setNombreArchivo(archivo.name);
      setErrorEscudo(error);
      return;
    }
    setErrorEscudo(null);
    setEscudoArchivo(archivo);
    setNombreArchivo(archivo.name);
    const lector = new FileReader();
    lector.onload = () => {
      if (typeof lector.result === "string") setEscudo(lector.result);
    };
    lector.readAsDataURL(archivo);
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setIntento(true);
    setErrorServidor(null);
    if (hayErrores || pending) return;

    const formData = new FormData();
    formData.set("nombre", nombre.trim());
    formData.set("slug", slug);
    formData.set("colorPrincipal", paleta.marca);
    formData.set("colorClaro", paleta.claro);
    const extra2 = normalizarHex(color2);
    const extra3 = normalizarHex(color3);
    if (extra2) formData.set("color2", extra2);
    if (extra3) formData.set("color3", extra3);
    if (dominioBase.trim()) {
      formData.set("dominioBase", dominioBase.trim().toLowerCase());
    }
    if (escudoArchivo) formData.set("escudo", escudoArchivo);

    startTransition(async () => {
      const resultado = await crear(formData);
      if (!resultado.ok) {
        setErrorServidor(resultado.error);
        return;
      }
      if (esEdicion) {
        router.push(despuesDeGuardar);
        router.refresh();
        return;
      }
      const params = new URLSearchParams({ slug: resultado.slug });
      router.push(`/super-admin/nuevo-club/creado?${params.toString()}`);
    });
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
            onChange={
              esEdicion
                ? undefined
                : (evento) => {
                    setEditaSlug(true);
                    setSlugManual(evento.target.value.toLowerCase());
                  }
            }
            placeholder="club-de-ejemplo"
            autoComplete="off"
            spellCheck={false}
            readOnly={esEdicion}
            aria-readonly={esEdicion || undefined}
            aria-invalid={mostrarErrores && Boolean(errores.slug)}
            className={
              esEdicion
                ? "h-12 rounded-xl bg-muted px-3 font-mono text-base"
                : "h-12 rounded-xl px-3 font-mono text-base"
            }
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {esEdicion ? (
              <>
                Es el identificador del club y no se puede cambiar. Aparece en
                las URLs, por ejemplo{" "}
                <span className="font-medium text-foreground">
                  /c/{slug || "identificador"}/admin
                </span>
                .
              </>
            ) : (
              <>
                Se sugiere a partir del nombre. Lo podés editar: aparece en las
                URLs, por ejemplo{" "}
                <span className="font-medium text-foreground">
                  /c/{slug || "identificador"}/admin
                </span>
                .
              </>
            )}
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
              {esEdicion ? "Reemplazar imagen" : "Subir imagen"}
            </span>
            <span className="min-w-0 truncate text-muted-foreground">
              {nombreArchivo ?? "Ningún archivo elegido"}
            </span>
            <input
              id="escudo-club"
              name="escudo"
              type="file"
              accept={ESCUDO_ACCEPT}
              onChange={(evento) => elegirEscudo(evento.target.files?.[0])}
              className="sr-only"
            />
          </label>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {esEdicion ? (
              <>
                Si no subís otra imagen, se mantiene el escudo actual. Si subís
                una nueva (PNG, JPG, WebP o GIF, hasta 2 MB), reemplaza a la
                anterior. Si no hay escudo, se muestran las iniciales del
                nombre.
              </>
            ) : (
              <>
                Un archivo a color, PNG si podés (también JPG, WebP o GIF,
                hasta 2 MB). Si no hay escudo, se muestran las iniciales del
                nombre.
              </>
            )}
          </p>
          {mostrarErrores && errores.escudo ? (
            <p className="text-sm text-destructive" role="alert">
              {errores.escudo}
            </p>
          ) : null}
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
              Hasta 3 colores. El 1 es obligatorio; 2 y 3, si quedan vacíos, se
              derivan del principal (marcados con * en la vista previa). El
              hover, el pressed, el fondo oscuro y el texto se calculan solos,
              con contraste AA.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="dominio-club" className="text-sm">
            Dominio del sitio web{" "}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="dominio-club"
            name="dominioBase"
            value={dominioBase}
            onChange={
              dominioSoloLectura
                ? undefined
                : (evento) => setDominioBase(evento.target.value)
            }
            placeholder="clubejemplo.com.ar"
            autoComplete="off"
            spellCheck={false}
            readOnly={dominioSoloLectura}
            aria-readonly={dominioSoloLectura || undefined}
            aria-invalid={mostrarErrores && Boolean(errores.dominioBase)}
            className={
              dominioSoloLectura
                ? "h-12 rounded-xl bg-muted px-3 font-mono text-base"
                : "h-12 rounded-xl px-3 font-mono text-base"
            }
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {dominioSoloLectura ? (
              <>
                Es el dominio del sitio web del club. Solo el Super Admin puede
                cambiarlo.{" "}
                {dominioBase.trim() ? (
                  <>
                    La app usa{" "}
                    <span className="font-medium text-foreground">
                      admin.{dominioBase.trim()}
                    </span>{" "}
                    y{" "}
                    <span className="font-medium text-foreground">
                      vivo.{dominioBase.trim()}
                    </span>
                    .
                  </>
                ) : (
                  <>
                    Todavía no tiene dominio propio: se entra por{" "}
                    <span className="font-medium text-foreground">
                      /c/{slug || "identificador"}/admin
                    </span>
                    .
                  </>
                )}
              </>
            ) : (
              <>
                Es el dominio del sitio web del club, sin https ni www. La app usa
                subdominios:{" "}
                <span className="font-medium text-foreground">
                  admin.{dominioBase.trim() || "dominio"}
                </span>{" "}
                y{" "}
                <span className="font-medium text-foreground">
                  vivo.{dominioBase.trim() || "dominio"}
                </span>
                . Si todavía no tiene, se entra por{" "}
                <span className="font-medium text-foreground">
                  /c/{slug || "identificador"}/admin
                </span>
                .
              </>
            )}
          </p>
          {mostrarErrores && errores.dominioBase ? (
            <p className="text-sm text-destructive" role="alert">
              {errores.dominioBase}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:sticky md:top-6">
        <button
          type="button"
          onClick={() => setPreviewAbierta((abierta) => !abierta)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm font-medium md:hidden"
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

      <div className="flex flex-col gap-3 md:col-span-2">
        {mostrarErrores && hayErrores && primerError(errores) ? (
          <p className="text-sm text-destructive md:hidden" role="alert">
            Revisá los campos marcados.
          </p>
        ) : null}
        {errorServidor ? (
          <p className="text-sm text-destructive" role="alert">
            {errorServidor}
          </p>
        ) : null}
        <BotonPrincipal type="submit" disabled={pending}>
          {esEdicion
            ? pending
              ? "Guardando…"
              : "Guardar cambios"
            : pending
              ? "Creando…"
              : "Crear club"}
        </BotonPrincipal>
      </div>
    </form>
  );
}
