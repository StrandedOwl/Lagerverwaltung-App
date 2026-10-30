"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiAufruf } from "@/lib/api-client"

/**
 * Login- und Registrierungsseite.
 *
 * Beide Endpunkte (/api/auth/login und POST /api/benutzer) setzen bei
 * Erfolg das httpOnly-Login-Cookie, danach geht es zur Startseite.
 * Bei der Registrierung gibt es bewusst keine Rollenwahl: neue Konten
 * sind immer "mitarbeiter", Admins werden von einem Admin ernannt.
 */
export default function LoginPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [passwort, setPasswort] = useState("")
  const [passwortSichtbar, setPasswortSichtbar] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [laedt, setLaedt] = useState(false)

  async function absenden(
    e: React.FormEvent<HTMLFormElement>,
    url: string,
    daten: Record<string, string>
  ) {
    e.preventDefault()
    setLaedt(true)
    setFehler(null)

    const ergebnis = await apiAufruf(url, "POST", daten)
    if (!ergebnis.ok) {
      setFehler(ergebnis.meldung)
      setLaedt(false)
      return
    }
    router.push("/")
    router.refresh()
  }

  function tabGewechselt() {
    setFehler(null)
    setPasswortSichtbar(false)
  }

  const passwortFeld = (id: string, neuesPasswort: boolean) => (
    <InputGroup>
      <InputGroupInput
        id={id}
        type={passwortSichtbar ? "text" : "password"}
        autoComplete={neuesPasswort ? "new-password" : "current-password"}
        value={passwort}
        onChange={(e) => setPasswort(e.target.value)}
        minLength={neuesPasswort ? 8 : undefined}
        required
      />
      <InputGroupAddon align="inline-end">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={
            passwortSichtbar ? "Passwort verbergen" : "Passwort anzeigen"
          }
          onClick={() => setPasswortSichtbar(!passwortSichtbar)}
        >
          {passwortSichtbar ? <EyeOff /> : <Eye />}
        </Button>
      </InputGroupAddon>
    </InputGroup>
  )

  return (
    <div className="flex h-full flex-1 items-start justify-center p-4">
      <Tabs
        defaultValue="anmelden"
        onValueChange={tabGewechselt}
        className="my-auto w-full max-w-sm"
      >
        <TabsList>
          <TabsTrigger value="anmelden">Anmelden</TabsTrigger>
          <TabsTrigger value="registrieren">Registrieren</TabsTrigger>
        </TabsList>

        <TabsContent value="anmelden">
          <Card>
            <form
              onSubmit={(e) =>
                absenden(e, "/api/auth/login", { email, passwort })
              }
              className="flex flex-col gap-4"
            >
              <CardHeader>
                <CardTitle>Anmelden</CardTitle>
                <CardDescription>
                  Lagerverwaltung-App &middot; Benutzerverwaltung
                </CardDescription>
              </CardHeader>
              <FieldGroup>
                <CardContent className="flex flex-col gap-4">
                  <Field>
                    <FieldLabel htmlFor="login-email">Email</FieldLabel>
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@lagerverwaltung.app"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="login-passwort">Passwort</FieldLabel>
                    {passwortFeld("login-passwort", false)}
                  </Field>
                  {fehler && <FieldError>{fehler}</FieldError>}
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={laedt}>
                    Anmelden
                    {laedt && <Spinner data-icon="inline-end" />}
                  </Button>
                </CardFooter>
              </FieldGroup>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="registrieren">
          <Card>
            <form
              onSubmit={(e) =>
                absenden(e, "/api/benutzer", { name, email, passwort })
              }
              className="flex flex-col gap-4"
            >
              <CardHeader>
                <CardTitle>Registrieren</CardTitle>
                <CardDescription>
                  Neue Konten erhalten die Rolle &laquo;Mitarbeiter&raquo;.
                </CardDescription>
              </CardHeader>
              <FieldGroup>
                <CardContent className="flex flex-col gap-4">
                  <Field>
                    <FieldLabel htmlFor="registrieren-name">Name</FieldLabel>
                    <Input
                      id="registrieren-name"
                      autoComplete="name"
                      placeholder="Vorname"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={100}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="registrieren-email">Email</FieldLabel>
                    <Input
                      id="registrieren-email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@lagerverwaltung.app"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="registrieren-passwort">
                      Passwort
                    </FieldLabel>
                    {passwortFeld("registrieren-passwort", true)}
                    <FieldDescription>Mindestens 8 Zeichen.</FieldDescription>
                  </Field>
                  {fehler && <FieldError>{fehler}</FieldError>}
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={laedt}>
                    Registrieren
                    {laedt && <Spinner data-icon="inline-end" />}
                  </Button>
                </CardFooter>
              </FieldGroup>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
