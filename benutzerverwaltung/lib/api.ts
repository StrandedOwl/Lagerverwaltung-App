import { NextRequest, NextResponse } from "next/server"

import { Entscheid } from "./berechtigungen"
import { ApiError } from "./types"

/**
 * Kleine Helfer, damit alle Route-Handler Fehler gleich beantworten
 * ({ error, message, details? }) und kein Fehler als unformatierter
 * 500er beim Aufrufer landet.
 */

export function fehlerAntwort(
  status: number,
  error: string,
  message: string,
  details?: string[]
) {
  const body: ApiError = details
    ? { error, message, details }
    : { error, message }
  return NextResponse.json(body, { status })
}

export function verweigert(entscheid: Extract<Entscheid, { erlaubt: false }>) {
  return fehlerAntwort(entscheid.status, entscheid.error, entscheid.message)
}

export function ungueltigeEingabe(fehler: string[]) {
  return fehlerAntwort(
    400,
    "invalid_request",
    "Die Eingaben sind ungültig.",
    fehler
  )
}

export function nichtAngemeldet() {
  return fehlerAntwort(
    401,
    "nicht_angemeldet",
    "Für diese Aktion ist ein Login nötig."
  )
}

export function nichtGefunden(id: string) {
  return fehlerAntwort(
    404,
    "benutzer_not_found",
    `Kein Benutzer mit id "${id}" gefunden.`
  )
}

export function emailBereitsVergeben() {
  return fehlerAntwort(
    409,
    "email_vergeben",
    "Zu dieser Email existiert bereits ein Benutzer."
  )
}

/** Fehler, den leseJson wirft, wenn der Body kein gültiges JSON ist. */
class UngueltigesJson extends Error {}

/** Liest den Body als JSON; kaputtes JSON führt zu einer 400-Antwort. */
export async function leseJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new UngueltigesJson()
  }
}

function istDoppelterEintrag(fehler: unknown): boolean {
  return (
    typeof fehler === "object" &&
    fehler !== null &&
    (fehler as { code?: unknown }).code === "ER_DUP_ENTRY"
  )
}

/**
 * Umhüllt einen Route-Handler mit einheitlicher Fehlerbehandlung:
 *  - kaputtes JSON         -> 400 invalid_json
 *  - doppelte Email (DB)   -> 409 email_vergeben (z. B. bei gleichzeitigen Requests)
 *  - alles andere          -> 500 server_error (Details nur im Server-Log)
 */
export function mitFehlerbehandlung<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args)
    } catch (fehler) {
      if (fehler instanceof UngueltigesJson) {
        return fehlerAntwort(
          400,
          "invalid_json",
          "Der Request-Body ist kein gültiges JSON."
        )
      }
      if (istDoppelterEintrag(fehler)) return emailBereitsVergeben()

      console.error("[benutzerverwaltung] Unerwarteter Fehler:", fehler)
      return fehlerAntwort(
        500,
        "server_error",
        "Interner Fehler in der Benutzerverwaltung."
      )
    }
  }
}
