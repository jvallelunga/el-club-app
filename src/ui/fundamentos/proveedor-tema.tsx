"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ProveedorTema({
  children,
  tema,
}: {
  children: React.ReactNode;
  tema?: "light" | "dark";
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      forcedTheme={tema}
    >
      {children}
    </NextThemesProvider>
  );
}
