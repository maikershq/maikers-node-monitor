import type { Metadata, Viewport } from "next";
import { Rajdhani, Open_Sans } from "next/font/google";
import "./globals.css";

const heading = Rajdhani({
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const body = Open_Sans({
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maikers Node Monitor - Infrastructure Dashboard",
  description:
    "Real-time monitoring, metrics, and health status for Maikers cellular stigmergy nodes and agent infrastructure.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://nodes.maikers.com",
  ),

  keywords: [
    "Maikers Node Monitor",
    "Infrastructure",
    "Metrics",
    "Dashboard",
    "Cellular Stigmergy",
    "Maikers Mainframe",
    "Agent-NFT",
    "Solana Protocol",
    "AI Agents",
    "Agentic Economy",
    "NFT Collections",
    "Metaplex",
    "Blockchain",
    "Web3",
    "Permissionless",
  ],
  authors: [{ name: "Maikers" }],
  creator: "Maikers",
  publisher: "Maikers",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    siteName: "Maikers Node Monitor",
    title: "Maikers Node Monitor - Infrastructure Dashboard",
    description:
      "Real-time monitoring, metrics, and health status for Maikers cellular stigmergy nodes and agent infrastructure.",
    url: "/",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Maikers Node Monitor",
        type: "image/jpeg",
      },
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Maikers Logo",
        type: "image/png",
      },
    ],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    site: "@maikers",
    creator: "@maikers",
    title: "Maikers Node Monitor - Infrastructure Dashboard",
    description:
      "Real-time monitoring, metrics, and health status for Maikers cellular stigmergy nodes and agent infrastructure.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Maikers Node Monitor",
      },
    ],
  },

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/logo.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.json",

  alternates: {
    canonical: "/",
  },
  category: "technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${heading.variable} ${body.variable} antialiased bg-[#111111]`}
      >
        {children}
      </body>
    </html>
  );
}
