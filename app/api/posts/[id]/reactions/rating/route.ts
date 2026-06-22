/**
 * @file app/api/posts/[id]/reactions/rating/route.ts
 * @description API endpoint to record or update a 1-5 star rating for a blog post.
 * 
 * @exports
 * - POST(): Function
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";

/**
 * POST: Records or updates a star rating (1-5). Last write wins.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: postId } = await params;
    const body = await req.json();
    const { visitorId, rating } = body;

    if (!visitorId || typeof visitorId !== "string" || visitorId.trim() === "") {
      return NextResponse.json({ error: "visitorId is required" }, { status: 400 });
    }

    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be an integer between 1 and 5" }, { status: 400 });
    }

    if (isRateLimited(`rating:${visitorId}:${postId}`)) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }

    // Verify config allows star ratings
    const config = await prisma.postEngagementConfig.findUnique({ where: { postId } });
    if (!config?.starRatingOn) {
      return NextResponse.json({ error: "Star ratings are disabled for this post." }, { status: 403 });
    }

    const starRating = await prisma.postStarRating.upsert({
      where: {
        postId_visitorId: {
          postId,
          visitorId,
        },
      },
      update: {
        rating,
      },
      create: {
        postId,
        visitorId,
        rating,
      },
    });

    return NextResponse.json(starRating);
  } catch (error) {
    console.error("POST /api/posts/[id]/reactions/rating failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
