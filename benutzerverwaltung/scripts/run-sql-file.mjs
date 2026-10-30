// Führt eine oder mehrere .sql-Dateien gegen die konfigurierte
// MySQL/MariaDB-Datenbank aus.
// Nutzung: node scripts/run-sql-file.mjs db/schema.sql [db/seed.sql ...]
//
// Liest die DB-Verbindungsdaten wie Next.js aus den env-Dateien
// (.env.example < .env < .env.local < echte Umgebungsvariablen),
// damit kein separates mysql-CLI nötig ist.

import { readFileSync, existsSync } from "node:fs"
import path from "node:path"
import mysql from "mysql2/promise"

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  const content = readFileSync(filePath, "utf-8")
  const env = {}
  for (const line of content.split(/\r?\n/)) {
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
  ...loadEnvFile(path.join(root, ".env")),
  ...loadEnvFile(path.join(root, ".env.local")),
  ...process.env,
}

const sqlFiles = process.argv.slice(2)
if (sqlFiles.length === 0) {
  console.error("Nutzung: node scripts/run-sql-file.mjs <datei.sql> [...]")
  process.exit(1)
}

let connection
try {
  connection = await mysql.createConnection({
    host: env.DB_HOST ?? "127.0.0.1",
    port: Number(env.DB_PORT ?? 3306),
    user: env.DB_USER ?? "lager",
    password: env.DB_PASSWORD ?? "lager_pw",
    database: env.DB_NAME ?? "lagerverwaltung_benutzer",
    multipleStatements: true,
  })
} catch (error) {
  console.error(
    `✗ Keine Verbindung zur Datenbank (${error.code ?? error.message}).\n` +
      "  Läuft der Container? -> npm run db:up"
  )
  process.exit(1)
}

try {
  for (const sqlFile of sqlFiles) {
    const sql = readFileSync(path.join(root, sqlFile), "utf-8")
    await connection.query(sql)
    console.log(`✓ ${sqlFile} erfolgreich ausgeführt`)
  }
} catch (error) {
  console.error(`✗ Fehler beim Ausführen: ${error.message}`)
  process.exitCode = 1
} finally {
  await connection.end()
}
