import { describe, expect, it } from "vitest"

import {
  darfBenutzerAnlegen,
  darfBenutzerBearbeiten,
  darfBenutzerLoeschen,
} from "@/lib/berechtigungen"
import { Benutzer } from "@/lib/types"

const admin: Benutzer = {
  id: "a1",
  name: "Admin",
  email: "admin@x.ch",
  rolle: "admin",
  erstelltAm: "2026-01-01T00:00:00.000Z",
}
const zweiterAdmin: Benutzer = { ...admin, id: "a2", email: "admin2@x.ch" }
const mitarbeiter: Benutzer = {
  ...admin,
  id: "m1",
  email: "m1@x.ch",
  rolle: "mitarbeiter",
}
const andererMitarbeiter: Benutzer = {
  ...mitarbeiter,
  id: "m2",
  email: "m2@x.ch",
}

describe("darfBenutzerAnlegen", () => {
  it("UT-B01: Registrierung (nicht eingeloggt) als mitarbeiter ist erlaubt", () => {
    expect(darfBenutzerAnlegen(null, "mitarbeiter").erlaubt).toBe(true)
  })

  it("UT-B02: Registrierung als admin ist verboten (403)", () => {
    expect(darfBenutzerAnlegen(null, "admin")).toMatchObject({
      erlaubt: false,
      status: 403,
    })
  })

  it("UT-B03: Admin darf Benutzer mit jeder Rolle anlegen", () => {
    expect(darfBenutzerAnlegen(admin, "admin").erlaubt).toBe(true)
    expect(darfBenutzerAnlegen(admin, "mitarbeiter").erlaubt).toBe(true)
  })

  it("UT-B04: eingeloggter Mitarbeiter darf niemanden anlegen", () => {
    expect(darfBenutzerAnlegen(mitarbeiter, "mitarbeiter")).toMatchObject({
      erlaubt: false,
      status: 403,
    })
  })
})

describe("darfBenutzerBearbeiten", () => {
  it("UT-B05: ohne Login -> 401", () => {
    expect(
      darfBenutzerBearbeiten(null, mitarbeiter, { name: "x" }, 1)
    ).toMatchObject({
      erlaubt: false,
      status: 401,
    })
  })

  it("UT-B06: Mitarbeiter darf eigenen Namen, Email und Passwort ändern", () => {
    const aenderung = { name: "Neu", email: "neu@x.ch", passwort: "geheim123" }
    expect(
      darfBenutzerBearbeiten(mitarbeiter, mitarbeiter, aenderung, 1).erlaubt
    ).toBe(true)
  })

  it("UT-B07: Mitarbeiter darf andere nicht bearbeiten", () => {
    expect(
      darfBenutzerBearbeiten(mitarbeiter, andererMitarbeiter, { name: "x" }, 1)
    ).toMatchObject({ erlaubt: false, status: 403 })
  })

  it("UT-B08: Mitarbeiter darf seine eigene Rolle nicht ändern", () => {
    expect(
      darfBenutzerBearbeiten(mitarbeiter, mitarbeiter, { rolle: "admin" }, 1)
    ).toMatchObject({ erlaubt: false, status: 403 })
  })

  it("UT-B09: unveränderte Rolle im Body ist für Mitarbeiter ok", () => {
    expect(
      darfBenutzerBearbeiten(
        mitarbeiter,
        mitarbeiter,
        { rolle: "mitarbeiter" },
        1
      ).erlaubt
    ).toBe(true)
  })

  it("UT-B10: Admin darf andere bearbeiten und befördern", () => {
    expect(
      darfBenutzerBearbeiten(admin, mitarbeiter, { rolle: "admin" }, 1).erlaubt
    ).toBe(true)
  })

  it("UT-B11: letzter Admin kann nicht herabgestuft werden (409)", () => {
    expect(
      darfBenutzerBearbeiten(admin, admin, { rolle: "mitarbeiter" }, 1)
    ).toMatchObject({ erlaubt: false, status: 409, error: "letzter_admin" })
  })

  it("UT-B12: bei zwei Admins darf einer herabgestuft werden", () => {
    expect(
      darfBenutzerBearbeiten(admin, zweiterAdmin, { rolle: "mitarbeiter" }, 2)
        .erlaubt
    ).toBe(true)
  })
})

describe("darfBenutzerLoeschen", () => {
  it("UT-B13: ohne Login -> 401", () => {
    expect(darfBenutzerLoeschen(null, mitarbeiter)).toMatchObject({
      status: 401,
    })
  })

  it("UT-B14: Mitarbeiter darf nicht löschen (403)", () => {
    expect(darfBenutzerLoeschen(mitarbeiter, andererMitarbeiter)).toMatchObject(
      {
        status: 403,
      }
    )
  })

  it("UT-B15: Admin darf andere löschen, auch andere Admins", () => {
    expect(darfBenutzerLoeschen(admin, mitarbeiter).erlaubt).toBe(true)
    expect(darfBenutzerLoeschen(admin, zweiterAdmin).erlaubt).toBe(true)
  })

  it("UT-B16: Admin darf sich nicht selbst löschen", () => {
    expect(darfBenutzerLoeschen(admin, admin)).toMatchObject({
      erlaubt: false,
      status: 403,
    })
  })
})
