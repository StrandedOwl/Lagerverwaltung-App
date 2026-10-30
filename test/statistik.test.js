// Unit-Tests für die Berechnungslogik der Statistik (node:test, ohne Zusatzpakete).
// Ausführen mit: npm test

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  berechneUebersicht,
  berechneLagerbestand,
  STANDARD_SCHWELLENWERT,
  OHNE_KATEGORIE,
} = require("../services/statistik");

const benutzer = [
  { id: "1", name: "A", rolle: "admin" },
  { id: "2", name: "B", rolle: "mitarbeiter" },
  { id: "3", name: "C", rolle: "mitarbeiter" },
];

const produkte = [
  { id: "p1", name: "Schraube", preis: 0.15, lagerbestand: 1200, kategorie: "Kleinteile" },
  { id: "p2", name: "Mutter", preis: 0.1, lagerbestand: 8, kategorie: "Kleinteile" },
  { id: "p3", name: "Hammer", preis: 24.5, lagerbestand: 0, kategorie: "Werkzeug" },
  { id: "p4", name: "Säge", preis: 30, lagerbestand: 2, kategorie: "Werkzeug" },
];

test("Übersicht: zählt Benutzer, Produkte und Kategorien", () => {
  const ergebnis = berechneUebersicht(benutzer, produkte);
  assert.equal(ergebnis.anzahlBenutzer, 3);
  assert.deepEqual(ergebnis.benutzerProRolle, { admin: 1, mitarbeiter: 2 });
  assert.equal(ergebnis.anzahlProdukte, 4);
  assert.equal(ergebnis.anzahlKategorien, 2);
});

test("Übersicht: berechnet Gesamtbestand und Gesamtwert", () => {
  const ergebnis = berechneUebersicht(benutzer, produkte);
  assert.equal(ergebnis.gesamtLagerbestand, 1210);
  // 1200*0.15 + 8*0.1 + 0*24.5 + 2*30 = 180 + 0.8 + 0 + 60
  assert.equal(ergebnis.gesamtwertLager, 240.8);
});

test("Übersicht: leere Listen ergeben Nullwerte", () => {
  const ergebnis = berechneUebersicht([], []);
  assert.deepEqual(ergebnis, {
    anzahlBenutzer: 0,
    benutzerProRolle: {},
    anzahlProdukte: 0,
    anzahlKategorien: 0,
    gesamtLagerbestand: 0,
    gesamtwertLager: 0,
  });
});

test("Übersicht: ungültige Zahlen und Zahlen als Text werden robust behandelt", () => {
  const ergebnis = berechneUebersicht([], [
    { preis: "10", lagerbestand: "3" },
    { preis: null, lagerbestand: "abc" },
  ]);
  assert.equal(ergebnis.gesamtLagerbestand, 3);
  assert.equal(ergebnis.gesamtwertLager, 30);
});

test("Lagerbestand: findet Produkte mit niedrigem Bestand, aufsteigend sortiert", () => {
  const ergebnis = berechneLagerbestand(produkte, 10);
  assert.deepEqual(
    ergebnis.produkteNiedrigerBestand.map((p) => p.name),
    ["Hammer", "Säge", "Mutter"]
  );
  assert.equal(ergebnis.anzahlNiedrigerBestand, 3);
  assert.equal(ergebnis.anzahlAusverkauft, 1);
});

test("Lagerbestand: Schwellenwert ist inklusiv", () => {
  const ergebnis = berechneLagerbestand(produkte, 8);
  assert.ok(ergebnis.produkteNiedrigerBestand.some((p) => p.name === "Mutter"));
  assert.equal(berechneLagerbestand(produkte, 7).anzahlNiedrigerBestand, 2);
});

test("Lagerbestand: ohne Angabe gilt der Standard-Schwellenwert", () => {
  assert.equal(berechneLagerbestand(produkte).schwellenwert, STANDARD_SCHWELLENWERT);
});

test("Lagerbestand: summiert pro Kategorie und sortiert nach Lagerwert", () => {
  const { proKategorie } = berechneLagerbestand(produkte, 10);
  assert.deepEqual(proKategorie, [
    { kategorie: "Kleinteile", anzahlProdukte: 2, lagerbestand: 1208, lagerwert: 180.8 },
    { kategorie: "Werkzeug", anzahlProdukte: 2, lagerbestand: 2, lagerwert: 60 },
  ]);
});

test("Lagerbestand: Produkte ohne Kategorie werden zusammengefasst", () => {
  const { proKategorie } = berechneLagerbestand([
    { name: "X", preis: 1, lagerbestand: 1 },
    { name: "Y", preis: 1, lagerbestand: 1, kategorie: "  " },
  ]);
  assert.equal(proKategorie.length, 1);
  assert.equal(proKategorie[0].kategorie, OHNE_KATEGORIE);
  assert.equal(proKategorie[0].anzahlProdukte, 2);
});
