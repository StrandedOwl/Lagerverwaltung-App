import { NextRequest } from "next/server"

import { getBenutzerById, toPublicBenutzer } from "./benutzer-repository"
import { TOKEN_COOKIE } from "./session"
import { pruefeToken, tokenAusAuthHeader } from "./token"
import { Benutzer } from "./types"

/**
 * Ermittelt, wer einen API-Request schickt.
 *
 * Reihenfolge:
 *  1. Header "Authorization: Bearer <token>" (andere Komponenten)
 *  2. httpOnly-Cookie "token" (eigene Oberfläche)
 *
 * Das Token wird kryptografisch geprüft und der Benutzer danach frisch
 * aus der Datenbank gelesen (aktuelle Rolle, existiert er noch?).
 * Gibt null zurück, wenn niemand gültig angemeldet ist.
 */
export async function ermittleBenutzer(
  request: NextRequest
): Promise<Benutzer | null> {
  const token =
    tokenAusAuthHeader(request.headers.get("authorization")) ??
    request.cookies.get(TOKEN_COOKIE)?.value

  return benutzerZuToken(token)
}

export async function benutzerZuToken(
  token: string | null | undefined
): Promise<Benutzer | null> {
  const inhalt = await pruefeToken(token)
  if (!inhalt) return null

  const benutzer = await getBenutzerById(inhalt.benutzerId)
  return benutzer ? toPublicBenutzer(benutzer) : null
}
