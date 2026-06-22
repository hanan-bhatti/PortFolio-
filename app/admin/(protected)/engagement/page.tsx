/**
 * @file app/admin/(protected)/engagement/page.tsx
 * @description Server-side page component for the admin engagement analytics overview dashboard.
 * Fetches and groups all post-level engagement and analytics metrics in parallel from Prisma.
 * 
 * @exports
 * - AdminEngagementOverviewPage (default): React Server Component
 * - dynamic: Constant
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import EngagementOverviewClient from "@/components/admin/EngagementOverviewClient";
import { readingTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminEngagementOverviewPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  // 1. Fetch posts and their configs
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      engagementConfig: true,
    },
  });

  // 2. Fetch reactions count
  const reactionsGroup = await prisma.postEmojiReaction.groupBy({
    by: ["postId"],
    _count: { id: true },
  });
  const reactionsMap: Record<string, number> = {};
  reactionsGroup.forEach((rg) => {
    reactionsMap[rg.postId] = rg._count.id;
  });

  // 3. Fetch helpful vote counts
  const helpfulGroup = await prisma.postHelpfulVote.groupBy({
    by: ["postId", "helpful"],
    _count: { id: true },
  });
  const helpfulMap: Record<string, { yes: number; no: number }> = {};
  helpfulGroup.forEach((hg) => {
    if (!helpfulMap[hg.postId]) {
      helpfulMap[hg.postId] = { yes: 0, no: 0 };
    }
    const record = helpfulMap[hg.postId];
    if (record) {
      if (hg.helpful) record.yes = hg._count.id;
      else record.no = hg._count.id;
    }
  });

  // 4. Fetch star ratings averages
  const starRatingsGroup = await prisma.postStarRating.groupBy({
    by: ["postId"],
    _avg: { rating: true },
    _count: { rating: true },
  });
  const starRatingsMap: Record<string, { average: number; total: number }> = {};
  starRatingsGroup.forEach((sg) => {
    starRatingsMap[sg.postId] = {
      average: sg._avg.rating ? parseFloat(sg._avg.rating.toFixed(1)) : 0,
      total: sg._count.rating || 0,
    };
  });

  // 5. Fetch all post analytics events for in-memory scroll/time aggregations
  const analyticsEvents = await prisma.postAnalyticsEvent.findMany({
    select: {
      postId: true,
      visitorId: true,
      eventType: true,
      value: true,
    },
  });

  // 6. Fetch top content gaps (search queries with zero results)
  const contentGapsRaw = await prisma.siteSearchQuery.groupBy({
    by: ["query"],
    where: { resultsCount: 0 },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });
  const contentGaps = contentGapsRaw.map((g) => ({
    query: g.query,
    count: g._count.id,
  }));

  // 7. Calculate aggregate summary cards metrics
  const totalReactions = await prisma.postEmojiReaction.count();
  const totalSurveyResponses = await prisma.postEndSurveyResponse.count();
  const totalNotifySignups = await prisma.postNotifyRequest.count();

  // Map database details to unified post records
  const mappedPosts = posts.map((post) => {
    const postEvents = analyticsEvents.filter((e) => e.postId === post.id);
    const uniqueVisitors = Array.from(new Set(postEvents.map((e) => e.visitorId)));
    const hit100 = Array.from(
      new Set(
        postEvents
          .filter((e) => e.eventType === "scroll_depth" && e.value === "100")
          .map((e) => e.visitorId)
      )
    );

    const scrollCompletionRate =
      uniqueVisitors.length > 0
        ? Math.round((hit100.length / uniqueVisitors.length) * 100)
        : 0;

    const timeEvents = postEvents.filter(
      (e) => e.eventType === "time_on_page" && e.value
    );
    const avgTimeOnPage =
      timeEvents.length > 0
        ? Math.round(
            timeEvents.reduce((sum, e) => sum + parseFloat(e.value!), 0) / timeEvents.length
          )
        : 0;

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

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      published: post.published,
      createdAt: post.createdAt.toISOString(),
      views: post.views,
      estReadTimeMins: readingTime(post.content),
      config,
      metrics: {
        emojiCount: reactionsMap[post.id] || 0,
        helpful: helpfulMap[post.id] || { yes: 0, no: 0 },
        rating: starRatingsMap[post.id] || { average: 0, total: 0 },
        scrollCompletionRate,
        avgTimeOnPageMins: Math.round(avgTimeOnPage / 60),
      },
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Engagement Overview"
        crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Engagement" }]}
      />

      <Suspense fallback={<div className="font-mono text-xs text-zinc-500">Loading metrics...</div>}>
        <EngagementOverviewClient
          posts={mappedPosts}
          contentGaps={contentGaps}
          summary={{
            totalReactions,
            totalSurveyResponses,
            totalNotifySignups,
          }}
        />
      </Suspense>
    </div>
  );
}
