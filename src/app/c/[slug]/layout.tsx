import { derivarPaleta } from "@/dominio/paleta";
import { marcaPublicaDelClub } from "@/datos/consultas/marca-club";
import { ProveedorPaleta } from "@/ui/fundamentos/proveedor-paleta";

export default async function LayoutClub({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await marcaPublicaDelClub({ slug });
  if (!club) return children;

  return (
    <ProveedorPaleta
      paleta={derivarPaleta(club.color_principal, club.color_claro, [
        club.color_2 ?? undefined,
        club.color_3 ?? undefined,
      ])}
    >
      {children}
    </ProveedorPaleta>
  );
}
