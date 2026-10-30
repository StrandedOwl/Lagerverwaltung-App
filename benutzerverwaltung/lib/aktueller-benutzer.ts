import { cache } from "react"
import { cookies } from "next/headers"

import { benutzerZuToken } from "@/lib/auth"
import { TOKEN_COOKIE } from "@/lib/session"
import { Benutzer } from "@/lib/types"

/**
 * Liest den eingeloggten Benutzer anhand des httpOnly-Login-Cookies.
 * Nur serverseitig verwendbar (Server Components, Route Handlers).
 * Gibt null zurück, wenn niemand (gültig) eingeloggt ist.
 *
 * Mit React "cache" wird pro Request nur einmal in der DB nachgeschaut,
 * auch wenn Layout und Seite die Funktion beide aufrufen.
 */
export const getAktuellerBenutzer = cache(
  async (): Promise<Benutzer | null> => {
    const token = (await cookies()).get(TOKEN_COOKIE)?.value
    return benutzerZuToken(token)
  }
)
