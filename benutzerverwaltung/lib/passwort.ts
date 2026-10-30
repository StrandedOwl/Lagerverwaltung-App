import bcrypt from "bcryptjs"

/**
 * Passwort-Hashing mit bcrypt.
 *
 * bcryptjs ist eine reine JavaScript-Implementierung (keine nativen
 * Abhängigkeiten), läuft also ohne Build-Tools auf Windows, macOS und Linux.
 * 10 Runden sind der gängige Kompromiss zwischen Sicherheit und Tempo
 * (ca. 50–100 ms pro Hash).
 */
const SALT_RUNDEN = 10

/**
 * Gültiger Hash eines zufälligen Passworts. Wird beim Login verglichen,
 * wenn es die Email gar nicht gibt - so dauert ein Fehlversuch immer
 * gleich lang und man kann nicht über die Antwortzeit herausfinden,
 * welche Emails registriert sind.
 */
const DUMMY_HASH =
  "$2b$10$ypVAj1WTupCSo4XtQFe3xO8ChqUej93cpeCymxOkR.P7C6sdHkvJa"

export async function hashePasswort(passwort: string): Promise<string> {
  return bcrypt.hash(passwort, SALT_RUNDEN)
}

export async function pruefePasswort(
  passwort: string,
  hash: string | null | undefined
): Promise<boolean> {
  const passt = await bcrypt.compare(passwort, hash ?? DUMMY_HASH)
  return hash ? passt : false
}
