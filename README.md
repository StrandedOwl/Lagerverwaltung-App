## Starten der Lagerverwaltung-App

Drei unabhängige Services – einzeln oder alle zusammen startbar.

| Komponente | Port | Startbefehl (im Hauptordner) |
|---|---|---|
| Statistik | 3000 | `npm run statistik` |
| Benutzerverwaltung | 3001 | `npm run benutzer` |
| Produkt-/Lagerverwaltung | 3002 | `npm run lager` |

### Einmalig einrichten

```bash
npm install

cd benutzerverwaltung
npm install
copy .env.example .env      # danach JWT_SECRET anpassen
npm run db:up                # MariaDB-Container starten
npm run db:reset              # Tabelle anlegen + Testbenutzer einfügen
cd ..
```

### Alle drei zusammen starten

```bash
npm run start:alle
```

Startet Statistik, Benutzerverwaltung und Produkt-/Lagerverwaltung inkl. Datenbank automatisch (Docker Desktop muss laufen). Beenden mit `Ctrl + C`.

Wird nur an einer Komponente gearbeitet, reicht der einzelne Befehl aus der Tabelle oben.
