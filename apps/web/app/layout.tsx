import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  applicationName: "PipNest Markets",
  title: "PipNest Markets",
  description: "Professional prop firm platform with funding challenges, trader dashboards, payouts, and MT4/MT5-ready workflows.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/logo-icon.png", type: "image/png" }],
    shortcut: [{ url: "/logo-icon.png", type: "image/png" }],
    apple: [{ url: "/logo-icon.png", type: "image/png" }]
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
