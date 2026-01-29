"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  LucideDownload,
  LucideCirclePlay,
  LucideZap,
  LucideShieldCheck,
  LucideSearch,
  LucideCpu,
  LucideLayers,
  LucideContainer,
  LucideTerminal,
  LucideActivity,
  LucideGauge,
  LucideChevronDown,
} from "lucide-react";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";

// Typing effect component
function TypingText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayText, setDisplayText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayText(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <span>
      {displayText}
      <span className={showCursor ? "opacity-100" : "opacity-0"}>█</span>
    </span>
  );
}

// Animated chart bar
function ChartBar({
  height,
  delay,
  label,
  value,
}: {
  height: number;
  delay: number;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
    >
      <span className="text-primary font-mono text-xs">{value}</span>
      <div
        className="w-8 bg-primary/10 rounded-sm overflow-hidden"
        style={{ height: "120px" }}
      >
        <motion.div
          className="w-full bg-primary rounded-sm"
          initial={{ height: 0 }}
          whileInView={{ height: `${height}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: delay + 0.2, ease: "easeOut" }}
        />
      </div>
      <span className="text-muted-foreground font-mono text-xs">{label}</span>
    </motion.div>
  );
}

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.8]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground"
    >
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cyber-gradient">
        <FlickeringGrid
          className="absolute inset-0 z-0"
          squareSize={4}
          gridGap={6}
          color="oklch(0.85 0.25 150)"
          maxOpacity={0.1}
          flickerChance={0.05}
        />

        {/* Scanline overlay */}
        <div className="absolute inset-0 z-[1] scanline opacity-30 pointer-events-none" />

        <motion.div
          className="container mx-auto px-4 relative z-10"
          style={{ opacity: headerOpacity }}
        >
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Badge
                variant="outline"
                className="mb-8 border-primary/30 text-primary py-2 px-6 rounded-none bg-primary/5 uppercase tracking-widest cyber-border font-mono"
              >
                <span className="animate-pulse mr-2">●</span>
                SYSTEM ONLINE v1.0
              </Badge>
            </motion.div>

            <motion.h1
              className="text-6xl md:text-8xl font-black tracking-tighter text-foreground mb-8 uppercase"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span data-text="PORT">
                PORT
              </span>
              <span className="text-primary neon-glow-strong">{" "}WATCH</span>
            </motion.h1>

            <motion.div
              className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl leading-relaxed font-mono terminal-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <TypingText
                text="> Deep shell observability for the modern engineer."
                delay={500}
              />
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    
                    size="lg"
                    className="h-16 px-12 text-xl bg-neon-glow font-black  text-black transition-all hover:scale-105 gap-3 rounded-none cyber-border border-0 shadow-[0_0_20px_rgba(0,255,136,0.3)]"
                  >
                    <LucideDownload size={24} strokeWidth={3} />
                    ACQUIRE ENGINE
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black border-primary/20 text-primary font-mono uppercase text-sm rounded-none min-w-[200px]">
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-primary/20 focus:text-primary cursor-pointer border-b border-primary/10 py-3"
                  >
                    <Link
                      href="https://github.com/Blackrose-blackhat/port-watch/releases/download/AppImage/app_0.1.0_amd64.AppImage"
                      className="w-full"
                    >
                      AppImage (.AppImage)
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-primary/20 focus:text-primary cursor-pointer border-b border-primary/10 py-3"
                  >
                    <Link
                      href="https://github.com/Blackrose-blackhat/port-watch/releases/latest"
                      className="w-full"
                    >
                      Debian (.deb)
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-primary/20 focus:text-primary cursor-pointer border-b border-primary/10 py-3"
                  >
                    <Link
                      href="https://github.com/Blackrose-blackhat/port-watch/releases/latest"
                      className="w-full"
                    >
                      RPM (.rpm)
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-primary/20 focus:text-primary cursor-pointer border-b border-primary/10 py-3"
                  >
                    <span className="w-full text-left text-muted-foreground/60 cursor-not-allowed opacity-60">
                      Mac (Coming Soon)
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-primary/20 focus:text-primary cursor-pointer py-3"
                  >
                    <Link
                      href="https://github.com/Blackrose-blackhat/port-watch/releases"
                      className="w-full"
                    >
                      Other Releases
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
             
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <LucideChevronDown className="text-primary/50" size={32} />
        </motion.div>
      </section>

      {/* Stats/Badge Strip */}
      <div className="border-y border-primary/20 bg-black py-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10 pointer-events-none" />
        <div className="flex gap-16 justify-center whitespace-nowrap font-mono text-sm uppercase tracking-[0.3em] text-primary/70">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />{" "}
            CPU_AWARE
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />{" "}
            DOCKER_BRIDGE
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />{" "}
            KERNEL_HOOKS
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />{" "}
            AES-256
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />{" "}
            {"<"}1MS LATENCY
          </span>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="container mx-auto px-4 text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 rounded-none px-4 py-1 uppercase font-mono">
              Core Modules
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6 uppercase tracking-tighter">
              High-Performance{" "}
              <span className="text-primary neon-glow">Observability</span>
            </h2>
            <div className="h-1 w-24 bg-primary mx-auto mb-8 shadow-[0_0_10px_rgba(0,255,136,0.5)]" />
          </motion.div>
        </div>

        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <LucideSearch size={32} />,
              title: "Vector Filtering",
              desc: "Heuristic filters purge 99% of background noise, exposing only relevant execution paths.",
            },
            {
              icon: <LucideShieldCheck size={32} />,
              title: "Docker Sentinel",
              desc: "Deep-packet inspection maps container PIDs to host interfaces for unified monitoring.",
            },
            {
              icon: <LucideZap size={32} />,
              title: "Kill Logic v2",
              desc: "Graceful termination with safety locks. Analyze dependencies before SIGKILL.",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <Card className="rounded-none border-primary/20 bg-black/50 hover:bg-primary/10 transition-all duration-300 group h-full flex flex-col cyber-border border-0 hover:shadow-[0_0_30px_rgba(0,255,136,0.1)]">
                <CardHeader>
                  <div className="w-16 h-16 rounded-none bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                    {f.icon}
                  </div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tight text-primary">
                    {f.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed font-mono text-sm">
                    {f.desc}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Metrics Section with Charts */}
      <section className="py-32 bg-black/50 border-y border-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.05),transparent_70%)]" />
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 rounded-none px-4 py-1 uppercase font-mono">
              Live Metrics
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6 uppercase tracking-tighter">
              Real-Time{" "}
              <span className="text-primary neon-glow">Telemetry</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* CPU Usage Chart */}
            <motion.div
              className="terminal-window rounded-none p-6"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <LucideGauge className="text-primary" size={20} />
                  <span className="font-mono text-primary uppercase text-sm">
                    CPU Usage
                  </span>
                </div>
                <span className="font-mono text-primary/50 text-xs">
                  Last 7 processes
                </span>
              </div>
              <div className="flex items-end justify-between gap-4 h-40">
                <ChartBar height={85} delay={0} label="node" value="85%" />
                <ChartBar height={62} delay={0.1} label="docker" value="62%" />
                <ChartBar height={45} delay={0.2} label="nginx" value="45%" />
                <ChartBar height={38} delay={0.3} label="redis" value="38%" />
                <ChartBar
                  height={25}
                  delay={0.4}
                  label="postgres"
                  value="25%"
                />
                <ChartBar height={18} delay={0.5} label="ssh" value="18%" />
                <ChartBar height={8} delay={0.6} label="cron" value="8%" />
              </div>
            </motion.div>

            {/* Memory Usage Chart */}
            <motion.div
              className="terminal-window rounded-none p-6"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <LucideActivity className="text-primary" size={20} />
                  <span className="font-mono text-primary uppercase text-sm">
                    Memory Allocation
                  </span>
                </div>
                <span className="font-mono text-primary/50 text-xs">In MB</span>
              </div>
              <div className="space-y-4">
                {[
                  { label: "node server.js", value: 524, max: 1024 },
                  { label: "docker-proxy", value: 312, max: 1024 },
                  { label: "nginx worker", value: 128, max: 1024 },
                  { label: "redis-server", value: 96, max: 1024 },
                  { label: "postgres", value: 256, max: 1024 },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="text-primary">{item.value}MB</span>
                    </div>
                    <div className="h-2 bg-primary/10 rounded-none overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        whileInView={{
                          width: `${(item.value / item.max) * 100}%`,
                        }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 1,
                          delay: i * 0.1,
                          ease: "easeOut",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tech Architecture Section */}
      <section className="py-32 bg-cyber-gradient border-y border-primary/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full" />
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-primary/20 text-primary border-0 mb-6 rounded-none px-4 py-1 uppercase font-mono tracking-widest font-bold">
                System Architecture
              </Badge>
              <h2 className="text-4xl md:text-6xl font-black text-foreground mb-8 uppercase tracking-tighter leading-tight">
                Forged in the <br />
                <span className="text-primary neon-glow">Linux Kernel.</span>
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: <LucideCpu className="text-primary" />,
                    title: "Ring 0 Access",
                    desc: "Low-level system calls for precise PID monitoring without overhead.",
                  },
                  {
                    icon: <LucideLayers className="text-primary" />,
                    title: "Modular Engine",
                    desc: "Decoupled frontend and core engine for maximum stability.",
                  },
                  {
                    icon: <LucideContainer className="text-primary" />,
                    title: "IPv6 Ready",
                    desc: "Native support for modern networking stacks and container protocols.",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex gap-4 items-start p-4 hover:bg-primary/5 transition-colors cyber-border border-0 group cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ x: 10 }}
                  >
                    <div className="mt-1 group-hover:rotate-12 transition-transform">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-lg uppercase tracking-tight">
                        {item.title}
                      </h4>
                      <p className="text-muted-foreground text-sm font-mono">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              className="relative group h-full"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="terminal-window aspect-square rounded-none overflow-hidden p-8 flex flex-col gap-4 group relative opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
                {/* COMING SOON OVERLAY */}
                <div className="absolute inset-0 z-[20] flex items-center justify-center p-4">
                  <div className="bg-black/80 border border-primary/40 px-6 py-4 cyber-border rotate-[-5deg] shadow-[0_0_20px_rgba(0,255,136,0.2)]">
                    <span className="text-primary font-black text-2xl uppercase tracking-[0.2em] italic neon-glow">
                      CLI Coming Soon
                    </span>
                  </div>
                </div>

                {/* Scanline effect */}
                <div className="absolute inset-0 scanline opacity-20 pointer-events-none z-10" />

                <div className="flex gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-destructive/50" />
                  <div className="w-3 h-3 rounded-full bg-primary/50" />
                  <div className="w-3 h-3 rounded-full bg-primary" />
                </div>
                <div className="space-y-2 font-mono text-xs md:text-sm terminal-text">
                  <p className="text-primary/60">$ portwatch --init</p>
                  <motion.p
                    className="text-primary"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                  >
                    [OK] Kernel interface connected.
                  </motion.p>
                  <motion.p
                    className="text-primary"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                  >
                    [OK] Docker container daemon detected.
                  </motion.p>
                  <motion.p
                    className="text-primary"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7 }}
                  >
                    [OK] Filter rules loaded: 84 active.
                  </motion.p>
                  <motion.p
                    className="text-primary/40 mt-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.9 }}
                  >
                    $ portwatch monitor --port 3000
                  </motion.p>
                  <motion.div
                    className="bg-primary/10 p-3 mt-2 border border-primary/20"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.1 }}
                  >
                    <p className="text-primary">
                      PID: 12845 | CMD: node server.js
                    </p>
                    <p className="text-primary">
                      NET: 172.17.0.2:3000 {"->"} 0.0.0.0:*
                    </p>
                    <p className="text-primary">MEM: 124MB | CPU: 1.2%</p>
                  </motion.div>
                  <motion.p
                    className="text-primary/60 mt-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.3 }}
                  >
                    _ Monitoring active
                    <span className="animate-pulse">...</span>
                  </motion.p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section
        id="download"
        className="py-32 bg-black relative overflow-hidden"
      >
        <FlickeringGrid
          className="absolute inset-0 z-0 opacity-20"
          squareSize={4}
          gridGap={20}
          color="oklch(0.85 0.25 150)"
          maxOpacity={0.1}
          flickerChance={0.1}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.1),transparent_50%)]" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <LucideTerminal size={64} className="text-primary mx-auto mb-12" />
            <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter uppercase text-foreground">
              Deploy the{" "}
              <span className="text-primary neon-glow-strong">Engine.</span>
            </h2>
            <p className="text-muted-foreground text-xl mb-12 font-mono">
              Available for Ubuntu, Debian, Fedora, Arch, and Gentoo. Minimal
              footprint, maximum impact.
            </p>

            <div className="flex flex-col items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="lg"
                    className="h-20 px-16 text-2xl font-black bg-primary text-primary hover:text-black hover:bg-primary/90 shadow-[0_0_30px_rgba(0,255,136,0.5)] rounded-none cyber-border border-0 uppercase transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(0,255,136,0.6)]"
                  >
                    Download AppImage
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black border-primary/20 text-primary font-mono uppercase text-sm rounded-none min-w-[240px]">
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-primary/20 focus:text-primary cursor-pointer border-b border-primary/10 py-4"
                  >
                    <Link
                      href="https://github.com/Blackrose-blackhat/port-watch/releases/download/AppImage/app_0.1.0_amd64.AppImage"
                      className="w-full text-center"
                    >
                      AppImage (.AppImage)
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-primary/20 focus:text-primary cursor-pointer border-b border-primary/10 py-4"
                  >
                    <Link
                      href="https://github.com/Blackrose-blackhat/port-watch/releases/latest"
                      className="w-full text-center"
                    >
                      Debian (.deb)
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-primary/20 focus:text-primary cursor-pointer border-b border-primary/10 py-4"
                  >
                    <Link
                      href="https://github.com/Blackrose-blackhat/port-watch/releases/latest"
                      className="w-full text-center"
                    >
                      RPM (.rpm)
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-primary/20 focus:text-primary cursor-pointer py-4"
                  >
                    <Link
                      href="https://github.com/Blackrose-blackhat/port-watch/releases"
                      className="w-full text-center"
                    >
                      Other Releases
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-primary/40 font-mono text-sm mt-4 uppercase tracking-[0.2em]">
                Hash: 8f2b...3e90 | Version: 1.0.0-Stable
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-16 border-t border-primary/20 bg-black text-center relative overflow-hidden">
        <div className="absolute inset-0 scanline opacity-10 pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <p className="text-primary/40 font-mono text-sm uppercase tracking-widest">
            © 2026 PortWatch. Protocol Cyber-Green Edition. <br /> Built for the
            dark-mode generation.
          </p>
        </div>
      </footer>
    </div>
  );
}
