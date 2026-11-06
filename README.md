## Starten der Lagerverwaltung-App

- **Statistik** (Port 3000): im Hauptordner `npm install` → `npm start`
- **Benutzerverwaltung** (Port 3001): in `benutzerverwaltung/` → `npm install`, `.env` einrichten, `npm run db:up` (MariaDB via Docker), `npm run db:reset`, dann `npm run dev`
- **Produkt-/Lagerverwaltung** (Port 3002): im Hauptordner `node public/server.js`
- **Alle zusammen**: einmalig alle drei wie oben installieren/einrichten, danach im Hauptordner `npm run start:alle` (startet alle drei automatisch, Docker Desktop muss laufen)
