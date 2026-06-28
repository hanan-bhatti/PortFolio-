/**
 * @file app/api/admin/posts/[id]/analytics/route.ts
 * @description Admin-only route handler to fetch aggregated public analytics for a post.
 * Calculates average scroll depth, reading times, bounce vs explore rates, referrers, and UTM variables.
 * 
 * @exports
 * - GET(): Function
 * - dynamic: Constant
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET: Aggregates reader interaction analytics events.
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

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { title: true, content: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Estimate read time (200 words per minute average)
    let wordCount = 0;
    try {
      const parsed = JSON.parse(post.content);
      const countWords = (node: any) => {
        if (node.type === "text" && node.text) {
          wordCount += node.text.trim().split(/\s+/).length;
        }
        if (node.content) {
          node.content.forEach(countWords);
        }
      };
      countWords(parsed);
    } catch {
      wordCount = post.content.split(/\s+/).length;
    }
    const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200)); // in minutes

    // Fetch all analytics events
    const events = await prisma.postAnalyticsEvent.findMany({
      where: { postId },
    });

    // 1. Average Scroll Depth
    const scrollEvents = events.filter((e) => e.eventType === "scroll_depth" && e.value);
    const avgScrollDepth =
      scrollEvents.length > 0
        ? Math.round(
            scrollEvents.reduce((sum, e) => sum + parseInt(e.value!, 10), 0) / scrollEvents.length
          )
        : 0;

    // 2. Average Time on Page (stored in seconds)
    const timeEvents = events.filter((e) => e.eventType === "time_on_page" && e.value);
    const avgTimeOnPage =
      timeEvents.length > 0
        ? Math.round(
            timeEvents.reduce((sum, e) => sum + parseFloat(e.value!), 0) / timeEvents.length
          )
        : 0;

    // 3. Bounce Rate vs Explored Rate
    const distinctVisitors = Array.from(new Set(events.map((e) => e.visitorId)));
    const totalVisitors = distinctVisitors.length;

    const bounceCount = Array.from(
      new Set(events.filter((e) => e.eventType === "bounce").map((e) => e.visitorId))
    ).length;

    const exploredCount = Array.from(
      new Set(events.filter((e) => e.eventType === "explored").map((e) => e.visitorId))
    ).length;

    const bounceRate = totalVisitors > 0 ? Math.round((bounceCount / totalVisitors) * 100) : 0;
    const exploredRate = totalVisitors > 0 ? Math.round((exploredCount / totalVisitors) * 100) : 0;

    // 4. Top Copied Code Blocks
    const copyEvents = events.filter((e) => e.eventType === "copy_event" && e.value);
    const copyCounts: Record<string, number> = {};
    copyEvents.forEach((e) => {
      copyCounts[e.value!] = (copyCounts[e.value!] || 0) + 1;
    });
    const topCopiedBlocks = Object.entries(copyCounts)
      .map(([blockId, count]) => ({ blockId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 5. Top Referrers (Unique per Visitor)
    const referrers: Record<string, number> = {};
    const seenReferrers = new Set<string>();
    events.forEach((e) => {
      if (e.referrer) {
        let domain = e.referrer;
        try {
          domain = new URL(e.referrer).hostname;
        } catch {}
        const key = `${e.visitorId}:${domain}`;
        if (!seenReferrers.has(key)) {
          seenReferrers.add(key);
          referrers[domain] = (referrers[domain] || 0) + 1;
        }
      }
    });
    const topReferrers = Object.entries(referrers)
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 6. UTM campaigns breakdown (Unique per Visitor)
    const utmSources: Record<string, number> = {};
    const utmMediums: Record<string, number> = {};
    const utmCampaigns: Record<string, number> = {};

    const seenSources = new Set<string>();
    const seenMediums = new Set<string>();
    const seenCampaigns = new Set<string>();

    events.forEach((e) => {
      const vid = e.visitorId;
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

    const utmBreakdown = {
      sources: Object.entries(utmSources).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      mediums: Object.entries(utmMediums).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      campaigns: Object.entries(utmCampaigns).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    };

    return NextResponse.json({
      estimatedReadTime, // in minutes
      avgScrollDepth,    // percentage
      avgTimeOnPage,     // seconds
      bounceRate,        // percentage
      exploredRate,      // percentage
      topCopiedBlocks,
      topReferrers,
      utmBreakdown,
      totalVisitors,
    });
  } catch (error) {
    console.error("GET /api/admin/posts/[id]/analytics failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
