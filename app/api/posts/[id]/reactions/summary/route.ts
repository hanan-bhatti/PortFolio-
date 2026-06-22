/**
 * @file app/api/posts/[id]/reactions/summary/route.ts
 * @description API endpoint to fetch the aggregate reactions summary for a blog post.
 * Includes emoji counts, helpfulness ratios, average ratings, section heatmaps,
 * and visitor-specific states if a visitorId is provided in searchParams.
 * 
 * @exports
 * - GET(): Function
 * - dynamic: Constant
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET: Returns aggregate counts of all engagement metrics, plus individual visitor states.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: postId } = await params;
    const { searchParams } = new URL(req.url);
    const visitorId = searchParams.get("visitorId") || null;

    // 1. Fetch emoji reactions counts
    const emojisGroup = await prisma.postEmojiReaction.groupBy({
      by: ["emoji"],
      where: { postId },
      _count: { id: true },
    });
    const emojiSummary: Record<string, number> = {};
    emojisGroup.forEach((g) => {
      emojiSummary[g.emoji] = g._count.id;
    });

    // 2. Fetch helpful vote counts
    const helpfulGroup = await prisma.postHelpfulVote.groupBy({
      by: ["helpful"],
      where: { postId },
      _count: { id: true },
    });
    let helpfulYes = 0;
    let helpfulNo = 0;
    helpfulGroup.forEach((g) => {
      if (g.helpful) helpfulYes = g._count.id;
      else helpfulNo = g._count.id;
    });

    // 3. Fetch star rating statistics
    const starStats = await prisma.postStarRating.aggregate({
      where: { postId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const avgRating = starStats._avg.rating || 0;
    const totalRatings = starStats._count.rating || 0;

    // 4. Fetch section reactions heatmap
    const sectionReactions = await prisma.postSectionReaction.findMany({
      where: { postId },
      select: {
        sectionId: true,
        emoji: true,
      },
    });
    const sectionSummary: Record<string, Record<string, number>> = {};
    sectionReactions.forEach((sr) => {
      if (!sectionSummary[sr.sectionId]) {
        sectionSummary[sr.sectionId] = {};
      }
      const sectionMap = sectionSummary[sr.sectionId];
      if (sectionMap) {
        sectionMap[sr.emoji] = (sectionMap[sr.emoji] || 0) + 1;
      }
    });

    // 5. Fetch visitor specific states if visitorId is provided
    let myEmojis: string[] = [];
    let myHelpful: boolean | null = null;
    let myRating: number | null = null;
    const mySectionReactions: Record<string, string[]> = {};

    if (visitorId) {
      const [emojis, helpfulVote, starRating, sections] = await Promise.all([
        prisma.postEmojiReaction.findMany({
          where: { postId, visitorId },
          select: { emoji: true },
        }),
        prisma.postHelpfulVote.findFirst({
          where: { postId, visitorId },
          select: { helpful: true },
        }),
        prisma.postStarRating.findFirst({
          where: { postId, visitorId },
          select: { rating: true },
        }),
        prisma.postSectionReaction.findMany({
          where: { postId, visitorId },
          select: { sectionId: true, emoji: true },
        }),
      ]);

      myEmojis = emojis.map((e) => e.emoji);
      myHelpful = helpfulVote ? helpfulVote.helpful : null;
      myRating = starRating ? starRating.rating : null;
      
      sections.forEach((s) => {
        if (!mySectionReactions[s.sectionId]) {
          mySectionReactions[s.sectionId] = [];
        }
        const sectionList = mySectionReactions[s.sectionId];
        if (sectionList) {
          sectionList.push(s.emoji);
        }
      });
    }

    return NextResponse.json({
      emojiSummary,
      helpful: { yes: helpfulYes, no: helpfulNo },
      rating: { average: parseFloat(avgRating.toFixed(1)), total: totalRatings },
      sectionSummary,
      visitor: visitorId
        ? {
            myEmojis,
            myHelpful,
            myRating,
            mySectionReactions,
          }
        : null,
    });
  } catch (error) {
    console.error("GET /api/posts/[id]/reactions/summary failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
