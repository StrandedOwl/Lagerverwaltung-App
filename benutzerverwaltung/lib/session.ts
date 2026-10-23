import { NextResponse } from "next/server"

/**
 * Gemeinsame Token-/Cookie-Logik für alles, was einen Benutzer in dieser
 * Komponente "einloggt" - aktuell also /api/auth/login und (nach
 * erfolgreicher Registrierung) /api/benutzer (POST).
 *
 * So bleibt das Token-Format an genau einer Stelle definiert, statt es
 * in jeder Route neu zusammenzubauen (siehe die Lehre aus dem Bug in
 * lib/token.ts: doppelte Logik an mehreren Stellen ist fehleranfällig).
 */

const TOKEN_COOKIE = "token"
const GUELTIGKEITSDAUER_MS = 1000 * 60 * 60 // 1 Stunde

export function erzeugeToken(benutzerId: string) {
  const gueltigBis = new Date(Date.now() + GUELTIGKEITSDAUER_MS).toISOString()
  const token = Buffer.from(`${benutzerId}:${gueltigBis}`).toString(
    "base64url"
  )
  return { token, gueltigBis }
}

export function setzeLoginCookie(
  response: NextResponse,
  token: string,
  gueltigBis: string
) {
  response.cookies.set({
    name: TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(gueltigBis),
  })
}
