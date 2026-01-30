"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LucideTerminal,
  LucideDownload,
  LucideGithub,
  LucideMenu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { LINKS } from "@/constants/links";
import { GithubBanner } from "./github-banner";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md group">
      <GithubBanner />
      <div className="border-b border-primary/20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity group/logo"
          >
            <div className="w-10 h-10 rounded-none bg-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover/logo:bg-primary/20 transition-colors cyber-border">
              <LucideTerminal size={20} />
            </div>
            <span className="font-black text-xl tracking-tight text-primary uppercase neon-glow">
              PortWatch
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-mono uppercase tracking-widest">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Features
            </Link>
            <Link
              href="#download"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Download
            </Link>
            <Link
              href={LINKS.GITHUB}
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
            >
              <LucideGithub size={16} />
              GitHub
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-neon-glow text-black hover:bg-primary/90 font-bold uppercase tracking-wider rounded-none cyber-border border-0 gap-2 hidden sm:flex">
                  <LucideDownload size={16} />
                  Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-black border-primary/20 text-primary font-mono uppercase text-xs rounded-none ">
                <DropdownMenuItem
                  asChild
                  className="focus:bg-primary/20 focus:text-primary cursor-pointer border-b border-primary/10"
                >
                  <Link href={LINKS.DOWNLOADS.APPIMAGE} className="w-full">
                    AppImage (.AppImage)
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="focus:bg-primary/20 focus:text-primary cursor-pointer border-b border-primary/10"
                >
                  <Link href={LINKS.DOWNLOADS.DEBIAN} className="w-full">
                    Debian (.deb)
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  asChild
                  className="focus:bg-primary/20 focus:text-primary cursor-pointer border-b border-primary/10"
                >
                  <Link href={LINKS.DOWNLOADS.RPM} className="w-full">
                    RPM (.rpm)
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  asChild
                  className="focus:bg-primary/20 focus:text-primary cursor-pointer"
                >
                  <Link href={LINKS.RELEASES} className="w-full">
                    Other Releases
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-primary hover:bg-primary/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <LucideMenu size={24} />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-primary/20 bg-black/95 backdrop-blur-md">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4 font-mono text-sm uppercase tracking-widest">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-primary transition-colors py-2"
            >
              Features
            </Link>
            <Link
              href="#download"
              className="text-muted-foreground hover:text-primary transition-colors py-2"
            >
              Download
            </Link>
            <Link
              href={LINKS.GITHUB}
              className="text-muted-foreground hover:text-primary transition-colors py-2 flex items-center gap-2"
            >
              <LucideGithub size={16} />
              GitHub
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-wider rounded-none cyber-border border-0 gap-2 mt-2">
                  <LucideDownload size={16} />
                  Download Selection
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-black border-primary/20 text-primary font-mono uppercase text-xs rounded-none w-[calc(100vw-2rem)]">
                <DropdownMenuItem
                  asChild
                  className="focus:bg-primary/20 focus:text-primary cursor-pointer border-b border-primary/10"
                >
                  <Link
                    href={LINKS.DOWNLOADS.APPIMAGE}
                    className="w-full py-2 px-4 block italic"
                  >
                    AppImage (.AppImage)
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="focus:bg-primary/20 focus:text-primary cursor-pointer border-b border-primary/10"
                >
                  <Link
                    href={LINKS.RELEASES_LATEST}
                    className="w-full py-2 px-4 block italic"
                  >
                    Debian (.deb)
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="focus:bg-primary/20 focus:text-primary cursor-pointer border-b border-primary/10"
                >
                  <Link
                    href={LINKS.RELEASES_LATEST}
                    className="w-full py-2 px-4 block italic"
                  >
                    RPM (.rpm)
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="focus:bg-primary/20 focus:text-primary cursor-pointer"
                >
                  <Link
                    href={LINKS.RELEASES}
                    className="w-full py-2 px-4 block italic"
                  >
                    Other Releases
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      )}
    </header>
  );
}
