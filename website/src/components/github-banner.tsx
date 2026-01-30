"use client";

import { LucideStar, LucideExternalLink, LucideGithub } from "lucide-react";
import Link from "next/link";
import { LINKS } from "@/constants/links";
import { motion } from "framer-motion";

export function GithubBanner() {
  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-primary/10 border-b border-primary/20 py-2 relative overflow-hidden group hover:bg-primary/15 transition-colors"
    >
      <div className="absolute inset-0 scanline opacity-10 pointer-events-none" />
      <div className="container mx-auto px-4 flex items-center justify-center gap-4 text-xs md:text-sm font-mono uppercase tracking-[0.2em]">
        <div className="flex items-center gap-2 text-primary">
          <LucideGithub
            size={14}
            className="group-hover:rotate-12 transition-transform"
          />
          <span className="hidden sm:inline">Engine is open source</span>
        </div>

        <div className="h-4 w-px bg-primary/20 hidden sm:block" />

        <Link
          href={LINKS.GITHUB}
          className="flex items-center gap-2 text-foreground font-black hover:text-primary transition-colors group/link"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Star on GitHub</span>
          <LucideStar
            size={14}
            className="text-primary fill-primary animate-pulse group-hover/link:scale-125 transition-transform"
          />
          <LucideExternalLink size={12} className="opacity-40" />
        </Link>
      </div>
    </motion.div>
  );
}
