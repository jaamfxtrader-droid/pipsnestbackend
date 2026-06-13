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
    icon: [
      { url: "/favicon.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    shortcut: [{ url: "/favicon.png", sizes: "192x192", type: "image/png" }],
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

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.pipnestmarkets.com/#organization",
      name: "PipNest Markets",
      url: "https://www.pipnestmarkets.com/",
      logo: {
        "@type": "ImageObject",
        url: "https://www.pipnestmarkets.com/_next/image?url=%2Flogo.png&w=96&q=75"
      },
      description:
        "PipNest Markets is a proprietary trading evaluation platform offering funded trading challenges, trader assessments, risk management programs, and performance-based funding opportunities.",
      sameAs: []
    },
    {
      "@type": "FinancialService",
      "@id": "https://www.pipnestmarkets.com/#financialservice",
      name: "PipNest Markets",
      url: "https://www.pipnestmarkets.com/",
      provider: {
        "@id": "https://www.pipnestmarkets.com/#organization"
      },
      areaServed: "Worldwide",
      serviceType: [
        "Funded Trading Challenge",
        "Trader Evaluation",
        "Proprietary Trading Program",
        "Risk Management Assessment",
        "Trading Performance Analytics"
      ],
      description:
        "PipNest Markets provides trader evaluation programs designed to identify skilled traders through simulated trading challenges and performance-based assessments."
    },
    {
      "@type": "WebSite",
      "@id": "https://www.pipnestmarkets.com/#website",
      url: "https://www.pipnestmarkets.com/",
      name: "PipNest Markets",
      publisher: {
        "@id": "https://www.pipnestmarkets.com/#organization"
      },
      inLanguage: "en",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://www.pipnestmarkets.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "WebPage",
      "@id": "https://www.pipnestmarkets.com/#webpage",
      url: "https://www.pipnestmarkets.com/",
      name: "PipNest Markets | Funded Trading Challenges",
      description:
        "Join PipNest Markets funded trading challenges and trader evaluation programs. Demonstrate your trading skills and unlock funding opportunities.",
      isPartOf: {
        "@id": "https://www.pipnestmarkets.com/#website"
      },
      about: {
        "@id": "https://www.pipnestmarkets.com/#financialservice"
      },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: "https://www.pipnestmarkets.com/_next/image?url=%2Flogo.png&w=96&q=75"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.pipnestmarkets.com/#breadcrumb",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://www.pipnestmarkets.com/"
        }
      ]
    }
  ]
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen bg-[#f7fbff] text-slate-950 antialiased dark:bg-[#061126] dark:text-slate-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
