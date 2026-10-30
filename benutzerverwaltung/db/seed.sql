-- Testdaten für die lokale Entwicklung und die Demo.
-- Anwenden mit: npm run db:seed
--
-- Die Passwörter sind mit bcrypt (10 Runden) gehasht. Im Klartext:
--   lorenzo@lagerverwaltung.app  /  lorenzo123  (admin)
--   andrin@lagerverwaltung.app   /  andrin123   (mitarbeiter)
--   louis@lagerverwaltung.app    /  louis123    (mitarbeiter)
--
-- Erneutes Ausführen setzt Name, Rolle und Passwort dieser drei Benutzer
-- wieder auf die Werte unten zurück (praktisch vor einer Demo).

INSERT INTO benutzer (id, name, email, rolle, passwort_hash, erstellt_am)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Lorenzo', 'lorenzo@lagerverwaltung.app', 'admin',
   '$2b$10$MiaAxPNbnSxMeXwAue6ETuCFgdy6ebujne09PYMxSy1vgcrk0fS4y', '2026-01-10 08:00:00'),
  ('22222222-2222-2222-2222-222222222222', 'Andrin', 'andrin@lagerverwaltung.app', 'mitarbeiter',
   '$2b$10$Hs1o3pUfTPifDf1Z0KnVaOlKDDMbQqs91k7BqHJ.cobuQde6drE62', '2026-02-01 09:30:00'),
  ('33333333-3333-3333-3333-333333333333', 'Louis', 'louis@lagerverwaltung.app', 'mitarbeiter',
   '$2b$10$E7cB5Ol/KGEX/n/zKGMsceNP58d9qOS7fZQQRU1yw6/nqbNEt3QnG', '2026-03-15 14:15:00')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  rolle = VALUES(rolle),
  passwort_hash = VALUES(passwort_hash);
