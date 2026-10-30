# Tests Benutzerverwaltung

Testdefinition, Testumgebung und Testprotokoll der Systemkomponente
Benutzerverwaltung (Lorenzo).

## 1. Teststrategie

Getestet wird auf drei Ebenen:

| Ebene | Was wird geprüft? | Wie? | Befehl |
| ----- | ----------------- | ---- | ------ |
| **Unit-Tests** | einzelne Funktionen und Route-Handler isoliert | Vitest; die Datenbank wird durch eine In-Memory-Version ersetzt (`tests/unit/helpers/fake-repository.ts`) | `npm test` |
| **API-Tests** | die ganze Komponente über HTTP, mit echter MariaDB | Vitest schickt echte Requests an den laufenden Server | `npm run test:api` |
| **UI-Tests** | Abläufe in der Weboberfläche | im Browser durchgeklickt | – |

Die Unit-Tests laufen ohne Datenbank und ohne Server in wenigen Sekunden. Sie
wurden laufend während der Entwicklung ausgeführt. Die API-Tests prüfen
zusätzlich SQL, Datenbank-Constraints, Cookies und das Zusammenspiel mit dem
Proxy, also genau das, was die anderen Komponenten später verwenden.

## 2. Testumgebung

| Komponente | Version / Einstellung |
| ---------- | --------------------- |
| Node.js | 20 oder neuer (Protokoll unten: 22.23) |
| Next.js | 16.3.4 |
| Datenbank | MariaDB 11 im Docker-Container (`npm run db:up`) |
| Testdaten | `db/seed.sql`: 1 Admin, 2 Mitarbeiter (siehe README) |
| Test-Framework | Vitest 3.2 |
| Browser (UI-Tests) | Chromium / Chrome |
| Konfiguration | `.env` aus `.env.example`; Unit-Tests verwenden ein eigenes festes `JWT_SECRET` (`vitest.config.mts`) |

**Vorbereitung für die API- und UI-Tests**

```bash
npm run db:up      # MariaDB starten
npm run db:reset   # definierter Ausgangszustand: genau die 3 Testbenutzer
npm run dev        # Server auf http://localhost:3001
npm run test:api   # in einem zweiten Terminal
```

Die API-Tests legen einen eigenen Testbenutzer an und löschen ihn am Ende
wieder. Sie verändern die Testbenutzer nicht.

## 3. Testfälle

### 3.1 Unit-Tests (96 Tests, `tests/unit/`)

| ID | Bereich | Geprüft wird |
| -- | ------- | ------------ |
| UT-V01 – V18 | Validierung | Pflichtfelder, Email-Format, Passwortlänge (8 Zeichen bis 72 Bytes), gültige Rollen, Namenslänge, Normalisierung (Trimmen, Kleinschreibung der Email), Teil-Updates, unbekannte Felder werden ignoriert, Login-Eingaben |
| UT-B01 – B16 | Berechtigungen | Registrierung nur als mitarbeiter, Admin darf alles ausser sich selbst löschen, Mitarbeiter nur eigenes Profil ohne Rolle, letzter Admin bleibt erhalten |
| UT-T01 – T08 | Token (JWT) | gültiges Token, Ablaufzeit 1 h, abgelaufene, manipulierte und fremd signierte Tokens werden abgelehnt, altes Base64-Format gilt nicht mehr, fehlendes `JWT_SECRET` fällt auf, Authorization-Header lesen |
| UT-P01 – P03 | Passwort | Hash ist gesalzen und enthält kein Klartext-Passwort, richtig/falsch wird erkannt, unbekannte Email ergibt immer `false` |
| UT-C01 – C04 | CORS | erlaubte und fremde Origins, `*`, Lesen von `CORS_ORIGINS` |
| UT-X01 – X08 | Proxy | Umleitung auf `/login`, Weiterleitung eingeloggter Benutzer weg von `/login`, gefälschtes Cookie, API wird nie umgeleitet, Preflight und CORS-Header |
| UT-R01 – R34 | Route-Handler | alle Endpunkte mit allen Status-Codes (200/201/400/401/403/404/409/500), Passwort-Hash nie in Antworten, Cookie-Verhalten bei Registrierung, Admin-Anlage und Logout, gleiche Antwort bei falscher Email und falschem Passwort, kaputtes JSON, Datenbankfehler |

