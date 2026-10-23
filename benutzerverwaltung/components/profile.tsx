"use client"

import { ChevronsUpDown, ChevronUp, Info, LogOut } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

import { useBenutzer } from "@/components/benutzer-provider"
import { Spinner } from "./ui/spinner"

export function Profile() {
  const benutzer = useBenutzer()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  if (!benutzer) return null

  const delay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms))

  async function handleLogout() {
    setLoading(true)
    await delay(10000)

    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      router.refresh()
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(nextOpen) => {
        if (!loading) setOpen(nextOpen)
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="lg" className="h-auto gap-2 py-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted-foreground text-primary"></div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{benutzer.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {benutzer.email}
              </span>
            </div>
          </Button>
        }
      />
      <DropdownMenuContent>
        {/* <DropdownMenuGroup>
          <DropdownMenuItem>
            <Info />
            Info
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator /> */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={loading}
            closeOnClick={false}
            variant="destructive"
          >
            {loading ? <Spinner /> : <LogOut />}
            Abmelden
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
