import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next dev no genera AGENTS.md: las instrucciones para agentes viven en CLAUDE.md.
  agentRules: false,
  turbopack: {
    // clsx (lo trae class-variance-authority) se resuelve con cn, así la app
    // usa una sola implementación para combinar clases.
    resolveAlias: {
      clsx: "cn",
      "tailwind-merge": "cn",
    },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
