import { NextRequest, NextResponse } from "next/server"

import { loescheLoginCookie } from "@/lib/session"

/**
 * POST /api/auth/logout
 * Löscht das Login-Cookie dieser Komponente.
 *
 * Hinweis: JWTs sind zustandslos. Ein Token, das eine andere Komponente
 * bereits erhalten hat, bleibt bis "gueltigBis" (max. 1 Stunde) gültig.
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true }, { status: 200 })
  loescheLoginCookie(request, response)
  return response
}
