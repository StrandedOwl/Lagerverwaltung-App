import { NextRequest, NextResponse } from "next/server"

import {
  emailBereitsVergeben,
  leseJson,
  mitFehlerbehandlung,
  ungueltigeEingabe,
  verweigert,
} from "@/lib/api"
import { ermittleBenutzer } from "@/lib/auth"
import {
  createBenutzer,
  emailVergeben,
  listBenutzer,
  toPublicBenutzer,
} from "@/lib/benutzer-repository"
import { darfBenutzerAnlegen } from "@/lib/berechtigungen"
import { hashePasswort } from "@/lib/passwort"
import { setzeLoginCookie } from "@/lib/session"
import { erzeugeToken } from "@/lib/token"
import { validiereNeuenBenutzer } from "@/lib/validierung"

/**
 * GET /api/benutzer
 * Liste aller Benutzer (ohne Passwort-Hash). Wird z. B. von der
 * Statistik-Komponente verwendet, um Namen zu Benutzer-IDs aufzulösen.
 * Gemäss Gruppen-Absprache ohne Login abrufbar.
 */
export const GET = mitFehlerbehandlung(async () => {
  const benutzer = await listBenutzer()
  return NextResponse.json(benutzer.map(toPublicBenutzer), { status: 200 })
})

/**
 * POST /api/benutzer
 * Legt einen neuen Benutzer an. Zwei Fälle:
 *
 *  - Nicht eingeloggt = Registrierung: nur Rolle "mitarbeiter" erlaubt.
 *    Danach ist man direkt eingeloggt (Login-Cookie wird gesetzt).
 *  - Als Admin eingeloggt: beliebige Rolle; der Admin bleibt eingeloggt
 *    (kein neues Cookie, sonst wäre er plötzlich der neue Benutzer).
 *
 * Der Response-Body ist in beiden Fällen der öffentliche Benutzer (201).
 */
export const POST = mitFehlerbehandlung(async (request: NextRequest) => {
  const pruefung = validiereNeuenBenutzer(await leseJson(request))
  if (!pruefung.ok) return ungueltigeEingabe(pruefung.fehler)
  const daten = pruefung.daten

  const akteur = await ermittleBenutzer(request)
  const entscheid = darfBenutzerAnlegen(akteur, daten.rolle)
  if (!entscheid.erlaubt) return verweigert(entscheid)

  if (await emailVergeben(daten.email)) return emailBereitsVergeben()

  const neuerBenutzer = await createBenutzer({
    name: daten.name,
    email: daten.email,
    rolle: daten.rolle,
    passwortHash: await hashePasswort(daten.passwort),
  })

  const response = NextResponse.json(toPublicBenutzer(neuerBenutzer), {
    status: 201,
  })

  if (!akteur) {
    const { token, gueltigBis } = await erzeugeToken(neuerBenutzer.id)
    setzeLoginCookie(request, response, token, gueltigBis)
  }
  return response
})
