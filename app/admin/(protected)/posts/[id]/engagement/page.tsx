/**
 * @file app/admin/(protected)/posts/[id]/engagement/page.tsx
 * @description Next.js route server component for the per-post engagement drill-down dashboard.
 * Aggregates all reactions, star histograms, scroll funnels, section heatmaps, copy counts,
 * traffic contexts, and survey feedback. Securely masks email PII.
 * 
 * @exports
 * - AdminPostEngagementPage (default): React Server Component
 * - dynamic: Constant
 */

import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import PageHeader from "@/components/admin/PageHeader";
import { renderPostContent } from "@/lib/tiptap-html";
import { readingTime } from "@/lib/utils";
import PostEngagementDrilldownClient from "@/components/admin/PostEngagementDrilldownClient";

export const dynamic = "force-dynamic";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const maskedLocal =
    local.charAt(0) +
    "***" +
    (local.length > 1 ? local.charAt(local.length - 1) : "");
  return `${maskedLocal}@${domain}`;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminPostEngagementPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const { id } = await params;

  // 1. Fetch post and config
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      engagementConfig: true,
    },
  });

  if (!post) notFound();

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

  const estReadTimeMins = readingTime(post.content);

  // 2. Fetch reactions group counts
  const emojisGroup = await prisma.postEmojiReaction.groupBy({
    by: ["emoji"],
    where: { postId: id },
    _count: { id: true },
  });
  const emojiSummary: Record<string, number> = {};
  let totalEmojis = 0;
  emojisGroup.forEach((g) => {
    emojiSummary[g.emoji] = g._count.id;
    totalEmojis += g._count.id;
  });

  // 3. Fetch helpful vote counts
  const helpfulGroup = await prisma.postHelpfulVote.groupBy({
    by: ["helpful"],
    where: { postId: id },
    _count: { id: true },
  });
  let helpfulYes = 0;
  let helpfulNo = 0;
  helpfulGroup.forEach((g) => {
    if (g.helpful) helpfulYes = g._count.id;
    else helpfulNo = g._count.id;
  });

  // 4. Fetch star ratings histogram
  const starGroup = await prisma.postStarRating.groupBy({
    by: ["rating"],
    where: { postId: id },
    _count: { id: true },
  });
  const starDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratingSum = 0;
  let totalRatings = 0;
  starGroup.forEach((g) => {
    starDistribution[g.rating] = g._count.id;
    ratingSum += g.rating * g._count.id;
    totalRatings += g._count.id;
  });
  const avgRating = totalRatings > 0 ? parseFloat((ratingSum / totalRatings).toFixed(1)) : 0;

  // 5. Fetch all analytics events for this post
  const events = await prisma.postAnalyticsEvent.findMany({
    where: { postId: id },
  });

  // Calculate unique visitor counts
  const uniqueVisitorsSet = new Set(events.map((e) => e.visitorId));
  const totalVisitors = uniqueVisitorsSet.size;

  // Calculate unique visitor interactions count (how many reacted/interacted in any way)
  const uniqueInteractedSet = new Set<string>();
  
  // Get unique visitor IDs who completed reactions, helpful votes, or ratings
  const [dbReactions, dbVotes, dbRatings] = await Promise.all([
    prisma.postEmojiReaction.findMany({ where: { postId: id }, select: { visitorId: true } }),
    prisma.postHelpfulVote.findMany({ where: { postId: id }, select: { visitorId: true } }),
    prisma.postStarRating.findMany({ where: { postId: id }, select: { visitorId: true } }),
  ]);
  dbReactions.forEach((r) => uniqueInteractedSet.add(r.visitorId));
  dbVotes.forEach((v) => uniqueInteractedSet.add(v.visitorId));
  dbRatings.forEach((rt) => uniqueInteractedSet.add(rt.visitorId));
  const totalInteracted = uniqueInteractedSet.size;

  // 6. Scroll Funnel checkpoints counts
  const scroll25 = new Set(
    events.filter((e) => e.eventType === "scroll_depth" && e.value === "25").map((e) => e.visitorId)
  ).size;
  const scroll50 = new Set(
    events.filter((e) => e.eventType === "scroll_depth" && e.value === "50").map((e) => e.visitorId)
  ).size;
  const scroll75 = new Set(
    events.filter((e) => e.eventType === "scroll_depth" && e.value === "75").map((e) => e.visitorId)
  ).size;
  const scroll100 = new Set(
    events.filter((e) => e.eventType === "scroll_depth" && e.value === "100").map((e) => e.visitorId)
  ).size;

  const scrollFunnel = {
    total: totalVisitors,
    v25: scroll25,
    v50: scroll50,
    v75: scroll75,
    v100: scroll100,
  };

  // 7. Time on Page Distribution
  const timeValues = events
    .filter((e) => e.eventType === "time_on_page" && e.value)
    .map((e) => parseFloat(e.value!))
    .sort((a, b) => a - b);
  const avgTimeSeconds =
    timeValues.length > 0
      ? Math.round(timeValues.reduce((sum, v) => sum + v, 0) / timeValues.length)
      : 0;
  const medianTimeSeconds =
    (timeValues.length > 0 ? timeValues[Math.floor(timeValues.length / 2)] : 0) ?? 0;

  // 8. Bounce vs Explored Rates
  const bounceCount = new Set(
    events.filter((e) => e.eventType === "bounce").map((e) => e.visitorId)
  ).size;
  const exploredCount = new Set(
    events.filter((e) => e.eventType === "explored").map((e) => e.visitorId)
  ).size;

  // 9. Section Reactions (Heatmap) counts grouping
  const dbSectionReactions = await prisma.postSectionReaction.findMany({
    where: { postId: id },
  });
  const sectionSummary: Record<
    string,
    { total: number; emojiCounts: Record<string, number>; dominantEmoji: string }
  > = {};
  dbSectionReactions.forEach((sr) => {
    if (!sectionSummary[sr.sectionId]) {
      sectionSummary[sr.sectionId] = { total: 0, emojiCounts: {}, dominantEmoji: "" };
    }
    const meta = sectionSummary[sr.sectionId];
    if (meta) {
      meta.total++;
      meta.emojiCounts[sr.emoji] = (meta.emojiCounts[sr.emoji] || 0) + 1;
    }
  });
  Object.keys(sectionSummary).forEach((sid) => {
    const meta = sectionSummary[sid]!;
    let max = 0;
    let dominant = "";
    Object.entries(meta.emojiCounts).forEach(([emoji, count]) => {
      if (count > max) {
        max = count;
        dominant = emoji;
      }
    });
    meta.dominantEmoji = dominant;
  });

  const { toc } = renderPostContent(post.content);

  // 10. Top Copied Code Blocks
  const copyEvents = events.filter((e) => e.eventType === "copy_event" && e.value);
  const copyCounts: Record<string, number> = {};
  copyEvents.forEach((e) => {
    copyCounts[e.value!] = (copyCounts[e.value!] || 0) + 1;
  });
  const topCopiedBlocks = Object.entries(copyCounts)
    .map(([blockId, count]) => ({ blockId, count }))
    .sort((a, b) => b.count - a.count);

  // 11. Traffic Context Referrers (Unique per Visitor)
  const referrers: Record<string, number> = {};
  const utmSources: Record<string, number> = {};
  const utmMediums: Record<string, number> = {};
  const utmCampaigns: Record<string, number> = {};

  const seenReferrers = new Set<string>();
  const seenSources = new Set<string>();
  const seenMediums = new Set<string>();
  const seenCampaigns = new Set<string>();

  events.forEach((e) => {
    const vid = e.visitorId;

    if (e.referrer) {
      let host = e.referrer;
      try {
        host = new URL(e.referrer).hostname;
      } catch {}
      const key = `${vid}:${host}`;
      if (!seenReferrers.has(key)) {
        seenReferrers.add(key);
        referrers[host] = (referrers[host] || 0) + 1;
      }
    }
    if (e.utmSource) {
      const key = `${vid}:${e.utmSource}`;
      if (!seenSources.has(key)) {
        seenSources.add(key);
        utmSources[e.utmSource] = (utmSources[e.utmSource] || 0) + 1;
      }
    }
    if (e.utmMedium) {
      const key = `${vid}:${e.utmMedium}`;
      if (!seenMediums.has(key)) {
        seenMediums.add(key);
        utmMediums[e.utmMedium] = (utmMediums[e.utmMedium] || 0) + 1;
      }
    }
    if (e.utmCampaign) {
      const key = `${vid}:${e.utmCampaign}`;
      if (!seenCampaigns.has(key)) {
        seenCampaigns.add(key);
        utmCampaigns[e.utmCampaign] = (utmCampaigns[e.utmCampaign] || 0) + 1;
      }
    }
  });
  const topReferrers = Object.entries(referrers)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const utmAttributions = {
    sources: Object.entries(utmSources).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    mediums: Object.entries(utmMediums).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    campaigns: Object.entries(utmCampaigns).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
  };

  // 12. Survey and Suggestions Results
  const surveys = await prisma.postEndSurveyResponse.findMany({
    where: { postId: id },
    orderBy: { createdAt: "desc" },
  });
  const difficultySummary = {
    too_basic: surveys.filter((s) => s.difficulty === "too_basic").length,
    just_right: surveys.filter((s) => s.difficulty === "just_right").length,
    too_advanced: surveys.filter((s) => s.difficulty === "too_advanced").length,
    total: surveys.filter((s) => s.difficulty).length,
  };
  const surveySuggestions = surveys
    .filter((s) => s.responseText && s.responseText.trim() !== "")
    .map((s) => ({
      id: s.id,
      text: s.responseText!,
      difficulty: s.difficulty,
      createdAt: s.createdAt.toISOString(),
    }));

  // 13. Notify Me Follows (PII Masked)
  const notifies = await prisma.postNotifyRequest.findMany({
    where: { postId: id },
    orderBy: { createdAt: "desc" },
  });
  const notifyFollowers = notifies.map((n) => ({
    id: n.id,
    email: maskEmail(n.email),
    topic: n.topic,
    createdAt: n.createdAt.toISOString(),
  }));

  const metrics = {
    totalVisitors,
    totalInteracted,
    estReadTimeMins,
    avgTimeOnPageMins: Math.round(avgTimeSeconds / 60),
    medianTimeOnPageMins: Math.round(medianTimeSeconds / 60),
    avgTimeSeconds,
    medianTimeSeconds,
    scrollCompletionRate:
      totalVisitors > 0 ? Math.round((scrollFunnel.v100 / totalVisitors) * 100) : 0,
    emoji: { summary: emojiSummary, total: totalEmojis },
    helpful: { yes: helpfulYes, no: helpfulNo },
    rating: { average: avgRating, distribution: starDistribution, total: totalRatings },
    scrollFunnel,
    engagementRates: {
      bounceRate: totalVisitors > 0 ? Math.round((bounceCount / totalVisitors) * 100) : 0,
      exploredRate: totalVisitors > 0 ? Math.round((exploredCount / totalVisitors) * 100) : 0,
    },
    sectionSummary,
    toc,
    topCopiedBlocks,
    traffic: { referrers: topReferrers, utm: utmAttributions },
    survey: { difficulty: difficultySummary, suggestions: surveySuggestions },
    notify: notifyFollowers,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Engagement Detail"
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Engagement", href: "/admin/engagement" },
          { label: post.title.slice(0, 20) + "..." },
        ]}
      />

      <Suspense fallback={<div className="font-mono text-xs text-zinc-500">Loading drill-down statistics...</div>}>
        <PostEngagementDrilldownClient
          postId={post.id}
          postTitle={post.title}
          postSlug={post.slug}
          postCreatedAt={post.createdAt.toISOString()}
          config={config}
          metrics={metrics}
        />
      </Suspense>
    </div>
  );
}
