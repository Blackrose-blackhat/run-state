import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "PortWatch | Next-Gen Observability for Linux Developers",
  description:
    "Premium performance monitoring tool for Linux developers. Zero-noise filtering, Docker native identification, and instant kill control.",
  keywords: [
    "linux",
    "observability",
    "performance monitoring",
    "docker",
    "developer tools",
    "network monitoring",
  ],
  authors: [{ name: "Blackrose Blackhat" }],
  openGraph: {
    title: "PortWatch | Next-Gen Observability for Linux Developers",
    description:
      "Premium performance monitoring tool for Linux developers. Zero-noise filtering, Docker native identification, and instant kill control.",
    url: "https://portwatch.fuxsociety.org",
    siteName: "PortWatch",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "PortWatch - Next-Gen Observability for Linux Developers",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PortWatch | Next-Gen Observability for Linux Developers",
    description:
      "Premium performance monitoring tool for Linux developers. Zero-noise filtering, Docker native identification, and instant kill control.",
    images: ["/opengraph-image.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased font-sans">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
