// Frontend der Statistik-Komponente: lädt die Auswertungen von der Statistik-API
// und stellt sie als Kennzahlen, Tabelle und Balkendiagramm dar.

const chf = new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" });
const anzahl = new Intl.NumberFormat("de-CH");

const $ = (id) => document.getElementById(id);

// Lädt JSON von der API und wirft bei Fehlern die Meldung des Servers weiter.
async function ladeJson(url) {
  const antwort = await fetch(url);
  const daten = await antwort.json().catch(() => ({}));
  if (!antwort.ok) {
    throw new Error(daten.fehler || `Anfrage fehlgeschlagen (HTTP ${antwort.status})`);
  }
  return daten;
}

function zeigeMeldung(text) {
  const meldung = $("meldung");
  meldung.textContent = text;
  meldung.hidden = !text;
}

// Erstellt eine Tabellenzelle. Daten aus anderen Komponenten werden immer als Text
// eingefügt (nie als HTML), damit kein fremdes Markup ausgeführt werden kann.
function zelle(text, klasse) {
  const td = document.createElement("td");
  td.textContent = text;
  if (klasse) td.className = klasse;
  return td;
}

function leereZeile(tbody, spalten, text) {
  const tr = document.createElement("tr");
  const td = zelle(text, "leer");
  td.colSpan = spalten;
  tr.appendChild(td);
  tbody.replaceChildren(tr);
}

// ---------- Kennzahlen ----------

function zeigeUebersicht(daten) {
  $("gesamtwertLager").textContent = chf.format(daten.gesamtwertLager);
  $("anzahlProdukte").textContent = anzahl.format(daten.anzahlProdukte);
  $("anzahlKategorien").textContent = `in ${daten.anzahlKategorien} Kategorien`;
  $("gesamtLagerbestand").textContent = anzahl.format(daten.gesamtLagerbestand);
  $("anzahlBenutzer").textContent = anzahl.format(daten.anzahlBenutzer);
  $("benutzerProRolle").textContent = Object.entries(daten.benutzerProRolle)
    .map(([rolle, n]) => `${n} ${rolle}`)
    .join(" · ");
}

// ---------- Lagerbestand ----------

function zeigeNiedrigenBestand(daten) {
  $("lagerZusammenfassung").textContent =
    `${daten.anzahlNiedrigerBestand} Produkte mit höchstens ${daten.schwellenwert} Stück, ` +
    `davon ${daten.anzahlAusverkauft} ausverkauft.`;

  const tbody = $("niedrigerBestand");
  if (daten.produkteNiedrigerBestand.length === 0) {
    leereZeile(tbody, 4, "Alle Produkte liegen über dem Schwellenwert.");
    return;
  }

  tbody.replaceChildren(
    ...daten.produkteNiedrigerBestand.map((p) => {
      const ausverkauft = p.lagerbestand <= 0;
      const tr = document.createElement("tr");
      tr.append(
        zelle(p.name),
        zelle(p.kategorie),
        zelle(anzahl.format(p.lagerbestand), "zahl"),
        // Status immer mit Text, nicht nur mit Farbe
        zelle(ausverkauft ? "Ausverkauft" : "Niedrig", ausverkauft ? "status status-kritisch" : "status status-warnung")
      );
      return tr;
    })
  );
}

function zeigeKategorien(daten) {
  const tbody = $("proKategorie");
  if (daten.proKategorie.length === 0) {
    leereZeile(tbody, 4, "Keine Produkte vorhanden.");
    return;
  }

  // Balkenlänge relativ zur grössten Kategorie
  const maximum = Math.max(...daten.proKategorie.map((k) => k.lagerwert), 1);

  tbody.replaceChildren(
    ...daten.proKategorie.map((k) => {
      const tr = document.createElement("tr");

      const balkenZelle = document.createElement("td");
      balkenZelle.className = "balken-spalte";
      const balken = document.createElement("div");
      balken.className = "balken";
      // 7rem bleiben für die Wertbeschriftung rechts vom Balken frei
      balken.style.width = `calc((100% - 7rem) * ${k.lagerwert / maximum})`;
      balken.title = `${k.kategorie}: ${chf.format(k.lagerwert)}`;
      const wert = document.createElement("span");
      wert.className = "balken-wert";
      wert.textContent = chf.format(k.lagerwert);
      const zeile = document.createElement("div");
      zeile.className = "balken-zeile";
      zeile.append(balken, wert);
      balkenZelle.appendChild(zeile);

      tr.append(
        zelle(k.kategorie),
        zelle(anzahl.format(k.anzahlProdukte), "zahl"),
        zelle(anzahl.format(k.lagerbestand), "zahl"),
        balkenZelle
      );
      return tr;
    })
  );
}

// ---------- Laden ----------

async function ladeLagerbestand() {
  const schwellenwert = $("schwellenwert").value;
  const daten = await ladeJson(`/api/statistik/lagerbestand?schwellenwert=${encodeURIComponent(schwellenwert)}`);
  zeigeNiedrigenBestand(daten);
  zeigeKategorien(daten);
}

async function ladeAlles() {
  zeigeMeldung("");
  const ergebnisse = await Promise.allSettled([
    ladeJson("/api/statistik/uebersicht").then(zeigeUebersicht),
    ladeLagerbestand(),
  ]);
  const fehler = ergebnisse.filter((e) => e.status === "rejected").map((e) => e.reason.message);
  zeigeMeldung([...new Set(fehler)].join(" "));
}

$("schwellenwertForm").addEventListener("submit", (event) => {
  event.preventDefault();
  zeigeMeldung("");
  ladeLagerbestand().catch((err) => zeigeMeldung(err.message));
});

ladeJson("/api/health")
  .then((daten) => ($("status").textContent = "Server-Status: " + daten.status))
  .catch(() => ($("status").textContent = "Server nicht erreichbar."));

ladeAlles();