Die genaue Erwartung steht jeweils im Testnamen, z. B.
`UT-R16: letzter Admin stuft sich selbst herab -> 409`.

### 3.2 API-Tests (19 Tests, `tests/api/benutzer-api.test.ts`)

| ID | Testfall | Eingabe | Erwartetes Ergebnis |
| -- | -------- | ------- | ------------------- |
| API-01 | Login Admin | `POST /api/auth/login` mit lorenzo / lorenzo123 | 200, JWT (3 Teile), Benutzer mit Rolle admin, httpOnly-Cookie |
| API-02 | Login Mitarbeiter | andrin / andrin123 | 200, Token |
| API-03 | Login falsches Passwort | lorenzo / falsch | 401 `invalid_credentials` |
| API-04 | Token prüfen | `GET /api/auth/verify` mit Admin-Token | 200 `valid: true`, Rolle admin |
| API-05 | Gefälschtes Token | Signatur verändert | 401 |
| API-06 | Liste abrufen | `GET /api/benutzer` | 200, ≥ 3 Einträge, keine Passwörter/Hashes |
| API-07 | Einzelnen Benutzer abrufen | existierende / unbekannte ID | 200 bzw. 404 |
| API-08 | Admin legt Benutzer an | `POST /api/benutzer` mit Admin-Token | 201, Rolle mitarbeiter |
| API-09 | Doppelte Email | gleiche Email in Grossbuchstaben | 409 |
| API-10 | Neuer Benutzer meldet sich an | Login mit neuem Passwort | 200 |
| API-11 | Ungültige Eingaben | Email "kaputt", Passwort "kurz" | 400 mit 2 Details |
| API-12 | Mitarbeiter ändert fremdes Profil | `PUT` mit Mitarbeiter-Token | 403 |
| API-13 | Ändern ohne Login | `PUT` ohne Token | 401 |
| API-14 | Admin ändert Name und Rolle | `PUT` mit Admin-Token | 200, neue Werte |
| API-15 | Mitarbeiter löscht | `DELETE` mit Mitarbeiter-Token | 403 |
| API-16 | Admin löscht | `DELETE` mit Admin-Token | 200, danach `GET` 404 |
| API-17 | Admin löscht sich selbst | `DELETE` eigene ID | 403 |
| API-18 | CORS-Preflight | `OPTIONS` mit Origin `http://localhost:3002` | 204, `Access-Control-Allow-Origin` gesetzt |
| API-19 | Seite ohne Login | `GET /` ohne Cookie | 307 auf `/login` |

### 3.3 UI-Tests

Vorbedingung: `npm run db:reset`, Server läuft, Browser ohne Cookies.

| ID | Testfall | Schritte | Erwartetes Ergebnis |
| -- | -------- | -------- | ------------------- |
| UI-01 | Schutz ohne Login | `http://localhost:3001/` öffnen | Umleitung auf `/login` |
| UI-02 | Falsches Passwort | lorenzo@… / falsch123 → Anmelden | Meldung "Email oder Passwort ist falsch." |
| UI-03 | Passwort anzeigen | Augen-Symbol klicken | Passwort wird sichtbar, Formular wird **nicht** abgeschickt |
| UI-04 | Login Admin | lorenzo@… / lorenzo123 | Startseite mit 3 Benutzern, Knopf "Benutzer anlegen" |
| UI-05 | Benutzer anlegen | "Benutzer anlegen", Mia / mia@… / mia12345 | Dialog schliesst, Liste zeigt 4 Benutzer |
| UI-06 | Benutzer bearbeiten | Stift bei Mia, Name "Mia M.", Rolle Admin | Liste zeigt "Mia M." mit Rolle admin |
| UI-07 | Doppelte Email | Stift bei Lorenzo, Email andrin@… | Dialog bleibt offen, Meldung "Zu dieser Email existiert bereits ein Benutzer." |
| UI-08 | Benutzer löschen | Papierkorb bei Mia M., "Löschen" bestätigen | Mia verschwindet, 3 Benutzer |
| UI-09 | Abmelden | Profil oben rechts → Abmelden | sofort zurück auf `/login` |
| UI-10 | Ansicht Mitarbeiter | als andrin@… anmelden | kein "Benutzer anlegen", kein Löschen, nur eigene Zeile bearbeitbar |
| UI-11 | Registrieren | Tab "Registrieren", Neu / neu@… / neu12345 | direkt eingeloggt, neuer Benutzer mit Rolle mitarbeiter in der Liste |

