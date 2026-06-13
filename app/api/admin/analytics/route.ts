import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalVisitors,
      totalPageViews,
      pageViewsToday,
      uniqueVisitorsTodayRaw,
      topPagesRaw,
      topReferrersRaw,
      byCountryRaw,
      byDeviceRaw,
      byBrowserRaw,
      recentVisitors,
      pageViewsLast30DaysRaw,
      trafficSourcesRaw,
      utmCampaignsRaw,
    ] = await Promise.all([
      // 1. Total visitors
      prisma.visitor.count(),
      // 2. Total pageviews
      prisma.pageView.count(),
      // 3. Pageviews today
      prisma.pageView.count({
        where: { timestamp: { gte: todayStart } },
      }),
      // 4. Unique visitors today (unique visitors who viewed a page today)
      prisma.pageView.groupBy({
        by: ["visitorId"],
        where: { timestamp: { gte: todayStart } },
      }),
      // 5. Top pages (top 10)
      prisma.pageView.groupBy({
        by: ["path"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      // 6. Top referrers (top 10)
      prisma.pageView.groupBy({
        by: ["referrer"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      // 7. By country
      prisma.visitor.groupBy({
        by: ["country"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      // 8. By device
      prisma.visitor.groupBy({
        by: ["device"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      // 9. By browser
      prisma.visitor.groupBy({
        by: ["browser"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      // 10. Recent visitors (last 20)
      prisma.visitor.findMany({
        orderBy: { lastSeen: "desc" },
        take: 20,
        include: {
          _count: {
            select: {
              pageViews: true,
              formSubmissions: true,
            },
          },
        },
      }),
      // 11. Pageviews last 30 days
      prisma.pageView.findMany({
        where: { timestamp: { gte: thirtyDaysAgo } },
        select: { timestamp: true },
      }),
      // 12. Traffic Sources
      prisma.pageView.groupBy({
        by: ["trafficSource"],
        _count: { id: true },
      }),
      // 13. UTM Campaigns
      prisma.pageView.groupBy({
        by: ["utmCampaign", "utmSource", "utmMedium"],
        where: { utmCampaign: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
    ]);

    const uniqueVisitorsToday = uniqueVisitorsTodayRaw.length;

    const topPages = topPagesRaw.map((p) => ({
      path: p.path,
      count: p._count.id,
    }));

    const topReferrers = topReferrersRaw.map((r) => ({
      referrer: r.referrer || "Direct / Unknown",
      count: r._count.id,
    }));

    const byCountry = byCountryRaw.map((c) => ({
      country: c.country || "Unknown",
      count: c._count.id,
    }));

    const byDevice = byDeviceRaw.map((d) => ({
      device: d.device || "Unknown",
      count: d._count.id,
    }));

    const byBrowser = byBrowserRaw.map((b) => ({
      browser: b.browser || "Unknown",
      count: b._count.id,
    }));

    // Group 30 days by date string YYYY-MM-DD
    const countsMap = new Map<string, number>();
    pageViewsLast30DaysRaw.forEach((pv) => {
      const dateStr = pv.timestamp.toISOString().split("T")[0] || "";
      countsMap.set(dateStr, (countsMap.get(dateStr) || 0) + 1);
    });

    const pageViewsLast30Days: Array<{ date: string; count: number }> = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(thirtyDaysAgo.getDate() + i);
      const dateStr = d.toISOString().split("T")[0] || "";
      pageViewsLast30Days.push({
        date: dateStr,
        count: countsMap.get(dateStr) || 0,
      });
    }

    // Map traffic sources
    const trafficMap: {
      direct: number;
      google: number;
      linkedin: number;
      github: number;
      twitter: number;
      other: number;
    } = {
      direct: 0,
      google: 0,
      linkedin: 0,
      github: 0,
      twitter: 0,
      other: 0,
    };

    trafficSourcesRaw.forEach((ts) => {
      const source = ts.trafficSource || "direct";
      if (source === "direct") {
        trafficMap.direct += ts._count.id;
      } else if (source === "google") {
        trafficMap.google += ts._count.id;
      } else if (source === "linkedin") {
        trafficMap.linkedin += ts._count.id;
      } else if (source === "github") {
        trafficMap.github += ts._count.id;
      } else if (source === "twitter") {
        trafficMap.twitter += ts._count.id;
      } else {
        trafficMap.other += ts._count.id;
      }
    });

    const trafficSources = Object.entries(trafficMap).map(([name, count]) => ({
      name,
      count,
    }));

    // Map UTM campaigns
    const utmCampaigns = utmCampaignsRaw.map((uc) => ({
      campaign: uc.utmCampaign || "Unknown",
      source: uc.utmSource || "—",
      medium: uc.utmMedium || "—",
      count: uc._count.id,
    }));

    return NextResponse.json({
      totalVisitors,
      totalPageViews,
      uniqueVisitorsToday,
      pageViewsToday,
      topPages,
      topReferrers,
      byCountry,
      byDevice,
      byBrowser,
      recentVisitors,
      pageViewsLast30Days,
      trafficSources,
      utmCampaigns,
    });
  } catch (error) {
    console.error("GET admin analytics failed:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
