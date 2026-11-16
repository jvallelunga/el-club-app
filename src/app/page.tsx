import Link from "next/link";

export default function Inicio() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-4 px-6 py-12">
      <h1 className="text-4xl font-medium tracking-tight">El Club App</h1>
      <p className="text-sm text-muted-foreground">
        App del club. El primer caso es Los Cardos Rugby Club (Tandil).
      </p>
      <p className="text-sm text-muted-foreground">
        <Link
          href="/mocks/roles"
          className="underline-offset-4 hover:underline"
        >
          Mocks de roles y permisos
        </Link>
      </p>
    </main>
  );
}
