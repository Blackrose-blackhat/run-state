import { Navbar } from "@/components/navbar"
import "./globals.css"
import { useEffect } from "react"

export const metadata = {
  title: "RunState | Next-Gen Observability for Linux Developers",
  description: "Premium performance monitoring tool for Linux developers. Zero-noise filtering, Docker native identification, and instant kill control.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
      } else {
        document.body.classList.remove("dark");
      }
    }
  }, []);

  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased font-sans">
        <Navbar />
        {children}
      </body>
    </html>
  )
}
