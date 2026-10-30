/**
 * Fachliche Typen der Benutzerverwaltung.
 *
 * Diese Typen bilden die JSON-Schnittstelle, die von den anderen
 * Systemkomponenten (Lagerverwaltung, Produktverwaltung, Statistik)
 * konsumiert wird. Siehe SCHNITTSTELLE.md für die Details.
 *
 * Datenmodell und Endpunkte gemäss Gruppen-Absprache (1. Benutzerverwaltung).
 */

export const ROLLEN = ["admin", "mitarbeiter"] as const

export type Rolle = (typeof ROLLEN)[number]

/** Öffentliches Benutzer-Objekt, so wie es über die API herausgegeben wird. */
export interface Benutzer {
  id: string
  name: string
  email: string
  rolle: Rolle
  erstelltAm: string // ISO-Datum
}

/** Interner Datensatz inkl. Passwort-Hash (nie über die API ausgeben!) */
export interface BenutzerRecord extends Benutzer {
  passwortHash: string
}

/** Body von POST /api/benutzer (nach der Validierung). */
export interface NeuerBenutzerDaten {
  name: string
  email: string
  rolle: Rolle
  passwort: string
}

/** Body von PUT /api/benutzer/:id (nach der Validierung, alles optional). */
export interface BenutzerUpdateDaten {
  name?: string
  email?: string
  rolle?: Rolle
  passwort?: string
}

export interface LoginRequest {
  email: string
  passwort: string
}

export interface LoginResponse {
  token: string
  benutzer: Benutzer
  gueltigBis: string // ISO-Datum
}

export interface VerifyResponse {
  valid: true
  benutzer: Benutzer
}

/** Einheitliches Fehlerformat aller Endpunkte. */
export interface ApiError {
  error: string
  message: string
  details?: string[]
}
