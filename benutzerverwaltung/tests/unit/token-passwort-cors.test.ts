import { SignJWT } from "jose"
import { afterEach, describe, expect, it, vi } from "vitest"

import { corsHeaderFuer, erlaubteOrigins } from "@/lib/cors"
import { hashePasswort, pruefePasswort } from "@/lib/passwort"
import {
  erzeugeToken,
  pruefeToken,
  TOKEN_GUELTIGKEIT_SEKUNDEN,
  tokenAusAuthHeader,
} from "@/lib/token"

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describe("Token (JWT)", () => {
  it("UT-T01: ein erzeugtes Token ist gültig und enthält die Benutzer-ID", async () => {
    const { token, gueltigBis } = await erzeugeToken("b-1")
    const inhalt = await pruefeToken(token)
    expect(inhalt).toEqual({ benutzerId: "b-1", gueltigBis })
  })

  it("UT-T02: gueltigBis liegt eine Stunde in der Zukunft", async () => {
    const vorher = Date.now()
    const { gueltigBis } = await erzeugeToken("b-1")
    const differenz = new Date(gueltigBis).getTime() - vorher
    expect(differenz).toBeGreaterThan((TOKEN_GUELTIGKEIT_SEKUNDEN - 2) * 1000)
    expect(differenz).toBeLessThanOrEqual(TOKEN_GUELTIGKEIT_SEKUNDEN * 1000)
  })

  it("UT-T03: abgelaufene Tokens werden abgelehnt", async () => {
    const { token } = await erzeugeToken("b-1")
    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + (TOKEN_GUELTIGKEIT_SEKUNDEN + 60) * 1000)
    expect(await pruefeToken(token)).toBeNull()
  })

  it("UT-T04: manipulierte Tokens werden abgelehnt", async () => {
    const { token } = await erzeugeToken("b-1")
    const [kopf, , signatur] = token.split(".")
    const gefaelschterInhalt = Buffer.from(
      JSON.stringify({
        sub: "admin-id",
        exp: 9999999999,
        iss: "benutzerverwaltung",
      })
    ).toString("base64url")
    expect(
      await pruefeToken(`${kopf}.${gefaelschterInhalt}.${signatur}`)
    ).toBeNull()
  })

  it("UT-T05: Tokens mit fremdem Schlüssel werden abgelehnt", async () => {
    const fremd = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("b-1")
      .setIssuer("benutzerverwaltung")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("ein-ganz-anderer-schluessel-0123456789"))
    expect(await pruefeToken(fremd)).toBeNull()
  })

  it("UT-T06: leere oder kaputte Tokens ergeben null", async () => {
    expect(await pruefeToken(undefined)).toBeNull()
    expect(await pruefeToken("")).toBeNull()
    expect(await pruefeToken("kein.jwt")).toBeNull()
    // Altes Platzhalter-Format (Base64 "id:datum") gilt nicht mehr
    const alt = Buffer.from("b-1:2099-01-01T00:00:00.000Z").toString(
      "base64url"
    )
    expect(await pruefeToken(alt)).toBeNull()
  })

  it("UT-T07: fehlendes oder zu kurzes JWT_SECRET fällt sofort auf", async () => {
    vi.stubEnv("JWT_SECRET", "zu-kurz")
    await expect(erzeugeToken("b-1")).rejects.toThrow(/JWT_SECRET/)
    await expect(pruefeToken("x.y.z")).rejects.toThrow(/JWT_SECRET/)
  })

  it("UT-T08: liest das Token aus dem Authorization-Header", () => {
    expect(tokenAusAuthHeader("Bearer abc.def.ghi")).toBe("abc.def.ghi")
    expect(tokenAusAuthHeader("bearer abc")).toBe("abc")
    expect(tokenAusAuthHeader("Basic abc")).toBeNull()
    expect(tokenAusAuthHeader("Bearer ")).toBeNull()
    expect(tokenAusAuthHeader(null)).toBeNull()
  })
})

describe("Passwort (bcrypt)", () => {
  it("UT-P01: Hash enthält nicht das Klartext-Passwort und ist gesalzen", async () => {
    const hash1 = await hashePasswort("geheim123")
    const hash2 = await hashePasswort("geheim123")
    expect(hash1).toMatch(/^\$2[aby]\$10\$/)
    expect(hash1).not.toContain("geheim123")
    expect(hash1).not.toBe(hash2)
  })

  it("UT-P02: richtiges Passwort passt, falsches nicht", async () => {
    const hash = await hashePasswort("geheim123")
    expect(await pruefePasswort("geheim123", hash)).toBe(true)
    expect(await pruefePasswort("Geheim123", hash)).toBe(false)
  })

  it("UT-P03: ohne Hash (unbekannte Email) ist das Ergebnis immer false", async () => {
    expect(await pruefePasswort("irgendwas", undefined)).toBe(false)
    expect(await pruefePasswort("irgendwas", null)).toBe(false)
  })
})

describe("CORS", () => {
  const erlaubt = ["http://localhost:3000", "http://localhost:3002"]

  it("UT-C01: erlaubter Origin erhält passende Header", () => {
    const header = corsHeaderFuer("http://localhost:3000", erlaubt)
    expect(header["Access-Control-Allow-Origin"]).toBe("http://localhost:3000")
    expect(header["Access-Control-Allow-Headers"]).toContain("Authorization")
  })

  it("UT-C02: fremder Origin erhält keine CORS-Header", () => {
    expect(corsHeaderFuer("http://boese.example", erlaubt)).toEqual({})
    expect(corsHeaderFuer(null, erlaubt)).toEqual({})
  })

  it("UT-C03: '*' erlaubt alle Origins", () => {
    expect(
      corsHeaderFuer("http://irgendwo:1234", ["*"])[
        "Access-Control-Allow-Origin"
      ]
    ).toBe("*")
  })

  it("UT-C04: CORS_ORIGINS wird kommagetrennt gelesen, sonst Standardliste", () => {
    expect(erlaubteOrigins(" http://a:1 , http://b:2 ,")).toEqual([
      "http://a:1",
      "http://b:2",
    ])
    expect(erlaubteOrigins(undefined)).toContain("http://localhost:3000")
  })
})
