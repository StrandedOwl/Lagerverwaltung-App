import { NextRequest, NextResponse } from "next/server"

import { getBenutzerByEmail, toPublicBenutzer } from "@/lib/benutzer-repository"
import { erzeugeToken, setzeLoginCookie } from "@/lib/session"
import { ApiError, LoginRequest, LoginResponse } from "@/lib/types"

/**
 * POST /api/auth/login
 *
 * Login-Endpunkt der Benutzerverwaltung. Andere Komponenten (bzw. das
 * Frontend) schicken hier Email/Passwort hin und erhalten ein Token
 * zurück, das danach bei jedem Request mitgeschickt wird.
 *
 * Zusätzlich wird das Token als httpOnly-Cookie gesetzt, damit die
 * eigenen Seiten dieser Komponente (siehe proxy.ts) den Login-Status
 * serverseitig prüfen können, ohne localStorage zu benötigen. Für
 * Requests von ANDEREN Komponenten bleibt der Token im Response-Body
 * massgeblich (Authorization: Bearer <token>, siehe SCHNITTSTELLE.md).
 *
 * ACHTUNG: Das ist aktuell nur ein Stub mit einem unsicheren
 * Platzhalter-Token (kein echtes Passwort-Hashing, kein JWT).
 * Für die echte Umsetzung: Passwort-Hash (bcrypt) + JWT mit Ablaufzeit.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<LoginRequest>

  if (!body.email || !body.passwort) {
    const error: ApiError = {
      error: "invalid_request",
      message: "email und passwort sind erforderlich.",
    }
    return NextResponse.json(error, { status: 400 })
  }

  const benutzer = await getBenutzerByEmail(body.email)

  // Platzhalter-Check: in der echten Umsetzung Passwort-Hash vergleichen.
  if (!benutzer || benutzer.passwortHash !== body.passwort) {
    const error: ApiError = {
      error: "invalid_credentials",
      message: "Email oder Passwort ist falsch.",
    }
    return NextResponse.json(error, { status: 401 })
  }

  const { token, gueltigBis } = erzeugeToken(benutzer.id)

  const responseBody: LoginResponse = {
    token,
    gueltigBis,
    benutzer: toPublicBenutzer(benutzer),
  }

  const response = NextResponse.json(responseBody, { status: 200 })
  setzeLoginCookie(response, token, gueltigBis)
  return response
}
