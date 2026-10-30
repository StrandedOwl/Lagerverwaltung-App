import { randomUUID } from "node:crypto"
import { RowDataPacket } from "mysql2"

import { pool } from "./db"
import { Benutzer, BenutzerRecord, Rolle } from "./types"

/**
 * Datenzugriff auf die Tabelle "benutzer".
 *
 * Alle SQL-Statements dieser Komponente stehen hier an einem Ort und
 * verwenden Platzhalter (?), damit keine SQL-Injection möglich ist.
 * Die Route-Handler kennen kein SQL, nur diese Funktionen.
 */

interface BenutzerRow extends RowDataPacket {
  id: string
  name: string
  email: string
  rolle: Rolle
  passwort_hash: string
  erstellt_am: Date
}

const SPALTEN = "id, name, email, rolle, passwort_hash, erstellt_am"

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

/** Entfernt den Passwort-Hash - nur dieses Objekt darf die API verlassen. */
export function toPublicBenutzer(record: BenutzerRecord): Benutzer {
  const { id, name, email, rolle, erstelltAm } = record
  return { id, name, email, rolle, erstelltAm }
}

export async function listBenutzer(): Promise<BenutzerRecord[]> {
  const [rows] = await pool.query<BenutzerRow[]>(
    `SELECT ${SPALTEN} FROM benutzer ORDER BY erstellt_am ASC`
  )
  return rows.map(rowToRecord)
}

export async function getBenutzerById(
  id: string
): Promise<BenutzerRecord | null> {
  const [rows] = await pool.query<BenutzerRow[]>(
    `SELECT ${SPALTEN} FROM benutzer WHERE id = ?`,
    [id]
  )
  return rows[0] ? rowToRecord(rows[0]) : null
}

export async function getBenutzerByEmail(
  email: string
): Promise<BenutzerRecord | null> {
  const [rows] = await pool.query<BenutzerRow[]>(
    `SELECT ${SPALTEN} FROM benutzer WHERE email = ?`,
    [email]
  )
  return rows[0] ? rowToRecord(rows[0]) : null
}

/**
 * Ist die Email schon vergeben? Mit ausserId kann ein Benutzer
 * ausgenommen werden (beim Bearbeiten darf man seine eigene Email behalten).
 */
export async function emailVergeben(
  email: string,
  ausserId?: string
): Promise<boolean> {
  const benutzer = await getBenutzerByEmail(email)
  return benutzer !== null && benutzer.id !== ausserId
}

export async function zaehleAdmins(): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS anzahl FROM benutzer WHERE rolle = 'admin'"
  )
  return Number(rows[0].anzahl)
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
  passwortHash?: string
}

/**
 * Aktualisiert nur die Felder, die übergeben wurden (Teil-Update).
 * Die Spaltennamen stammen aus einer festen Liste, nie aus dem Request.
 */
export async function updateBenutzer(
  id: string,
  input: UpdateBenutzerInput
): Promise<BenutzerRecord | null> {
  const spalten: Record<keyof UpdateBenutzerInput, string> = {
    name: "name",
    email: "email",
    rolle: "rolle",
    passwortHash: "passwort_hash",
  }

  const felder: string[] = []
  const werte: unknown[] = []

  for (const schluessel of Object.keys(
    spalten
  ) as (keyof UpdateBenutzerInput)[]) {
    const wert = input[schluessel]
    if (wert !== undefined) {
      felder.push(`${spalten[schluessel]} = ?`)
      werte.push(wert)
    }
  }

  if (felder.length > 0) {
    werte.push(id)
    await pool.query(
      `UPDATE benutzer SET ${felder.join(", ")} WHERE id = ?`,
      werte
    )
  }

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
