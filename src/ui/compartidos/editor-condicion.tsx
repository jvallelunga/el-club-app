"use client";

import { Plus, X } from "lucide-react";
import {
  agregarChequeo,
  agregarSubgrupo,
  CAMPOS,
  cambiarCampo,
  cambiarChequeo,
  cambiarConector,
  describirCondicion,
  esSubgrupo,
  LIMITES,
  quitar,
  tieneSubgrupo,
  validarCondicion,
  type Campo,
  type Chequeo,
  type Condicion,
  type Conector,
  type Ubicacion,
} from "@/dominio/condicion";
import { Button } from "@/ui/nativos/button";
import { cn } from "@/lib/utils";

const claseCampo =
  "h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Editor en bloques de una condición (#74): cada bloque tiene su «Todas (Y) /
 * Alguna (O)», «+ Chequeo» y, arriba, «+ Grupo» para el único subnivel.
 * Debajo muestra la condición en texto y, si no se puede guardar, por qué.
 *
 * No sabe de quién es la condición: lo usan el deporte, la condición del club
 * (#77) y las categorías (#57).
 */
export function EditorCondicion({
  condicion,
  onChange,
  etiqueta,
}: {
  condicion: Condicion;
  onChange: (condicion: Condicion) => void;
  /** Nombre accesible del editor, por ejemplo «Condición para anotarse». */
  etiqueta: string;
}) {
  const conGrupo = tieneSubgrupo(condicion);
  const validacion = validarCondicion(condicion);

  return (
    <div className="flex flex-col gap-2" role="group" aria-label={etiqueta}>
      <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Cumplir</span>
          <InterruptorConector
            valor={condicion.conector}
            etiqueta="Cómo se unen los chequeos"
            onChange={(conector) => onChange(cambiarConector(condicion, conector))}
          />
        </div>

        {condicion.items.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Sin chequeos: puede anotarse cualquier socio.
          </p>
        ) : null}

        {condicion.items.map((item, i) =>
          esSubgrupo(item) ? (
            <div
              key={i}
              role="group"
              aria-label="Grupo"
              className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <InterruptorConector
                  valor={item.conector}
                  etiqueta="Cómo se unen los chequeos del grupo"
                  onChange={(conector) => onChange(cambiarConector(condicion, conector, i))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Quitar grupo"
                  onClick={() => onChange(quitar(condicion, [i]))}
                >
                  <X className="size-4" />
                </Button>
              </div>
              {item.items.map((chequeo, j) => (
                <FilaChequeo
                  key={j}
                  chequeo={chequeo}
                  ubicacion={[i, j]}
                  condicion={condicion}
                  onChange={onChange}
                />
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => onChange(agregarChequeo(condicion, i))}
              >
                <Plus className="size-3.5" /> Chequeo
              </Button>
            </div>
          ) : (
            <FilaChequeo
              key={i}
              chequeo={item}
              ubicacion={[i]}
              condicion={condicion}
              onChange={onChange}
            />
          ),
        )}

        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(agregarChequeo(condicion))}
          >
            <Plus className="size-3.5" /> Chequeo
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={conGrupo}
            title={conGrupo ? "Ya hay un grupo: como máximo un subnivel" : undefined}
            onClick={() => onChange(agregarSubgrupo(condicion))}
          >
            <Plus className="size-3.5" /> Grupo
          </Button>
        </div>
      </div>

      {validacion.ok ? (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground" aria-live="polite">
          {describirCondicion(validacion.condicion)}
        </p>
      ) : (
        <p className="text-xs text-destructive" role="alert">
          {validacion.error}
        </p>
      )}
    </div>
  );
}

function InterruptorConector({
  valor,
  etiqueta,
  onChange,
}: {
  valor: Conector;
  etiqueta: string;
  onChange: (conector: Conector) => void;
}) {
  return (
    <div
      role="group"
      aria-label={etiqueta}
      className="inline-flex rounded-md border border-border p-0.5 text-xs"
    >
      {(["Y", "O"] as const).map((conector) => (
        <button
          key={conector}
          type="button"
          aria-pressed={valor === conector}
          onClick={() => onChange(conector)}
          className={cn(
            "rounded px-2 py-0.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            valor === conector ? "bg-foreground text-background" : "text-muted-foreground",
          )}
        >
          {conector === "Y" ? "Todas (Y)" : "Alguna (O)"}
        </button>
      ))}
    </div>
  );
}

function FilaChequeo({
  chequeo,
  ubicacion,
  condicion,
  onChange,
}: {
  chequeo: Chequeo;
  ubicacion: Ubicacion;
  condicion: Condicion;
  onChange: (condicion: Condicion) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-background p-1.5 ring-1 ring-border">
      <select
        aria-label="Qué se chequea"
        className={claseCampo}
        value={chequeo.campo}
        onChange={(e) => onChange(cambiarCampo(condicion, ubicacion, e.target.value as Campo))}
      >
        {CAMPOS.map((opcion) => (
          <option key={opcion.campo} value={opcion.campo}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
      <ValorChequeo
        chequeo={chequeo}
        onChange={(nuevo) => onChange(cambiarChequeo(condicion, ubicacion, nuevo))}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="ml-auto"
        aria-label="Quitar chequeo"
        onClick={() => onChange(quitar(condicion, ubicacion))}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}

/** Vacío es «sin límite»; lo que no es un entero válido lo marca `validarCondicion`. */
function numero(texto: string): number | undefined {
  return texto.trim() === "" ? undefined : Number(texto);
}

function ValorChequeo({
  chequeo,
  onChange,
}: {
  chequeo: Chequeo;
  onChange: (chequeo: Chequeo) => void;
}) {
  if (chequeo.campo === "sexo") {
    return (
      <select
        aria-label="Sexo"
        className={claseCampo}
        value={chequeo.valor}
        onChange={(e) => onChange({ ...chequeo, valor: e.target.value === "F" ? "F" : "M" })}
      >
        <option value="M">Masculino</option>
        <option value="F">Femenino</option>
      </select>
    );
  }
  const { min, max } = LIMITES[chequeo.campo];
  const nombre = chequeo.campo === "edad" ? "Edad" : "Año de nacimiento";
  const placeholder = chequeo.campo === "edad" ? "—" : "año";
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
      desde
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        aria-label={`${nombre} desde`}
        className={cn(claseCampo, "w-16")}
        placeholder={placeholder}
        value={chequeo.desde ?? ""}
        onChange={(e) => onChange({ ...chequeo, desde: numero(e.target.value) })}
      />
      hasta
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        aria-label={`${nombre} hasta`}
        className={cn(claseCampo, "w-16")}
        placeholder={placeholder}
        value={chequeo.hasta ?? ""}
        onChange={(e) => onChange({ ...chequeo, hasta: numero(e.target.value) })}
      />
      {chequeo.campo === "edad" ? "años" : null}
    </span>
  );
}
