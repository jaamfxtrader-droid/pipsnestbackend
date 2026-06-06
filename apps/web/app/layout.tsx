import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://pipnestmarkets.com"),
  applicationName: "PipNest Markets",
  title: {
    default: "PipNest Markets | Funded Trader Challenges & Prop Trading Platform",
    template: "%s | PipNest Markets"
  },
  description:
    "PipNest Markets is a professional prop trading platform for funded trader challenges, MT4/MT5-ready account workflows, trader dashboards, payouts, and affiliate growth.",
  keywords: [
    "PipNest Markets",
    "funded trader program",
    "prop trading firm",
    "forex funding challenge",
    "trading challenge",
    "MT4 funded account",
    "MT5 funded account",
    "trader dashboard",
    "profit split",
    "payout trading platform"
  ],
  alternates: {
    canonical: "/"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  openGraph: {
    type: "website",
    url: "https://pipnestmarkets.com",
    siteName: "PipNest Markets",
    title: "PipNest Markets | Funded Trader Challenges & Prop Trading Platform",
    description:
      "Join PipNest Markets for funded trader challenges, MT4/MT5-ready workflows, secure dashboards, payout tracking, and affiliate tools.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PipNest Markets funded trader platform"
      },
      {
        url: "/og-square.png",
        width: 1200,
        height: 1200,
        alt: "PipNest Markets logo and funded trader platform"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "PipNest Markets | Funded Trader Challenges",
    description:
      "Professional funded trader challenges, MT4/MT5-ready workflows, payout tracking, and secure trader dashboards.",
    images: ["/og-image.png"]
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/logo-icon.png", sizes: "512x512", type: "image/png" }],
    shortcut: [{ url: "/logo-icon.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PipNest Markets"
  }
};

export const viewport: Viewport = {
  themeColor: "#2563eb"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#f7fbff] text-slate-950 antialiased dark:bg-[#061126] dark:text-slate-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
