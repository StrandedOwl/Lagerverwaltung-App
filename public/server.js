/**
 * Produkt-/Lagerverwaltung (Komponente von Louis)
 * Modul 321 – LB2, verteiltes Lagerverwaltungssystem
 *
 * Eigenständiger Dienst (Standard: Port 3002), der Produkte und Lagerbestände
 * über eine REST-API mit JSON bereitstellt. Die Statistik (Andrin) liest die
 * Daten über GET /api/produkte.
 *
 * Endpunkte:
 *   GET    /api/health          Health-Check
 *   GET    /api/produkte        Liste aller Produkte
 *   GET    /api/produkte/:id    Einzelnes Produkt
 *   POST   /api/produkte        Neues Produkt anlegen
 *   PUT    /api/produkte/:id    Produkt ändern (auch teilweise, z.B. nur lagerbestand)
 *   DELETE /api/produkte/:id    Produkt löschen
 *
 * Datenmodell: { id, name, beschreibung, preis, lagerbestand, kategorie }
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto'); // für eindeutige Produkt-IDs (UUID)

// ---------- Konfiguration (per Umgebungsvariablen anpassbar) ----------

// Port des Dienstes. Standard 3002, damit er nicht mit Statistik (3000)
// und Benutzerverwaltung (3001) kollidiert.
const PORT = process.env.PORT || 3002;

// Liegt server.js in public/, kommt die Datendatei nach <Projekt>/data/ (ausserhalb von public/),
// damit sie nicht vom statischen Webserver ausgeliefert wird.
const BASE = path.basename(__dirname) === 'public' ? path.join(__dirname, '..') : __dirname;
const DATA_FILE = process.env.DATA_FILE || path.join(BASE, 'data', 'products.json');

// ---------- Datenhaltung (JSON-Datei, atomar geschrieben) ----------

/**
 * Liest alle Produkte aus der Datendatei.
 * Gibt eine leere Liste zurück, wenn die Datei noch nicht existiert.
 * Bricht mit einem Fehler ab, wenn die Datei beschädigt ist.
 * @returns {Array<object>} Liste der Produkte
 */
function load() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    // Nicht still mit [] weitermachen: das würde beim nächsten Speichern alle Daten überschreiben.
    throw new Error(`Datendatei ${DATA_FILE} ist beschädigt: ${err.message}`);
  }
}

/**
 * Schreibt alle Produkte in die Datendatei.
 * Das Schreiben ist atomar: erst in eine temporäre Datei, dann umbenennen.
 * Bei einem Absturz mitten im Schreiben bleibt die alte Datei intakt.
 * @param {Array<object>} produkte Vollständige Liste der Produkte
 */
function save(produkte) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true }); // Ordner data/ anlegen, falls er fehlt
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(produkte, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

// Alle Produkte liegen im Arbeitsspeicher und werden bei jeder Änderung gespeichert.
let produkte = load();

// ---------- Validierung ----------
// Die Regeln liegen in validate.js, damit sie einzeln getestet werden können (Unit Tests).
// Projektstruktur: validate.js liegt im Ordner test/ neben public/ (../test/validate.js).
// Die Suche ist bewusst tolerant, damit der Server auch bei einer anderen Ablage startet.
const VALIDATE_PFADE = ['../test/validate', './test/validate', './validate'];
const validatePfad = VALIDATE_PFADE.find((p) => fs.existsSync(path.join(__dirname, `${p}.js`)));
if (!validatePfad) throw new Error('validate.js nicht gefunden. Erwartet in test/ (neben public/).');
const { validate, FIELDS } = require(validatePfad);

// ---------- App und Middleware ----------
const app = express();
app.use(express.json()); // liest JSON-Bodies in req.body

// CORS: damit Statistik/Benutzerverwaltung und Weboberflächen auf anderen Ports die API aufrufen können
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Der Browser schickt vor PUT/DELETE eine OPTIONS-Anfrage ("Preflight"), die hier direkt beantwortet wird.
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Weboberfläche ausliefern. Liegt die HTML-Datei direkt neben server.js (flache Ordnerstruktur),
// wird sie hier ausgeliefert, sonst aus dem Ordner public/.
const HTML = path.join(__dirname, 'produktverwaltung.html');
app.get(['/', '/produktverwaltung.html'], (req, res, next) => (fs.existsSync(HTML) ? res.sendFile(HTML) : next()));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Sucht das Produkt zur ID aus der URL.
 * Antwortet selbst mit 404, wenn es keins gibt. Der Aufrufer muss dann nur noch abbrechen.
 * @returns {object|undefined} Das Produkt oder undefined
 */
function findProdukt(req, res) {
  const produkt = produkte.find((p) => p.id === req.params.id);
  if (!produkt) res.status(404).json({ error: `Produkt ${req.params.id} nicht gefunden` });
  return produkt;
}

// ---------- Routen ----------

// Health-Check (für Monitoring / Docker / Demo): zeigt, dass der Dienst läuft
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'produkt-lagerverwaltung', produkte: produkte.length });
});

