-- Testdaten für die lokale Entwicklung.
-- Anwenden mit: npm run db:seed
--
-- ACHTUNG: passwort_hash ist hier nur ein Platzhalter im Klartext!
-- Für die echte Umsetzung mit bcrypt o.ä. hashen (siehe SCHNITTSTELLE.md).

INSERT INTO benutzer (id, name, email, rolle, passwort_hash, erstellt_am)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Lorenzo', 'lorenzo@lagerverwaltung.app', 'admin', 'lor123', '2026-01-10 08:00:00'),
  ('22222222-2222-2222-2222-222222222222', 'Andrin', 'andrin@lagerverwaltung.app', 'mitarbeiter', 'and123', '2026-02-01 09:30:00'),
  ('33333333-3333-3333-3333-333333333333', 'Louis', 'louis@lagerverwaltung.app', 'mitarbeiter', 'lou123', '2026-03-15 14:15:00')
ON DUPLICATE KEY UPDATE name = VALUES(name);