## 4. Testprotokoll

### Durchführung 1 – Entwicklungsumgebung

| | |
| --- | --- |
| **Datum** | 30.10.2026 |
| **Umgebung** | Linux, Node.js 22.23, Next.js 16.3.4 (Produktions-Build, `next start`), MariaDB 10.11 lokal installiert (statt Docker), Chromium headless |
| **Ausgangszustand** | `npm run db:reset` |

| Ebene | Anzahl | Bestanden | Fehlgeschlagen |
| ----- | ------ | --------- | -------------- |
| Unit-Tests (`npm test`) | 96 | 96 | 0 |
| API-Tests (`npm run test:api`) | 19 | 19 | 0 |
| UI-Tests (UI-01 – UI-11, automatisiert durchgeklickt) | 11 | 11 | 0 |

**Testabdeckung Unit-Tests** (`npm run test:coverage`): 99.8 % der Anweisungen,
97.8 % der Verzweigungen, 100 % der Funktionen. Ausgenommen sind Dateien, die
eine echte Datenbank brauchen (`benutzer-repository.ts`, `db.ts`,
`aktueller-benutzer.ts`). Diese werden durch die API-Tests abgedeckt.

**Während der Entwicklung gefundene und behobene Fehler**

| # | Fehler | Ursache | Behebung |
| - | ------ | ------- | -------- |
| 1 | Token wurde nach dem Login sofort als ungültig erkannt | Platzhalter-Token "id:datum" wurde mit `split(":")` zerlegt, das ISO-Datum enthält selbst Doppelpunkte | zuerst nur am ersten Doppelpunkt getrennt, danach ganz durch signiertes JWT ersetzt (UT-T06) |
| 2 | Klick auf das Augen-Symbol schickte das Login-Formular ab | Button ohne `type`, im Formular ist der Standard `submit` | `type="button"` gesetzt (UI-03) |
| 3 | Admin war nach dem Anlegen eines Benutzers plötzlich als dieser Benutzer angemeldet | `POST /api/benutzer` setzte immer das Login-Cookie | Cookie nur noch bei Registrierung ohne Login (UT-R06) |
| 4 | Kaputtes JSON oder doppelte Email beim Bearbeiten ergaben `500` | keine Fehlerbehandlung um `request.json()` bzw. den Unique-Constraint | `mitFehlerbehandlung` + Prüfung vor dem Speichern (UT-R10, UT-R17, UT-R34) |
| 5 | Jeder konnte sich bei der Registrierung als Admin anlegen | Rolle wurde ungeprüft übernommen | Berechtigungsregel `darfBenutzerAnlegen` (UT-B02, UT-R05) |
| 6 | `npm run lint` brach mit Fehler ab | ESLint 10 ist mit `eslint-config-next` 16 noch nicht kompatibel | ESLint auf Version 9 fixiert |

### Durchführung 2 – Abgaberechner

*Vor der Abgabe auf dem eigenen Rechner mit Docker wiederholen und hier eintragen.*

| | |
| --- | --- |
| **Datum** | |
| **Umgebung** | Windows, Node.js …, MariaDB 11 (Docker) |
| **Durchgeführt von** | Lorenzo |

| Ebene | Anzahl | Bestanden | Fehlgeschlagen | Bemerkung |
| ----- | ------ | --------- | -------------- | --------- |
| Unit-Tests | 96 | | | |
| API-Tests | 19 | | | |
| UI-Tests | 11 | | | |
