"use client";

import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from "@tanstack/react-query";
import type { ReactNode } from "react";

function crearCliente(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        networkMode: "always",
        staleTime: 10_000,
        refetchOnWindowFocus: true,
        retry: 2,
      },
    },
  });
}

let clienteNavegador: QueryClient | undefined;

function obtenerCliente(): QueryClient {
  if (isServer) {
    return crearCliente();
  }
  if (!clienteNavegador) {
    clienteNavegador = crearCliente();
  }
  return clienteNavegador;
}

export function ProveedorConsulta({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={obtenerCliente()}>{children}</QueryClientProvider>
  );
}
