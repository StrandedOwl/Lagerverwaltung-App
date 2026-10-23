import mysql from "mysql2/promise"

/**
 * Verbindungs-Pool zur MySQL/MariaDB-Datenbank.
 *
 * Als globalThis-Singleton gehalten, damit im Next.js-Dev-Modus (Hot
 * Reload) nicht bei jeder Codeänderung ein neuer Pool aufgebaut wird.
 */
declare global {
  // eslint-disable-next-line no-var
  var __benutzerverwaltungPool: mysql.Pool | undefined
}

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "lager",
    password: process.env.DB_PASSWORD ?? "lager_pw",
    database: process.env.DB_NAME ?? "lagerverwaltung_benutzer",
    waitForConnections: true,
    connectionLimit: 10,
  })
}

export const pool = globalThis.__benutzerverwaltungPool ?? createPool()

if (process.env.NODE_ENV !== "production") {
  globalThis.__benutzerverwaltungPool = pool
}
