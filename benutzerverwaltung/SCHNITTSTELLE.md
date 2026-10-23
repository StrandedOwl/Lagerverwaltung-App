# Schnittstelle Benutzerverwaltung (Lorenzo)

Dieses Dokument beschreibt die REST-Schnittstelle der Benutzerverwaltung, wie
sie den anderen Systemkomponenten (Lagerverwaltung, Produktverwaltung,
Statistik) zur Verfügung gestellt wird.

**Status: mit der Gruppe abgesprochen** (Endpunkte, Datenmodell und Rollen
gemäss gemeinsamem Dokument "1. Benutzerverwaltung (Lorenzo)").

## Endpunkte

| Methode | Endpunkt            | Beschreibung          |
| ------- | -------------------- | ---------------------- |
| GET     | `/api/benutzer`      | Liste aller Benutzer   |
| GET     | `/api/benutzer/:id`  | Einzelner Benutzer     |
| POST    | `/api/benutzer`      | Neuen Benutzer anlegen |
| PUT     | `/api/benutzer/:id`  | Benutzer aktualisieren |
| DELETE  | `/api/benutzer/:id`  | Benutzer löschen       |

## Datenmodell (Benutzer-Objekt)

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "rolle": "admin | mitarbeiter",
  "erstelltAm": "ISO-Datum"
}
```

Das Passwort ist nie Teil dieses Objekts und wird von keinem GET-Endpunkt
zurückgegeben.

## Authentifizierung (zusätzlich zum CRUD)

Da jede Aktion im System von einem eingeloggten Benutzer ausgeführt wird,
bietet die Benutzerverwaltung zusätzlich zwei Auth-Endpunkte an, die von den
anderen Komponenten verwendet werden können:

### `POST /api/auth/login`

Request:

```json
{ "email": "lu@lagerverwaltung.app", "passwort": "..." }
```

Response `200`:

```json
{
  "token": "…",
  "gueltigBis": "2026-09-18T10:00:00.000Z",
  "benutzer": {
    "id": "b-2",
    "name": "Lu",
    "email": "lu@lagerverwaltung.app",
    "rolle": "mitarbeiter",
    "erstelltAm": "2026-02-01T09:30:00.000Z"
  }
}
```

Response `401`: `{ "error": "invalid_credentials", "message": "..." }`

### `GET /api/auth/verify`

Header: `Authorization: Bearer <token>`

Response `200`: `{ "valid": true, "benutzer": { ...siehe oben... } }`
Response `401`: Token fehlt/abgelaufen/ungültig.

Andere Komponenten validieren ein vom Frontend mitgeschicktes Token, indem sie
es an diesen Endpunkt weiterreichen, statt es selbst zu verifizieren.

> Aktuell ist das Token nur ein Base64-Platzhalter ohne Signatur – **nicht
> sicher**. Für die echte Umsetzung: JWT mit Secret/Signatur und definierter
> Ablaufzeit.

## Rollenmodell

- `admin` – volle Rechte, inkl. Benutzerverwaltung
- `mitarbeiter` – Standardrolle für alle anderen Benutzer

## Persistenz

Die Benutzer werden in MariaDB gespeichert (Tabelle `benutzer`, siehe
`db/schema.sql`). Zugriff erfolgt mit rohem SQL über `mysql2`
(`lib/db.ts` für den Connection-Pool, `lib/benutzer-repository.ts` für die
Queries) – bewusst ohne ORM, da mit MySQL/SQL direkt gearbeitet werden
sollte.

### Lokales Setup

1. `.env.example` nach `.env.local` kopieren (Werte passen zu
   `docker-compose.yml`, i. d. R. keine Anpassung nötig)
2. `npm run db:up` – startet MariaDB via Docker
3. `npm run db:migrate` – legt die Tabelle `benutzer` an
4. `npm run db:seed` – befüllt sie mit drei Testbenutzern
5. `npm run dev` – App starten

`npm run db:down` stoppt den Container wieder (Daten bleiben im Docker-Volume
erhalten).

## Offene Punkte

- Passwort-Hashing (bcrypt) statt Klartext-Platzhalter
- Token-Format: eigenes Verifizieren via Secret vs. immer `/api/auth/verify`
  aufrufen – mit Gruppe klären, falls andere Komponenten Requests direkt
  selbst validieren wollen
- Base-URL/Port dieser Komponente im Gesamtsystem (für die anderen, die diese
  API aufrufen)
