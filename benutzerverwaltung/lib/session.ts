import { NextRequest, NextResponse } from "next/server"

/**
 * Login-Cookie für die eigene Oberfläche dieser Komponente.
 *
 * Das Cookie enthält dasselbe JWT wie der Response-Body von
 * /api/auth/login. Die eigenen Seiten lesen es serverseitig (httpOnly,
 * also nicht per JavaScript auslesbar). Andere Komponenten verwenden
 * stattdessen den Authorization-Header (siehe SCHNITTSTELLE.md).
 *
 * Name und Optionen sind nur hier definiert, damit sie nicht in
 * mehreren Dateien auseinanderlaufen.
 */

export const TOKEN_COOKIE = "token"

/**
 * "Secure" nur, wenn die Seite wirklich über HTTPS aufgerufen wird.
 * Sonst würde der Browser das Cookie z. B. bei der Demo über
 * http://<IP>:3001 verwerfen und man käme nie über das Login hinaus.
 */
function istHttps(request: NextRequest): boolean {
  return (
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https"
  )
}

export function setzeLoginCookie(
  request: NextRequest,
  response: NextResponse,
  token: string,
  gueltigBis: string
) {
  response.cookies.set({
    name: TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: istHttps(request),
    path: "/",
    expires: new Date(gueltigBis),
  })
}

export function loescheLoginCookie(
  request: NextRequest,
  response: NextResponse
) {
  response.cookies.set({
    name: TOKEN_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: istHttps(request),
    path: "/",
    maxAge: 0,
  })
}
