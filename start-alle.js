// Startet das ganze verteilte System mit einem Befehl: npm run start:alle
//
//   Statistik (Andrin)                 -> http://localhost:3000  (server.js)
//   Benutzerverwaltung (Lorenzo)       -> http://localhost:3001  (benutzerverwaltung/, Next.js + MariaDB)
//   Produkt-/Lagerverwaltung (Louis)   -> http://localhost:3002  (public/server.js)
//
// Jede Komponente bleibt ein eigener Prozess – das Skript startet sie nur gemeinsam
// und zeigt ihre Ausgaben mit Präfix im selben Terminal an. Ctrl+C beendet alle.

const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const BENUTZER_DIR = path.join(ROOT, "benutzerverwaltung");
const PRODUKT_DATEN = path.join(ROOT, "data", "products.json");
const PRODUKT_STARTDATEN = path.join(ROOT, "public", "products.json");

const prozesse = [];

function log(name, text) {
  for (const zeile of String(text).split(/\r?\n/)) {
    if (zeile.trim()) console.log(`[${name}] ${zeile}`);
  }
}

function starte(name, befehl, optionen) {
  const kind = spawn(befehl, { shell: true, ...optionen, env: { ...process.env, ...optionen.env } });
  kind.stdout.on("data", (d) => log(name, d));
  kind.stderr.on("data", (d) => log(name, d));
  kind.on("exit", (code) => log(name, `beendet (Code ${code})`));
  prozesse.push(kind);
}

// Prüft, ob die Benutzerverwaltung startklar ist, und startet ihre Datenbank.
function bereiteBenutzerverwaltungVor() {
  if (!fs.existsSync(path.join(BENUTZER_DIR, "node_modules"))) {
    log("benutzer", "Abhängigkeiten fehlen. Einmalig ausführen: cd benutzerverwaltung && npm install");
    return false;
  }
  if (!fs.existsSync(path.join(BENUTZER_DIR, ".env"))) {
    log("benutzer", "benutzerverwaltung/.env fehlt. Einmalig .env.example nach .env kopieren.");
    return false;
  }
  log("benutzer", "Starte MariaDB (docker compose up -d) ...");
  const docker = spawnSync("docker compose up -d --wait", { cwd: BENUTZER_DIR, shell: true, encoding: "utf8" });
  if (docker.status !== 0) {
    log("benutzer", "Datenbank konnte nicht gestartet werden. Läuft Docker Desktop?");
    log("benutzer", docker.stderr);
    return false;
  }
  return true;
}

// Louis' Server speichert Produkte in data/products.json. Beim ersten Start
// wird die Datei mit den Beispielprodukten aus public/products.json angelegt.
function bereiteProduktdatenVor() {
  if (fs.existsSync(PRODUKT_DATEN) || !fs.existsSync(PRODUKT_STARTDATEN)) return;
  fs.mkdirSync(path.dirname(PRODUKT_DATEN), { recursive: true });
  fs.copyFileSync(PRODUKT_STARTDATEN, PRODUKT_DATEN);
  log("produkte", "data/products.json mit Beispielprodukten angelegt.");
}

function stoppeAlle() {
  for (const kind of prozesse) {
    if (kind.exitCode !== null) continue;
    // Unter Windows muss der ganze Prozessbaum beendet werden (shell -> npm -> node)
    if (process.platform === "win32") spawnSync(`taskkill /pid ${kind.pid} /T /F`, { shell: true });
    else kind.kill("SIGTERM");
  }
  process.exit(0);
}

process.on("SIGINT", stoppeAlle);
process.on("SIGTERM", stoppeAlle);

bereiteProduktdatenVor();
starte("produkte", "node public/server.js", { cwd: ROOT, env: { PORT: "3002" } });
starte("statistik", "node server.js", { cwd: ROOT, env: { PORT: "3000" } });
if (bereiteBenutzerverwaltungVor()) {
  starte("benutzer", "npm run dev", { cwd: BENUTZER_DIR, env: { PORT: "" } });
}

console.log("\nÜbersicht: http://localhost:3000   (beenden mit Ctrl+C)\n");
