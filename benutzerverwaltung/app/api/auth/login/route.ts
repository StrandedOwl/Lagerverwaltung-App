import { NextRequest, NextResponse } from "next/server"

import {
  fehlerAntwort,
  leseJson,
  mitFehlerbehandlung,
  ungueltigeEingabe,
} from "@/lib/api"
import { getBenutzerByEmail, toPublicBenutzer } from "@/lib/benutzer-repository"
import { pruefePasswort } from "@/lib/passwort"
import { setzeLoginCookie } from "@/lib/session"
import { erzeugeToken } from "@/lib/token"
import { LoginResponse } from "@/lib/types"
import { validiereLogin } from "@/lib/validierung"

/**
 * POST /api/auth/login
 *
 * Prüft Email und Passwort (bcrypt) und gibt ein signiertes JWT zurück,
 * das eine Stunde gültig ist. Andere Komponenten schicken dieses Token
 * danach als "Authorization: Bearer <token>" mit.
 *
 * Zusätzlich wird das Token als httpOnly-Cookie gesetzt, damit die
 * eigenen Seiten dieser Komponente (siehe proxy.ts) den Login-Status
 * serverseitig prüfen können.
 *
 * Bei falscher Email UND bei falschem Passwort kommt dieselbe Antwort,
 * damit man nicht herausfinden kann, welche Emails registriert sind.
 */
export const POST = mitFehlerbehandlung(async (request: NextRequest) => {
  const pruefung = validiereLogin(await leseJson(request))
  if (!pruefung.ok) return ungueltigeEingabe(pruefung.fehler)
  const { email, passwort } = pruefung.daten

  const benutzer = await getBenutzerByEmail(email)
  const passwortKorrekt = await pruefePasswort(passwort, benutzer?.passwortHash)

  if (!benutzer || !passwortKorrekt) {
    return fehlerAntwort(
      401,
      "invalid_credentials",
      "Email oder Passwort ist falsch."
    )
  }

  const { token, gueltigBis } = await erzeugeToken(benutzer.id)
  const body: LoginResponse = {
    token,
    gueltigBis,
    benutzer: toPublicBenutzer(benutzer),
  }

  const response = NextResponse.json(body, { status: 200 })
  setzeLoginCookie(request, response, token, gueltigBis)
  return response
})
