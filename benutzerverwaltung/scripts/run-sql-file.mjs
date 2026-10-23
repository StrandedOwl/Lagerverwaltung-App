// Führt eine .sql-Datei gegen die konfigurierte MySQL/MariaDB-Datenbank aus.
// Nutzung: node scripts/run-sql-file.mjs db/schema.sql
//
// Liest die DB-Verbindungsdaten aus .env.local (fällt sonst auf die Werte
// aus .env.example zurück), damit kein separates mysql-CLI nötig ist.

import { readFileSync, existsSync } from "node:fs"
import path from "node:path"
import mysql from "mysql2/promise"

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  const content = readFileSync(filePath, "utf-8")
  const env = {}
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return env
}

const root = process.cwd()
const env = {
  ...loadEnvFile(path.join(root, ".env.example")),
  ...loadEnvFile(path.join(root, ".env.local")),
  ...process.env,
}

const sqlFile = process.argv[2]
if (!sqlFile) {
  console.error("Nutzung: node scripts/run-sql-file.mjs <pfad-zur-sql-datei>")
  process.exit(1)
}

const sql = readFileSync(path.join(root, sqlFile), "utf-8")

const connection = await mysql.createConnection({
  host: env.DB_HOST ?? "127.0.0.1",
  port: Number(env.DB_PORT ?? 3306),
  user: env.DB_USER ?? "lager",
  password: env.DB_PASSWORD ?? "lager_pw",
  database: env.DB_NAME ?? "lagerverwaltung_benutzer",
  multipleStatements: true,
})

try {
  await connection.query(sql)
  console.log(`✓ ${sqlFile} erfolgreich ausgeführt`)
} finally {
  await connection.end()
}
