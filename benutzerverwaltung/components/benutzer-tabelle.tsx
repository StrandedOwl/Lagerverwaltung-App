"use client"

import { Pencil } from "lucide-react"

import { BenutzerFormularDialog } from "@/components/benutzer-formular-dialog"
import { BenutzerLoeschenDialog } from "@/components/benutzer-loeschen-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Benutzer } from "@/lib/types"

const datumsFormat = new Intl.DateTimeFormat("de-CH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

interface Props {
  benutzer: Benutzer[]
  aktueller: Benutzer
}

/**
 * Tabelle aller Benutzer mit Aktionen je nach Berechtigung:
 *  - Admin: alle bearbeiten, alle ausser sich selbst löschen
 *  - Mitarbeiter: nur die eigene Zeile bearbeiten
 * (Die API prüft dieselben Regeln nochmals - die Oberfläche blendet nur
 * aus, was sowieso nicht erlaubt wäre.)
 */
export function BenutzerTabelle({ benutzer, aktueller }: Props) {
  const istAdmin = aktueller.rolle === "admin"

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Rolle</TableHead>
          <TableHead>Erstellt am</TableHead>
          <TableHead className="w-20 text-right">
            <span className="sr-only">Aktionen</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {benutzer.map((b) => {
          const istSelbst = b.id === aktueller.id
          return (
            <TableRow key={b.id}>
              <TableCell className="font-medium">
                {b.name}
                {istSelbst && (
                  <span className="ml-1 text-muted-foreground">(du)</span>
                )}
              </TableCell>
              <TableCell>{b.email}</TableCell>
              <TableCell>
                <Badge variant={b.rolle === "admin" ? "default" : "secondary"}>
                  {b.rolle}
                </Badge>
              </TableCell>
              <TableCell>
                {datumsFormat.format(new Date(b.erstelltAm))}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  {(istAdmin || istSelbst) && (
                    <BenutzerFormularDialog
                      benutzer={b}
                      darfRolleWaehlen={istAdmin}
                      ausloeser={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`${b.name} bearbeiten`}
                        >
                          <Pencil />
                        </Button>
                      }
                    />
                  )}
                  <BenutzerLoeschenDialog benutzer={b} istSelbst={istSelbst} />
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
