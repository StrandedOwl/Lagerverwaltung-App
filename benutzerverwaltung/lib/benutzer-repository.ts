import { randomUUID } from "node:crypto"
import { RowDataPacket } from "mysql2"

import { pool } from "./db"
import { Benutzer, BenutzerRecord, Rolle } from "./types"

interface BenutzerRow extends RowDataPacket {
  id: string
  name: string
  email: string
  rolle: Rolle
  passwort_hash: string
  erstellt_am: Date
}

function rowToRecord(row: BenutzerRow): BenutzerRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    rolle: row.rolle,
    passwortHash: row.passwort_hash,
    erstelltAm: row.erstellt_am.toISOString(),
  }
}

export function toPublicBenutzer(record: BenutzerRecord): Benutzer {
  const { id, name, email, rolle, erstelltAm } = record
  return { id, name, email, rolle, erstelltAm }
}

export async function listBenutzer(): Promise<BenutzerRecord[]> {
  const [rows] = await pool.query<BenutzerRow[]>(
    "SELECT id, name, email, rolle, passwort_hash, erstellt_am FROM benutzer ORDER BY erstellt_am ASC"
  )
  return rows.map(rowToRecord)
}

export async function getBenutzerById(
  id: string
): Promise<BenutzerRecord | null> {
  const [rows] = await pool.query<BenutzerRow[]>(
    "SELECT id, name, email, rolle, passwort_hash, erstellt_am FROM benutzer WHERE id = ?",
    [id]
  )
  return rows[0] ? rowToRecord(rows[0]) : null
}

export async function getBenutzerByEmail(
  email: string
): Promise<BenutzerRecord | null> {
  const [rows] = await pool.query<BenutzerRow[]>(
    "SELECT id, name, email, rolle, passwort_hash, erstellt_am FROM benutzer WHERE email = ?",
    [email]
  )
  return rows[0] ? rowToRecord(rows[0]) : null
}

export interface CreateBenutzerInput {
  name: string
  email: string
  rolle: Rolle
  passwortHash: string
}

export async function createBenutzer(
  input: CreateBenutzerInput
): Promise<BenutzerRecord> {
  const id = randomUUID()

  await pool.query(
    "INSERT INTO benutzer (id, name, email, rolle, passwort_hash) VALUES (?, ?, ?, ?, ?)",
    [id, input.name, input.email, input.rolle, input.passwortHash]
  )

  const erstellt = await getBenutzerById(id)
  if (!erstellt) {
    throw new Error("Benutzer konnte nach dem Anlegen nicht gelesen werden.")
  }
  return erstellt
}

export interface UpdateBenutzerInput {
  name?: string
  email?: string
  rolle?: Rolle
}

export async function updateBenutzer(
  id: string,
  input: UpdateBenutzerInput
): Promise<BenutzerRecord | null> {
  const felder: string[] = []
  const werte: unknown[] = []

  if (input.name !== undefined) {
    felder.push("name = ?")
    werte.push(input.name)
  }
  if (input.email !== undefined) {
    felder.push("email = ?")
    werte.push(input.email)
  }
  if (input.rolle !== undefined) {
    felder.push("rolle = ?")
    werte.push(input.rolle)
  }

  if (felder.length === 0) {
    return getBenutzerById(id)
  }

  werte.push(id)
  await pool.query(
    `UPDATE benutzer SET ${felder.join(", ")} WHERE id = ?`,
    werte
  )

  return getBenutzerById(id)
}

export async function deleteBenutzer(
  id: string
): Promise<BenutzerRecord | null> {
  const benutzer = await getBenutzerById(id)
  if (!benutzer) return null

  await pool.query("DELETE FROM benutzer WHERE id = ?", [id])
  return benutzer
}

/** Ist die given email schon vergeben? (z. B. vor dem Anlegen prüfen) */
export async function emailExistiert(email: string): Promise<boolean> {
  const benutzer = await getBenutzerByEmail(email)
  return benutzer !== null
}
