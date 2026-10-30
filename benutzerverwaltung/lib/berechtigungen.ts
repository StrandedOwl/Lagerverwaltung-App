/**
 * Berechtigungsregeln der Benutzerverwaltung.
 *
 * Reine Funktionen ohne Datenbankzugriff: sie bekommen den handelnden
 * Benutzer ("akteur", null = nicht eingeloggt) und das Ziel und sagen,
 * ob die Aktion erlaubt ist. Dadurch sind alle Regeln an einer Stelle
 * und lassen sich vollständig per Unit-Test abdecken.
 *
 * Regeln:
 *  - Registrieren (nicht eingeloggt): nur als "mitarbeiter"
 *  - Admin: darf Benutzer mit beliebiger Rolle anlegen, alle bearbeiten,
 *    alle ausser sich selbst löschen
 *  - Mitarbeiter: darf nur das eigene Profil bearbeiten (ohne Rolle)
 *  - Es muss immer mindestens ein Admin übrig bleiben
 */

import { Benutzer, BenutzerUpdateDaten, Rolle } from "./types"

export type Entscheid =
  | { erlaubt: true }
  | { erlaubt: false; status: 401 | 403 | 409; error: string; message: string }

const ERLAUBT: Entscheid = { erlaubt: true }

function nichtEingeloggt(): Entscheid {
  return {
    erlaubt: false,
    status: 401,
    error: "nicht_angemeldet",
    message: "Für diese Aktion ist ein Login nötig.",
  }
}

function verboten(message: string): Entscheid {
  return { erlaubt: false, status: 403, error: "keine_berechtigung", message }
}

export function darfBenutzerAnlegen(
  akteur: Benutzer | null,
  zielRolle: Rolle
): Entscheid {
  if (akteur?.rolle === "admin") return ERLAUBT

  if (akteur) {
    return verboten("Nur Admins dürfen weitere Benutzer anlegen.")
  }
  if (zielRolle !== "mitarbeiter") {
    return verboten(
      'Bei der Registrierung ist nur die Rolle "mitarbeiter" möglich.'
    )
  }
  return ERLAUBT
}

export function darfBenutzerBearbeiten(
  akteur: Benutzer | null,
  ziel: Benutzer,
  aenderung: BenutzerUpdateDaten,
  anzahlAdmins: number
): Entscheid {
  if (!akteur) return nichtEingeloggt()

  const istAdmin = akteur.rolle === "admin"
  const istSelbst = akteur.id === ziel.id

  if (!istAdmin && !istSelbst) {
    return verboten("Du darfst nur dein eigenes Profil bearbeiten.")
  }

  const rolleAendertSich =
    aenderung.rolle !== undefined && aenderung.rolle !== ziel.rolle

  if (rolleAendertSich && !istAdmin) {
    return verboten("Nur Admins dürfen Rollen ändern.")
  }

  if (rolleAendertSich && ziel.rolle === "admin" && anzahlAdmins <= 1) {
    return {
      erlaubt: false,
      status: 409,
      error: "letzter_admin",
      message: "Der letzte Admin kann nicht zum Mitarbeiter gemacht werden.",
    }
  }

  return ERLAUBT
}

export function darfBenutzerLoeschen(
  akteur: Benutzer | null,
  ziel: Benutzer
): Entscheid {
  if (!akteur) return nichtEingeloggt()
  if (akteur.rolle !== "admin") {
    return verboten("Nur Admins dürfen Benutzer löschen.")
  }
  if (akteur.id === ziel.id) {
    // Schützt auch davor, dass der letzte Admin verschwindet: ein Admin
    // kann nur von einem ANDEREN Admin gelöscht werden.
    return verboten("Du kannst dein eigenes Konto nicht löschen.")
  }
  return ERLAUBT
}
