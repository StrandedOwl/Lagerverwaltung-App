import { NextRequest, NextResponse } from "next/server"

import { fehlerAntwort, mitFehlerbehandlung } from "@/lib/api"
import { benutzerZuToken } from "@/lib/auth"
import { tokenAusAuthHeader } from "@/lib/token"
import { VerifyResponse } from "@/lib/types"

/**
 * GET /api/auth/verify
 * Header: Authorization: Bearer <token>
 *
 * Für die ANDEREN Komponenten (Lagerverwaltung, Produktverwaltung,
 * Statistik): Sie schicken das Token, das ihnen das Frontend mitgibt,
 * hierher und erfahren, ob es gültig ist und zu welchem Benutzer es
 * gehört (inkl. Rolle für eigene Berechtigungsprüfungen).
 *
 * 200 -> { valid: true, benutzer }
 * 401 -> Token fehlt, ist abgelaufen, gefälscht oder der Benutzer
 *        wurde inzwischen gelöscht.
 */
export const GET = mitFehlerbehandlung(async (request: NextRequest) => {
  const token = tokenAusAuthHeader(request.headers.get("authorization"))
  if (!token) {
    return fehlerAntwort(
      401,
      "missing_token",
      "Authorization: Bearer <token> Header fehlt."
    )
  }

  const benutzer = await benutzerZuToken(token)
  if (!benutzer) {
    return fehlerAntwort(
      401,
      "invalid_token",
      "Token ist abgelaufen oder ungültig."
    )
  }

  const body: VerifyResponse = { valid: true, benutzer }
  return NextResponse.json(body, { status: 200 })
})
