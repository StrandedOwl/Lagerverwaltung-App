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
| GET | `/api/statistik/lagerbestand` | Auswertung Lagerbestand (z.B. Produkte mit niedrigem Bestand) |

Ruft dafür intern auf: `GET /api/benutzer` und `GET /api/produkte`.