/**
 * Automatisierte API-Tests der Produkt-/Lagerverwaltung
 *
 * Verwendet den in Node.js eingebauten Test-Runner (node:test), es sind keine
 * zusätzlichen Pakete nötig. Die App wird auf einem zufälligen freien Port
 * gestartet und per fetch() aufgerufen (Integrationstests der REST-API).
 *
 * Ausführen mit: npm test   (benötigt Node.js 18+)
 * Mit Abdeckung: node --test --experimental-test-coverage
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

// ---------- Testumgebung ----------

// Testdaten in temporärer Datei, damit data/products.json unberührt bleibt.
// DATA_FILE muss gesetzt sein, bevor server.js geladen wird, weil er die Datei beim Start einliest.
const tmpFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'lager-')), 'products.json');
fs.writeFileSync(tmpFile, '[]');
process.env.DATA_FILE = tmpFile;

// server.js liegt je nach Ordnerstruktur neben dieser Datei oder eine Ebene höher
const app = require(fs.existsSync(path.join(__dirname, 'server.js')) ? './server' : '../server');
let server, base;

// Vor allen Tests: Server auf Port 0 starten (das Betriebssystem wählt einen freien Port)
test.before(async () => {
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://localhost:${server.address().port}`;
});
// Nach allen Tests: Server wieder beenden, sonst läuft der Test-Prozess weiter
test.after(() => server.close());

// ---------- Hilfsfunktionen ----------

/**
 * Sendet einen Request an den Testserver.
 * @param {string} method HTTP-Methode
 * @param {string} url Pfad, z.B. '/api/produkte'
 * @param {object|string} [body] Objekt (wird zu JSON) oder ein fertiger String, z.B. um kaputtes JSON zu senden
 */
const call = (method, url, body) =>
  fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });

// Ein gültiges Produkt, das die Tests als Vorlage verwenden
const gueltig = { name: 'Testprodukt', beschreibung: 'x', preis: 9.5, lagerbestand: 10, kategorie: 'Test' };

// ---------- Tests ----------

// T1: Der Dienst meldet sich als lauffähig
test('Health-Check antwortet ok', async () => {
  const res = await call('GET', '/api/health');
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'ok');
});

// T2: Anlegen ergibt 201 und der Server vergibt die ID
test('POST legt Produkt an (201) und vergibt String-ID', async () => {
  const res = await call('POST', '/api/produkte', gueltig);
  assert.equal(res.status, 201);
  const p = await res.json();
  assert.equal(typeof p.id, 'string');
  assert.equal(p.name, 'Testprodukt');
});

// T3: Jede dieser Eingaben verletzt eine Validierungsregel
test('POST mit ungültigen Daten gibt 400', async () => {
  const ungueltig = [
    {},                                  // Pflichtfelder fehlen
    { ...gueltig, name: '  ' },          // Name nur Leerzeichen
    { ...gueltig, preis: -1 },           // negativer Preis
    { ...gueltig, lagerbestand: 1.5 },   // Bestand keine Ganzzahl
    { ...gueltig, preis: '5' },          // Preis als Text statt Zahl
  ];
  for (const bad of ungueltig) {
    const res = await call('POST', '/api/produkte', bad);
    assert.equal(res.status, 400, JSON.stringify(bad)); // bei einem Fehlschlag steht der Body in der Meldung
  }
});

// T4: Der Client bekommt auch bei kaputtem JSON eine JSON-Antwort, keine HTML-Fehlerseite
test('Kaputtes JSON gibt 400 als JSON', async () => {
  const res = await call('POST', '/api/produkte', '{kaputt');
  assert.equal(res.status, 400);
  assert.ok((await res.json()).error);
});

// T5: Ein angelegtes Produkt erscheint in der Liste und ist einzeln abrufbar
test('GET Liste und GET einzeln', async () => {
  const { id } = await (await call('POST', '/api/produkte', gueltig)).json();
  const liste = await (await call('GET', '/api/produkte')).json();
  assert.ok(liste.some((p) => p.id === id));
  const res = await call('GET', `/api/produkte/${id}`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).id, id);
});

// T6: Eine unbekannte ID ergibt 404
test('GET unbekannte ID gibt 404', async () => {
  const res = await call('GET', '/api/produkte/gibt-es-nicht');
  assert.equal(res.status, 404);
});

// T7: So ändert die Oberfläche den Lagerbestand: nur ein Feld senden, die anderen bleiben unverändert
test('PUT ändert nur den Lagerbestand (Teil-Update)', async () => {
  const { id } = await (await call('POST', '/api/produkte', gueltig)).json();
  const res = await call('PUT', `/api/produkte/${id}`, { lagerbestand: 42 });
  assert.equal(res.status, 200);
  const p = await res.json();
  assert.equal(p.lagerbestand, 42);
  assert.equal(p.name, 'Testprodukt'); // Name ist unverändert
});

// T8: Ein negativer Bestand und ein leerer Body werden abgelehnt, eine unbekannte ID ergibt 404
test('PUT mit ungültigem Bestand oder leerem Body gibt 400, unbekannte ID 404', async () => {
  const { id } = await (await call('POST', '/api/produkte', gueltig)).json();
  assert.equal((await call('PUT', `/api/produkte/${id}`, { lagerbestand: -5 })).status, 400);
  assert.equal((await call('PUT', `/api/produkte/${id}`, {})).status, 400);
  assert.equal((await call('PUT', '/api/produkte/xyz', { lagerbestand: 1 })).status, 404);
});

// T9: Löschen ergibt 204, danach ist das Produkt weg (ein zweites Löschen ergibt 404)
test('DELETE löscht (204), danach 404', async () => {
  const { id } = await (await call('POST', '/api/produkte', gueltig)).json();
  assert.equal((await call('DELETE', `/api/produkte/${id}`)).status, 204);
  assert.equal((await call('GET', `/api/produkte/${id}`)).status, 404);
  assert.equal((await call('DELETE', `/api/produkte/${id}`)).status, 404);
});

// T10: Auch eine unbekannte Route unter /api liefert JSON
test('Unbekannte API-Route gibt JSON-404', async () => {
  const res = await call('GET', '/api/gibtsnicht');
  assert.equal(res.status, 404);
  assert.ok((await res.json()).error);
});

// T11: Die Daten stehen wirklich in der Datei (Persistenz). Dieser Test muss nach den anderen laufen,
// die Produkte angelegt haben. node:test führt die Tests in der Reihenfolge der Datei aus.
test('Daten werden persistent gespeichert', async () => {
  const gespeichert = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
  assert.ok(Array.isArray(gespeichert) && gespeichert.length > 0);
});