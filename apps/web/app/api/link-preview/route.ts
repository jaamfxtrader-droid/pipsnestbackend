import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function meta(content: string, property: string) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["'][^>]*>`, "i")
  ];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }
  return "";
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function title(content: string) {
  const match = content.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtml(match[1].trim()) : "";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const rawUrl = requestUrl.searchParams.get("url") ?? "";
  let url: URL;

  try {
    url = new URL(rawUrl, requestUrl.origin);
  } catch {
    return NextResponse.json({ preview: null }, { status: 400 });
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return NextResponse.json({ preview: null }, { status: 400 });
  }

  try {
    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "PipNestMarketsBot/1.0" },
      next: { revalidate: 3600 }
    });
    const html = (await response.text()).slice(0, 250_000);
    const image = meta(html, "og:image");
    const imageUrl = image ? new URL(image, url).toString() : "";

    return NextResponse.json({
      preview: {
        title: meta(html, "og:title") || title(html),
        description: meta(html, "og:description") || meta(html, "description"),
        image: imageUrl,
        siteName: meta(html, "og:site_name") || url.hostname,
        url: url.toString()
      }
    });
  } catch {
    return NextResponse.json({ preview: null });
  }
}
