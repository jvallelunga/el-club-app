"use client";

import { useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from "lucide-react";
import { Input } from "@/ui/nativos/input";
import { Label } from "@/ui/nativos/label";
import { Button } from "@/ui/nativos/button";
import { BotonPrincipal } from "@/ui/features/mocks-roles/marco-mock";
import { cn } from "@/lib/utils";
import {
  REDES_SOCIALES,
  type IdRedSocial,
} from "@/dominio/contacto";
import { CONTACTO_VACIO, type ContactoClubEjemplo, type RedSocialEjemplo } from "./datos-ejemplo";

const CAMPO = "h-12 rounded-xl px-3 text-base";
const SELECT = cn(CAMPO, "w-full border border-input bg-background");

export type ResultadoGuardarContacto =
  | { ok: true }
  | { ok: false; error: string };

function nuevaRed(): RedSocialEjemplo {
  return {
    id: `r-${crypto.randomUUID()}`,
    red: "instagram",
    valor: "",
  };
}

export function FormularioContactoClub({
  inicial,
  guardar,
}: {
  inicial: ContactoClubEjemplo;
  guardar?: (formData: FormData) => Promise<ResultadoGuardarContacto>;
}) {
  const [telefono, setTelefono] = useState(inicial.telefono);
  const [email, setEmail] = useState(inicial.email);
  const [direccion, setDireccion] = useState(inicial.direccion);
  const [web, setWeb] = useState(inicial.web);
  const [redes, setRedes] = useState<RedSocialEjemplo[]>(inicial.redes);
  const [guardado, setGuardado] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function marcarCambio() {
    setGuardado(false);
    setErrorServidor(null);
  }

  function actualizarRed(id: string, cambio: Partial<RedSocialEjemplo>) {
    marcarCambio();
    setRedes((actual) =>
      actual.map((red) => (red.id === id ? { ...red, ...cambio } : red)),
    );
  }

  function mover(id: string, direccion: -1 | 1) {
    marcarCambio();
    setRedes((actual) => {
      const i = actual.findIndex((red) => red.id === id);
      const j = i + direccion;
      if (i < 0 || j < 0 || j >= actual.length) return actual;
      const copia = [...actual];
      const [item] = copia.splice(i, 1);
      copia.splice(j, 0, item);
      return copia;
    });
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(evento) => {
        evento.preventDefault();
        if (!guardar) {
          setGuardado(true);
          return;
        }
        const formData = new FormData();
        formData.set("telefono", telefono);
        formData.set("email", email);
        formData.set("direccion", direccion);
        formData.set("web", web);
        formData.set(
          "redes",
          JSON.stringify(
            redes.map((red) => ({
              red: red.red,
              valor: red.valor,
              etiqueta: red.etiqueta ?? "",
            })),
          ),
        );
        startTransition(async () => {
          const resultado = await guardar(formData);
          if (!resultado.ok) {
            setErrorServidor(resultado.error);
            setGuardado(false);
            return;
          }
          setErrorServidor(null);
          setGuardado(true);
        });
      }}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="contacto-telefono" className="text-sm">
            Teléfono{" "}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="contacto-telefono"
            type="tel"
            value={telefono}
            onChange={(e) => {
              marcarCambio();
              setTelefono(e.target.value);
            }}
            placeholder="+54 11 0000-0000"
            autoComplete="tel"
            className={CAMPO}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="contacto-email" className="text-sm">
            Email{" "}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="contacto-email"
            type="email"
            value={email}
            onChange={(e) => {
              marcarCambio();
              setEmail(e.target.value);
            }}
            placeholder="contacto@club.com"
            autoComplete="email"
            className={CAMPO}
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="contacto-direccion" className="text-sm">
            Dirección{" "}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="contacto-direccion"
            value={direccion}
            onChange={(e) => {
              marcarCambio();
              setDireccion(e.target.value);
            }}
            placeholder="Calle y número, ciudad"
            autoComplete="street-address"
            className={CAMPO}
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="contacto-web" className="text-sm">
            Web{" "}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="contacto-web"
            type="url"
            value={web}
            onChange={(e) => {
              marcarCambio();
              setWeb(e.target.value);
            }}
            placeholder="https://"
            autoComplete="url"
            className={CAMPO}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Redes sociales</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Todas opcionales. Podés sumar Instagram, Facebook, X, YouTube,
              TikTok, WhatsApp, LinkedIn u otra red, y cambiar el orden.
            </p>
          </div>
        </div>

        {redes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            Todavía no hay redes. Agregá la primera cuando quieras.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {redes.map((red, indice) => (
              <li
                key={red.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-start"
              >
                <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-[11rem_minmax(0,1fr)]">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`red-${red.id}`} className="text-sm">
                      Red
                    </Label>
                    <select
                      id={`red-${red.id}`}
                      value={red.red}
                      onChange={(e) =>
                        actualizarRed(red.id, {
                          red: e.target.value as IdRedSocial,
                          etiqueta:
                            e.target.value === "otra" ? red.etiqueta : undefined,
                        })
                      }
                      className={SELECT}
                    >
                      {REDES_SOCIALES.map((opcion) => (
                        <option key={opcion.id} value={opcion.id}>
                          {opcion.etiqueta}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`valor-${red.id}`} className="text-sm">
                      {red.red === "whatsapp" ? "Número o link" : "URL o usuario"}
                    </Label>
                    <Input
                      id={`valor-${red.id}`}
                      value={red.valor}
                      onChange={(e) =>
                        actualizarRed(red.id, { valor: e.target.value })
                      }
                      placeholder={
                        red.red === "instagram"
                          ? "@club"
                          : red.red === "whatsapp"
                            ? "+54 11 0000-0000"
                            : "https://"
                      }
                      className={CAMPO}
                    />
                  </div>
                  {red.red === "otra" ? (
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <Label htmlFor={`etiqueta-${red.id}`} className="text-sm">
                        Nombre de la red
                      </Label>
                      <Input
                        id={`etiqueta-${red.id}`}
                        value={red.etiqueta ?? ""}
                        onChange={(e) =>
                          actualizarRed(red.id, { etiqueta: e.target.value })
                        }
                        placeholder="Por ejemplo, canal de videos"
                        className={CAMPO}
                      />
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:flex-col sm:pt-7">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    className="size-11"
                    aria-label="Subir"
                    disabled={indice === 0}
                    onClick={() => mover(red.id, -1)}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    className="size-11"
                    aria-label="Bajar"
                    disabled={indice === redes.length - 1}
                    onClick={() => mover(red.id, 1)}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    className="size-11 text-destructive"
                    aria-label="Quitar red"
                    onClick={() => {
                      marcarCambio();
                      setRedes((actual) =>
                        actual.filter((item) => item.id !== red.id),
                      );
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-xl sm:w-auto"
          onClick={() => {
            marcarCambio();
            setRedes((actual) => [...actual, nuevaRed()]);
          }}
        >
          <Plus className="size-4" />
          Agregar red
        </Button>
      </div>

      {errorServidor ? (
        <p className="text-sm text-destructive" role="alert">
          {errorServidor}
        </p>
      ) : guardado ? (
        <p className="text-sm text-muted-foreground" role="status">
          {guardar
            ? "Contacto guardado."
            : "En el mock no se guarda de verdad. Así se vería el aviso al guardar."}
        </p>
      ) : null}

      <BotonPrincipal type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar contacto"}
      </BotonPrincipal>
    </form>
  );
}

export { CONTACTO_VACIO };
