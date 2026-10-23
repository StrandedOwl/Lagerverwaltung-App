import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { BenutzerProvider } from "@/components/benutzer-provider"
import { getAktuellerBenutzer } from "@/lib/aktueller-benutzer"

const fontSans = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const benutzerPromise = getAktuellerBenutzer()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "font-sans antialiased",
        fontMono.variable,
        fontSans.variable
      )}
    >
      <body className="flex min-h-screen w-screen flex-col">
        <ThemeProvider>
          <BenutzerProvider benutzerPromise={benutzerPromise}>
            <TooltipProvider>{children}</TooltipProvider>
          </BenutzerProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
