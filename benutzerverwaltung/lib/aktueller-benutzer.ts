import { cache } from "react"
import { cookies } from "next/headers"

import { getBenutzerById, toPublicBenutzer } from "@/lib/benutzer-repository"
import { decodeToken, istTokenGueltig } from "@/lib/token"
import { Benutzer } from "@/lib/types"

const TOKEN_COOKIE = "token"

/**
 * Liest den eingeloggten Benutzer anhand des httpOnly-Login-Cookies.
 * Nur serverseitig verwendbar (Server Components, Route Handlers).
 * Gibt null zurück, wenn niemand (gültig) eingeloggt ist.
 */
export const getAktuellerBenutzer = cache(
  async (): Promise<Benutzer | null> => {
    const token = (await cookies()).get(TOKEN_COOKIE)?.value
    const decoded = token ? decodeToken(token) : null
    if (!decoded || !istTokenGueltig(decoded)) return null

    const benutzer = await getBenutzerById(decoded.benutzerId)
    return benutzer ? toPublicBenutzer(benutzer) : null
  }
)
