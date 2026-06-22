/**
 * @file app/api/posts/[id]/engagement-config/route.ts
 * @description Public Next.js API route to fetch active engagement configurations for a post by its slug or ID.
 * 
 * @exports
 * - GET(): Function
 * - dynamic: Constant
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET: Retrieves the public engagement config settings and internal post ID for a post slug or ID.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Try finding by slug first, then by ID as fallback
    let post = await prisma.post.findUnique({
      where: { slug: id },
      include: {
        engagementConfig: true,
      },
    });

    if (!post) {
      post = await prisma.post.findUnique({
        where: { id },
        include: {
          engagementConfig: true,
        },
      });
    }

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const config = post.engagementConfig || {
      emojiReactionsOn: false,
      helpfulVoteOn: false,
      starRatingOn: false,
      sectionReactionsOn: false,
      endSurveyOn: false,
      difficultyToggleOn: false,
      exitIntentOn: false,
      notifyMeOn: false,
    };

    return NextResponse.json({
      postId: post.id,
      emojiReactionsOn: config.emojiReactionsOn,
      helpfulVoteOn: config.helpfulVoteOn,
      starRatingOn: config.starRatingOn,
      sectionReactionsOn: config.sectionReactionsOn,
      endSurveyOn: config.endSurveyOn,
      difficultyToggleOn: config.difficultyToggleOn,
      exitIntentOn: config.exitIntentOn,
      notifyMeOn: config.notifyMeOn,
    });
  } catch (error) {
    console.error("GET /api/posts/[id]/engagement-config failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
