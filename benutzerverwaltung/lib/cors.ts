/**
 * CORS-Regeln für /api/*.
 *
 * Die anderen Komponenten laufen auf eigenen Ports (= eigene "Origins").
 * Ruft deren Frontend z. B. /api/auth/login direkt im Browser auf, blockiert
 * der Browser die Antwort, wenn sie keine passenden CORS-Header enthält.
 *
 * Erlaubte Origins kommen aus der Umgebungsvariable CORS_ORIGINS
 * (kommagetrennt, "*" = alle). Ohne Angabe sind localhost:3000-3004 erlaubt.
 */

const STANDARD_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:3004",
]

export const CORS_BASIS_HEADER: Record<string, string> = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "600",
}

export function erlaubteOrigins(
  wert: string | undefined = process.env.CORS_ORIGINS
): string[] {
  if (!wert || wert.trim() === "") return STANDARD_ORIGINS
  return wert
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
}

/** Liefert die CORS-Header für einen Request mit dem gegebenen Origin. */
export function corsHeaderFuer(
  origin: string | null,
  erlaubt: string[] = erlaubteOrigins()
): Record<string, string> {
  if (!origin) return {}
  if (erlaubt.includes("*")) {
    return { ...CORS_BASIS_HEADER, "Access-Control-Allow-Origin": "*" }
  }
  if (erlaubt.includes(origin)) {
    return {
      ...CORS_BASIS_HEADER,
      "Access-Control-Allow-Origin": origin,
      Vary: "Origin",
    }
  }
  return {}
}
