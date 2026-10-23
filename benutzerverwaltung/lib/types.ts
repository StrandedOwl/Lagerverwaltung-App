/**
 * Fachliche Typen der Benutzerverwaltung.
 *
 * Diese Typen bilden die JSON-Schnittstelle, die von den anderen
 * Systemkomponenten (Lagerverwaltung, Produktverwaltung, Statistik)
 * konsumiert wird. Siehe SCHNITTSTELLE.md für die Details.
 *
 * Datenmodell und Endpunkte gemäss Gruppen-Absprache (1. Benutzerverwaltung).
 */

export type Rolle = "admin" | "mitarbeiter"

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

export interface LoginRequest {
  email: string
  passwort: string
}

export interface LoginResponse {
  token: string
  benutzer: Benutzer
  gueltigBis: string // ISO-Datum
}

export interface ApiError {
  error: string
  message: string
}
