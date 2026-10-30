import { defineConfig } from "vitest/config"

/**
 * API-Tests gegen den laufenden Server (Black-Box über HTTP).
 * Voraussetzung: npm run db:reset && npm run dev
 * Anderer Server: API_URL=http://localhost:3001 npm run test:api
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/api/**/*.test.ts"],
    // Die Tests bauen aufeinander auf (anlegen -> bearbeiten -> löschen).
    sequence: { concurrent: false },
    fileParallelism: false,
    testTimeout: 15000,
  },
})
