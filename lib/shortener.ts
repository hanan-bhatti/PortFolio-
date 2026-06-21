/**
 * @file lib/shortener.ts
 * @description Helper functions for generating short links, tracking clicks, and replacing post content links.
 * 
 * @exports
 * - getOrCreateShortLink(targetUrl, type, postId): Finds or creates a ShortLink
 * - shortenPostHtml(html, postId): Parses HTML and replaces external links with tracked short links
 */

import { prisma } from "@/lib/prisma";
import { generateShortCode } from "@/lib/utils";

export async function getOrCreateShortLink(
  targetUrl: string,
  type: "link" | "share",
  postId?: string
): Promise<string> {
  const existing = await prisma.shortLink.findFirst({
    where: {
      targetUrl,
      type,
      postId: postId || null,
    },
  });

  if (existing) {
    return existing.code;
  }

  // Generate a unique code
  let code = generateShortCode();
  let attempts = 0;
  while (attempts < 10) {
    const conflict = await prisma.shortLink.findUnique({ where: { code } });
    if (!conflict) break;
    code = generateShortCode();
    attempts++;
  }

  const created = await prisma.shortLink.create({
    data: {
      code,
      targetUrl,
      type,
      postId: postId || null,
    },
  });

  return created.code;
}

export async function shortenPostHtml(html: string, postId: string): Promise<string> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hanan-bhatti.site").replace(/\/$/, "");

  // Find all href="..." in <a> tags
  const hrefRegex = /<a\s+([^>]*?\s+)?href=["']([^"']+)["']/g;

  const matches: { fullMatch: string; prefix: string; url: string }[] = [];
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    const fullMatch = match[0];
    const prefix = match[1] || "";
    const url = match[2];

    if (!url) continue;

    // Check if the URL is external
    const isExternal = url.startsWith("http://") || url.startsWith("https://");
    const isOwnSite =
      url.startsWith(siteUrl) ||
      url.startsWith("http://localhost:3000") ||
      url.startsWith("https://localhost:3000");
    const isAnchor = url.startsWith("#");

    if (isExternal && !isOwnSite && !isAnchor) {
      matches.push({ fullMatch, prefix, url });
    }
  }

  if (matches.length === 0) {
    return html;
  }

  let shortenedHtml = html;
  for (const item of matches) {
    const code = await getOrCreateShortLink(item.url, "link", postId);
    const replacement = `<a ${item.prefix}href="/s/${code}"`;
    // Replace only the specific occurrence
    shortenedHtml = shortenedHtml.replace(item.fullMatch, replacement);
  }

  return shortenedHtml;
}
