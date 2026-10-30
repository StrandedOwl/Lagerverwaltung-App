import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"

import { proxy } from "@/proxy"
import { erzeugeToken } from "@/lib/token"

function anfrage(
  pfad: string,
  optionen: { methode?: string; origin?: string; token?: string } = {}
) {
  const headers: Record<string, string> = {}
  if (optionen.origin) headers.Origin = optionen.origin
  if (optionen.token) headers.Cookie = `token=${optionen.token}`
  return new NextRequest(`http://localhost:3001${pfad}`, {
    method: optionen.methode ?? "GET",
    headers,
  })
}

describe("proxy: Seiten", () => {
  it("UT-X01: ohne Login wird / auf /login umgeleitet", async () => {
    const res = await proxy(anfrage("/"))
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toBe("http://localhost:3001/login")
  })

  it("UT-X02: mit gültigem Login wird / normal ausgeliefert", async () => {
    const { token } = await erzeugeToken("b-1")
    const res = await proxy(anfrage("/", { token }))
    expect(res.headers.get("location")).toBeNull()
  })

  it("UT-X03: eingeloggt auf /login -> zurück zur Startseite", async () => {
    const { token } = await erzeugeToken("b-1")
    const res = await proxy(anfrage("/login", { token }))
    expect(res.headers.get("location")).toBe("http://localhost:3001/")
  })

  it("UT-X04: gefälschtes Cookie zählt nicht als Login", async () => {
    const res = await proxy(anfrage("/", { token: "gefaelscht" }))
    expect(res.headers.get("location")).toBe("http://localhost:3001/login")
  })
})

describe("proxy: API und CORS", () => {
  it("UT-X05: /api/* wird nie auf /login umgeleitet", async () => {
    const res = await proxy(anfrage("/api/benutzer"))
    expect(res.headers.get("location")).toBeNull()
  })

  it("UT-X06: Preflight von erlaubtem Origin -> 204 mit CORS-Headern", async () => {
    const res = await proxy(
      anfrage("/api/auth/login", {
        methode: "OPTIONS",
        origin: "http://localhost:3002",
      })
    )
    expect(res.status).toBe(204)
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:3002"
    )
    expect(res.headers.get("access-control-allow-methods")).toContain("PUT")
  })

  it("UT-X07: normale API-Antwort an erlaubten Origin enthält CORS-Header", async () => {
    const res = await proxy(
      anfrage("/api/benutzer", { origin: "http://localhost:3003" })
    )
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:3003"
    )
  })

  it("UT-X08: fremder Origin bekommt keine Freigabe", async () => {
    const res = await proxy(
      anfrage("/api/benutzer", { origin: "http://boese.example" })
    )
    expect(res.headers.get("access-control-allow-origin")).toBeNull()
  })
})
