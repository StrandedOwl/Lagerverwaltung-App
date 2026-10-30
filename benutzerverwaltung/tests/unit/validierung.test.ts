import { describe, expect, it } from "vitest"

import {
  istRolle,
  normalisiereEmail,
  validiereBenutzerUpdate,
  validiereLogin,
  validiereNeuenBenutzer,
} from "@/lib/validierung"

const gueltig = {
  name: "Lu",
  email: "lu@lagerverwaltung.app",
  passwort: "geheim123",
}

describe("validiereNeuenBenutzer", () => {
  it("UT-V01: akzeptiert gültige Daten und setzt Standardrolle mitarbeiter", () => {
    const ergebnis = validiereNeuenBenutzer(gueltig)
    expect(ergebnis).toEqual({
      ok: true,
      daten: { ...gueltig, rolle: "mitarbeiter" },
    })
  })

  it("UT-V02: übernimmt eine gültige Rolle", () => {
    const ergebnis = validiereNeuenBenutzer({ ...gueltig, rolle: "admin" })
    expect(ergebnis.ok && ergebnis.daten.rolle).toBe("admin")
  })

  it("UT-V03: trimmt den Namen und normalisiert die Email", () => {
    const ergebnis = validiereNeuenBenutzer({
      ...gueltig,
      name: "  Lu  ",
      email: "  LU@Lagerverwaltung.APP ",
    })
    expect(ergebnis.ok && ergebnis.daten).toMatchObject({
      name: "Lu",
      email: "lu@lagerverwaltung.app",
    })
  })

  it("UT-V04: meldet alle fehlenden Pflichtfelder auf einmal", () => {
    const ergebnis = validiereNeuenBenutzer({})
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler).toHaveLength(3)
  })

  it.each([
    ["kein Objekt", null],
    ["Array", []],
    ["Text", "hallo"],
  ])("UT-V05: lehnt einen Body ab, der kein Objekt ist (%s)", (_, body) => {
    expect(validiereNeuenBenutzer(body).ok).toBe(false)
  })

  it.each([
    ["ohne @", "lu.lagerverwaltung.app"],
    ["ohne Domain-Endung", "lu@lagerverwaltung"],
    ["mit Leerzeichen", "l u@x.ch"],
    ["keine Zeichenkette", 42],
  ])("UT-V06: lehnt ungültige Email ab (%s)", (_, email) => {
    expect(validiereNeuenBenutzer({ ...gueltig, email }).ok).toBe(false)
  })

  it("UT-V07: verlangt mindestens 8 Zeichen Passwort", () => {
    expect(validiereNeuenBenutzer({ ...gueltig, passwort: "1234567" }).ok).toBe(
      false
    )
    expect(
      validiereNeuenBenutzer({ ...gueltig, passwort: "12345678" }).ok
    ).toBe(true)
  })

  it("UT-V08: lehnt Passwörter über 72 Bytes ab (bcrypt-Grenze)", () => {
    // "ä" sind 2 Bytes: 37 Zeichen = 74 Bytes
    const ergebnis = validiereNeuenBenutzer({
      ...gueltig,
      passwort: "ä".repeat(37),
    })
    expect(ergebnis.ok).toBe(false)
  })

  it("UT-V09: lehnt unbekannte Rollen ab", () => {
    expect(validiereNeuenBenutzer({ ...gueltig, rolle: "chef" }).ok).toBe(false)
  })

  it("UT-V10: lehnt leere und zu lange Namen ab", () => {
    expect(validiereNeuenBenutzer({ ...gueltig, name: "   " }).ok).toBe(false)
    expect(
      validiereNeuenBenutzer({ ...gueltig, name: "x".repeat(101) }).ok
    ).toBe(false)
  })
})

describe("validiereBenutzerUpdate", () => {
  it("UT-V11: erlaubt Teil-Updates mit einzelnen Feldern", () => {
    expect(validiereBenutzerUpdate({ name: "Neu" })).toEqual({
      ok: true,
      daten: { name: "Neu" },
    })
  })

  it("UT-V12: verlangt mindestens ein Feld", () => {
    expect(validiereBenutzerUpdate({}).ok).toBe(false)
  })

  it("UT-V13: ignoriert unbekannte Felder wie id oder erstelltAm", () => {
    const ergebnis = validiereBenutzerUpdate({
      id: "x",
      erstelltAm: "y",
      name: "A",
    })
    expect(ergebnis).toEqual({ ok: true, daten: { name: "A" } })
  })

  it("UT-V14: prüft übergebene Felder genauso streng wie beim Anlegen", () => {
    expect(validiereBenutzerUpdate({ email: "kaputt" }).ok).toBe(false)
    expect(validiereBenutzerUpdate({ passwort: "kurz" }).ok).toBe(false)
    expect(validiereBenutzerUpdate({ rolle: "gott" }).ok).toBe(false)
    expect(validiereBenutzerUpdate("text").ok).toBe(false)
  })
})

describe("validiereLogin", () => {
  it("UT-V15: normalisiert die Email und prüft die Passwort-Länge nicht", () => {
    expect(validiereLogin({ email: " A@B.CH ", passwort: "x" })).toEqual({
      ok: true,
      daten: { email: "a@b.ch", passwort: "x" },
    })
  })

  it("UT-V16: verlangt Email und Passwort", () => {
    const ergebnis = validiereLogin({ email: "", passwort: "" })
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler).toHaveLength(2)
    expect(validiereLogin(undefined).ok).toBe(false)
  })
})

describe("Hilfsfunktionen", () => {
  it("UT-V17: istRolle erkennt nur admin und mitarbeiter", () => {
    expect(istRolle("admin")).toBe(true)
    expect(istRolle("mitarbeiter")).toBe(true)
    expect(istRolle("Admin")).toBe(false)
    expect(istRolle(undefined)).toBe(false)
  })

  it("UT-V18: normalisiereEmail trimmt und schreibt klein", () => {
    expect(normalisiereEmail("  Lu@X.CH ")).toBe("lu@x.ch")
  })
})
