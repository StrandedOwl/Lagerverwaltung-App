/**
 * API-Tests (Black-Box) gegen den laufenden Server mit echter MariaDB.
 *
 * Vorbereitung:
 *   npm run db:up      (Docker-Container mit MariaDB)
 *   npm run db:reset   (Tabelle neu + Testdaten aus db/seed.sql)
 *   npm run dev        (Server auf http://localhost:3001)
 * Dann in einem zweiten Terminal:
 *   npm run test:api
 *
 * Die Tests bauen aufeinander auf und räumen am Ende selbst auf.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const API = process.env.API_URL ?? "http://localhost:3001"
const ADMIN = { email: "lorenzo@lagerverwaltung.app", passwort: "lorenzo123" }
const MITARBEITER = {
  email: "andrin@lagerverwaltung.app",
  passwort: "andrin123",
}
const TEST_EMAIL = `api-test-${Date.now()}@lagerverwaltung.app`

let adminToken = ""
let mitarbeiterToken = ""
let mitarbeiterId = ""
let neueId = ""

async function aufruf(
  pfad: string,
  methode = "GET",
  optionen: {
    body?: unknown
    token?: string
    headers?: Record<string, string>
  } = {}
) {
  const headers: Record<string, string> = { ...optionen.headers }
  if (optionen.body !== undefined) headers["Content-Type"] = "application/json"
  if (optionen.token) headers.Authorization = `Bearer ${optionen.token}`
  const res = await fetch(`${API}${pfad}`, {
    method: methode,
    headers,
    body:
      optionen.body === undefined ? undefined : JSON.stringify(optionen.body),
  })
  const text = await res.text()
  return {
    status: res.status,
    headers: res.headers,
    body: text ? JSON.parse(text) : null,
  }
}

beforeAll(async () => {
  const erreichbar = await fetch(`${API}/api/benutzer`).catch(() => null)
  if (!erreichbar) {
    throw new Error(
      `Server unter ${API} nicht erreichbar - läuft "npm run dev"?`
    )
  }
})

afterAll(async () => {
  // Aufräumen, falls ein Test mittendrin abgebrochen ist.
  if (neueId && adminToken)
    await aufruf(`/api/benutzer/${neueId}`, "DELETE", { token: adminToken })
})

describe("Authentifizierung", () => {
  it("API-01: Login als Admin liefert JWT, Ablaufzeit und Benutzer", async () => {
    const res = await aufruf("/api/auth/login", "POST", { body: ADMIN })
    expect(res.status).toBe(200)
    expect(res.body.token.split(".")).toHaveLength(3)
    expect(res.body.benutzer).toMatchObject({
      email: ADMIN.email,
      rolle: "admin",
    })
    expect(res.headers.get("set-cookie")).toMatch(/token=.*HttpOnly/i)
    adminToken = res.body.token
  })

  it("API-02: Login als Mitarbeiter", async () => {
    const res = await aufruf("/api/auth/login", "POST", { body: MITARBEITER })
    expect(res.status).toBe(200)
    mitarbeiterToken = res.body.token
    mitarbeiterId = res.body.benutzer.id
  })

  it("API-03: falsches Passwort -> 401 invalid_credentials", async () => {
    const res = await aufruf("/api/auth/login", "POST", {
      body: { email: ADMIN.email, passwort: "falsch" },
    })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe("invalid_credentials")
  })

  it("API-04: verify mit gültigem Token -> 200 valid", async () => {
    const res = await aufruf("/api/auth/verify", "GET", { token: adminToken })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      valid: true,
      benutzer: { rolle: "admin" },
    })
  })

  it("API-05: verify mit gefälschtem Token -> 401", async () => {
    const res = await aufruf("/api/auth/verify", "GET", {
      token: adminToken.slice(0, -2) + "xx",
    })
    expect(res.status).toBe(401)
  })
})

describe("Benutzer lesen", () => {
  it("API-06: GET /api/benutzer liefert Liste ohne Passwörter", async () => {
    const res = await aufruf("/api/benutzer")
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(3)
    expect(JSON.stringify(res.body)).not.toMatch(/passwort|\$2[aby]\$/)
  })

  it("API-07: GET /api/benutzer/:id liefert einzelnen Benutzer, unbekannt -> 404", async () => {
    expect((await aufruf(`/api/benutzer/${mitarbeiterId}`)).body.email).toBe(
      MITARBEITER.email
    )
    expect((await aufruf("/api/benutzer/gibt-es-nicht")).status).toBe(404)
  })
})

describe("Benutzer anlegen, bearbeiten, löschen", () => {
  it("API-08: Admin legt neuen Benutzer an -> 201", async () => {
    const res = await aufruf("/api/benutzer", "POST", {
      token: adminToken,
      body: { name: "API Test", email: TEST_EMAIL, passwort: "testtest1" },
    })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ email: TEST_EMAIL, rolle: "mitarbeiter" })
    neueId = res.body.id
  })

  it("API-09: gleiche Email nochmals -> 409", async () => {
    const res = await aufruf("/api/benutzer", "POST", {
      body: {
        name: "Doppelt",
        email: TEST_EMAIL.toUpperCase(),
        passwort: "testtest1",
      },
    })
    expect(res.status).toBe(409)
  })

  it("API-10: neuer Benutzer kann sich mit seinem Passwort anmelden", async () => {
    const res = await aufruf("/api/auth/login", "POST", {
      body: { email: TEST_EMAIL, passwort: "testtest1" },
    })
    expect(res.status).toBe(200)
  })

  it("API-11: ungültige Eingaben -> 400 mit Details", async () => {
    const res = await aufruf("/api/benutzer", "POST", {
      body: { name: "X", email: "kaputt", passwort: "kurz" },
    })
    expect(res.status).toBe(400)
    expect(res.body.details).toHaveLength(2)
  })

  it("API-12: Mitarbeiter darf fremdes Profil nicht ändern -> 403", async () => {
    const res = await aufruf(`/api/benutzer/${neueId}`, "PUT", {
      token: mitarbeiterToken,
      body: { name: "Gehackt" },
    })
    expect(res.status).toBe(403)
  })

  it("API-13: ohne Login ändern -> 401", async () => {
    const res = await aufruf(`/api/benutzer/${neueId}`, "PUT", {
      body: { name: "X" },
    })
    expect(res.status).toBe(401)
  })

  it("API-14: Admin ändert Name und Rolle -> 200", async () => {
    const res = await aufruf(`/api/benutzer/${neueId}`, "PUT", {
      token: adminToken,
      body: { name: "API Test geändert", rolle: "admin" },
    })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      name: "API Test geändert",
      rolle: "admin",
    })
  })

  it("API-15: Mitarbeiter darf nicht löschen -> 403", async () => {
    const res = await aufruf(`/api/benutzer/${neueId}`, "DELETE", {
      token: mitarbeiterToken,
    })
    expect(res.status).toBe(403)
  })

  it("API-16: Admin löscht Benutzer -> 200, danach 404", async () => {
    const res = await aufruf(`/api/benutzer/${neueId}`, "DELETE", {
      token: adminToken,
    })
    expect(res.status).toBe(200)
    expect((await aufruf(`/api/benutzer/${neueId}`)).status).toBe(404)
    neueId = ""
  })

  it("API-17: Admin kann sich nicht selbst löschen -> 403", async () => {
    const ich = await aufruf("/api/auth/verify", "GET", { token: adminToken })
    const res = await aufruf(
      `/api/benutzer/${ich.body.benutzer.id}`,
      "DELETE",
      { token: adminToken }
    )
    expect(res.status).toBe(403)
  })
})

describe("Integration mit anderen Komponenten", () => {
  it("API-18: CORS-Preflight von localhost:3002 wird erlaubt", async () => {
    const res = await fetch(`${API}/api/auth/verify`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3002",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "authorization",
      },
    })
    expect(res.status).toBe(204)
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:3002"
    )
  })

  it("API-19: Seiten ohne Login leiten auf /login um", async () => {
    const res = await fetch(`${API}/`, { redirect: "manual" })
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toMatch(/\/login$/)
  })
})
