"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

import { useBenutzer } from "@/components/benutzer-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"

/**
 * Profil-Menü oben rechts: zeigt den eingeloggten Benutzer und
 * bietet das Abmelden an.
 */
export function Profile() {
  const benutzer = useBenutzer()
  const router = useRouter()
  const [laedt, setLaedt] = useState(false)
  const [offen, setOffen] = useState(false)

  if (!benutzer) return null

  const initiale = benutzer.name.trim().charAt(0).toUpperCase() || "?"

  async function abmelden() {
    setLaedt(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      router.refresh()
    } finally {
      setLaedt(false)
      setOffen(false)
    }
  }

  return (
    <DropdownMenu
      open={offen}
      onOpenChange={(neuOffen) => {
        if (!laedt) setOffen(neuOffen)
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="lg" className="h-auto gap-2 py-2">
            <div
              aria-hidden="true"
              className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary font-medium text-primary-foreground"
            >
              {initiale}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{benutzer.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {benutzer.email}
              </span>
            </div>
          </Button>
        }
      />
      <DropdownMenuContent align="center">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between gap-4">
            Rolle
            <Badge variant="secondary">{benutzer.rolle}</Badge>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={abmelden}
            disabled={laedt}
            closeOnClick={false}
            variant="destructive"
          >
            {laedt ? <Spinner /> : <LogOut />}
            Abmelden
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
