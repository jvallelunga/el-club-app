"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/ui/nativos/input";
import { Label } from "@/ui/nativos/label";
import { BotonPrincipal } from "@/ui/features/mocks-roles/marco-mock";
import { cn } from "@/lib/utils";
import {
  TIPOS_DEL_CLUB_EJEMPLO,
  type TipoInstalacionEjemplo,
} from "./datos-ejemplo";

const CAMPO = "h-12 rounded-xl px-3 text-base";
const SELECT = cn(CAMPO, "w-full border border-input bg-background");

export type ResultadoGuardarInstalacion =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export type InicialInstalacion = {
  tipoId: string;
  nombre: string;
  notas: string;
};

export function FormularioInstalacion({
  tipos = TIPOS_DEL_CLUB_EJEMPLO,
  destino,
  guardar,
  inicial,
  etiquetaBoton,
}: {
  tipos?: TipoInstalacionEjemplo[];
  destino: string;
  guardar?: (formData: FormData) => Promise<ResultadoGuardarInstalacion>;
  inicial?: InicialInstalacion;
  etiquetaBoton?: string;
}) {
  const router = useRouter();
  const [tipoId, setTipoId] = useState(
    inicial?.tipoId ?? tipos[0]?.id ?? "cancha-rugby",
  );
  const [tipoPropio, setTipoPropio] = useState("");
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [notas, setNotas] = useState(inicial?.notas ?? "");
  const [intento, setIntento] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const tipoOtra = tipos.find(
    (tipo) => tipo.base && tipo.nombre.toLowerCase() === "otra",
  );
  const eligeOtra = tipoId === "otra" || tipoId === tipoOtra?.id;
  const errorTipo =
    eligeOtra && !tipoPropio.trim()
      ? "Poné el nombre del tipo de instalación."
      : null;
  const errorNombre = nombre.trim()
    ? null
    : "Poné un nombre, por ejemplo «Cancha 1».";

  const textoBoton =
    etiquetaBoton ?? (inicial ? "Guardar instalación" : "Agregar instalación");

  return (
    <form
      className="mx-auto flex w-full max-w-xl flex-col gap-5"
      onSubmit={(evento) => {
        evento.preventDefault();
        setIntento(true);
        setErrorServidor(null);
        if (errorTipo || errorNombre) return;
        if (!guardar) {
          router.push(destino);
          return;
        }
        const formData = new FormData();
        formData.set("tipo_instalacion_id", tipoId);
        formData.set("tipo_propio", tipoPropio);
        formData.set("nombre", nombre);
        formData.set("notas", notas);
        startTransition(async () => {
          const resultado = await guardar(formData);
          if (!resultado.ok) {
            setErrorServidor(resultado.error);
            return;
          }
          router.push(destino);
          router.refresh();
        });
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="ins-tipo" className="text-sm">
          Tipo
        </Label>
        <select
          id="ins-tipo"
          value={tipoId}
          onChange={(e) => setTipoId(e.target.value)}
          className={SELECT}
        >
          <optgroup label="Tipos de base">
            {tipos
              .filter((tipo) => tipo.base)
              .map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
          </optgroup>
          {tipos.some((tipo) => !tipo.base) ? (
            <optgroup label="Tipos de este club">
              {tipos
                .filter((tipo) => !tipo.base)
                .map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
            </optgroup>
          ) : null}
        </select>
        <p className="text-xs leading-relaxed text-muted-foreground">
          La lista de base es la misma para todos los clubes. Si no alcanza,
          elegí «Otra» y agregá un tipo propio (queda disponible para este
          club).
        </p>
      </div>

      {eligeOtra ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="ins-tipo-propio" className="text-sm">
            Nombre del tipo
          </Label>
          <Input
            id="ins-tipo-propio"
            value={tipoPropio}
            onChange={(e) => setTipoPropio(e.target.value)}
            placeholder="Por ejemplo, cantina"
            className={CAMPO}
            aria-invalid={intento && Boolean(errorTipo)}
          />
          {intento && errorTipo ? (
            <p className="text-sm text-destructive" role="alert">
              {errorTipo}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="ins-nombre" className="text-sm">
          Nombre
        </Label>
        <Input
          id="ins-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Cancha 1"
          className={CAMPO}
          aria-invalid={intento && Boolean(errorNombre)}
        />
        {intento && errorNombre ? (
          <p className="text-sm text-destructive" role="alert">
            {errorNombre}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Cómo la distinguen si hay más de una del mismo tipo.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ins-notas" className="text-sm">
          Notas{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <textarea
          id="ins-notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Césped natural, con iluminación."
          rows={4}
          className="min-h-28 w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
        />
      </div>

      {errorServidor ? (
        <p className="text-sm text-destructive" role="alert">
          {errorServidor}
        </p>
      ) : null}

      <BotonPrincipal type="submit" disabled={pending}>
        {pending ? "Guardando…" : textoBoton}
      </BotonPrincipal>
    </form>
  );
}
