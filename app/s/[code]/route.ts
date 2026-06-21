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
    const userAgent = request.headers.get("user-agent") || null;
    const referer = request.headers.get("referer") || null;

    // Verify visitor ID exists in DB
    let validVisitorId: string | null = null;
    if (visitorId) {
      const visitorExists = await prisma.visitor.findUnique({ where: { id: visitorId } });
      if (visitorExists) {
        validVisitorId = visitorId;
      }
    }

    // Save click event
    await prisma.shortLinkClick.create({
      data: {
        shortLinkId: shortLink.id,
        visitorId: validVisitorId,
        userAgent,
        referer,
      },
    });

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
