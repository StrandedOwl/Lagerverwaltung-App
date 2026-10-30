import { jwtVerify, SignJWT } from "jose"

/**
 * Login-Token als signiertes JWT (HS256).
 *
 * Inhalt: sub = Benutzer-ID, iat = ausgestellt, exp = gültig bis.
 * Die Rolle steht bewusst NICHT im Token: sie wird bei jeder Prüfung
 * frisch aus der Datenbank gelesen. So wirkt eine Rollenänderung oder
 * das Löschen eines Benutzers sofort und nicht erst nach Ablauf des Tokens.
 *
 * Verwendet von: /api/auth/login, POST /api/benutzer (Registrierung),
 * /api/auth/verify, lib/auth.ts und proxy.ts.
 */

const ALGORITHMUS = "HS256"
const AUSSTELLER = "benutzerverwaltung"

/** Wie lange ein Login gültig ist. */
export const TOKEN_GUELTIGKEIT_SEKUNDEN = 60 * 60 // 1 Stunde

export interface TokenInhalt {
  benutzerId: string
  gueltigBis: string // ISO-Datum
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET fehlt oder ist kürzer als 32 Zeichen. " +
        "Bitte in .env setzen (siehe .env.example)."
    )
  }
  return new TextEncoder().encode(secret)
}

export async function erzeugeToken(
  benutzerId: string
): Promise<{ token: string; gueltigBis: string }> {
  const jetztSekunden = Math.floor(Date.now() / 1000)
  const exp = jetztSekunden + TOKEN_GUELTIGKEIT_SEKUNDEN

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: ALGORITHMUS })
    .setSubject(benutzerId)
    .setIssuer(AUSSTELLER)
    .setIssuedAt(jetztSekunden)
    .setExpirationTime(exp)
    .sign(getSecret())

  return { token, gueltigBis: new Date(exp * 1000).toISOString() }
}

/**
 * Prüft Signatur, Aussteller und Ablaufzeit.
 * Gibt null zurück, wenn das Token in irgendeiner Form ungültig ist -
 * der Grund spielt für die Aufrufer keine Rolle (immer 401).
 */
export async function pruefeToken(
  token: string | null | undefined
): Promise<TokenInhalt | null> {
  if (!token) return null
  // Ausserhalb von try: ein fehlendes Secret ist ein Konfigurationsfehler
  // und soll laut auffallen, nicht wie ein ungültiges Token aussehen.
  const secret = getSecret()
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [ALGORITHMUS],
      issuer: AUSSTELLER,
    })
    if (!payload.sub || !payload.exp) return null
    return {
      benutzerId: payload.sub,
      gueltigBis: new Date(payload.exp * 1000).toISOString(),
    }
  } catch {
    return null
  }
}

/** Liest "Authorization: Bearer <token>" aus. */
export function tokenAusAuthHeader(header: string | null): string | null {
  if (!header) return null
  const treffer = header.match(/^Bearer\s+(\S+)$/i)
  return treffer ? treffer[1] : null
}
