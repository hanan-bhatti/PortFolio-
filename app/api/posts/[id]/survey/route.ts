/**
 * @file app/api/posts/[id]/survey/route.ts
 * @description API endpoint to collect visitor feedback (content suggestions and reading difficulty rating).
 * 
 * @exports
 * - POST(): Function
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";

/**
 * POST: Create a survey response for a visitor on a post.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: postId } = await params;
    const body = await req.json();
    const { visitorId, responseText, difficulty } = body;

    if (!visitorId || typeof visitorId !== "string" || visitorId.trim() === "") {
      return NextResponse.json({ error: "visitorId is required" }, { status: 400 });
    }

    if (isRateLimited(`survey:${visitorId}:${postId}`)) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }

    // Verify config allows end-survey or difficulty toggles
    const config = await prisma.postEngagementConfig.findUnique({ where: { postId } });
    if (!config?.endSurveyOn && !config?.difficultyToggleOn) {
      return NextResponse.json({ error: "Survey features are disabled for this post." }, { status: 403 });
    }

    // Validate difficulty if supplied
    if (difficulty && !["too_basic", "just_right", "too_advanced"].includes(difficulty)) {
      return NextResponse.json({ error: "Invalid difficulty value." }, { status: 400 });
    }

    const response = await prisma.$transaction(async (tx) => {
      await tx.postEndSurveyResponse.deleteMany({
        where: {
          postId,
          visitorId,
        },
      });

      return tx.postEndSurveyResponse.create({
        data: {
          postId,
          visitorId,
          responseText: responseText ? responseText.trim() : null,
          difficulty: difficulty || null,
        },
      });
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts/[id]/survey failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
