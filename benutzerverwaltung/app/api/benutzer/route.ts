import { NextRequest, NextResponse } from "next/server"

import {
  createBenutzer,
  emailExistiert,
  listBenutzer,
  toPublicBenutzer,
} from "@/lib/benutzer-repository"
import { erzeugeToken, setzeLoginCookie } from "@/lib/session"
import { ApiError, Benutzer } from "@/lib/types"

/**
 * GET /api/benutzer
 * Liste aller Benutzer. Wird z. B. von der Statistik-Komponente
 * verwendet, um Namen zu Benutzer-IDs aufzulösen.
 */
export async function GET() {
  const benutzer = await listBenutzer()
  return NextResponse.json(benutzer.map(toPublicBenutzer), { status: 200 })
}

/**
 * POST /api/benutzer
 * Legt einen neuen Benutzer an (nur Rolle "admin" dürfte das später).
 *
 * Verdoppelt aktuell auch als Registrierungs-Endpunkt fürs eigene
 * Frontend (kein Auth-Schutz nötig zum Anlegen). Damit man nach dem
 * Registrieren direkt eingeloggt ist, wird - genau wie bei
 * /api/auth/login - das Session-Cookie gesetzt. Der Response-Body
 * bleibt unverändert (nur der öffentliche Benutzer, kein Token) -
 * das entspricht weiterhin der vereinbarten Schnittstelle für die
 * anderen Komponenten, das Cookie ist nur ein Zusatz on top.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<Benutzer> & {
    passwort?: string
  }

  if (!body.email || !body.name || !body.rolle || !body.passwort) {
    const error: ApiError = {
      error: "invalid_request",
      message: "name, email, rolle und passwort sind erforderlich.",
    }
    return NextResponse.json(error, { status: 400 })
  }

  if (await emailExistiert(body.email)) {
    const error: ApiError = {
      error: "email_vergeben",
      message: "Zu dieser Email existiert bereits ein Benutzer.",
    }
    return NextResponse.json(error, { status: 409 })
  }

  const neuerBenutzer = await createBenutzer({
    name: body.name,
    email: body.email,
    rolle: body.rolle,
    passwortHash: body.passwort, // Platzhalter: in echt hashen!
  })

  const response = NextResponse.json(toPublicBenutzer(neuerBenutzer), {
    status: 201,
  })
  const { token, gueltigBis } = erzeugeToken(neuerBenutzer.id)
  setzeLoginCookie(response, token, gueltigBis)
  return response
}
