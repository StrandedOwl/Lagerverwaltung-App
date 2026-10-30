// Ausführen mit: npm test   (benötigt Node.js 18+, keine zusätzlichen Pakete)
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Testdaten in temporärer Datei, damit data/products.json unberührt bleibt
const tmpFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'lager-')), 'products.json');
fs.writeFileSync(tmpFile, '[]');
process.env.DATA_FILE = tmpFile;

const app = require(fs.existsSync(path.join(__dirname, 'server.js')) ? './server' : '../server');
let server, base;

test.before(async () => {
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://localhost:${server.address().port}`;
});
test.after(() => server.close());

const call = (method, url, body) =>
  fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });

const gueltig = { name: 'Testprodukt', beschreibung: 'x', preis: 9.5, lagerbestand: 10, kategorie: 'Test' };

test('Health-Check antwortet ok', async () => {
  const res = await call('GET', '/api/health');
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'ok');
});

test('POST legt Produkt an (201) und vergibt String-ID', async () => {
  const res = await call('POST', '/api/produkte', gueltig);
  assert.equal(res.status, 201);
  const p = await res.json();
  assert.equal(typeof p.id, 'string');
  assert.equal(p.name, 'Testprodukt');
});

test('POST mit ungültigen Daten gibt 400', async () => {
  for (const bad of [{}, { ...gueltig, name: '  ' }, { ...gueltig, preis: -1 }, { ...gueltig, lagerbestand: 1.5 }, { ...gueltig, preis: '5' }]) {
    const res = await call('POST', '/api/produkte', bad);
    assert.equal(res.status, 400, JSON.stringify(bad));
  }
});

test('Kaputtes JSON gibt 400 als JSON', async () => {
  const res = await call('POST', '/api/produkte', '{kaputt');
  assert.equal(res.status, 400);
  assert.ok((await res.json()).error);
});

test('GET Liste und GET einzeln', async () => {
  const { id } = await (await call('POST', '/api/produkte', gueltig)).json();
  const liste = await (await call('GET', '/api/produkte')).json();
  assert.ok(liste.some((p) => p.id === id));
  const res = await call('GET', `/api/produkte/${id}`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).id, id);
});

test('GET unbekannte ID gibt 404', async () => {
  const res = await call('GET', '/api/produkte/gibt-es-nicht');
  assert.equal(res.status, 404);
});

test('PUT ändert nur den Lagerbestand (Teil-Update)', async () => {
  const { id } = await (await call('POST', '/api/produkte', gueltig)).json();
  const res = await call('PUT', `/api/produkte/${id}`, { lagerbestand: 42 });
  assert.equal(res.status, 200);
  const p = await res.json();
  assert.equal(p.lagerbestand, 42);
  assert.equal(p.name, 'Testprodukt');
});

test('PUT mit ungültigem Bestand oder leerem Body gibt 400, unbekannte ID 404', async () => {
  const { id } = await (await call('POST', '/api/produkte', gueltig)).json();
  assert.equal((await call('PUT', `/api/produkte/${id}`, { lagerbestand: -5 })).status, 400);
  assert.equal((await call('PUT', `/api/produkte/${id}`, {})).status, 400);
  assert.equal((await call('PUT', '/api/produkte/xyz', { lagerbestand: 1 })).status, 404);
});

test('DELETE löscht (204), danach 404', async () => {
  const { id } = await (await call('POST', '/api/produkte', gueltig)).json();
  assert.equal((await call('DELETE', `/api/produkte/${id}`)).status, 204);
  assert.equal((await call('GET', `/api/produkte/${id}`)).status, 404);
  assert.equal((await call('DELETE', `/api/produkte/${id}`)).status, 404);
});

test('Unbekannte API-Route gibt JSON-404', async () => {
  const res = await call('GET', '/api/gibtsnicht');
  assert.equal(res.status, 404);
  assert.ok((await res.json()).error);
});

test('Daten werden persistent gespeichert', async () => {
  const gespeichert = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
  assert.ok(Array.isArray(gespeichert) && gespeichert.length > 0);
});