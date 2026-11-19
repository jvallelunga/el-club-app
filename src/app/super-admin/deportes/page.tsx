import { ShellAdmin } from "@/ui/compartidos/shell-admin";
import { CatalogoDeportes } from "@/ui/features/deportes/catalogo-deportes";
import { borrarDeporte, crearDeporte, editarDeporte } from "@/datos/comandos/deportes";
import { superAdminRequerido } from "@/datos/consultas/acceso";
import { listarDeportes } from "@/datos/consultas/deportes";

export const dynamic = "force-dynamic";

export default async function PaginaDeportes() {
  await superAdminRequerido("/super-admin/deportes");
  const deportes = await listarDeportes();

  return (
    <ShellAdmin
      titulo="Deportes"
      subtitulo="Super Admin · catálogo"
      tituloMobile="Deportes"
      subtituloMobile="Super Admin"
      rol="super-admin"
      activo="deportes"
    >
      <CatalogoDeportes
        deportes={deportes}
        crear={crearDeporte}
        editar={editarDeporte}
        borrar={borrarDeporte}
      />
    </ShellAdmin>
  );
}
