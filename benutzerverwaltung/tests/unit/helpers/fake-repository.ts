/**
 * In-Memory-Ersatz für lib/benutzer-repository.ts.
 *
 * Damit lassen sich die Route-Handler ohne echte Datenbank testen:
 * die Tests ersetzen das Modul per vi.mock() durch dieses hier und
 * setzen mit setzeDaten() einen definierten Ausgangszustand.
 */
import { randomUUID } from "node:crypto"

import type {
  CreateBenutzerInput,
  UpdateBenutzerInput,
} from "@/lib/benutzer-repository"
import type { Benutzer, BenutzerRecord } from "@/lib/types"

let daten = new Map<string, BenutzerRecord>()

export function setzeDaten(records: BenutzerRecord[]) {
  daten = new Map(records.map((r) => [r.id, { ...r }]))
}

export function alleDaten(): BenutzerRecord[] {
  return [...daten.values()]
}

export function toPublicBenutzer(record: BenutzerRecord): Benutzer {
  const { id, name, email, rolle, erstelltAm } = record
  return { id, name, email, rolle, erstelltAm }
}

export async function listBenutzer() {
  return alleDaten()
}

export async function getBenutzerById(id: string) {
  return daten.get(id) ?? null
}

export async function getBenutzerByEmail(email: string) {
  return alleDaten().find((b) => b.email === email) ?? null
}

export async function emailVergeben(email: string, ausserId?: string) {
  const b = await getBenutzerByEmail(email)
  return b !== null && b.id !== ausserId
}

export async function zaehleAdmins() {
  return alleDaten().filter((b) => b.rolle === "admin").length
}

export async function createBenutzer(input: CreateBenutzerInput) {
  const record: BenutzerRecord = {
    id: randomUUID(),
    erstelltAm: new Date().toISOString(),
    ...input,
  }
  daten.set(record.id, record)
  return record
}

export async function updateBenutzer(id: string, input: UpdateBenutzerInput) {
  const b = daten.get(id)
  if (!b) return null
  const ohneUndefined = Object.fromEntries(
    Object.entries(input).filter(([, wert]) => wert !== undefined)
  )
  const neu = { ...b, ...ohneUndefined }
  daten.set(id, neu)
  return neu
}

export async function deleteBenutzer(id: string) {
  const b = daten.get(id) ?? null
  daten.delete(id)
  return b
}
