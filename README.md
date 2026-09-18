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

## Setup

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
