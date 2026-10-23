import { NextRequest, NextResponse } from "next/server"

import { getBenutzerById, toPublicBenutzer } from "@/lib/benutzer-repository"
import { decodeToken, istTokenGueltig } from "@/lib/token"
import { ApiError } from "@/lib/types"

/**
 * GET /api/auth/verify
 * Header: Authorization: Bearer <token>
 *
 * Diese Route ist für die ANDEREN Komponenten gedacht (Lagerverwaltung,
 * Produktverwaltung, Statistik): sie schicken das Token, das ihnen ein
 * Benutzer im Frontend mitgibt, hierher und bekommen zurück, ob es
 * gültig ist und zu welchem Benutzer es gehört (inkl. Rolle für
 * Berechtigungsprüfungen).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? ""
  const token = authHeader.replace(/^Bearer\s+/i, "")

  if (!token) {
    const error: ApiError = {
      error: "missing_token",
      message: "Authorization: Bearer <token> Header fehlt.",
    }
    return NextResponse.json(error, { status: 401 })
  }

  const decoded = decodeToken(token)

  if (!decoded || !istTokenGueltig(decoded)) {
    const error: ApiError = {
      error: "token_expired",
      message: "Token ist abgelaufen oder ungültig.",
    }
    return NextResponse.json(error, { status: 401 })
  }

  const benutzer = await getBenutzerById(decoded.benutzerId)
  if (!benutzer) {
    const error: ApiError = {
      error: "benutzer_not_found",
      message: "Zu diesem Token existiert kein Benutzer mehr.",
    }
    return NextResponse.json(error, { status: 404 })
  }

  return NextResponse.json(
    { valid: true, benutzer: toPublicBenutzer(benutzer) },
    { status: 200 }
  )
}
