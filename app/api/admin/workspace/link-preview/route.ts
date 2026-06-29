import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// In-memory preview cache to serve as stable TTL cache
const localCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL query parameter is required" }, { status: 400 });
  }

  // Check cache
  const cached = localCache.get(url);
  if (cached && cached.expiry > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 86400 } // NextJS fetch cache fallback
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract Open Graph / HTML Metadata
    const ogTitle = $('meta[property="og:title"]').attr("content") || $('meta[name="twitter:title"]').attr("content") || $("title").text() || "";
    const ogDesc = $('meta[property="og:description"]').attr("content") || $('meta[name="twitter:description"]').attr("content") || $('meta[name="description"]').attr("content") || "";
    let ogImage = $('meta[property="og:image"]').attr("content") || $('meta[name="twitter:image"]').attr("content") || "";
    
    // Resolve relative og:image links
    if (ogImage && ogImage.startsWith("/")) {
      const parsedUrl = new URL(url);
      ogImage = `${parsedUrl.protocol}//${parsedUrl.host}${ogImage}`;
    }

    // Resolve Favicon
    let favicon = $('link[rel="icon"]').attr("href") || $('link[rel="shortcut icon"]').attr("href") || $('link[rel="alternate icon"]').attr("href") || "";
    
    if (favicon) {
      if (favicon.startsWith("//")) {
        favicon = `https:${favicon}`;
      } else if (favicon.startsWith("/")) {
        const parsedUrl = new URL(url);
        favicon = `${parsedUrl.protocol}//${parsedUrl.host}${favicon}`;
      } else if (!favicon.startsWith("http")) {
        const parsedUrl = new URL(url);
        favicon = `${parsedUrl.protocol}//${parsedUrl.host}/${favicon}`;
      }
    } else {
      const parsedUrl = new URL(url);
      favicon = `${parsedUrl.protocol}//${parsedUrl.host}/favicon.ico`;
    }

    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.replace("www.", "");

    const data = {
      title: ogTitle.trim(),
      description: ogDesc.trim(),
      image: ogImage,
      favicon: favicon,
      url: url,
      domain: domain
    };

    // Store in cache
    localCache.set(url, {
      data,
      expiry: Date.now() + CACHE_TTL
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Link preview error:", error);
    return NextResponse.json({ error: "Could not fetch preview" }, { status: 500 });
  }
}
