/**
 * Hilfsfunktionen rund um das (aktuell nur Platzhalter-)Token-Format
 * "<benutzerId>:<gueltigBisIso>", Base64url-kodiert.
 *
 * Wird sowohl von /api/auth/verify als auch von proxy.ts (für den
 * optimistischen Login-Check auf den Seiten) verwendet.
 */

export interface DecodedToken {
  benutzerId: string
  gueltigBis: string
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8")

    // NICHT decoded.split(":") verwenden: ein ISO-Datum enthält selbst
    // Doppelpunkte (z. B. "10:50:27"), das würde es kaputt abschneiden.
    // Nur am ERSTEN Doppelpunkt trennen (UUIDs enthalten keine).
    const trennstelle = decoded.indexOf(":")
    if (trennstelle === -1) return null

    const benutzerId = decoded.slice(0, trennstelle)
    const gueltigBis = decoded.slice(trennstelle + 1)
    if (!benutzerId || !gueltigBis) return null

    return { benutzerId, gueltigBis }
  } catch {
    return null
  }
}

export function istTokenGueltig(decoded: DecodedToken): boolean {
  return new Date(decoded.gueltigBis) > new Date()
}
