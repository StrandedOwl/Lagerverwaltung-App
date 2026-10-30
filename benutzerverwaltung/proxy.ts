import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { corsHeaderFuer } from "@/lib/cors"
import { TOKEN_COOKIE } from "@/lib/session"
import { pruefeToken } from "@/lib/token"

/**
 * Proxy (früher "Middleware") - läuft vor jedem Request.
 *
 * 1. /api/*: CORS-Header für die anderen Systemkomponenten setzen und
 *    Preflight-Requests (OPTIONS) direkt beantworten. Die eigentliche
 *    Berechtigungsprüfung passiert in den Route-Handlern.
 *
 * 2. Seiten: Wer nicht eingeloggt ist, wird auf /login umgeleitet.
 *    Hier wird nur die Signatur/Ablaufzeit des Tokens geprüft, ohne
 *    Datenbank - das reicht für den Redirect. Die Seiten lesen den
 *    Benutzer danach selbst aus der DB (lib/aktueller-benutzer.ts).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/")) {
    return behandleApi(request)
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value
  const eingeloggt = (await pruefeToken(token)) !== null

  if (pathname === "/login") {
    // Schon eingeloggt und trotzdem auf /login? Direkt zur Startseite.
    return eingeloggt
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next()
  }

  if (!eingeloggt) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

function behandleApi(request: NextRequest) {
  const cors = corsHeaderFuer(request.headers.get("origin"))

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: cors })
  }

  const response = NextResponse.next()
  for (const [name, wert] of Object.entries(cors)) {
    response.headers.set(name, wert)
  }
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
