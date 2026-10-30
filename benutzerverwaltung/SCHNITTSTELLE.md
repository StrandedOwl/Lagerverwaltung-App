# Schnittstelle Benutzerverwaltung (Lorenzo)

Dieses Dokument beschreibt die REST-Schnittstelle der Benutzerverwaltung, wie
sie den anderen Systemkomponenten (Lagerverwaltung, Produktverwaltung,
Statistik) zur Verfügung gestellt wird.

**Status:** Endpunkte, Datenmodell und Rollen gemäss gemeinsamem Dokument
"1. Benutzerverwaltung (Lorenzo)". Die Erweiterungen (Login, Berechtigungen,
Fehlercodes) sind unten unter [Änderungen](#änderungen-gegenüber-der-ersten-version)
zusammengefasst.

## Basis-URL

```
http://localhost:3001
```

Alle Antworten sind JSON (`Content-Type: application/json`).

## Übersicht

| Methode | Endpunkt             | Login nötig?              | Beschreibung                       |
| ------- | -------------------- | ------------------------- | ---------------------------------- |
| GET     | `/api/benutzer`      | nein                      | Liste aller Benutzer               |
| GET     | `/api/benutzer/:id`  | nein                      | Einzelner Benutzer                 |
| POST    | `/api/benutzer`      | nein (Registrierung) / Admin | Neuen Benutzer anlegen          |
| PUT     | `/api/benutzer/:id`  | ja (Admin oder sich selbst) | Benutzer aktualisieren           |
| DELETE  | `/api/benutzer/:id`  | ja (nur Admin)            | Benutzer löschen                   |
| POST    | `/api/auth/login`    | nein                      | Anmelden, liefert Token            |
| GET     | `/api/auth/verify`   | Token im Header           | Token prüfen, liefert Benutzer     |
| POST    | `/api/auth/logout`   | nein                      | Login-Cookie der eigenen Oberfläche löschen |

"Login nötig" heisst: Header `Authorization: Bearer <token>` mitschicken
(Token aus `/api/auth/login`).

## Datenmodell (Benutzer-Objekt)

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "name": "Lorenzo",
  "email": "lorenzo@lagerverwaltung.app",
  "rolle": "admin",
  "erstelltAm": "2026-01-10T07:00:00.000Z"
}
```

| Feld         | Typ                          | Hinweis                                   |
| ------------ | ---------------------------- | ----------------------------------------- |
| `id`         | string (UUID)                | wird vom Server vergeben                  |
| `name`       | string                       | 1–100 Zeichen                             |
| `email`      | string                       | eindeutig, wird klein geschrieben gespeichert |
| `rolle`      | `"admin"` \| `"mitarbeiter"` |                                           |
| `erstelltAm` | string (ISO-8601, UTC)       | wird vom Server gesetzt                   |

Das Passwort (bzw. sein Hash) ist **nie** Teil der Antwort.

## Endpunkte im Detail

### `GET /api/benutzer`

Response `200`: Array von Benutzer-Objekten, älteste zuerst.

### `GET /api/benutzer/:id`

Response `200`: Benutzer-Objekt · `404 benutzer_not_found`

### `POST /api/benutzer`

Request:

```json
{
  "name": "Mia",
  "email": "mia@lagerverwaltung.app",
  "passwort": "mindestens8",
  "rolle": "mitarbeiter"
}
```

- `rolle` ist optional (Standard `"mitarbeiter"`).
- **Ohne Token** (Registrierung) ist nur `"mitarbeiter"` erlaubt. Zusätzlich wird
  das Login-Cookie gesetzt, man ist danach direkt angemeldet.
- **Mit Admin-Token** ist jede Rolle erlaubt, es wird kein Cookie gesetzt.

Response `201`: das neue Benutzer-Objekt ·
`400 invalid_request` · `403 keine_berechtigung` · `409 email_vergeben`

### `PUT /api/benutzer/:id`

Teil-Update: nur die mitgeschickten Felder werden geändert, mindestens eines ist nötig.

```json
{ "name": "Mia M.", "email": "mia.m@lagerverwaltung.app", "rolle": "admin", "passwort": "neuesPasswort" }
```

- Admins dürfen alle Benutzer bearbeiten, Mitarbeiter nur sich selbst und ohne `rolle`.
- Der letzte Admin kann nicht zum Mitarbeiter gemacht werden.

Response `200`: aktualisiertes Benutzer-Objekt ·
`400` · `401 nicht_angemeldet` · `403 keine_berechtigung` · `404` ·
`409 email_vergeben` / `409 letzter_admin`

### `DELETE /api/benutzer/:id`

Nur Admins, und nicht das eigene Konto.

Response `200`: das gelöschte Benutzer-Objekt · `401` · `403` · `404`

### `POST /api/auth/login`

Request:

```json
{ "email": "lorenzo@lagerverwaltung.app", "passwort": "lorenzo123" }
```

Response `200`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOi…",
  "gueltigBis": "2026-10-30T09:25:51.000Z",
  "benutzer": { "id": "…", "name": "Lorenzo", "email": "…", "rolle": "admin", "erstelltAm": "…" }
}
```

Das Token ist ein signiertes JWT und **1 Stunde** gültig. Es enthält nur die
Benutzer-ID. Rolle und Name immer über `/api/auth/verify` abfragen, nicht aus dem
Token lesen.

