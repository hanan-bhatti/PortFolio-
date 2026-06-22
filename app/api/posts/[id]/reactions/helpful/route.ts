/**
 * @file app/api/posts/[id]/reactions/helpful/route.ts
 * @description API endpoint to record or update a helpfulness vote (Yes/No) for a blog post.
 * 
 * @exports
 * - POST(): Function
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";

/**
 * POST: Record or update a helpfulness vote. Last write wins.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: postId } = await params;
    const body = await req.json();
    const { visitorId, helpful } = body;

    if (!visitorId || typeof visitorId !== "string" || visitorId.trim() === "") {
      return NextResponse.json({ error: "visitorId is required" }, { status: 400 });
    }

    if (typeof helpful !== "boolean") {
      return NextResponse.json({ error: "helpful must be a boolean" }, { status: 400 });
    }

    if (isRateLimited(`helpful:${visitorId}:${postId}`)) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }

    // Verify config allows helpful vote
    const config = await prisma.postEngagementConfig.findUnique({ where: { postId } });
    if (!config?.helpfulVoteOn) {
      return NextResponse.json({ error: "Helpful vote is disabled for this post." }, { status: 403 });
    }

    const vote = await prisma.postHelpfulVote.upsert({
      where: {
        postId_visitorId: {
          postId,
          visitorId,
        },
      },
      update: {
        helpful,
      },
      create: {
        postId,
        visitorId,
        helpful,
      },
    });

    return NextResponse.json(vote);
  } catch (error) {
    console.error("POST /api/posts/[id]/reactions/helpful failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
