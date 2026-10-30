"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { apiAufruf } from "@/lib/api-client"
import { Benutzer } from "@/lib/types"

/**
 * Sicherheitsabfrage vor DELETE /api/benutzer/:id (nur für Admins sichtbar).
 */
export function BenutzerLoeschenDialog({
  benutzer,
  istSelbst,
}: {
  benutzer: Benutzer
  istSelbst: boolean
}) {
  const router = useRouter()
  const [offen, setOffen] = useState(false)
  const [laedt, setLaedt] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  async function loeschen() {
    setLaedt(true)
    setFehler(null)
    const ergebnis = await apiAufruf<Benutzer>(
      `/api/benutzer/${benutzer.id}`,
      "DELETE"
    )
    setLaedt(false)

    if (!ergebnis.ok) {
      setFehler(ergebnis.meldung)
      return
    }
    setOffen(false)
    router.refresh()
  }

  return (
    <AlertDialog
      open={offen}
      onOpenChange={(neuOffen) => {
        if (laedt) return
        setFehler(null)
        setOffen(neuOffen)
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${benutzer.name} löschen`}
            disabled={istSelbst}
          />
        }
      >
        <Trash2 />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{benutzer.name} löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            {benutzer.email} kann sich danach nicht mehr anmelden. Das lässt
            sich nicht rückgängig machen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {fehler && <p className="text-sm text-destructive">{fehler}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={laedt}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={loeschen}
            disabled={laedt}
          >
            Löschen
            {laedt && <Spinner data-icon="inline-end" />}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
