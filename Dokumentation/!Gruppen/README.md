# Lagerverwaltung – Verteiltes System

Projektarbeit im Modul 321 «Verteilte Systeme programmieren» (LB2).

## Grundidee

Das System bildet eine **Lagerverwaltung** ab und ist in mehrere unabhängige Systemkomponenten aufgeteilt. Jede Komponente wird von einem Teammitglied eigenständig entwickelt und über klar definierte Schnittstellen mit den anderen Komponenten verbunden.

## Teamaufteilung

| Systemkomponente             | Verantwortlich |
|-------------------------------|----------------|
| Benutzerverwaltung             | Lorenzo        |
| Produkt-/Lagerverwaltung       | Louis          |
| Statistik                      | Andrin         |

## Verwendete Technologien

- **Sprache / Laufzeitumgebung:** Node.js
- **Datenbank:** [Supabase](https://supabase.com) (PostgreSQL)

## Aufbau

Die einzelnen Systemkomponenten kommunizieren über definierte Schnittstellen miteinander (siehe [Schnittstellen.md](Schnittstellen.md) für Details zu Endpunkten, Datenformaten und Zusammenspiel der Komponenten).

## Ganzes System starten

| Komponente | Ordner | Adresse |
|---|---|---|
| Statistik + Übersicht | `server.js` | http://localhost:3000 |
| Benutzerverwaltung | `benutzerverwaltung/` | http://localhost:3001 |
| Produkt-/Lagerverwaltung | `public/server.js` | http://localhost:3002 |

**Einmalig einrichten:**
```
npm install
cd benutzerverwaltung
npm install
copy .env.example .env      (danach JWT_SECRET anpassen)
npm run db:up
npm run db:reset
cd ..
```

**Starten** (Docker Desktop muss laufen):
```
npm run start:alle
```
Das startet alle drei Server und die Datenbank. Danach http://localhost:3000 öffnen. Mit **Ctrl + C** werden alle wieder beendet.

## Setup (nur Statistik)

1. Abhängigkeiten installieren:
   ```
   npm install
   ```
2. `.env.example` nach `.env` kopieren und mit den eigenen Supabase-Zugangsdaten füllen:
   ```
   SUPABASE_URL=...
   SUPABASE_PUBLISHABLE_KEY=...
   SUPABASE_SECRET_KEY=...
   SUPABASE_JWKS_URL=...
   ```
   Die Zugangsdaten findet ihr im Supabase-Dashboard unter **Connect → Server** bzw. unter **API Keys**.
3. Server starten:
   ```
   npm start
   ```
   Solange Benutzer- und Produktverwaltung noch nicht laufen, kann die Statistik mit `MOCK_DATEN=true` in der `.env` mit Testdaten betrieben werden.
4. Unit-Tests ausführen:
   ```
   npm test
   ```
