import { NextResponse } from "next/server"

const TOKEN_COOKIE = "token"

/**
 * POST /api/auth/logout
 * Löscht das Login-Cookie dieser Komponente. Nur für die eigene
 * Oberfläche relevant, keine Auswirkung auf Tokens, die andere
 * Komponenten via Authorization-Header verwenden (die laufen einfach
 * bis gueltigBis weiter).
 */
export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 })
  response.cookies.set({
    name: TOKEN_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
  })
  return response
}
