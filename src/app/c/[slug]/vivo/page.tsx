import { notFound } from "next/navigation";
import {
  Contenido,
  MarcoPagina,
  Cabecera,
} from "@/ui/compartidos/marco";
import { adminDelClubRequerido, sesionRequerida } from "@/datos/consultas/acceso";
import { clubPorSlug } from "@/datos/consultas/clubes";

export const dynamic = "force-dynamic";

export default async function PaginaVivoClub({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await sesionRequerida(`/c/${slug}/vivo`);
  const club = await clubPorSlug(slug);
  if (!club) notFound();
  await adminDelClubRequerido(club.id, `/c/${slug}/vivo`);

  const hostVivo = club.dominio_base ? `vivo.${club.dominio_base}` : null;

  return (
    <MarcoPagina
      cabecera={<Cabecera titulo={club.nombre} subtitulo="En vivo" />}
    >
      <Contenido className="mx-auto w-full max-w-xl justify-center gap-4 py-16">
        <h1 className="text-2xl font-medium tracking-tight">En vivo</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Acá va a estar el tablero de partidos en vivo de {club.nombre}.
          Todavía no está disponible.
        </p>
        {hostVivo ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Cuando el dominio esté configurado, esta superficie también va a
            estar en{" "}
            <span className="font-medium text-foreground">{hostVivo}</span>.
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            El acceso, hasta que el club tenga un dominio propio, es{" "}
            <span className="font-medium text-foreground">
              /c/{club.slug}/vivo
            </span>
            .
          </p>
        )}
      </Contenido>
    </MarcoPagina>
  );
}
