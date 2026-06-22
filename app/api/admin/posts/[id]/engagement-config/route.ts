/**
 * @file app/api/admin/posts/[id]/engagement-config/route.ts
 * @description Admin route handlers to manage a blog post's engagement features configuration.
 * Secured via NextAuth session validation.
 * 
 * @exports
 * - GET(): Function
 * - PATCH(): Function
 * - dynamic: Constant
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET: Fetch the engagement configuration for a post. If it doesn't exist, create defaults.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;

    let config = await prisma.postEngagementConfig.findUnique({
      where: { postId },
    });

    if (!config) {
      config = await prisma.postEngagementConfig.create({
        data: { postId },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("GET /api/admin/posts/[id]/engagement-config failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PATCH: Partially updates toggle fields for a post's engagement configurations.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;
    const body = await req.json();

    const updated = await prisma.postEngagementConfig.upsert({
      where: { postId },
      update: {
        emojiReactionsOn: body.emojiReactionsOn,
        helpfulVoteOn: body.helpfulVoteOn,
        starRatingOn: body.starRatingOn,
        sectionReactionsOn: body.sectionReactionsOn,
        endSurveyOn: body.endSurveyOn,
        difficultyToggleOn: body.difficultyToggleOn,
        exitIntentOn: body.exitIntentOn,
        notifyMeOn: body.notifyMeOn,
      },
      create: {
        postId,
        emojiReactionsOn: body.emojiReactionsOn ?? false,
        helpfulVoteOn: body.helpfulVoteOn ?? false,
        starRatingOn: body.starRatingOn ?? false,
        sectionReactionsOn: body.sectionReactionsOn ?? false,
        endSurveyOn: body.endSurveyOn ?? false,
        difficultyToggleOn: body.difficultyToggleOn ?? false,
        exitIntentOn: body.exitIntentOn ?? false,
        notifyMeOn: body.notifyMeOn ?? false,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/admin/posts/[id]/engagement-config failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
