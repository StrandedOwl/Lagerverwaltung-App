-- Schema der Benutzerverwaltung.
-- Anwenden mit: npm run db:migrate

CREATE TABLE IF NOT EXISTS benutzer (
  id            CHAR(36)      NOT NULL PRIMARY KEY,          -- UUID v4
  name          VARCHAR(255)  NOT NULL,
  email         VARCHAR(255)  NOT NULL,                       -- immer klein geschrieben gespeichert
  rolle         ENUM('admin', 'mitarbeiter') NOT NULL DEFAULT 'mitarbeiter',
  passwort_hash VARCHAR(255)  NOT NULL,                       -- bcrypt-Hash, nie Klartext
  erstellt_am   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_benutzer_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
