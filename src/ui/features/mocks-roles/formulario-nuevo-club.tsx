"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/ui/nativos/input";
import { Label } from "@/ui/nativos/label";
import { BotonPrincipal } from "./marco-mock";
import { CLUB_CREADO_EJEMPLO, RUTAS_MOCK } from "./datos-ejemplo";
import { slugDesdeNombre, inicialesDesdeNombre } from "@/dominio/slug";
import { validarDominioBase } from "@/dominio/host";
import {
  COLOR_CLARO_DEFAULT,
  COLOR_MARCA_VACIO,
  ESTADOS_SISTEMA,
  acentoVisible,
  derivarPaleta,
  esHexValido,
  normalizarHex,
  textoConContrasteAA,
  type PaletaDerivada,
} from "./paleta";

const CLAVE_ESCUDO = "mock-nuevo-club-escudo";

export type ErroresNuevoClub = {
  nombre?: string;
  slug?: string;
  marca?: string;
  claro?: string;
  extras?: string;
  dominioBase?: string;
};

function validar(valores: {
  nombre: string;
  slug: string;
  slugManual: boolean;
  marca: string;
  claro: string;
  extras: string[];
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
    errores.slug =
      "El identificador se arma con el nombre, o lo podés escribir vos.";
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errores.slug =
      "Usá solo letras minúsculas, números y guiones, sin guión al inicio o al final.";
  }
  if (!esHexValido(valores.marca)) {
    errores.marca = "Usá un color hexadecimal, por ejemplo #1f4b3a.";
  }
  if (!esHexValido(valores.claro)) {
    errores.claro = "Usá un color hexadecimal, por ejemplo #ffffff.";
  }
  const extraInvalido = valores.extras.some(
    (extra) => extra.trim() !== "" && !esHexValido(extra),
  );
  if (extraInvalido) {
    errores.extras = "Los colores opcionales van en hexadecimal, por ejemplo #c47a2c. Si no los cargás, se derivan del principal.";
  }
  const errorDominio = validarDominioBase(valores.dominioBase);
  if (errorDominio) errores.dominioBase = errorDominio;
  return errores;
}

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
  const [extras, setExtras] = useState<string[]>(
    conDatos
      ? [
          CLUB_CREADO_EJEMPLO.color2,
          CLUB_CREADO_EJEMPLO.color3,
          CLUB_CREADO_EJEMPLO.color4,
        ]
      : [],
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
  const paleta = useMemo(() => derivarPaleta(marca, claro, extras), [marca, claro, extras]);

  const errores = validar({
    nombre,
    slug,
    slugManual: editaSlug,
    marca,
    claro,
    extras,
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
    const nombresExtra = ["color2", "color3", "color4"] as const;
    extras.forEach((extra, indice) => {
      const normalizado = normalizarHex(extra);
      if (normalizado) params.set(nombresExtra[indice], normalizado);
    });
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
          <CampoColor
            id="color-1"
            etiqueta="Color 1 · principal"
            valor={marca}
            invalido={mostrarErrores && Boolean(errores.marca)}
            onChange={setMarca}
            ayuda="Obligatorio. Botones, header y acentos principales."
          />
          {extras.map((extra, indice) => {
            const numero = indice + 2;
            const usos =
              numero === 2
                ? "Insignias y líneas."
                : numero === 3
                  ? "Indicador en vivo."
                  : "Destacados.";
            return (
              <CampoColor
                key={`color-${numero}`}
                id={`color-${numero}`}
                etiqueta={`Color ${numero}`}
                opcional
                valor={extra}
                sugerido={paleta.colores[indice + 1]}
                invalido={mostrarErrores && Boolean(errores.extras) && extra.trim() !== "" && !esHexValido(extra)}
                onChange={(valor) =>
                  setExtras((actuales) =>
                    actuales.map((item, i) => (i === indice ? valor : item)),
                  )
                }
                onQuitar={() =>
                  setExtras((actuales) => actuales.filter((_, i) => i !== indice))
                }
                ayuda={`${usos} Si lo dejás vacío, se deriva del color principal.`}
              />
            );
          })}
          {extras.length < 3 ? (
            <button
              type="button"
              onClick={() => setExtras((actuales) => [...actuales, ""])}
              className="h-11 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:bg-muted/60"
            >
              Agregar color
            </button>
          ) : null}
          <CampoColor
            id="color-claro"
            etiqueta="Color claro"
            valor={claro}
            invalido={mostrarErrores && Boolean(errores.claro)}
            onChange={setClaro}
            ayuda="Fondo claro, aparte de la paleta. Si no lo cambiás, queda #ffffff."
          />
          {mostrarErrores && (errores.marca || errores.claro || errores.extras) ? (
            <p className="text-sm text-destructive" role="alert">
              {errores.marca ?? errores.claro ?? errores.extras}
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Hasta 4 colores: el 1 es obligatorio; 2, 3 y 4 son opcionales
              para detalles. El hover, el pressed, el fondo oscuro y, si
              faltan, los colores 2 a 4 se derivan del principal. El texto se
              elige para cumplir contraste AA. Los estados (ok, alerta, error)
              son del sistema y no cambian.
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

function CampoColor({
  id,
  etiqueta,
  valor,
  invalido,
  onChange,
  ayuda,
  opcional,
  sugerido,
  onQuitar,
}: {
  id: string;
  etiqueta: string;
  valor: string;
  invalido?: boolean;
  onChange: (valor: string) => void;
  ayuda: string;
  opcional?: boolean;
  sugerido?: string;
  onQuitar?: () => void;
}) {
  const paraPicker =
    normalizarHex(valor) ?? normalizarHex(sugerido ?? "") ?? COLOR_CLARO_DEFAULT;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="text-sm">
          {etiqueta}{" "}
          {opcional ? (
            <span className="font-normal text-muted-foreground">(opcional)</span>
          ) : null}
        </Label>
        {onQuitar ? (
          <button
            type="button"
            onClick={onQuitar}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Quitar
          </button>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="color"
          value={paraPicker}
          onChange={(evento) => onChange(evento.target.value)}
          className="size-11 shrink-0 cursor-pointer rounded-lg border border-border bg-background p-1"
        />
        <Input
          value={valor}
          onChange={(evento) => onChange(evento.target.value)}
          placeholder={sugerido ?? "#ffffff"}
          spellCheck={false}
          aria-invalid={invalido}
          className="h-11 rounded-xl font-mono text-sm"
          aria-label={`${etiqueta} en hexadecimal`}
        />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{ayuda}</p>
    </div>
  );
}

export function VistaPreviaClub({
  nombre,
  slug,
  escudo,
  paleta,
  dominioBase,
}: {
  nombre: string;
  slug: string;
  escudo: string | null;
  paleta: PaletaDerivada;
  dominioBase: string;
}) {
  const hayNombre = Boolean(nombre.trim());
  const visible = hayNombre ? nombre.trim() : "Nombre del club";
  const iniciales = hayNombre ? inicialesDesdeNombre(visible) || "?" : "?";
  const rival = "Rival de ejemplo";

  return (
    <aside className="flex flex-col gap-3">
      <p className="text-sm font-medium">Vista previa</p>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <EncabezadoPreview
          visible={visible}
          iniciales={iniciales}
          escudo={escudo}
          paleta={paleta}
        />
        <div className="flex flex-col gap-3 p-3" style={{ background: paleta.claro }}>
          <FilaColores paleta={paleta} />
          <div className="flex gap-2">
            <BotonMarca paleta={paleta} tono="marca">
              Ver club
            </BotonMarca>
            <BotonMarca paleta={paleta} tono="hover">
              Hover
            </BotonMarca>
            <BotonMarca paleta={paleta} tono="pressed">
              Pressed
            </BotonMarca>
          </div>
          <TarjetaEjemplo
            visible={visible}
            rival={rival}
            paleta={paleta}
            variante="clara"
          />
          <TarjetaEjemplo
            visible={visible}
            rival={rival}
            paleta={paleta}
            variante="oscura"
          />
          <p
            className="text-[11px] leading-relaxed"
            style={{ color: paleta.textoSobreClaro, opacity: 0.7 }}
          >
            {dominioBase.trim()
              ? `App: admin.${dominioBase.trim()} y vivo.${dominioBase.trim()}`
              : `Sin dominio: /c/${slug || "identificador"}/admin`}
          </p>
        </div>
        <div className="flex flex-col gap-2 border-t border-border bg-muted/40 px-3 py-2.5">
          <p className="text-[11px] font-medium text-muted-foreground">
            Estados del sistema (fijos)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.values(ESTADOS_SISTEMA).map((estado) => (
              <span
                key={estado.etiqueta}
                className="rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase"
                style={{ background: estado.claro, color: "#ffffff" }}
              >
                {estado.etiqueta}
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function FilaColores({ paleta }: { paleta: PaletaDerivada }) {
  return (
    <div className="flex gap-1.5" aria-label="Paleta de hasta 4 colores">
      {paleta.colores.map((color, indice) => (
        <span
          key={`${color}-${indice}`}
          className="flex h-7 flex-1 flex-col overflow-hidden rounded-md ring-1 ring-black/10"
          title={`Color ${indice + 1}${paleta.explicitos[indice] ? "" : " (derivado)"}`}
        >
          <span className="min-h-0 flex-1" style={{ background: color }} />
          <span
            className="px-1 py-0.5 text-center text-[9px] leading-none"
            style={{
              background: paleta.claro,
              color: paleta.textoSobreClaro,
              opacity: 0.7,
            }}
          >
            {indice + 1}
            {paleta.explicitos[indice] ? "" : "*"}
          </span>
        </span>
      ))}
    </div>
  );
}

function EncabezadoPreview({
  visible,
  iniciales,
  escudo,
  paleta,
}: {
  visible: string;
  iniciales: string;
  escudo: string | null;
  paleta: PaletaDerivada;
}) {
  return (
    <div
      className="flex items-center gap-3 border-b-2 px-3 py-3"
      style={{
        background: paleta.marca,
        color: paleta.textoSobreMarca,
        borderColor: paleta.colores[1],
      }}
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center overflow-hidden bg-white ring-1 ring-black/10"
        style={{ borderRadius: escudo ? "0.6rem" : "9999px" }}
      >
        {escudo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={escudo} alt="" className="size-full object-contain p-0.5" />
        ) : (
          <span
            className="text-xs font-medium"
            style={{ color: paleta.marca }}
          >
            {iniciales}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{visible}</p>
        <p className="truncate text-[11px] opacity-80">Admin</p>
      </div>
    </div>
  );
}

function BotonMarca({
  paleta,
  tono,
  children,
}: {
  paleta: PaletaDerivada;
  tono: "marca" | "hover" | "pressed";
  children: ReactNode;
}) {
  const fondo =
    tono === "hover" ? paleta.hover : tono === "pressed" ? paleta.pressed : paleta.marca;
  const texto = textoConContrasteAA(fondo);
  return (
    <span
      className="inline-flex h-8 flex-1 items-center justify-center rounded-lg px-2 text-[11px] font-medium"
      style={{ background: fondo, color: texto }}
    >
      {children}
    </span>
  );
}


function TarjetaEjemplo({
  visible,
  rival,
  paleta,
  variante,
}: {
  visible: string;
  rival: string;
  paleta: PaletaDerivada;
  variante: "clara" | "oscura";
}) {
  const fondo = variante === "clara" ? paleta.claro : paleta.oscuro;
  const texto =
    variante === "clara" ? paleta.textoSobreClaro : paleta.textoSobreOscuro;
  const linea = acentoVisible(paleta.colores[1], fondo);
  const chipFondo = acentoVisible(paleta.colores[2], fondo);
  const chipTexto = textoConContrasteAA(chipFondo);
  const destacado = acentoVisible(paleta.colores[3], fondo);

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border p-3"
      style={{
        background: fondo,
        color: texto,
        borderColor: variante === "clara" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)",
        boxShadow: `inset 3px 0 0 ${destacado}`,
      }}
    >
      <div
        className="h-0.5 w-full rounded-full"
        style={{ background: linea }}
        aria-hidden
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium tracking-wide uppercase opacity-70">
          Próximo partido
        </p>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase"
          style={{ background: chipFondo, color: chipTexto }}
        >
          En vivo
        </span>
      </div>
      <p className="text-sm font-medium leading-snug">
        {visible} vs {rival}
      </p>
      <p className="text-[11px] opacity-70">Sáb 15:00 · Cancha 1</p>
    </div>
  );
}

export { CLAVE_ESCUDO };
