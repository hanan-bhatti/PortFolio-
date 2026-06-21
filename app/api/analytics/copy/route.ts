/**
 * @file app/api/analytics/copy/route.ts
 * @description API route to log code copy events.
 * 
 * @exports
 * - POST(request: NextRequest): Promise<NextResponse>
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, codeBlockId, codeBlock, isMultiline, visitorId } = body;

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

    await prisma.codeCopyEvent.create({
      data: {
        postId,
        codeBlockId: codeBlockId || null,
        codeBlock: codeBlock || "",
        isMultiline: Boolean(isMultiline),
        visitorId: validVisitorId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Copy tracking failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
