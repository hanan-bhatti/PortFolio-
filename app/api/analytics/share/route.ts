/**
 * @file app/api/analytics/share/route.ts
 * @description API route to log post share button clicks.
 * 
 * @exports
 * - POST(request: NextRequest): Promise<NextResponse>
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, visitorId } = body;

    if (!postId) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    // Verify visitor exists if provided
    let validVisitorId: string | null = null;
    if (visitorId) {
      const visitorExists = await prisma.visitor.findUnique({ where: { id: visitorId } });
      if (visitorExists) {
        validVisitorId = visitorId;
      }
    }

    // Log the share action as an event if needed or simply increment post shares
    // Let's create a ShortLinkClick or similar click event if they click, but here we track that the share button was clicked
    // Let's log it in a general tracking table if needed, or create a ShortLinkClick representing the generation/copy action.
    // For now, let's look up the post share short link and record a copy action on it, or just return success.
    const shareLink = await prisma.shortLink.findFirst({
      where: { postId, type: "share" }
    });

    if (shareLink) {
      await prisma.shortLinkClick.create({
        data: {
          shortLinkId: shareLink.id,
          visitorId: validVisitorId,
          userAgent: request.headers.get("user-agent") || null,
          referer: "share_button_copy", // distinguish copy/generation from actual clicks
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Share tracking failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