// Liste aller Produkte (wird von der Statistik genutzt)
app.get('/api/produkte', (req, res) => res.json(produkte));

// Einzelnes Produkt: 200 oder 404
app.get('/api/produkte/:id', (req, res) => {
  const p = findProdukt(req, res);
  if (p) res.json(p);
});

// Neues Produkt anlegen: 201 bei Erfolg, 400 bei ungültigen Daten
app.post('/api/produkte', (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });
  const { name, beschreibung = '', preis, lagerbestand, kategorie = '' } = req.body;
  // Die ID vergibt der Server (UUID), der Client kann keine vorgeben.
  const produkt = {
    id: randomUUID(), name: name.trim(), beschreibung, preis, lagerbestand, kategorie: kategorie.trim(),
  };
  produkte.push(produkt);
  save(produkte);
  res.status(201).location(`/api/produkte/${produkt.id}`).json(produkt);
});

// Produkt aktualisieren (auch teilweise, z.B. nur { "lagerbestand": 50 })
// So wird auch der Lagerbestand geändert, denn die Schnittstelle kennt kein PATCH.
app.put('/api/produkte/:id', (req, res) => {
  const p = findProdukt(req, res);
  if (!p) return;
  // Ein leerer Body ist kein sinnvolles Update
  if (!FIELDS.some((k) => req.body[k] !== undefined)) {
    return res.status(400).json({ errors: [`mindestens eines dieser Felder angeben: ${FIELDS.join(', ')}`] });
  }
  const errors = validate(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ errors });
  // Nur die mitgesendeten Felder übernehmen. name und kategorie werden von Leerzeichen am Rand befreit.
  for (const key of FIELDS) {
    if (req.body[key] === undefined) continue;
    p[key] = typeof req.body[key] === 'string' && (key === 'name' || key === 'kategorie')
      ? req.body[key].trim() : req.body[key];
  }
  save(produkte);
  res.json(p);
});

// Produkt löschen: 204 ohne Inhalt oder 404
app.delete('/api/produkte/:id', (req, res) => {
  const p = findProdukt(req, res);
  if (!p) return;
  produkte = produkte.filter((x) => x.id !== p.id);
  save(produkte);
  res.status(204).end();
});

// ---------- Fehlerbehandlung: immer JSON, nie HTML ----------

// Unbekannte Route unter /api: 404 als JSON
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} existiert nicht` });
});

// Zentraler Error-Handler (Express erkennt ihn an den vier Parametern).
// Ohne ihn würde Express bei kaputtem JSON eine HTML-Fehlerseite senden.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Ungültiges JSON im Request-Body' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request-Body zu gross' });
  console.error(err); // unerwarteter Fehler: im Server-Log festhalten, dem Client aber keine Details zeigen
  res.status(500).json({ error: 'Interner Serverfehler' });
});

// ---------- Start ----------

// Nur starten, wenn direkt ausgeführt (die Tests importieren die App ohne Port zu belegen)
if (require.main === module) {
  app.listen(PORT, () => console.log(`Produkt-/Lagerverwaltung läuft auf http://localhost:${PORT}`));
}

module.exports = app; // für die automatisierten Tests