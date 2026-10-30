-- Löscht die Tabelle der Benutzerverwaltung komplett.
-- Wird von "npm run db:reset" verwendet (danach folgen migrate + seed).
-- ACHTUNG: alle Benutzer gehen verloren!

DROP TABLE IF EXISTS benutzer;
