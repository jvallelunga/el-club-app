import { ShellAdmin } from "@/ui/compartidos/shell-admin";
import { CatalogoDeportes } from "@/ui/features/deportes/catalogo-deportes";
import { borrarDeporte, crearDeporte, editarDeporte } from "@/datos/comandos/deportes";
import { superAdminRequerido } from "@/datos/consultas/acceso";
import { panelesDeLaSesion } from "@/datos/consultas/paneles";
import { listarDeportes } from "@/datos/consultas/deportes";
import { clubesPorDeporte } from "@/datos/consultas/deportes-del-club";

export const dynamic = "force-dynamic";

export default async function PaginaDeportes() {
  const sesion = await superAdminRequerido("/super-admin/deportes");
  const paneles = await panelesDeLaSesion(sesion);
  const [deportes, clubes] = await Promise.all([listarDeportes(), clubesPorDeporte()]);

  return (
    <ShellAdmin
      titulo="Deportes"
      subtitulo="Super Admin · catálogo"
      tituloMobile="Deportes"
      subtituloMobile="Super Admin"
      paneles={paneles}
      activo="deportes"
    >
      <CatalogoDeportes
        deportes={deportes}
        clubesPorDeporte={clubes}
        crear={crearDeporte}
        editar={editarDeporte}
        borrar={borrarDeporte}
      />
    </ShellAdmin>
  );
}
