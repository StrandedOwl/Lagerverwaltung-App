import { NextRequest } from "next/server"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { GET as benutzerById, DELETE, PUT } from "@/app/api/benutzer/[id]/route"
import { GET as benutzerListe, POST } from "@/app/api/benutzer/route"
import { POST as login } from "@/app/api/auth/login/route"
import { POST as logout } from "@/app/api/auth/logout/route"
import { GET as verify } from "@/app/api/auth/verify/route"
import { hashePasswort } from "@/lib/passwort"
import { erzeugeToken } from "@/lib/token"
import { BenutzerRecord } from "@/lib/types"

import { alleDaten, setzeDaten } from "./helpers/fake-repository"

// Echte Datenbank durch In-Memory-Daten ersetzen.
vi.mock("@/lib/benutzer-repository", () => import("./helpers/fake-repository"))

const BASIS = "http://localhost:3001"

let ADMIN: BenutzerRecord
let MITARBEITER: BenutzerRecord
let adminToken: string
let mitarbeiterToken: string

beforeAll(async () => {
  ADMIN = {
    id: "admin-1",
    name: "Lorenzo",
    email: "lorenzo@lagerverwaltung.app",
    rolle: "admin",
    erstelltAm: "2026-01-10T08:00:00.000Z",
    passwortHash: await hashePasswort("lorenzo123"),
  }
  MITARBEITER = {
    id: "mitarbeiter-1",
    name: "Andrin",
    email: "andrin@lagerverwaltung.app",
    rolle: "mitarbeiter",
    erstelltAm: "2026-02-01T09:30:00.000Z",
    passwortHash: await hashePasswort("andrin123"),
  }
  adminToken = (await erzeugeToken(ADMIN.id)).token
  mitarbeiterToken = (await erzeugeToken(MITARBEITER.id)).token
})

beforeEach(() => {
  setzeDaten([ADMIN, MITARBEITER])
})

function anfrage(
  pfad: string,
  methode: string,
  optionen: { body?: unknown; token?: string; rohBody?: string } = {}
) {
  const headers: Record<string, string> = {}
  if (optionen.body !== undefined || optionen.rohBody !== undefined) {
    headers["Content-Type"] = "application/json"
  }
  if (optionen.token) headers.Authorization = `Bearer ${optionen.token}`
  return new NextRequest(`${BASIS}${pfad}`, {
    method: methode,
    headers,
    body:
      optionen.rohBody ??
      (optionen.body === undefined ? undefined : JSON.stringify(optionen.body)),
  })
}

const kontext = (id: string) => ({ params: Promise.resolve({ id }) })

describe("GET /api/benutzer", () => {
  it("UT-R01: liefert alle Benutzer ohne Passwort-Hash", async () => {
    const res = await benutzerListe()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toHaveLength(2)
    expect(JSON.stringify(body)).not.toContain("passwort")
    expect(Object.keys(body[0]).sort()).toEqual([
      "email",
      "erstelltAm",
      "id",
      "name",
      "rolle",
    ])
  })
})

describe("GET /api/benutzer/:id", () => {
  it("UT-R02: liefert einen Benutzer", async () => {
    const res = await benutzerById(
      anfrage("/api/benutzer/admin-1", "GET"),
      kontext("admin-1")
    )
    expect(res.status).toBe(200)
    expect((await res.json()).email).toBe(ADMIN.email)
  })

  it("UT-R03: unbekannte ID -> 404", async () => {
    const res = await benutzerById(
      anfrage("/api/benutzer/x", "GET"),
      kontext("x")
    )
    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe("benutzer_not_found")
  })
})

