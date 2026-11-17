import { derivarPaleta } from "@/dominio/paleta";
import { CLUB_CREADO_EJEMPLO } from "@/ui/features/mocks-roles/datos-ejemplo";
import { ProveedorPaleta } from "@/ui/fundamentos/proveedor-paleta";

export default function LayoutMocksClub({
  children,
}: {
  children: React.ReactNode;
}) {
  const paleta = derivarPaleta(
    CLUB_CREADO_EJEMPLO.marca,
    CLUB_CREADO_EJEMPLO.claro,
    [CLUB_CREADO_EJEMPLO.color2, CLUB_CREADO_EJEMPLO.color3],
  );
  return <ProveedorPaleta paleta={paleta}>{children}</ProveedorPaleta>;
}
