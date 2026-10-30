## Grundsätze
- **Format:** JSON (`Content-Type: application/json`)
- **Protokoll:** REST über HTTP
- **Statuscodes:** 200 (OK), 201 (Created), 400 (Fehlerhafte Anfrage), 404 (Nicht gefunden), 500 (Serverfehler)

## 1. Benutzerverwaltung (Lorenzo)

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | `/api/benutzer` | Liste aller Benutzer |
| GET | `/api/benutzer/:id` | Einzelner Benutzer |
| POST | `/api/benutzer` | Neuen Benutzer anlegen |
| PUT | `/api/benutzer/:id` | Benutzer aktualisieren |
| DELETE | `/api/benutzer/:id` | Benutzer löschen |

**Datenmodell (Benutzer-Objekt):**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "rolle": "admin | mitarbeiter",
  "erstelltAm": "ISO-Datum"
}
```

## 2. Produkt-/Lagerverwaltung (Louis)

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | `/api/produkte` | Liste aller Produkte |
| GET | `/api/produkte/:id` | Einzelnes Produkt |
| POST | `/api/produkte` | Neues Produkt anlegen |
| PUT | `/api/produkte/:id` | Produkt aktualisieren (z.B. Lagerbestand ändern) |
| DELETE | `/api/produkte/:id` | Produkt löschen |

**Datenmodell (Produkt-Objekt):**
```json
{
  "id": "string",
  "name": "string",
  "beschreibung": "string",
  "preis": "number",
  "lagerbestand": "number",
  "kategorie": "string"
}
```

## 3. Statistik (Andrin)

Diese Komponente hat i.d.R. keine eigenen Schreib-Endpunkte für die anderen – sie **ruft** deren GET-Endpunkte auf und wertet die Daten aus.

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | `/api/statistik/uebersicht` | Anzahl Benutzer, Anzahl Produkte, Gesamtwert Lager |
| GET | `/api/statistik/lagerbestand?schwellenwert=10` | Auswertung Lagerbestand (z.B. Produkte mit niedrigem Bestand) |

Ruft dafür intern auf: `GET /api/benutzer` und `GET /api/produkte`.
Die Adressen dieser Komponenten werden über `BENUTZER_SERVICE_URL` und `PRODUKT_SERVICE_URL` in der `.env` konfiguriert (leer = gleicher Server).

**Antwort `GET /api/statistik/uebersicht`:**
```json
{
  "anzahlBenutzer": 4,
  "benutzerProRolle": { "admin": 2, "mitarbeiter": 2 },
  "anzahlProdukte": 8,
  "anzahlKategorien": 4,
  "gesamtLagerbestand": 1335,
  "gesamtwertLager": 3026.9
}
```

**Antwort `GET /api/statistik/lagerbestand`:**

Query-Parameter `schwellenwert` (optional, ganze Zahl >= 0, Standard `10`): Produkte mit `lagerbestand <= schwellenwert` gelten als niedrig. Ein ungültiger Wert ergibt Status 400.
```json
{
  "schwellenwert": 10,
  "anzahlAusverkauft": 1,
  "anzahlNiedrigerBestand": 2,
  "produkteNiedrigerBestand": [
    { "id": "p4", "name": "Hammer", "kategorie": "Werkzeug", "lagerbestand": 0 },
    { "id": "p7", "name": "Schutzbrille", "kategorie": "Schutzausrüstung", "lagerbestand": 3 }
  ],
  "proKategorie": [
    { "kategorie": "Werkzeug", "anzahlProdukte": 3, "lagerbestand": 19, "lagerwert": 2013.6 }
  ]
}
```

**Fehlerfall:** Ist eine andere Komponente nicht erreichbar, antwortet die Statistik mit Status 500:
```json
{ "fehler": "Benutzerverwaltung nicht erreichbar oder fehlerhafte Antwort: HTTP 404", "komponente": "Benutzerverwaltung" }
```