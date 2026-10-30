const express = require('express');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

// ---------- Konfiguration (per Umgebungsvariablen anpassbar) ----------
const PORT = process.env.PORT || 3002;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'products.json');

// ---------- Datenhaltung (JSON-Datei, atomar geschrieben) ----------
function load() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    // Nicht still mit [] weitermachen: das würde beim nächsten Speichern alle Daten überschreiben.
    throw new Error(`Datendatei ${DATA_FILE} ist beschädigt: ${err.message}`);
  }
}

function save(produkte) {
  // Erst in temporäre Datei schreiben, dann umbenennen: bei einem Absturz bleibt die alte Datei intakt.
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(produkte, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

let produkte = load();

// ---------- Validierung ----------
// Datenmodell: { id, name, beschreibung, preis, lagerbestand, kategorie }
const FIELDS = ['name', 'beschreibung', 'preis', 'lagerbestand', 'kategorie'];

function validate(body, { partial = false } = {}) {
  const errors = [];
  const has = (k) => body[k] !== undefined;

  if (!partial || has('name')) {
    if (typeof body.name !== 'string' || !body.name.trim()) errors.push('name muss ein nicht-leerer Text sein');
    else if (body.name.length > 100) errors.push('name darf maximal 100 Zeichen lang sein');
  }
  if (has('beschreibung') && typeof body.beschreibung !== 'string') errors.push('beschreibung muss ein Text sein');
  if (has('kategorie') && typeof body.kategorie !== 'string') errors.push('kategorie muss ein Text sein');
  if (!partial || has('preis')) {
    if (typeof body.preis !== 'number' || !Number.isFinite(body.preis) || body.preis < 0) {
      errors.push('preis muss eine Zahl >= 0 sein');
    }
  }
  if (!partial || has('lagerbestand')) {
    if (!Number.isInteger(body.lagerbestand) || body.lagerbestand < 0) {
      errors.push('lagerbestand muss eine ganze Zahl >= 0 sein');
    }
  }
  return errors;
}

// ---------- App ----------
const app = express();
app.use(express.json());

// CORS: damit Statistik/Benutzerverwaltung (andere Ports) die API aufrufen können
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Liegt die HTML-Datei direkt neben server.js (flache Ordnerstruktur), wird sie hier ausgeliefert
const HTML = path.join(__dirname, 'produktverwaltung.html');
app.get(['/', '/produktverwaltung.html'], (req, res, next) => (fs.existsSync(HTML) ? res.sendFile(HTML) : next()));
app.use(express.static(path.join(__dirname, 'public')));

function findProdukt(req, res) {
  const produkt = produkte.find((p) => p.id === req.params.id);
  if (!produkt) res.status(404).json({ error: `Produkt ${req.params.id} nicht gefunden` });
  return produkt;
}

// Health-Check (für Monitoring / Docker / Demo)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'produkt-lagerverwaltung', produkte: produkte.length });
});

// Liste aller Produkte
app.get('/api/produkte', (req, res) => res.json(produkte));

// Einzelnes Produkt
app.get('/api/produkte/:id', (req, res) => {
  const p = findProdukt(req, res);
  if (p) res.json(p);
});

// Neues Produkt anlegen
app.post('/api/produkte', (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });
  const { name, beschreibung = '', preis, lagerbestand, kategorie = '' } = req.body;
  const produkt = {
    id: randomUUID(), name: name.trim(), beschreibung, preis, lagerbestand, kategorie: kategorie.trim(),
  };
  produkte.push(produkt);
  save(produkte);
  res.status(201).location(`/api/produkte/${produkt.id}`).json(produkt);
});

// Produkt aktualisieren (auch teilweise, z.B. nur { "lagerbestand": 50 })
app.put('/api/produkte/:id', (req, res) => {
  const p = findProdukt(req, res);
  if (!p) return;
  if (!FIELDS.some((k) => req.body[k] !== undefined)) {
    return res.status(400).json({ errors: [`mindestens eines dieser Felder angeben: ${FIELDS.join(', ')}`] });
  }
  const errors = validate(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ errors });
  for (const key of FIELDS) {
    if (req.body[key] === undefined) continue;
    p[key] = typeof req.body[key] === 'string' && (key === 'name' || key === 'kategorie')
      ? req.body[key].trim() : req.body[key];
  }
  save(produkte);
  res.json(p);
});

// Produkt löschen
app.delete('/api/produkte/:id', (req, res) => {
  const p = findProdukt(req, res);
  if (!p) return;
  produkte = produkte.filter((x) => x.id !== p.id);
  save(produkte);
  res.status(204).end();
});

// ---------- Fehlerbehandlung: immer JSON, nie HTML ----------
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} existiert nicht` });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Ungültiges JSON im Request-Body' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request-Body zu gross' });
  console.error(err);
  res.status(500).json({ error: 'Interner Serverfehler' });
});

// Nur starten, wenn direkt ausgeführt (die Tests importieren die App ohne Port zu belegen)
if (require.main === module) {
  app.listen(PORT, () => console.log(`Produkt-/Lagerverwaltung läuft auf http://localhost:${PORT}`));
}

module.exports = app;