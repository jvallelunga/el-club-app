import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "cn";
import { ProveedorConsulta } from "@/datos/proveedor-consulta";
import { ProveedorTema } from "@/ui/fundamentos/proveedor-tema";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "El Club App",
  description: "App del club. El primer caso es Los Cardos Rugby Club (Tandil).",
  other: { google: "notranslate" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-AR"
      translate="no"
      suppressHydrationWarning
      className={cn(inter.variable, "font-sans")}
    >
      <body>
        <ProveedorTema>
          <ProveedorConsulta>{children}</ProveedorConsulta>
        </ProveedorTema>
      </body>
    </html>
  );
}