Response `400 invalid_request` · `401 invalid_credentials` (gleiche Antwort für
unbekannte Email und falsches Passwort)

### `GET /api/auth/verify`

Header: `Authorization: Bearer <token>`

Response `200`:

```json
{ "valid": true, "benutzer": { "id": "…", "name": "…", "email": "…", "rolle": "mitarbeiter", "erstelltAm": "…" } }
```

Response `401 missing_token` (kein Header) oder `401 invalid_token` (abgelaufen,
gefälscht oder Benutzer inzwischen gelöscht).

### `POST /api/auth/logout`

Löscht nur das Cookie der eigenen Oberfläche. Ein bereits ausgegebenes Token
bleibt bis `gueltigBis` gültig (JWT ist zustandslos).

## So verwenden die anderen Komponenten den Login

1. Das Frontend ruft `POST /api/auth/login` auf und merkt sich `token`.
2. Bei jedem Request an die eigene Komponente schickt es
   `Authorization: Bearer <token>` mit.
3. Das Backend der Komponente prüft das Token bei der Benutzerverwaltung:

```ts
async function pruefeLogin(authHeader: string | null) {
  if (!authHeader) return null
  const res = await fetch("http://localhost:3001/api/auth/verify", {
    headers: { Authorization: authHeader },
  })
  if (!res.ok) return null // 401 -> nicht eingeloggt
  const { benutzer } = await res.json()
  return benutzer // { id, name, email, rolle, erstelltAm }
}

// Beispiel: nur Admins dürfen Lagerorte löschen
const benutzer = await pruefeLogin(request.headers.get("authorization"))
if (!benutzer) return Response.json({ error: "nicht_angemeldet" }, { status: 401 })
if (benutzer.rolle !== "admin") return Response.json({ error: "keine_berechtigung" }, { status: 403 })
```

## Fehlerformat

Alle Fehler haben dasselbe Format:

```json
{
  "error": "invalid_request",
  "message": "Die Eingaben sind ungültig.",
  "details": ["passwort muss mindestens 8 Zeichen lang sein."]
}
```

`details` gibt es nur bei Validierungsfehlern.

| Status | `error`                | Bedeutung                                         |
| ------ | ---------------------- | ------------------------------------------------- |
| 400    | `invalid_request`      | Eingaben ungültig (Details in `details`)          |
| 400    | `invalid_json`         | Body ist kein gültiges JSON                       |
| 401    | `nicht_angemeldet`     | Aktion braucht ein gültiges Token                 |
| 401    | `invalid_credentials`  | Login fehlgeschlagen                              |
| 401    | `missing_token`        | `/verify` ohne Authorization-Header               |
| 401    | `invalid_token`        | Token abgelaufen, gefälscht oder Benutzer gelöscht |
| 403    | `keine_berechtigung`   | eingeloggt, aber nicht berechtigt                 |
| 404    | `benutzer_not_found`   | ID existiert nicht                                |
| 409    | `email_vergeben`       | Email gehört schon einem anderen Benutzer         |
| 409    | `letzter_admin`        | letzter Admin kann nicht herabgestuft werden      |
| 500    | `server_error`         | unerwarteter Fehler (z. B. Datenbank nicht erreichbar) |

## CORS

Frontends anderer Komponenten dürfen `/api/*` direkt aus dem Browser aufrufen,
wenn ihr Origin in `CORS_ORIGINS` steht (Standard: `http://localhost:3000`,
`:3002`, `:3003`, `:3004`). Erlaubte Header: `Content-Type`, `Authorization`.
Server-zu-Server-Aufrufe brauchen kein CORS.

## Rollenmodell

| Aktion                         | nicht eingeloggt | mitarbeiter     | admin                 |
| ------------------------------ | ---------------- | --------------- | --------------------- |
| Benutzer lesen                 | ja               | ja              | ja                    |
| Registrieren (als mitarbeiter) | ja               | –               | –                     |
| Benutzer anlegen (jede Rolle)  | nein             | nein            | ja                    |
| eigenes Profil bearbeiten      | –                | ja (ohne Rolle) | ja                    |
| andere bearbeiten / Rolle ändern | nein           | nein            | ja                    |
| Benutzer löschen               | nein             | nein            | ja (nicht sich selbst) |

## Persistenz

MariaDB, Tabelle `benutzer` (siehe `db/schema.sql`). Zugriff mit rohem SQL über
`mysql2`, alle Statements in `lib/benutzer-repository.ts`.

## Änderungen gegenüber der ersten Version

Für die anderen Komponenten relevant:

- `POST /api/benutzer`: `passwort` ist Pflicht, `rolle` ist optional. Ohne Login
  ist nur `mitarbeiter` erlaubt.
- `PUT` und `DELETE` brauchen jetzt ein Token (`Authorization: Bearer …`).
- `PUT` akzeptiert zusätzlich `passwort`.
- `/api/auth/verify` antwortet bei ungültigem Token oder gelöschtem Benutzer
  immer mit `401` (`invalid_token`, früher `token_expired` bzw. `404`).
- Das Token ist jetzt ein signiertes JWT statt Base64-Platzhalter. Für die
  anderen Komponenten ändert sich nichts, sie reichen es weiter an `/verify`.
- Feste Basis-URL `http://localhost:3001` und CORS für die anderen Frontends.

Bisher offene Punkte (Passwort-Hashing, Token-Format, Base-URL/Port) sind
damit erledigt.