describe("POST /api/benutzer", () => {
  const neu = {
    name: "Louis",
    email: "Louis@Lagerverwaltung.app",
    passwort: "louis1234",
  }

  it("UT-R04: Registrierung legt Mitarbeiter an, hasht das Passwort und setzt Cookie", async () => {
    const res = await POST(anfrage("/api/benutzer", "POST", { body: neu }))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body).toMatchObject({
      name: "Louis",
      email: "louis@lagerverwaltung.app",
      rolle: "mitarbeiter",
    })
    expect(res.headers.get("set-cookie")).toMatch(/^token=/)

    const gespeichert = alleDaten().find((b) => b.id === body.id)!
    expect(gespeichert.passwortHash).not.toBe("louis1234")
    expect(gespeichert.passwortHash).toMatch(/^\$2/)
  })

  it("UT-R05: Registrierung als admin -> 403", async () => {
    const res = await POST(
      anfrage("/api/benutzer", "POST", { body: { ...neu, rolle: "admin" } })
    )
    expect(res.status).toBe(403)
  })

  it("UT-R06: Admin legt Admin an, bleibt aber selbst eingeloggt (kein Cookie)", async () => {
    const res = await POST(
      anfrage("/api/benutzer", "POST", {
        body: { ...neu, rolle: "admin" },
        token: adminToken,
      })
    )
    expect(res.status).toBe(201)
    expect((await res.json()).rolle).toBe("admin")
    expect(res.headers.get("set-cookie")).toBeNull()
  })

  it("UT-R07: eingeloggter Mitarbeiter darf niemanden anlegen -> 403", async () => {
    const res = await POST(
      anfrage("/api/benutzer", "POST", { body: neu, token: mitarbeiterToken })
    )
    expect(res.status).toBe(403)
  })

  it("UT-R08: doppelte Email (auch anders geschrieben) -> 409", async () => {
    const res = await POST(
      anfrage("/api/benutzer", "POST", {
        body: { ...neu, email: "ANDRIN@lagerverwaltung.app" },
      })
    )
    expect(res.status).toBe(409)
    expect((await res.json()).error).toBe("email_vergeben")
  })

  it("UT-R09: ungültige Eingaben -> 400 mit Details", async () => {
    const res = await POST(
      anfrage("/api/benutzer", "POST", { body: { name: "" } })
    )
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error).toBe("invalid_request")
    expect(body.details.length).toBeGreaterThan(0)
  })

  it("UT-R10: kaputtes JSON -> 400 invalid_json statt 500", async () => {
    const res = await POST(
      anfrage("/api/benutzer", "POST", { rohBody: "{kaputt" })
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe("invalid_json")
  })
})

