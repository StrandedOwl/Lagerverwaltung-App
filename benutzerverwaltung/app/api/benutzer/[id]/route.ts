import { NextRequest, NextResponse } from "next/server"

import {
  emailBereitsVergeben,
  leseJson,
  mitFehlerbehandlung,
  nichtAngemeldet,
  nichtGefunden,
  ungueltigeEingabe,
  verweigert,
} from "@/lib/api"
import { ermittleBenutzer } from "@/lib/auth"
import {
  deleteBenutzer,
  emailVergeben,
  getBenutzerById,
  toPublicBenutzer,
  updateBenutzer,
  zaehleAdmins,
} from "@/lib/benutzer-repository"
import {
  darfBenutzerBearbeiten,
  darfBenutzerLoeschen,
} from "@/lib/berechtigungen"
import { hashePasswort } from "@/lib/passwort"
import { validiereBenutzerUpdate } from "@/lib/validierung"

interface Kontext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/benutzer/:id
 * Details zu einem einzelnen Benutzer (gemäss Absprache ohne Login abrufbar).
 */
export const GET = mitFehlerbehandlung(
  async (_request: NextRequest, { params }: Kontext) => {
    const { id } = await params
    const benutzer = await getBenutzerById(id)
    if (!benutzer) return nichtGefunden(id)

    return NextResponse.json(toPublicBenutzer(benutzer), { status: 200 })
  }
)

/**
 * PUT /api/benutzer/:id
 * Aktualisiert name, email, rolle und/oder passwort (Teil-Update).
 * Login nötig: Admins dürfen alle bearbeiten, Mitarbeiter nur sich selbst
 * (ohne Rolle). Der letzte Admin kann nicht herabgestuft werden.
 */
export const PUT = mitFehlerbehandlung(
  async (request: NextRequest, { params }: Kontext) => {
    const { id } = await params

    // Login zuerst prüfen: Unangemeldete erhalten immer 401 und
    // erfahren so nicht, welche IDs existieren.
    const akteur = await ermittleBenutzer(request)
    if (!akteur) return nichtAngemeldet()

    const bestehender = await getBenutzerById(id)
    if (!bestehender) return nichtGefunden(id)

    const pruefung = validiereBenutzerUpdate(await leseJson(request))
    if (!pruefung.ok) return ungueltigeEingabe(pruefung.fehler)
    const daten = pruefung.daten

    const entscheid = darfBenutzerBearbeiten(
      akteur,
      toPublicBenutzer(bestehender),
      daten,
      await zaehleAdmins()
    )
    if (!entscheid.erlaubt) return verweigert(entscheid)

    if (daten.email && (await emailVergeben(daten.email, id))) {
      return emailBereitsVergeben()
    }

    const aktualisiert = await updateBenutzer(id, {
      name: daten.name,
      email: daten.email,
      rolle: daten.rolle,
      passwortHash: daten.passwort
        ? await hashePasswort(daten.passwort)
        : undefined,
    })
    if (!aktualisiert) return nichtGefunden(id)

    return NextResponse.json(toPublicBenutzer(aktualisiert), { status: 200 })
  }
)

/**
 * DELETE /api/benutzer/:id
 * Löscht einen Benutzer. Nur Admins, und nicht das eigene Konto.
 * Antwortet mit dem gelöschten Benutzer.
 */
export const DELETE = mitFehlerbehandlung(
  async (request: NextRequest, { params }: Kontext) => {
    const { id } = await params

    const akteur = await ermittleBenutzer(request)
    if (!akteur) return nichtAngemeldet()

    const ziel = await getBenutzerById(id)
    if (!ziel) return nichtGefunden(id)

    const entscheid = darfBenutzerLoeschen(akteur, toPublicBenutzer(ziel))
    if (!entscheid.erlaubt) return verweigert(entscheid)

    const geloescht = await deleteBenutzer(id)
    if (!geloescht) return nichtGefunden(id)

    return NextResponse.json(toPublicBenutzer(geloescht), { status: 200 })
  }
)
