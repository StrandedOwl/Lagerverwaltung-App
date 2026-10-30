import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

/**
 * Testkonfiguration (Vitest).
 *
 *  npm test               -> Unit-Tests (ohne Datenbank, ohne Server)
 *  npm run test:coverage  -> dasselbe mit Testabdeckung
 *  npm run test:api       -> API-Tests gegen den laufenden Server
 *                            (Datenbank + "npm run dev" müssen laufen)
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    env: {
      // Fester Test-Schlüssel, damit die Unit-Tests ohne .env laufen.
      JWT_SECRET: "test-secret-nur-fuer-unit-tests-0123456789abcdef",
    },
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts", "app/api/**/*.ts", "proxy.ts"],
      // Diese Dateien brauchen eine echte Datenbank bzw. einen Browser und
      // werden deshalb durch die API-Tests (npm run test:api) abgedeckt.
      exclude: [
        "lib/db.ts",
        "lib/benutzer-repository.ts",
        "lib/aktueller-benutzer.ts",
        "lib/api-client.ts",
        "lib/utils.ts",
      ],
      reporter: ["text", "html"],
    },
  },
})
