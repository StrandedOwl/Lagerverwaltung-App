"use client"

import { createContext, use } from "react"

import type { Benutzer } from "@/lib/types"

const BenutzerContext = createContext<Promise<Benutzer | null> | null>(null)

export function BenutzerProvider({
  children,
  benutzerPromise,
}: {
  children: React.ReactNode
  benutzerPromise: Promise<Benutzer | null>
}) {
  return (
    <BenutzerContext.Provider value={benutzerPromise}>
      {children}
    </BenutzerContext.Provider>
  )
}

/** Eingeloggter Benutzer oder null, wenn niemand eingeloggt ist. */
export function useBenutzer(): Benutzer | null {
  const benutzerPromise = use(BenutzerContext)
  if (!benutzerPromise) {
    throw new Error("useBenutzer muss innerhalb von <BenutzerProvider> verwendet werden.")
  }
  return use(benutzerPromise)
}
