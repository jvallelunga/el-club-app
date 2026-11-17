import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mocks · Roles y permisos",
  description:
    "Mocks de aprobación de roles y permisos. No hay login real ni datos verdaderos.",
  robots: { index: false, follow: false },
};

export default function LayoutMocksRoles({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
