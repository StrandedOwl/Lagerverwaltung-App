// Reine Berechnungslogik der Statistik-Komponente.
// Die Funktionen erhalten die Rohdaten der anderen Komponenten (Benutzer, Produkte)
// und haben keine Seiteneffekte – dadurch sind sie einfach mit Unit-Tests prüfbar.

const STANDARD_SCHWELLENWERT = 10;
const OHNE_KATEGORIE = "Ohne Kategorie";

// Wandelt einen Wert in eine Zahl um. Ungültige Werte (null, "abc", ...) zählen als 0,
// damit ein einzelner fehlerhafter Datensatz nicht die ganze Auswertung verfälscht.
function zahl(wert) {
  const n = Number(wert);
  return Number.isFinite(n) ? n : 0;
}

// Rundet Geldbeträge auf zwei Nachkommastellen (Rappen).
function runden(betrag) {
  return Math.round(betrag * 100) / 100;
}

function kategorieVon(produkt) {
  const kategorie = typeof produkt.kategorie === "string" ? produkt.kategorie.trim() : "";
  return kategorie || OHNE_KATEGORIE;
}

function lagerwertVon(produkt) {
  return zahl(produkt.preis) * zahl(produkt.lagerbestand);
}

// Zählt, wie oft jeder Wert eines Feldes vorkommt, z.B. { admin: 2, mitarbeiter: 5 }.
function zaehleNach(liste, feld) {
  return liste.reduce((zaehler, eintrag) => {
    const schluessel = eintrag[feld] || "unbekannt";
    zaehler[schluessel] = (zaehler[schluessel] || 0) + 1;
    return zaehler;
  }, {});
}

/**
 * Kennzahlen über das gesamte System.
 * @param {Array} benutzer Liste aus GET /api/benutzer
 * @param {Array} produkte Liste aus GET /api/produkte
 */
function berechneUebersicht(benutzer, produkte) {
  const gesamtLagerbestand = produkte.reduce((summe, p) => summe + zahl(p.lagerbestand), 0);
  const gesamtwertLager = produkte.reduce((summe, p) => summe + lagerwertVon(p), 0);

  return {
    anzahlBenutzer: benutzer.length,
    benutzerProRolle: zaehleNach(benutzer, "rolle"),
    anzahlProdukte: produkte.length,
    anzahlKategorien: new Set(produkte.map(kategorieVon)).size,
    gesamtLagerbestand,
    gesamtwertLager: runden(gesamtwertLager),
  };
}

/**
 * Auswertung des Lagerbestands: Produkte mit niedrigem Bestand und Werte pro Kategorie.
 * @param {Array} produkte Liste aus GET /api/produkte
 * @param {number} schwellenwert Produkte mit Bestand <= Schwellenwert gelten als "niedrig"
 */
function berechneLagerbestand(produkte, schwellenwert = STANDARD_SCHWELLENWERT) {
  const produkteNiedrigerBestand = produkte
    .filter((p) => zahl(p.lagerbestand) <= schwellenwert)
    .map((p) => ({
      id: p.id,
      name: p.name,
      kategorie: kategorieVon(p),
      lagerbestand: zahl(p.lagerbestand),
    }))
    .sort((a, b) => a.lagerbestand - b.lagerbestand || String(a.name).localeCompare(String(b.name)));

  // Produkte nach Kategorie gruppieren und Summen bilden.
  const kategorien = new Map();
  for (const produkt of produkte) {
    const name = kategorieVon(produkt);
    const eintrag = kategorien.get(name) || { kategorie: name, anzahlProdukte: 0, lagerbestand: 0, lagerwert: 0 };
    eintrag.anzahlProdukte += 1;
    eintrag.lagerbestand += zahl(produkt.lagerbestand);
    eintrag.lagerwert += lagerwertVon(produkt);
    kategorien.set(name, eintrag);
  }

  const proKategorie = [...kategorien.values()]
    .map((k) => ({ ...k, lagerwert: runden(k.lagerwert) }))
    .sort((a, b) => b.lagerwert - a.lagerwert);

  return {
    schwellenwert,
    anzahlAusverkauft: produkteNiedrigerBestand.filter((p) => p.lagerbestand <= 0).length,
    anzahlNiedrigerBestand: produkteNiedrigerBestand.length,
    produkteNiedrigerBestand,
    proKategorie,
  };
}

module.exports = {
  STANDARD_SCHWELLENWERT,
  OHNE_KATEGORIE,
  berechneUebersicht,
  berechneLagerbestand,
};
