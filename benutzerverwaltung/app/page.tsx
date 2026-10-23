import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LogoutButton } from "@/components/logout-button"
import { listBenutzer, toPublicBenutzer } from "@/lib/benutzer-repository"
import { Profile } from "@/components/profile"

export const dynamic = "force-dynamic"

export default async function Home() {
  const benutzer = (await listBenutzer()).map(toPublicBenutzer)

  return (
    <>
      <header className="flex h-fit w-full p-2">
        <Profile />
      </header>
      <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-center gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-medium tracking-tight">
              Benutzerverwaltung
            </h1>
            <p className="text-sm text-muted-foreground">
              Lagerverwaltung-App &middot; LB2 Modul 321
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Benutzer</CardTitle>
            <CardDescription>
              Aus MariaDB (siehe db/schema.sql). Wird konsumiert über GET
              /api/benutzer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Erstellt am</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {benutzer.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{b.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{b.rolle}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Intl.DateTimeFormat("de-CH", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }).format(new Date(b.erstelltAm))}
                      {/* {new Date(b.erstelltAm).toLocaleDateString("de-CH")} */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
