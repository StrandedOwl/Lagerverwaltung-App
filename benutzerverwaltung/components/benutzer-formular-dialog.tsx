"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { apiAufruf } from "@/lib/api-client"
import { Benutzer, Rolle } from "@/lib/types"

interface Props {
  /** Ohne benutzer = neuen Benutzer anlegen, mit benutzer = bearbeiten. */
  benutzer?: Benutzer
  /** Nur Admins sehen das Rollen-Feld. */
  darfRolleWaehlen: boolean
  /** Element, das den Dialog öffnet (z. B. ein Button). */
  ausloeser: React.ReactElement
}

/**
 * Dialog zum Anlegen oder Bearbeiten eines Benutzers.
 * Schickt POST /api/benutzer bzw. PUT /api/benutzer/:id und lädt danach
 * die Seite neu, damit die Tabelle die neuen Daten zeigt.
 */
export function BenutzerFormularDialog({
  benutzer,
  darfRolleWaehlen,
  ausloeser,
}: Props) {
  const router = useRouter()
  const bearbeiten = benutzer !== undefined

  const [offen, setOffen] = useState(false)
  const [name, setName] = useState(benutzer?.name ?? "")
  const [email, setEmail] = useState(benutzer?.email ?? "")
  const [rolle, setRolle] = useState<Rolle>(benutzer?.rolle ?? "mitarbeiter")
  const [passwort, setPasswort] = useState("")
  const [fehler, setFehler] = useState<string | null>(null)
  const [laedt, setLaedt] = useState(false)

  function oeffnenOderSchliessen(neuOffen: boolean) {
    if (laedt) return
    if (neuOffen) {
      // Beim Öffnen immer mit den aktuellen Werten starten.
      setName(benutzer?.name ?? "")
      setEmail(benutzer?.email ?? "")
      setRolle(benutzer?.rolle ?? "mitarbeiter")
      setPasswort("")
      setFehler(null)
    }
    setOffen(neuOffen)
  }

  async function speichern(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLaedt(true)
    setFehler(null)

    const daten: Record<string, string> = { name, email }
    if (darfRolleWaehlen) daten.rolle = rolle
    if (passwort) daten.passwort = passwort

    const ergebnis = bearbeiten
      ? await apiAufruf<Benutzer>(`/api/benutzer/${benutzer.id}`, "PUT", daten)
      : await apiAufruf<Benutzer>("/api/benutzer", "POST", daten)

    setLaedt(false)
    if (!ergebnis.ok) {
      setFehler(ergebnis.meldung)
      return
    }
    setOffen(false)
    router.refresh()
  }

  const idPrefix = benutzer ? `benutzer-${benutzer.id}` : "neuer-benutzer"

  return (
    <Dialog open={offen} onOpenChange={oeffnenOderSchliessen}>
      <DialogTrigger render={ausloeser} />
      <DialogContent>
        <form onSubmit={speichern} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {bearbeiten ? "Benutzer bearbeiten" : "Benutzer anlegen"}
            </DialogTitle>
            <DialogDescription>
              {bearbeiten
                ? "Leeres Passwort-Feld = Passwort bleibt unverändert."
                : "Der neue Benutzer kann sich danach direkt anmelden."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor={`${idPrefix}-name`}>Name</FieldLabel>
              <Input
                id={`${idPrefix}-name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor={`${idPrefix}-email`}>Email</FieldLabel>
              <Input
                id={`${idPrefix}-email`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>

            {darfRolleWaehlen && (
              <Field>
                <FieldLabel htmlFor={`${idPrefix}-rolle`}>Rolle</FieldLabel>
                <NativeSelect
                  id={`${idPrefix}-rolle`}
                  className="w-full"
                  value={rolle}
                  onChange={(e) => setRolle(e.target.value as Rolle)}
                >
                  <NativeSelectOption value="mitarbeiter">
                    Mitarbeiter
                  </NativeSelectOption>
                  <NativeSelectOption value="admin">Admin</NativeSelectOption>
                </NativeSelect>
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor={`${idPrefix}-passwort`}>
                {bearbeiten ? "Neues Passwort" : "Passwort"}
              </FieldLabel>
              <Input
                id={`${idPrefix}-passwort`}
                type="password"
                autoComplete="new-password"
                value={passwort}
                onChange={(e) => setPasswort(e.target.value)}
                minLength={8}
                required={!bearbeiten}
              />
              <FieldDescription>Mindestens 8 Zeichen.</FieldDescription>
            </Field>

            {fehler && <FieldError>{fehler}</FieldError>}
          </FieldGroup>

          <DialogFooter>
            <Button type="submit" disabled={laedt}>
              {bearbeiten ? "Speichern" : "Anlegen"}
              {laedt && <Spinner data-icon="inline-end" />}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
