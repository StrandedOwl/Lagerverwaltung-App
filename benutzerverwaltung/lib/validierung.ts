/**
 * Eingabe-Validierung für die API der Benutzerverwaltung.
 *
 * Bewusst ohne externe Bibliothek: jede Funktion nimmt den rohen
 * Request-Body (unknown) entgegen und liefert entweder die bereinigten
 * Daten oder eine Liste verständlicher Fehlermeldungen zurück. So können
 * die Route-Handler einfach "400 + Fehlerliste" antworten und die Regeln
 * lassen sich isoliert per Unit-Test prüfen.
 */

import {
  BenutzerUpdateDaten,
  LoginRequest,
  NeuerBenutzerDaten,
  Rolle,
  ROLLEN,
} from "./types"

export type ValidierungsErgebnis<T> =
  { ok: true; daten: T } | { ok: false; fehler: string[] }

export const NAME_MAX_LAENGE = 100
export const EMAIL_MAX_LAENGE = 255
export const PASSWORT_MIN_LAENGE = 8
/** bcrypt berücksichtigt nur die ersten 72 Bytes eines Passworts. */
export const PASSWORT_MAX_LAENGE = 72

// Absichtlich einfach gehalten: "etwas@etwas.tld" ohne Leerzeichen.
const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function istObjekt(wert: unknown): wert is Record<string, unknown> {
  return typeof wert === "object" && wert !== null && !Array.isArray(wert)
}

export function istRolle(wert: unknown): wert is Rolle {
  return (
    typeof wert === "string" && (ROLLEN as readonly string[]).includes(wert)
  )
}

/** Vereinheitlicht Emails, damit "Lu@X.ch" und "lu@x.ch" gleich behandelt werden. */
export function normalisiereEmail(email: string): string {
  return email.trim().toLowerCase()
}

function pruefeName(wert: unknown, fehler: string[]): string | undefined {
  if (typeof wert !== "string" || wert.trim().length === 0) {
    fehler.push("name muss ein nicht-leerer Text sein.")
    return undefined
  }
  const name = wert.trim()
  if (name.length > NAME_MAX_LAENGE) {
    fehler.push(`name darf höchstens ${NAME_MAX_LAENGE} Zeichen lang sein.`)
    return undefined
  }
  return name
}

function pruefeEmail(wert: unknown, fehler: string[]): string | undefined {
  if (typeof wert !== "string") {
    fehler.push("email muss ein Text sein.")
    return undefined
  }
  const email = normalisiereEmail(wert)
  if (!EMAIL_MUSTER.test(email) || email.length > EMAIL_MAX_LAENGE) {
    fehler.push("email ist keine gültige Email-Adresse.")
    return undefined
  }
  return email
}

function pruefePasswort(wert: unknown, fehler: string[]): string | undefined {
  if (typeof wert !== "string") {
    fehler.push("passwort muss ein Text sein.")
    return undefined
  }
  if (wert.length < PASSWORT_MIN_LAENGE) {
    fehler.push(
      `passwort muss mindestens ${PASSWORT_MIN_LAENGE} Zeichen lang sein.`
    )
    return undefined
  }
  if (new TextEncoder().encode(wert).length > PASSWORT_MAX_LAENGE) {
    fehler.push(
      `passwort darf höchstens ${PASSWORT_MAX_LAENGE} Bytes lang sein.`
    )
    return undefined
  }
  return wert
}

function pruefeRolle(wert: unknown, fehler: string[]): Rolle | undefined {
  if (!istRolle(wert)) {
    fehler.push(`rolle muss einer der Werte ${ROLLEN.join(" | ")} sein.`)
    return undefined
  }
  return wert
}

/**
 * POST /api/benutzer
 * Pflicht: name, email, passwort. Optional: rolle (Standard "mitarbeiter").
 */
export function validiereNeuenBenutzer(
  body: unknown
): ValidierungsErgebnis<NeuerBenutzerDaten> {
  if (!istObjekt(body)) {
    return { ok: false, fehler: ["Request-Body muss ein JSON-Objekt sein."] }
  }

  const fehler: string[] = []
  const name = pruefeName(body.name, fehler)
  const email = pruefeEmail(body.email, fehler)
  const passwort = pruefePasswort(body.passwort, fehler)
  const rolle =
    body.rolle === undefined ? "mitarbeiter" : pruefeRolle(body.rolle, fehler)

  if (fehler.length > 0 || !name || !email || !passwort || !rolle) {
    return { ok: false, fehler }
  }
  return { ok: true, daten: { name, email, passwort, rolle } }
}

/**
 * PUT /api/benutzer/:id
 * Alle Felder optional, aber mindestens eines muss vorhanden sein.
 */
export function validiereBenutzerUpdate(
  body: unknown
): ValidierungsErgebnis<BenutzerUpdateDaten> {
  if (!istObjekt(body)) {
    return { ok: false, fehler: ["Request-Body muss ein JSON-Objekt sein."] }
  }

  const fehler: string[] = []
  const daten: BenutzerUpdateDaten = {}

  if (body.name !== undefined) daten.name = pruefeName(body.name, fehler)
  if (body.email !== undefined) daten.email = pruefeEmail(body.email, fehler)
  if (body.rolle !== undefined) daten.rolle = pruefeRolle(body.rolle, fehler)
  if (body.passwort !== undefined) {
    daten.passwort = pruefePasswort(body.passwort, fehler)
  }

  if (fehler.length > 0) return { ok: false, fehler }

  if (Object.keys(daten).length === 0) {
    return {
      ok: false,
      fehler: [
        "Mindestens eines der Felder name, email, rolle, passwort angeben.",
      ],
    }
  }
  return { ok: true, daten }
}

/**
 * POST /api/auth/login
 * Beim Login wird die Passwort-Länge bewusst NICHT geprüft, sonst würde
 * man verraten, welche Passwörter grundsätzlich möglich sind.
 */
export function validiereLogin(
  body: unknown
): ValidierungsErgebnis<LoginRequest> {
  if (!istObjekt(body)) {
    return { ok: false, fehler: ["Request-Body muss ein JSON-Objekt sein."] }
  }
  const fehler: string[] = []
  if (typeof body.email !== "string" || body.email.trim() === "") {
    fehler.push("email ist erforderlich.")
  }
  if (typeof body.passwort !== "string" || body.passwort === "") {
    fehler.push("passwort ist erforderlich.")
  }
  if (fehler.length > 0) return { ok: false, fehler }

  return {
    ok: true,
    daten: {
      email: normalisiereEmail(body.email as string),
      passwort: body.passwort as string,
    },
  }
}
