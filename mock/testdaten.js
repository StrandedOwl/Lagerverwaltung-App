// Testdaten für die Entwicklung, solange Benutzer- und Produktverwaltung noch nicht laufen.
// Wird nur aktiviert, wenn in der .env MOCK_DATEN=true gesetzt ist.
// Die Daten entsprechen den Datenmodellen aus Schnittstellen.md.

const express = require("express");

const benutzer = [
  { id: "1", name: "Lorenzo", email: "lorenzo@example.ch", rolle: "admin", erstelltAm: "2026-09-01T08:00:00Z" },
  { id: "2", name: "Louis", email: "louis@example.ch", rolle: "admin", erstelltAm: "2026-09-01T08:05:00Z" },
  { id: "3", name: "Andrin", email: "andrin@example.ch", rolle: "mitarbeiter", erstelltAm: "2026-09-02T09:30:00Z" },
  { id: "4", name: "Sara", email: "sara@example.ch", rolle: "mitarbeiter", erstelltAm: "2026-09-10T14:15:00Z" },
];

const produkte = [
  { id: "p1", name: "Schraube M6", beschreibung: "Edelstahl, 20 mm", preis: 0.15, lagerbestand: 1200, kategorie: "Kleinteile" },
  { id: "p2", name: "Mutter M6", beschreibung: "Edelstahl", preis: 0.1, lagerbestand: 8, kategorie: "Kleinteile" },
  { id: "p3", name: "Akkuschrauber", beschreibung: "18 V", preis: 129.9, lagerbestand: 14, kategorie: "Werkzeug" },
  { id: "p4", name: "Hammer", beschreibung: "500 g", preis: 24.5, lagerbestand: 0, kategorie: "Werkzeug" },
  { id: "p5", name: "Wasserwaage", beschreibung: "60 cm", preis: 39.0, lagerbestand: 5, kategorie: "Werkzeug" },
  { id: "p6", name: "Arbeitshandschuhe", beschreibung: "Grösse L", preis: 9.9, lagerbestand: 60, kategorie: "Schutzausrüstung" },
  { id: "p7", name: "Schutzbrille", beschreibung: "klar", preis: 12.0, lagerbestand: 3, kategorie: "Schutzausrüstung" },
  { id: "p8", name: "Kabelbinder", beschreibung: "100 Stk.", preis: 4.5, lagerbestand: 45, kategorie: "Elektro" },
];

const router = express.Router();
router.get("/benutzer", (req, res) => res.json(benutzer));
router.get("/produkte", (req, res) => res.json(produkte));

module.exports = router;
