import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Von shadcn/ui generierter Code (nicht selbst geschrieben, wird per
    // "npx shadcn add" aktualisiert) - nicht Teil der eigenen Code-Qualität.
    "components/ui/**",
    "hooks/use-mobile.ts",
    "coverage/**",
  ]),
]);

export default eslintConfig;
