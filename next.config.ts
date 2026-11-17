import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
