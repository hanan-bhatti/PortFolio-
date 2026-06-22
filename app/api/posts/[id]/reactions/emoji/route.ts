/**
 * @file app/api/posts/[id]/reactions/emoji/route.ts
 * @description API endpoint to record or remove post emoji reactions for anonymous visitors.
 * Validates reaction lists, rates limit visitors, and conforms to post configurability.
 * 
 * @exports
 * - POST(): Function
 * - DELETE(): Function
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";

const VALID_EMOJIS = ["👍", "🔥", "🤯", "❤️", "😂"];

/**
 * POST: Inserts a unique emoji reaction for a visitor on a post.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: postId } = await params;
    const body = await req.json();
    const { visitorId, emoji } = body;

    if (!visitorId || typeof visitorId !== "string" || visitorId.trim() === "") {
      return NextResponse.json({ error: "visitorId is required" }, { status: 400 });
    }

    if (!emoji || !VALID_EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: "Invalid emoji reaction" }, { status: 400 });
    }

    if (isRateLimited(`emoji:${visitorId}:${postId}`)) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }

    // Verify engagement config allows reactions
    const config = await prisma.postEngagementConfig.findUnique({ where: { postId } });
    if (!config?.emojiReactionsOn) {
      return NextResponse.json({ error: "Emoji reactions are disabled for this post." }, { status: 403 });
    }

    const reaction = await prisma.$transaction(async (tx) => {
      // Enforce at most one emoji reaction per visitor per post by deleting previous ones
      await tx.postEmojiReaction.deleteMany({
        where: {
          postId,
          visitorId,
        },
      });

      return tx.postEmojiReaction.create({
        data: {
          postId,
          visitorId,
          emoji,
        },
      });
    });

    return NextResponse.json(reaction, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts/[id]/reactions/emoji failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE: Removes a visitor's emoji reaction from a post.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: postId } = await params;
    const body = await req.json();
    const { visitorId, emoji } = body;

    if (!visitorId || typeof visitorId !== "string" || visitorId.trim() === "") {
      return NextResponse.json({ error: "visitorId is required" }, { status: 400 });
    }

    if (!emoji || typeof emoji !== "string") {
      return NextResponse.json({ error: "emoji is required" }, { status: 400 });
    }

    if (isRateLimited(`emoji-del:${visitorId}:${postId}`)) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }

    await prisma.postEmojiReaction.deleteMany({
      where: {
        postId,
        visitorId,
        emoji,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/posts/[id]/reactions/emoji failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
