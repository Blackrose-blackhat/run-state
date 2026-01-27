"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { LucideDownload, LucideCirclePlay, LucideZap, LucideShieldCheck, LucideSearch } from "lucide-react"
import Image from "next/image"
import { FlickeringGrid } from "@/components/ui/flickering-grid"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent)]">
        {/* Background Image Effect */}
        <FlickeringGrid
          className="absolute inset-0 z-0"
          squareSize={4}
          gridGap={6}
          color="#6366f1"
          maxOpacity={0.15}
          flickerChance={0.1}
        />

        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="outline" className="mb-4 border-indigo-100 text-indigo-600 py-1.5 px-4 rounded-full bg-indigo-50/50">
                RunState 1.0 is now live for Linux Meta-Engineering
              </Badge>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Observability without <br /> the <span className="text-indigo-600 font-black">Background Noise.</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-slate-500 mb-10 max-w-2xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              The premium monitoring suit for Linux developers. 
              Clean, Docker-aware, and built for those who value precise execution metadata over generic system metrics.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link href="https://github.com/Blackrose-blackhat/run-state/archive/refs/tags/Download.zip">
              <Button size="lg" className="h-14 px-10 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_10px_40px_-10px_rgba(79,70,229,0.3)] transition-all hover:scale-105 gap-2 rounded-xl">
                <LucideDownload size={22} />
                Download for Linux
              </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-slate-200 text-slate-600 hover:bg-slate-50 gap-2 rounded-xl">
                <LucideCirclePlay size={22} />
                Explore Features
              </Button>
            </motion.div>
          </div>
          
          {/* Dashboard Preview Overlay */}
          <motion.div 
            className="relative max-w-6xl mx-auto px-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative rounded-[2rem] border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden bg-white p-3">
              <div className="relative rounded-2xl overflow-hidden border border-slate-100 min-h-[500px] flex flex-col group">
                <Image src="/hero.png" fill alt="Dashboard Preview" className="object-cover opacity-10 group-hover:scale-105 transition-transform duration-700 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
                
                <div className="relative z-10 p-8 flex flex-col items-center justify-center min-h-[500px]">
                   <div className="bg-white/90 p-10 rounded-3xl border border-slate-200/50 shadow-2xl backdrop-blur-2xl flex flex-col items-center gap-6 max-w-md text-center transform hover:scale-[1.02] transition-transform">
                      <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-100 rotate-3 transform">
                        <LucideZap size={40} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise Telemetry</h3>
                        <p className="text-slate-500 text-sm">Real-time engine detecting 100% of network-active and Docker-proxy processes with near-zero overhead.</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100">IPv6 Ready</Badge>
                        <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100">Docker Aware</Badge>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-t border-slate-100">
        <div className="container mx-auto px-4 text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Precision-Engineered for Devs</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Stop searching through system logs. RunState gives you the exact telemetry you need to debug and optimize.</p>
        </div>
        
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <LucideSearch />,
              title: "Zero-Noise Filtering",
              desc: "Aggressive identification logic removes trivial system processes, leaving only your development services."
            },
            {
              icon: <LucideShieldCheck />,
              title: "Docker Native",
              desc: "Deep integration with Docker networking (IPv6) reveals what's actually happening inside your containers."
            },
            {
              icon: <LucideZap />,
              title: "Instant Kill Control",
              desc: "Two-phase graceful termination with impact analysis. Know exactly what you're killing before it dies."
            }
          ].map((f, i) => (
            <motion.div 
              key={i}
              className="p-8 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all hover:shadow-xl hover:shadow-indigo-50/20 group text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
              <p className="text-slate-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-600/10 blur-[100px] rounded-full translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-blue-600/10 blur-[100px] rounded-full -translate-x-1/2" />
        
        <div className="container mx-auto px-4 relative flex flex-col items-center">
          <div className="max-w-2xl text-center mb-12">
            <h2 className="text-4xl font-bold mb-6 italic tracking-tight italic">RunState for Linux</h2>
            <p className="text-slate-400 text-lg">Available for Ubuntu, Debian, Fedora, and Arch. Lightweight, open-source engine, premium interface.</p>
          </div>
          
         
          <Link href="https://github.com/Blackrose-blackhat/run-state/releases/download/AppImage/app_0.1.0_amd64.AppImage" >
          <Button size="lg" className="h-14 px-10 text-lg bg-white text-slate-900 hover:bg-slate-100 shadow-2xl shadow-white/5 font-bold">
            Download AppImage (64MB)
          </Button>
          </Link>
        </div>
      </section>
      
      <footer className="py-12 border-t border-slate-100 text-center text-slate-400 text-sm">
        <p>© 2026 RunState. Built for the modern meta-engineering stack. Pure White Edition.</p>
      </footer>
    </div>
  )
}
