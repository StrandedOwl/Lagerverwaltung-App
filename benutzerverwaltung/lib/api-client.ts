import { ApiError } from "./types"

/**
 * Kleiner Wrapper um fetch() für die eigene Oberfläche.
 *
 * Gibt entweder die Daten oder eine lesbare Fehlermeldung zurück, damit
 * nicht jede Komponente selbst Status-Codes und das Fehlerformat
 * ({ error, message, details }) auswerten muss.
 */

export type ApiErgebnis<T> =
  { ok: true; daten: T } | { ok: false; meldung: string }

export async function apiAufruf<T>(
  url: string,
  methode: "GET" | "POST" | "PUT" | "DELETE",
  body?: unknown
): Promise<ApiErgebnis<T>> {
  let response: Response
  try {
    response = await fetch(url, {
      method: methode,
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    return { ok: false, meldung: "Server nicht erreichbar." }
  }

  const daten = await response.json().catch(() => null)

  if (!response.ok) {
    const fehler = daten as Partial<ApiError> | null
    const details = fehler?.details?.length
      ? ` ${fehler.details.join(" ")}`
      : ""
    return {
      ok: false,
      meldung: (fehler?.message ?? `Fehler ${response.status}.`) + details,
    }
  }

  return { ok: true, daten: daten as T }
}
