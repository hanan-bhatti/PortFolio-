/**
 * @file app/api/posts/[id]/reactions/section/route.ts
 * @description API endpoint to record a visitor's emoji reaction to a specific post section (heading/code block).
 * 
 * @exports
 * - POST(): Function
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";

/**
 * POST: Create a new section reaction for a visitor on a post.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: postId } = await params;
    const body = await req.json();
    const { visitorId, sectionId, emoji } = body;

    if (!visitorId || typeof visitorId !== "string" || visitorId.trim() === "") {
      return NextResponse.json({ error: "visitorId is required" }, { status: 400 });
    }

    if (!sectionId || typeof sectionId !== "string" || sectionId.trim() === "") {
      return NextResponse.json({ error: "sectionId is required" }, { status: 400 });
    }

    if (!emoji || typeof emoji !== "string" || emoji.trim() === "") {
      return NextResponse.json({ error: "emoji is required" }, { status: 400 });
    }

    if (isRateLimited(`section:${visitorId}:${postId}`)) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }

    // Verify config allows section reactions
    const config = await prisma.postEngagementConfig.findUnique({ where: { postId } });
    if (!config?.sectionReactionsOn) {
      return NextResponse.json({ error: "Section reactions are disabled for this post." }, { status: 403 });
    }

    const existing = await prisma.postSectionReaction.findFirst({
      where: {
        postId,
        visitorId,
        sectionId,
      },
    });

    if (existing) {
      if (existing.emoji === emoji) {
        // Toggle OFF: if they click the same emoji again, delete it
        await prisma.postSectionReaction.delete({
          where: { id: existing.id },
        });
        return NextResponse.json({ success: true, toggledOff: true }, { status: 200 });
      } else {
        // Update: if they click a different emoji, change it
        const updated = await prisma.postSectionReaction.update({
          where: { id: existing.id },
          data: { emoji },
        });
        return NextResponse.json(updated, { status: 200 });
      }
    }

    const reaction = await prisma.postSectionReaction.create({
      data: {
        postId,
        visitorId,
        sectionId,
        emoji,
      },
    });

    return NextResponse.json(reaction, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts/[id]/reactions/section failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
