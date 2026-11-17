import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { ProveedorConsulta } from "@/datos/proveedor-consulta";
import { ProveedorTema } from "@/ui/fundamentos/proveedor-tema";
import "./globals.css";
import { derivarPaleta } from "@/dominio/paleta";
import { marcaClubDePeticion } from "@/datos/consultas/marca-club";
import { ProveedorPaleta } from "@/ui/fundamentos/proveedor-paleta";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "El Club App",
  description: "App del club para organizar torneos y el día a día del club.",
  other: { google: "notranslate" },
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clubHost = await marcaClubDePeticion();
  const contenido = clubHost ? (
    <ProveedorPaleta
      paleta={derivarPaleta(clubHost.color_principal, clubHost.color_claro, [
        clubHost.color_2 ?? undefined,
        clubHost.color_3 ?? undefined,
      ])}
    >
      {children}
    </ProveedorPaleta>
  ) : (
    children
  );

  return (
    <html
      lang="es-AR"
      translate="no"
      suppressHydrationWarning
      className={cn(inter.variable, "font-sans")}
    >
      <body>
        <ProveedorTema>
          <ProveedorConsulta>{contenido}</ProveedorConsulta>
        </ProveedorTema>
      </body>
    </html>
  );
}
