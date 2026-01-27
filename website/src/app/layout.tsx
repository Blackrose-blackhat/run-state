import { Navbar } from "@/components/navbar"
import "./globals.css"

export const metadata = {
  title: "RunState | Next-Gen Observability for Linux Developers",
  description: "Premium performance monitoring tool for Linux developers. Zero-noise filtering, Docker native identification, and instant kill control.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased font-sans">
        <Navbar />
        {children}
      </body>
    </html>
  )
}
