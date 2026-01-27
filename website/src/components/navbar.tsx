"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LucideShield, LucideDownload } from "lucide-react"

export function Navbar() {
  return (
    <header className="fixed top-0 w-full z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <LucideShield size={18} />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">RunState</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link href="#features" className="hover:text-indigo-600 transition-colors">Features</Link>
          <Link href="#observability" className="hover:text-indigo-600 transition-colors">Observability</Link>
          <Link href="#download" className="hover:text-indigo-600 transition-colors">Linux Download</Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="hidden sm:flex text-slate-600">
            Docs
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
            Get Started
          </Button>
        </div>
      </div>
    </header>
  )
}
