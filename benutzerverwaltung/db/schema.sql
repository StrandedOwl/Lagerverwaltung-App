-- Schema der Benutzerverwaltung.
-- Anwenden mit: npm run db:migrate

CREATE TABLE IF NOT EXISTS benutzer (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  name          VARCHAR(255)  NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  rolle         ENUM('admin', 'mitarbeiter') NOT NULL DEFAULT 'mitarbeiter',
  passwort_hash VARCHAR(255)  NOT NULL,
  erstellt_am   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_benutzer_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
