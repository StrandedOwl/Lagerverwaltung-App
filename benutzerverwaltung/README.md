# Benutzerverwaltung · Lagerverwaltung-App

Systemkomponente **Benutzerverwaltung** des verteilten Systems
"Lagerverwaltung-App" (LB2, Modul 321 – Verteilte Systeme programmieren).
Verantwortlich: Lorenzo.

Die Komponente verwaltet die Benutzer des Gesamtsystems und stellt den anderen
Komponenten (Lagerverwaltung, Produktverwaltung, Statistik) Login und
Token-Prüfung über eine REST-API zur Verfügung.

- **Schnittstelle:** [SCHNITTSTELLE.md](SCHNITTSTELLE.md)
- **Komponentendokumentation:** [docs/DOKUMENTATION.md](docs/DOKUMENTATION.md)
- **Tests und Testprotokoll:** [docs/TESTS.md](docs/TESTS.md)

## Voraussetzungen

- Node.js 20 oder neuer
- Docker Desktop (für die MariaDB)

## Schnellstart

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env  -> JWT_SECRET anpassen
npm run db:up             # MariaDB im Docker-Container starten
npm run db:reset          # Tabelle anlegen + Testbenutzer einfügen
npm run dev               # http://localhost:3001
```

## Testbenutzer

| Email                         | Passwort     | Rolle       |
| ----------------------------- | ------------ | ----------- |
| `lorenzo@lagerverwaltung.app` | `lorenzo123` | admin       |
| `andrin@lagerverwaltung.app`  | `andrin123`  | mitarbeiter |
| `louis@lagerverwaltung.app`   | `louis123`   | mitarbeiter |

`npm run db:seed` setzt diese drei Konten jederzeit auf die Werte oben zurück
(praktisch vor der Demo).

## Scripts

| Script                  | Zweck                                                   |
| ----------------------- | ------------------------------------------------------- |
| `npm run dev`           | Entwicklungsserver auf Port 3001                        |
| `npm run build` / `start` | Produktions-Build bauen / starten (Port 3001)         |
| `npm test`              | Unit-Tests (ohne Datenbank)                             |
| `npm run test:coverage` | Unit-Tests mit Testabdeckung (Bericht in `coverage/`)   |
| `npm run test:api`      | API-Tests gegen den laufenden Server (DB + `dev` nötig) |
| `npm run lint`          | ESLint                                                  |
| `npm run typecheck`     | TypeScript-Prüfung                                      |
| `npm run db:up` / `db:down` | MariaDB-Container starten / stoppen                 |
| `npm run db:migrate`    | Tabelle `benutzer` anlegen (falls nicht vorhanden)      |
| `npm run db:seed`       | Testbenutzer einfügen bzw. zurücksetzen                 |
| `npm run db:reset`      | Tabelle löschen, neu anlegen, Testbenutzer einfügen     |

## Konfiguration (`.env`)

| Variable       | Bedeutung                                              |
| -------------- | ------------------------------------------------------ |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Datenbankverbindung (passt zu `docker-compose.yml`) |
| `JWT_SECRET`   | Schlüssel zum Signieren der Login-Tokens, mind. 32 Zeichen |
| `CORS_ORIGINS` | Frontends, die `/api/*` im Browser aufrufen dürfen     |

## Projektstruktur

```
app/
  api/benutzer/          REST-Endpunkte für Benutzer (CRUD)
  api/auth/              Login, Token-Prüfung, Logout
  login/page.tsx         Anmelden / Registrieren
  page.tsx               Benutzerliste mit Verwaltung
components/              eigene UI-Komponenten (components/ui = shadcn/ui)
lib/                     Fachlogik: Validierung, Berechtigungen, Token, Passwort, DB-Zugriff
db/                      SQL: Schema, Testdaten, Reset
proxy.ts                 Login-Umleitung für Seiten, CORS für /api
tests/unit/              Unit-Tests (Vitest)
tests/api/               API-Tests gegen den laufenden Server
docs/                    Dokumentation, Diagramme, Screenshots
```
