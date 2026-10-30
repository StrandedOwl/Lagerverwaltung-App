import { redirect } from "next/navigation"
import { UserPlus } from "lucide-react"

import { BenutzerFormularDialog } from "@/components/benutzer-formular-dialog"
import { BenutzerTabelle } from "@/components/benutzer-tabelle"
import { Profile } from "@/components/profile"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getAktuellerBenutzer } from "@/lib/aktueller-benutzer"
import { listBenutzer, toPublicBenutzer } from "@/lib/benutzer-repository"

export const dynamic = "force-dynamic"

/**
 * Startseite der Benutzerverwaltung: Liste aller Benutzer.
 * Admins können hier Benutzer anlegen, bearbeiten und löschen,
 * Mitarbeiter ihr eigenes Profil bearbeiten.
 */
export default async function Home() {
  const aktueller = await getAktuellerBenutzer()
  // Der Proxy leitet zwar schon um, aber das Token kann zu einem
  // inzwischen gelöschten Benutzer gehören.
  if (!aktueller) redirect("/login")

  const benutzer = (await listBenutzer()).map(toPublicBenutzer)
  const istAdmin = aktueller.rolle === "admin"

  return (
    <>
      <header className="flex w-full items-center justify-start p-2">
        <Profile />
      </header>
      <main className="mx-auto flex w-full flex-1 flex-col items-center justify-start gap-6 p-6 pt-20">
        <div className="flex size-full h-fit max-w-4xl flex-col gap-4">
          <div>
            <h1 className="font-heading text-2xl font-medium tracking-tight">
              Benutzerverwaltung
            </h1>
            <p className="text-sm text-muted-foreground">
              Lagerverwaltung-App &middot; LB2 Modul 321
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Benutzer ({benutzer.length})</CardTitle>
              <CardDescription>
                {istAdmin
                  ? "Als Admin kannst du Benutzer anlegen, bearbeiten und löschen."
                  : "Du kannst dein eigenes Profil bearbeiten."}
              </CardDescription>
              {istAdmin && (
                <CardAction>
                  <BenutzerFormularDialog
                    darfRolleWaehlen
                    ausloeser={
                      <Button size="sm" variant="default">
                        <UserPlus data-icon="inline-start" />
                        Benutzer anlegen
                      </Button>
                    }
                  />
                </CardAction>
              )}
            </CardHeader>
            <CardContent>
              <BenutzerTabelle benutzer={benutzer} aktueller={aktueller} />
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
