/**
 * @file app/s/[code]/route.ts
 * @description Next.js route handler for processing short link redirects, tracking link/share clicks, and logging visitors.
 * 
 * @exports
 * - GET(request: NextRequest, context): Promise<NextResponse>
 * - dynamic: Constant / Helper
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BOT_PATTERN =
  /bot|crawler|spider|scraper|headless|prerender|lighthouse|pagespeed|semrush|ahrefs|\bmoz\b|dataforseo|pingdom|uptimerobot|statuspage|node-fetch|python-requests|curl|wget|axios|postman|insomnia|go-http|java\/|okhttp|dart:|cfnetwork|libwww/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const shortLink = await prisma.shortLink.findUnique({
      where: { code },
    });

    if (!shortLink) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get("v") || null;
    const visitorCookie = request.cookies.get("visitorId")?.value || null;
    const userAgent = request.headers.get("user-agent") || "";
    const referer = request.headers.get("referer") || null;

    // Verify visitor ID exists in DB
    let validVisitorId: string | null = null;
    const targetVisitorId = visitorCookie || visitorId;
    if (targetVisitorId) {
      const visitorExists = await prisma.visitor.findUnique({ where: { id: targetVisitorId } });
      if (visitorExists) {
        validVisitorId = targetVisitorId;
      }
    }

    const isBot = !userAgent || BOT_PATTERN.test(userAgent);
    const isPrefetch =
      request.headers.get("purpose") === "prefetch" ||
      request.headers.get("x-purpose") === "prefetch" ||
      request.headers.get("sec-purpose") === "prefetch" ||
      request.headers.get("purpose") === "prerender" ||
      request.headers.get("sec-purpose") === "prerender";

    const secFetchMode = request.headers.get("sec-fetch-mode") || "";
    const isNavigation = secFetchMode === "navigate" || !secFetchMode;

    // Save click event (skip for bots/crawlers/pre-renderers/unverified sessions/background prefetchers)
    if (validVisitorId && !isBot && !isPrefetch && isNavigation) {
      await prisma.shortLinkClick.create({
        data: {
          shortLinkId: shortLink.id,
          visitorId: validVisitorId,
          userAgent: userAgent || null,
          referer,
        },
      });
    }

    let target: string;
    try {
      target = new URL(shortLink.targetUrl).toString();
    } catch {
      target = new URL(shortLink.targetUrl, request.url).toString();
    }

    return NextResponse.redirect(target);
  } catch (error) {
    console.error("ShortLink redirect failed:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