describe("PUT /api/benutzer/:id", () => {
  it("UT-R11: ohne Login -> 401", async () => {
    const res = await PUT(
      anfrage("/api/benutzer/mitarbeiter-1", "PUT", { body: { name: "X" } }),
      kontext("mitarbeiter-1")
    )
    expect(res.status).toBe(401)
  })

  it("UT-R12: Mitarbeiter ändert eigenen Namen und eigenes Passwort", async () => {
    const res = await PUT(
      anfrage("/api/benutzer/mitarbeiter-1", "PUT", {
        body: { name: "Andrin B.", passwort: "neuesPasswort1" },
        token: mitarbeiterToken,
      }),
      kontext("mitarbeiter-1")
    )
    expect(res.status).toBe(200)
    expect((await res.json()).name).toBe("Andrin B.")
    const gespeichert = alleDaten().find((b) => b.id === "mitarbeiter-1")!
    expect(gespeichert.passwortHash).not.toBe(MITARBEITER.passwortHash)
  })

  it("UT-R13: Mitarbeiter macht sich selbst zum Admin -> 403", async () => {
    const res = await PUT(
      anfrage("/api/benutzer/mitarbeiter-1", "PUT", {
        body: { rolle: "admin" },
        token: mitarbeiterToken,
      }),
      kontext("mitarbeiter-1")
    )
    expect(res.status).toBe(403)
  })

  it("UT-R14: Mitarbeiter bearbeitet fremdes Profil -> 403", async () => {
    const res = await PUT(
      anfrage("/api/benutzer/admin-1", "PUT", {
        body: { name: "Gehackt" },
        token: mitarbeiterToken,
      }),
      kontext("admin-1")
    )
    expect(res.status).toBe(403)
  })

  it("UT-R15: Admin befördert Mitarbeiter", async () => {
    const res = await PUT(
      anfrage("/api/benutzer/mitarbeiter-1", "PUT", {
        body: { rolle: "admin" },
        token: adminToken,
      }),
      kontext("mitarbeiter-1")
    )
    expect(res.status).toBe(200)
    expect((await res.json()).rolle).toBe("admin")
  })

  it("UT-R16: letzter Admin stuft sich selbst herab -> 409", async () => {
    const res = await PUT(
      anfrage("/api/benutzer/admin-1", "PUT", {
        body: { rolle: "mitarbeiter" },
        token: adminToken,
      }),
      kontext("admin-1")
    )
    expect(res.status).toBe(409)
    expect((await res.json()).error).toBe("letzter_admin")
  })

  it("UT-R17: Email eines anderen Benutzers übernehmen -> 409", async () => {
    const res = await PUT(
      anfrage("/api/benutzer/admin-1", "PUT", {
        body: { email: MITARBEITER.email },
        token: adminToken,
      }),
      kontext("admin-1")
    )
    expect(res.status).toBe(409)
  })

  it("UT-R18: eigene Email unverändert mitschicken ist ok", async () => {
    const res = await PUT(
      anfrage("/api/benutzer/admin-1", "PUT", {
        body: { email: ADMIN.email },
        token: adminToken,
      }),
      kontext("admin-1")
    )
    expect(res.status).toBe(200)
  })

  it("UT-R19: unbekannte ID -> 404, leerer Body -> 400", async () => {
    const r404 = await PUT(
      anfrage("/api/benutzer/x", "PUT", {
        body: { name: "X" },
        token: adminToken,
      }),
      kontext("x")
    )
    expect(r404.status).toBe(404)
    const r400 = await PUT(
      anfrage("/api/benutzer/admin-1", "PUT", { body: {}, token: adminToken }),
      kontext("admin-1")
    )
    expect(r400.status).toBe(400)
  })
})

describe("DELETE /api/benutzer/:id", () => {
  it("UT-R20: ohne Login -> 401", async () => {
    const res = await DELETE(
      anfrage("/api/benutzer/mitarbeiter-1", "DELETE"),
      kontext("mitarbeiter-1")
    )
    expect(res.status).toBe(401)
  })

  it("UT-R21: Mitarbeiter darf nicht löschen -> 403", async () => {
    const res = await DELETE(
      anfrage("/api/benutzer/admin-1", "DELETE", { token: mitarbeiterToken }),
      kontext("admin-1")
    )
    expect(res.status).toBe(403)
  })

  it("UT-R22: Admin löscht Mitarbeiter -> 200, danach weg", async () => {
    const res = await DELETE(
      anfrage("/api/benutzer/mitarbeiter-1", "DELETE", { token: adminToken }),
      kontext("mitarbeiter-1")
    )
    expect(res.status).toBe(200)
    expect(alleDaten().map((b) => b.id)).toEqual(["admin-1"])
  })

  it("UT-R23: Admin löscht sich selbst -> 403", async () => {
    const res = await DELETE(
      anfrage("/api/benutzer/admin-1", "DELETE", { token: adminToken }),
      kontext("admin-1")
    )
    expect(res.status).toBe(403)
  })

  it("UT-R24: unbekannte ID -> 404", async () => {
    const res = await DELETE(
      anfrage("/api/benutzer/x", "DELETE", { token: adminToken }),
      kontext("x")
    )
    expect(res.status).toBe(404)
  })
})

