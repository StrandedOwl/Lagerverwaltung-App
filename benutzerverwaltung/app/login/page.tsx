"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Rolle } from "@/lib/types"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Eye, EyeOff } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

export default function LoginPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [rolle, setRolle] = useState<Rolle>("mitarbeiter")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [passwordVisible, setPasswordVisible] = useState(false)

  const delay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms))

  async function handleAnmelden(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // await delay(10000)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, passwort: password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.message ?? "Anmelden fehlgeschlagen.")
        return
      }

      // Das Login-Cookie wird von /api/auth/login direkt gesetzt
      // (httpOnly), hier ist nichts weiter zu tun.
      router.push("/")
      router.refresh()
    } catch {
      setError("Server nicht erreichbar.")
    } finally {
      setLoading(false)
    }
  }

  async function handleRegistrieren(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/benutzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, rolle, passwort: password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.message ?? "Registrieren fehlgeschlagen.")
        return
      }

      // Das Login-Cookie wird von POST /api/benutzer direkt mitgesetzt,
      // genau wie beim normalen Login - hier ist nichts weiter zu tun.
      router.push("/")
      router.refresh()
    } catch {
      setError("Server nicht erreichbar.")
    } finally {
      setLoading(false)
    }
  }

  const rollen = [
    { label: "Admin", value: "admin" },
    { label: "Mitarbeiter", value: "mitarbeiter" },
  ] satisfies { label: string; value: Rolle }[]

  return (
    <div className="flex h-full flex-1 items-start justify-center p-4">
      <Tabs defaultValue="anmelden" className="my-auto w-full max-w-sm">
        <TabsList>
          <TabsTrigger value="anmelden">Anmelden</TabsTrigger>
          <TabsTrigger value="registrieren">Registrieren</TabsTrigger>
        </TabsList>
        <TabsContent value="anmelden">
          <Card>
            <form onSubmit={handleAnmelden} className="flex flex-col gap-4">
              <CardHeader>
                <CardTitle>Anmelden</CardTitle>
                <CardDescription>
                  Lagerverwaltung-App &middot; Benutzerverwaltung
                </CardDescription>
              </CardHeader>
              <FieldGroup>
                <CardContent className="flex flex-col gap-4">
                  <Field className="flex flex-col gap-2">
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@lagerverwaltung.app"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Field>

                  <Field className="flex flex-col gap-2">
                    <FieldLabel htmlFor="password">Passwort</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="password"
                        type={passwordVisible ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <InputGroupAddon align="inline-end">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setPasswordVisible(!passwordVisible)}
                        >
                          {passwordVisible ? <EyeOff /> : <Eye />}
                        </Button>
                      </InputGroupAddon>
                    </InputGroup>
                  </Field>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </CardContent>
                <CardFooter>
                  <Field>
                    <Button type="submit" className="w-full" disabled={loading}>
                      Anmelden
                      {loading && <Spinner data-icon="inline-end" />}
                    </Button>
                  </Field>
                </CardFooter>
              </FieldGroup>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="registrieren">
          <Card>
            <form onSubmit={handleRegistrieren} className="flex flex-col gap-4">
              <CardHeader>
                <CardTitle>Registrieren</CardTitle>
                <CardDescription>
                  Lagerverwaltung-App &middot; Benutzerverwaltung
                </CardDescription>
              </CardHeader>
              <FieldGroup>
                <CardContent className="flex flex-col gap-4">
                  <Field className="flex flex-col gap-2">
                    <FieldLabel htmlFor="name">Name</FieldLabel>
                    <Input
                      id="name"
                      type="name"
                      placeholder="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </Field>

                  <Field className="flex flex-col gap-2">
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@lagerverwaltung.app"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Field>

                  <Field className="flex flex-col gap-2">
                    <FieldLabel htmlFor="password">Passwort</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="password"
                        type={passwordVisible ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <InputGroupAddon align="inline-end">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setPasswordVisible(!passwordVisible)}
                        >
                          {passwordVisible ? <EyeOff /> : <Eye />}
                        </Button>
                      </InputGroupAddon>
                    </InputGroup>
                  </Field>

                  <Field className="flex flex-col gap-2">
                    <FieldLabel htmlFor="rolle">Rolle</FieldLabel>
                    <RadioGroup
                      value={rolle}
                      onValueChange={(value) => setRolle(value as Rolle)}
                      required
                      className="flex"
                    >
                      {rollen.map((rolle) => (
                        <FieldLabel key={rolle.label} htmlFor={rolle.value}>
                          <Field orientation="horizontal">
                            <FieldContent>
                              <FieldTitle>{rolle.label}</FieldTitle>
                            </FieldContent>
                            <RadioGroupItem
                              value={rolle.value}
                              id={rolle.value}
                            />
                          </Field>
                        </FieldLabel>
                      ))}
                    </RadioGroup>
                  </Field>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </CardContent>
                <CardFooter>
                  <Field>
                    <Button type="submit" className="w-full" disabled={loading}>
                      Registrieren
                      {loading && <Spinner data-icon="inline-end" />}
                    </Button>
                  </Field>
                </CardFooter>
              </FieldGroup>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

{
  /* <Select
                    id="rolle"
                    items={rollen}
                    value={rolle}
                    onValueChange={(value) => setRolle(value as Rolle)}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Rollen</SelectLabel>
                        {rollen.map((rolle) => (
                          <SelectItem key={rolle.value} value={rolle.value}>
                            {rolle.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select> */
}
