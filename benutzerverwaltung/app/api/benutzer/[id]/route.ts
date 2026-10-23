import { NextRequest, NextResponse } from "next/server"

import {
  deleteBenutzer,
  getBenutzerById,
  toPublicBenutzer,
  updateBenutzer,
} from "@/lib/benutzer-repository"
import { ApiError, Benutzer } from "@/lib/types"

/**
 * GET /api/benutzer/:id
 * Details zu einem einzelnen Benutzer.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const benutzer = await getBenutzerById(id)

  if (!benutzer) {
    const error: ApiError = {
      error: "benutzer_not_found",
      message: `Kein Benutzer mit id "${id}" gefunden.`,
    }
    return NextResponse.json(error, { status: 404 })
  }

  return NextResponse.json(toPublicBenutzer(benutzer), { status: 200 })
}

/**
 * PUT /api/benutzer/:id
 * Aktualisiert einen bestehenden Benutzer (name, email, rolle).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const bestehender = await getBenutzerById(id)

  if (!bestehender) {
    const error: ApiError = {
      error: "benutzer_not_found",
      message: `Kein Benutzer mit id "${id}" gefunden.`,
    }
    return NextResponse.json(error, { status: 404 })
  }

  const body = (await request.json()) as Partial<Benutzer>

  const aktualisiert = await updateBenutzer(id, {
    name: body.name,
    email: body.email,
    rolle: body.rolle,
  })

  return NextResponse.json(toPublicBenutzer(aktualisiert!), { status: 200 })
}

/**
 * DELETE /api/benutzer/:id
 * Löscht einen Benutzer.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const geloescht = await deleteBenutzer(id)

  if (!geloescht) {
    const error: ApiError = {
      error: "benutzer_not_found",
      message: `Kein Benutzer mit id "${id}" gefunden.`,
    }
    return NextResponse.json(error, { status: 404 })
  }

  return NextResponse.json(toPublicBenutzer(geloescht), { status: 200 })
}