describe("POST /api/auth/login", () => {
  it("UT-R25: korrekte Daten -> 200 mit Token, Ablaufzeit und Benutzer", async () => {
    const res = await login(
      anfrage("/api/auth/login", "POST", {
        body: { email: "LORENZO@lagerverwaltung.app", passwort: "lorenzo123" },
      })
    )
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.token.split(".")).toHaveLength(3)
    expect(body.benutzer.id).toBe("admin-1")
    expect(new Date(body.gueltigBis).getTime()).toBeGreaterThan(Date.now())
    expect(res.headers.get("set-cookie")).toMatch(/HttpOnly/i)
  })

  it("UT-R26: falsches Passwort und unbekannte Email -> gleiche 401-Antwort", async () => {
    const falsch = await login(
      anfrage("/api/auth/login", "POST", {
        body: { email: ADMIN.email, passwort: "falsch" },
      })
    )
    const unbekannt = await login(
      anfrage("/api/auth/login", "POST", {
        body: { email: "nie@x.ch", passwort: "falsch" },
      })
    )
    expect(falsch.status).toBe(401)
    expect(unbekannt.status).toBe(401)
    expect(await falsch.json()).toEqual(await unbekannt.json())
  })

  it("UT-R27: fehlende Felder -> 400", async () => {
    const res = await login(
      anfrage("/api/auth/login", "POST", { body: { email: ADMIN.email } })
    )
    expect(res.status).toBe(400)
  })
})

describe("GET /api/auth/verify", () => {
  it("UT-R28: gültiges Token -> 200 mit aktuellem Benutzer", async () => {
    const res = await verify(
      anfrage("/api/auth/verify", "GET", { token: adminToken })
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      valid: true,
      benutzer: { id: "admin-1", rolle: "admin" },
    })
  })

  it("UT-R29: ohne Header -> 401 missing_token", async () => {
    const res = await verify(anfrage("/api/auth/verify", "GET"))
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe("missing_token")
  })

  it("UT-R30: ungültiges Token -> 401 invalid_token", async () => {
    const res = await verify(
      anfrage("/api/auth/verify", "GET", { token: "a.b.c" })
    )
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe("invalid_token")
  })

  it("UT-R31: Token eines gelöschten Benutzers -> 401", async () => {
    setzeDaten([ADMIN])
    const res = await verify(
      anfrage("/api/auth/verify", "GET", { token: mitarbeiterToken })
    )
    expect(res.status).toBe(401)
  })
})

describe("POST /api/auth/logout", () => {
  it("UT-R32: löscht das Login-Cookie", async () => {
    const res = await logout(anfrage("/api/auth/logout", "POST"))
    expect(res.status).toBe(200)
    expect(res.headers.get("set-cookie")).toMatch(/token=;.*Max-Age=0/i)
  })
})

describe("Fehlerbehandlung", () => {
  it("UT-R33: unerwartete Fehler (z. B. DB weg) -> 500 im einheitlichen Format", async () => {
    const repo = await import("@/lib/benutzer-repository")
    const spion = vi
      .spyOn(repo, "listBenutzer")
      .mockRejectedValueOnce(new Error("DB down"))
    const log = vi.spyOn(console, "error").mockImplementation(() => {})

    const res = await benutzerListe()
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({
      error: "server_error",
      message: "Interner Fehler in der Benutzerverwaltung.",
    })
    spion.mockRestore()
    log.mockRestore()
  })

  it("UT-R34: doppelter DB-Eintrag (gleichzeitige Requests) -> 409", async () => {
    const repo = await import("@/lib/benutzer-repository")
    const spion = vi
      .spyOn(repo, "createBenutzer")
      .mockRejectedValueOnce(
        Object.assign(new Error("Duplicate"), { code: "ER_DUP_ENTRY" })
      )

    const res = await POST(
      anfrage("/api/benutzer", "POST", {
        body: { name: "A", email: "a@b.ch", passwort: "12345678" },
      })
    )
    expect(res.status).toBe(409)
    spion.mockRestore()
  })
})
