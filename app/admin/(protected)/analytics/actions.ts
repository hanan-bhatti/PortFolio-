/**
 * @file app/admin/(protected)/analytics/actions.ts
 * @description Next.js Server Actions for fetching filtered visitor and page view statistics.
 * 
 * @exports
 * - getAnalyticsData: Fetch analytics dashboard statistics based on filter parameters
 */

"use server";

import { prisma } from "@/lib/prisma";

export interface AnalyticsFiltersState {
  range: string;
  path: string;
  device: string;
  country: string;
  chartRange: string;
}

export interface AnalyticsData {
  totalVisitors: number;
  totalPageViews: number;
  pageViewsToday: number;
  uniqueVisitorsToday: number;
  topPages: Array<{ path: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  byCountry: Array<{ country: string; count: number }>;
  byDevice: Array<{ device: string; count: number }>;
  byBrowser: Array<{ browser: string; count: number }>;
  recentVisitors: Array<{
    id: string;
    city: string | null;
    country: string | null;
    device: string | null;
    browser: string | null;
    firstSeen: Date;
    lastSeen: Date;
    visits: number;
    consentType: string;
    _count: {
      pageViews: number;
      formSubmissions: number;
    };
  }>;
  chartData: Array<{ label: string; tooltip: string; count: number }>;
  trafficSources: Array<{ name: string; key: string; count: number }>;
  utmCampaigns: Array<{ campaign: string; source: string; medium: string; count: number }>;
}

export async function getAnalyticsData(filters: AnalyticsFiltersState): Promise<AnalyticsData> {
  const { range, path: filterPath, device: filterDevice, country: filterCountry, chartRange } = filters;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  // Build the dynamic where clauses
  const pageViewWhere: any = {};
  if (range === "30d") {
    pageViewWhere.timestamp = { gte: thirtyDaysAgo };
  }
  if (filterPath) {
    pageViewWhere.path = { contains: filterPath, mode: "insensitive" };
  }
  if (filterDevice || filterCountry) {
    pageViewWhere.visitor = {};
    if (filterDevice) {
      pageViewWhere.visitor.device = filterDevice;
    }
    if (filterCountry) {
      pageViewWhere.visitor.country = filterCountry;
    }
  }

  // Build chart-specific where clause
  const chartPageViewWhere: any = {};
  if (chartRange === "30d") {
    chartPageViewWhere.timestamp = { gte: thirtyDaysAgo };
  }
  if (filterPath) {
    chartPageViewWhere.path = { contains: filterPath, mode: "insensitive" };
  }
  if (filterDevice || filterCountry) {
    chartPageViewWhere.visitor = {};
    if (filterDevice) {
      chartPageViewWhere.visitor.device = filterDevice;
    }
    if (filterCountry) {
      chartPageViewWhere.visitor.country = filterCountry;
    }
  }

  const visitorWhere: any = {};
  if (range === "30d") {
    visitorWhere.lastSeen = { gte: thirtyDaysAgo };
  }
  if (filterDevice) {
    visitorWhere.device = filterDevice;
  }
  if (filterCountry) {
    visitorWhere.country = filterCountry;
  }
  if (filterPath) {
    visitorWhere.pageViews = {
      some: {
        path: { contains: filterPath, mode: "insensitive" },
        ...(range === "30d" ? { timestamp: { gte: thirtyDaysAgo } } : {}),
      },
    };
  }

  // Fetch data directly from Prisma
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
    recentVisitorsRaw,
    chartPageViewsRaw,
    trafficSourcesRaw,
    utmCampaignsRaw,
  ] = await Promise.all([
    prisma.visitor.count({ where: visitorWhere }),
    prisma.pageView.count({ where: pageViewWhere }),
    prisma.pageView.count({
      where: { ...pageViewWhere, timestamp: { gte: todayStart } },
    }),
    prisma.pageView.groupBy({
      by: ["visitorId"],
      where: { ...pageViewWhere, timestamp: { gte: todayStart } },
    }),
    prisma.pageView.groupBy({
      by: ["path"],
      where: pageViewWhere,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.pageView.groupBy({
      by: ["referrer"],
      where: pageViewWhere,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.visitor.groupBy({
      by: ["country"],
      where: visitorWhere,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.visitor.groupBy({
      by: ["device"],
      where: visitorWhere,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.visitor.groupBy({
      by: ["browser"],
      where: visitorWhere,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.visitor.findMany({
      where: visitorWhere,
      orderBy: { lastSeen: "desc" },
      take: 100,
      include: {
        _count: {
          select: {
            pageViews: true,
            formSubmissions: true,
          },
        },
      },
    }),
    prisma.pageView.findMany({
      where: chartPageViewWhere,
      select: { timestamp: true },
    }),
    prisma.pageView.groupBy({
      by: ["trafficSource"],
      where: pageViewWhere,
      _count: { id: true },
    }),
    prisma.pageView.groupBy({
      by: ["utmCampaign", "utmSource", "utmMedium"],
      where: { ...pageViewWhere, utmCampaign: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
  ]);

  const uniqueVisitorsToday = uniqueVisitorsTodayRaw.length;

  const topPages = topPagesRaw.map((p) => ({
    path: p.path,
    count: p._count.id,
  }));

  // Filter referrers
  const OWN_DOMAINS = new Set(["hanan-bhatti.site", "www.hanan-bhatti.site", "localhost", "127.0.0.1"]);
  const topReferrers = topReferrersRaw
    .filter((r) => {
      if (!r.referrer) return false;
      if (r.referrer.startsWith("android-app://")) return false;
      try {
        const u = new URL(r.referrer);
        const host = u.hostname.replace(/^www\./, "");
        if (OWN_DOMAINS.has(host)) return false;
        if (u.pathname.startsWith("/admin")) return false;
      } catch {
        return false;
      }
      return true;
    })
    .map((r) => ({ referrer: r.referrer as string, count: r._count.id }))
    .slice(0, 10);

  const byCountry = byCountryRaw
    .filter((c) => c.country !== null)
    .map((c) => ({ country: c.country as string, count: c._count.id }));

  const byDevice = byDeviceRaw
    .filter((d) => d.device !== null)
    .map((d) => ({ device: d.device as string, count: d._count.id }));

  const byBrowser = byBrowserRaw
    .filter((b) => b.browser !== null)
    .map((b) => ({ browser: b.browser as string, count: b._count.id }));

  // Aggregate traffic sources
  const KNOWN_SOURCES: Record<string, string> = {
    direct: "Direct",
    google: "Google",
    bing: "Bing",
    yahoo: "Yahoo",
    duckduckgo: "DuckDuckGo",
    linkedin: "LinkedIn",
    github: "GitHub",
    twitter: "Twitter / X",
    facebook: "Facebook",
    instagram: "Instagram",
    reddit: "Reddit",
    whatsapp: "WhatsApp",
    medium: "Medium",
    devto: "Dev.to",
  };

  const trafficAgg = new Map<string, number>();
  let otherCount = 0;

  trafficSourcesRaw.forEach((ts) => {
    const source = (ts.trafficSource || "direct").toLowerCase();
    if (KNOWN_SOURCES[source] !== undefined) {
      trafficAgg.set(source, (trafficAgg.get(source) ?? 0) + ts._count.id);
    } else {
      otherCount += ts._count.id;
    }
  });
  if (otherCount > 0) trafficAgg.set("other", otherCount);

  const trafficSources = Array.from(trafficAgg.entries())
    .map(([key, count]) => ({ name: KNOWN_SOURCES[key] ?? key, key, count }))
    .sort((a, b) => b.count - a.count);

  // Map UTM campaigns
  const utmCampaigns = utmCampaignsRaw.map((uc) => ({
    campaign: uc.utmCampaign || "Unknown",
    source: uc.utmSource || "—",
    medium: uc.utmMedium || "—",
    count: uc._count.id,
  }));

  // Build chart data
  const chartData: Array<{ label: string; tooltip: string; count: number }> = [];

  if (chartRange === "30d") {
    const countsMap = new Map<string, number>();
    chartPageViewsRaw.forEach((pv) => {
      const dateStr = pv.timestamp.toISOString().split("T")[0] || "";
      countsMap.set(dateStr, (countsMap.get(dateStr) || 0) + 1);
    });

    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(thirtyDaysAgo.getDate() + i);
      const dateStr = d.toISOString().split("T")[0] || "";
      const count = countsMap.get(dateStr) || 0;
      chartData.push({
        label: String(d.getDate()),
        tooltip: `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${count} views`,
        count,
      });
    }
  } else {
    const monthCountsMap = new Map<string, number>();
    chartPageViewsRaw.forEach((pv) => {
      const date = new Date(pv.timestamp);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthCountsMap.set(key, (monthCountsMap.get(key) || 0) + 1);
    });

    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const count = monthCountsMap.get(key) || 0;
      chartData.push({
        label: d.toLocaleDateString("en-US", { month: "short" }),
        tooltip: `${d.toLocaleDateString("en-US", { year: "numeric", month: "long" })}: ${count} views`,
        count,
      });
    }
  }

  // Cast recentVisitors Raw type to match AnalyticsData layout
  const recentVisitors = recentVisitorsRaw.map((rv) => ({
    id: rv.id,
    city: rv.city,
    country: rv.country,
    device: rv.device,
    browser: rv.browser,
    firstSeen: rv.firstSeen,
    lastSeen: rv.lastSeen,
    visits: rv.visits,
    consentType: rv.consentType,
    _count: {
      pageViews: rv._count.pageViews,
      formSubmissions: rv._count.formSubmissions,
    },
  }));

  return {
    totalVisitors,
    totalPageViews,
    pageViewsToday,
    uniqueVisitorsToday,
    topPages,
    topReferrers,
    byCountry,
    byDevice,
    byBrowser,
    recentVisitors,
    chartData,
    trafficSources,
    utmCampaigns,
  };
}
