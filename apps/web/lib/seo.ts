import type { Metadata } from "next";

const siteUrl = "https://pipnestmarkets.com";
const siteName = "PipNest Markets";
const defaultKeywords = [
  "PipNest Markets",
  "funded trader program",
  "prop trading firm",
  "forex funding challenge",
  "trading challenge",
  "MT4 funded account",
  "MT5 funded account",
  "trader dashboard",
  "profit split",
  "trading payouts"
];

export function pageMetadata({
  title,
  description,
  path,
  keywords = []
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  const url = `${siteUrl}${path}`;
  const fullTitle = `${title} | ${siteName}`;

  return {
    title,
    description,
    keywords: [...new Set([...defaultKeywords, ...keywords])],
    alternates: {
      canonical: path
    },
    openGraph: {
      type: "website",
      url,
      siteName,
      title: fullTitle,
      description,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${title} - ${siteName}`
        },
        {
          url: "/og-square.png",
          width: 1200,
          height: 1200,
          alt: `${title} - ${siteName}`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ["/og-image.png"]
    }
  };
}

export const privateAreaMetadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};
