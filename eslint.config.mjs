import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const datosSoloServidor = [
  "@/datos/supabase",
  "@/datos/tipos",
  "@/datos/consultas",
  "@/datos/consultas/*",
  "@/datos/comandos",
  "@/datos/comandos/*",
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/dominio/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              message: "dominio no importa React.",
            },
            {
              name: "react-dom",
              message: "dominio no importa React.",
            },
            {
              name: "next",
              message: "dominio no importa Next.",
            },
            {
              name: "@tanstack/react-query",
              message: "dominio no importa TanStack Query.",
            },
            {
              name: "@supabase/supabase-js",
              message: "dominio no importa Supabase.",
            },
          ],
          patterns: [
            {
              group: [
                "next/*",
                "react/*",
                "@/app",
                "@/app/**",
                "@/ui",
                "@/ui/**",
                "@/datos",
                "@/datos/**",
              ],
              message: "dominio no importa nada de la app.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: datosSoloServidor,
              message:
                "ui no importa datos de servidor (supabase, tipos, consultas, comandos).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/ui/nativos/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/ui/compartidos",
                "@/ui/compartidos/*",
                "@/ui/features",
                "@/ui/features/*",
                "@/datos",
                "@/datos/**",
              ],
              message: "nativos no importan compartidos, features ni datos.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/ui/compartidos/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/ui/features",
                "@/ui/features/*",
                "@/datos",
                "@/datos/**",
              ],
              message: "compartidos no importan features ni datos.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    ignores: [
      "src/app/api/**",
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/app/**/template.tsx",
      "src/app/**/default.tsx",
      "src/app/**/loading.tsx",
      "src/app/**/error.tsx",
      "src/app/**/not-found.tsx",
      "src/app/**/route.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/datos/supabase",
                "@/datos/consultas",
                "@/datos/consultas/**",
                "@/datos/comandos",
                "@/datos/comandos/**",
              ],
              message:
                "un componente cliente no importa datos de servidor; las páginas y route handlers sí pueden.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
