import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { decodeToken, istTokenGueltig } from "@/lib/token"

const TOKEN_COOKIE = "token"

/**
 * Optimistischer Login-Check für die Seiten dieser Komponente (nicht für
 * /api/*, das bleibt für die anderen Systemkomponenten offen und läuft
 * über den Authorization-Header, siehe /api/auth/verify).
 *
 * "Optimistisch", weil hier nur Format/Ablauf des Tokens geprüft werden,
 * ohne die Datenbank zu fragen - reicht für einen schnellen Redirect,
 * ersetzt aber nicht die richtige Prüfung in den API-Routen selbst.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const tokenCookie = request.cookies.get(TOKEN_COOKIE)?.value
  const decoded = tokenCookie ? decodeToken(tokenCookie) : null
  const eingeloggt = decoded !== null && istTokenGueltig(decoded)

  if (pathname === "/login") {
    // Schon eingeloggt und trotzdem auf /login? Direkt zurück zur Startseite.
    if (eingeloggt) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  if (!eingeloggt) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
