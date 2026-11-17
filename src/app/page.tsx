import Link from "next/link";
import { LogoElClub } from "@/ui/marca/logo-el-club";

export default function Inicio() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-4 px-6 py-12">
      <div className="flex items-center gap-3">
        <LogoElClub className="size-12" />
        <h1 className="text-4xl font-medium tracking-tight">El Club App</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        App de gestión de clubes.
      </p>
      <p className="text-sm">
        <Link href="/ingreso" className="underline-offset-4 hover:underline">
          Ingresar
        </Link>
      </p>
    </main>
  );
}
