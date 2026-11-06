// Zugriff auf die anderen Systemkomponenten über deren REST-Schnittstellen.
// Die Statistik speichert selbst keine Daten, sondern liest sie bei jeder Anfrage
// über GET /api/benutzer (Benutzerverwaltung) und GET /api/produkte (Produkt-/Lagerverwaltung).

const TIMEOUT_MS = 5000;

// Fehler, wenn eine andere Komponente nicht erreichbar ist oder ungültige Daten liefert.
class DatenquelleFehler extends Error {
  constructor(komponente, ursache) {
    super(`${komponente} nicht erreichbar oder fehlerhafte Antwort: ${ursache}`);
    this.name = "DatenquelleFehler";
    this.komponente = komponente;
  }
}

// Basis-URLs der anderen Komponenten. Standard sind die vereinbarten Ports
// (Benutzerverwaltung 3001, Produkt-/Lagerverwaltung 3002). Im Mock-Modus
// liefert der Statistik-Server die Testdaten selbst.
function basisUrl(variable, standardPort) {
  const port = process.env.MOCK_DATEN === "true" ? process.env.PORT || 3000 : standardPort;
  return (process.env[variable] || `http://localhost:${port}`).replace(/\/+$/, "");
}

async function ladeListe(komponente, url) {
  let antwort;
  try {
    antwort = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    throw new DatenquelleFehler(komponente, err.message);
  }

  if (!antwort.ok) {
    throw new DatenquelleFehler(komponente, `HTTP ${antwort.status}`);
  }

  const daten = await antwort.json().catch(() => null);
  if (!Array.isArray(daten)) {
    throw new DatenquelleFehler(komponente, "Antwort ist keine Liste");
  }
  return daten;
}

function ladeBenutzer() {
  return ladeListe("Benutzerverwaltung", `${basisUrl("BENUTZER_SERVICE_URL", 3001)}/api/benutzer`);
}

function ladeProdukte() {
  return ladeListe("Produkt-/Lagerverwaltung", `${basisUrl("PRODUKT_SERVICE_URL", 3002)}/api/produkte`);
}

module.exports = { DatenquelleFehler, ladeBenutzer, ladeProdukte };
