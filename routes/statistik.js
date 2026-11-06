// REST-Endpunkte der Statistik-Komponente (siehe Schnittstellen.md, Abschnitt 3).

const express = require("express");
const { ladeBenutzer, ladeProdukte, DatenquelleFehler } = require("../services/datenquellen");
const { berechneUebersicht, berechneLagerbestand, STANDARD_SCHWELLENWERT } = require("../services/statistik");

const router = express.Router();

// GET /api/statistik/uebersicht
// Anzahl Benutzer, Anzahl Produkte, Gesamtbestand und Gesamtwert des Lagers.
// Fällt nur die Benutzerverwaltung aus, werden die Produktzahlen trotzdem geliefert
// (Benutzerwerte = null, Grund in "warnungen"). Ohne Produktdaten gibt es einen Fehler.
router.get("/uebersicht", async (req, res, next) => {
  const [benutzer, produkte] = await Promise.allSettled([ladeBenutzer(), ladeProdukte()]);

  if (produkte.status === "rejected") return next(produkte.reason);

  const ergebnis = berechneUebersicht(benutzer.status === "fulfilled" ? benutzer.value : null, produkte.value);
  if (benutzer.status === "rejected") {
    console.warn(benutzer.reason.message);
    ergebnis.warnungen = [benutzer.reason.message];
  }
  res.json(ergebnis);
});

// GET /api/statistik/lagerbestand?schwellenwert=10
// Produkte mit niedrigem Bestand sowie Bestand und Wert pro Kategorie.
router.get("/lagerbestand", async (req, res, next) => {
  const schwellenwert =
    req.query.schwellenwert === undefined ? STANDARD_SCHWELLENWERT : Number(req.query.schwellenwert);

  if (!Number.isInteger(schwellenwert) || schwellenwert < 0) {
    return res.status(400).json({ fehler: "schwellenwert muss eine ganze Zahl >= 0 sein" });
  }

  try {
    const produkte = await ladeProdukte();
    res.json(berechneLagerbestand(produkte, schwellenwert));
  } catch (err) {
    next(err);
  }
});

// Fehlerbehandlung: Ausfälle anderer Komponenten werden mit einer verständlichen
// Meldung zurückgegeben, statt den Server abstürzen zu lassen.
router.use((err, req, res, next) => {
  if (err instanceof DatenquelleFehler) {
    console.warn(err.message);
    return res.status(500).json({ fehler: err.message, komponente: err.komponente });
  }
  console.error(err);
  res.status(500).json({ fehler: "Interner Fehler der Statistik-Komponente" });
});

module.exports = router;
