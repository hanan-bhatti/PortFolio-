import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import ClearAnalyticsButton from "@/components/admin/ClearAnalyticsButton";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalyticsDashboardPage() {
  async function clearAnalytics() {
    "use server";
    await prisma.pageView.deleteMany();
    await prisma.visitor.deleteMany();
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/admin/analytics");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

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
    recentVisitors,
    pageViewsLast30DaysRaw,
    trafficSourcesRaw,
    utmCampaignsRaw,
  ] = await Promise.all([
    prisma.visitor.count(),
    prisma.pageView.count(),
    prisma.pageView.count({
      where: { timestamp: { gte: todayStart } },
    }),
    prisma.pageView.groupBy({
      by: ["visitorId"],
      where: { timestamp: { gte: todayStart } },
    }),
    prisma.pageView.groupBy({
      by: ["path"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.pageView.groupBy({
      by: ["referrer"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.visitor.groupBy({
      by: ["country"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.visitor.groupBy({
      by: ["device"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.visitor.groupBy({
      by: ["browser"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
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
    prisma.pageView.findMany({
      where: { timestamp: { gte: thirtyDaysAgo } },
      select: { timestamp: true },
    }),
    prisma.pageView.groupBy({
      by: ["trafficSource"],
      _count: { id: true },
    }),
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

  const totalTraffic = trafficSources.reduce((acc, t) => acc + t.count, 0);

  // Map UTM campaigns
  const utmCampaigns = utmCampaignsRaw.map((uc) => ({
    campaign: uc.utmCampaign || "Unknown",
    source: uc.utmSource || "—",
    medium: uc.utmMedium || "—",
    count: uc._count.id,
  }));

  // Build last 30 days chart data
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

  const peak = Math.max(...pageViewsLast30Days.map((d) => d.count), 0);

  const stats = [
    { label: "Total Visitors", value: totalVisitors },
    { label: "Total Page Views", value: totalPageViews },
    { label: "Visitors Today", value: uniqueVisitorsToday },
    { label: "Page Views Today", value: pageViewsToday },
  ];

  const formatShortDate = (dateVal: Date) => {
    return dateVal.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalDevice = byDevice.reduce((acc, d) => acc + d.count, 0);
  const totalCountry = byCountry.reduce((acc, c) => acc + c.count, 0);
  const totalBrowser = byBrowser.reduce((acc, b) => acc + b.count, 0);

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Analytics"
        crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Analytics" }]}
        action={<ClearAnalyticsButton clearAction={clearAnalytics} />}
      />

      {/* ROW 1: 4 Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[#262626] bg-[#1a1a1a] p-6"
          >
            <p className="font-sans text-[12px] font-normal text-zinc-500 uppercase tracking-wider">{stat.label}</p>
            <p className="mt-2 font-syne text-3xl font-bold text-[#F59E0B]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ROW 2: 30-Day CSS Chart */}
      <div className="rounded-2xl border border-[#262626] bg-[#1a1a1a] p-6">
        <h3 className="mb-6 font-syne text-lg font-bold text-white">Page Views (Last 30 Days)</h3>
        <div className="flex h-[200px] items-end gap-1.5 sm:gap-2">
          {pageViewsLast30Days.map((day) => {
            const heightPercent = peak > 0 ? (day.count / peak) * 100 : 0;
            const heightStr = peak === 0 ? "4px" : day.count === 0 ? "0px" : `${Math.max(2, heightPercent)}%`;

            return (
              <div key={day.date} className="group relative flex h-full flex-1 flex-col justify-end">
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded border border-[#262626] bg-black px-2 py-1 font-mono text-[10px] text-white whitespace-nowrap z-25 group-hover:block">
                  {day.date}: {day.count} views
                </div>
                {/* Bar */}
                <div
                  style={{ height: heightStr }}
                  className="w-full bg-[#F59E0B] hover:bg-white transition-colors duration-200"
                />
                {/* X Axis Label */}
                <span className="mt-2 block text-center font-mono text-[9px] text-zinc-500">
                  {new Date(day.date).getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ROW 3: Top Pages & Top Referrers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Top Pages */}
        <div className="rounded-2xl border border-[#262626] bg-[#1a1a1a] p-6">
          <h3 className="mb-4 font-syne text-lg font-bold text-white">Top Pages</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-[13px]">
              <thead>
                <tr className="border-b border-[#262626] text-zinc-500 font-mono text-xs uppercase">
                  <th className="pb-3 font-medium">Path</th>
                  <th className="pb-3 text-right font-medium">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]/50">
                {topPages.map((page, index) => (
                  <tr
                    key={page.path}
                    className={index % 2 === 1 ? "bg-[#1a1a1a]" : "bg-black/10"}
                  >
                    <td className="py-3 font-mono text-zinc-300 truncate max-w-xs px-2">{page.path}</td>
                    <td className="py-3 text-right text-white font-semibold pr-2">{page.count}</td>
                  </tr>
                ))}
                {topPages.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-6 text-center text-zinc-600">No views tracked yet</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Top Referrers */}
        <div className="rounded-2xl border border-[#262626] bg-[#1a1a1a] p-6">
          <h3 className="mb-4 font-syne text-lg font-bold text-white">Top Referrers</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-[13px]">
              <thead>
                <tr className="border-b border-[#262626] text-zinc-500 font-mono text-xs uppercase">
                  <th className="pb-3 font-medium">Referrer</th>
                  <th className="pb-3 text-right font-medium">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]/50">
                {topReferrers.map((ref, index) => (
                  <tr
                    key={ref.referrer}
                    className={index % 2 === 1 ? "bg-[#1a1a1a]" : "bg-black/10"}
                  >
                    <td className="py-3 font-mono text-zinc-300 truncate max-w-xs px-2">{ref.referrer}</td>
                    <td className="py-3 text-right text-white font-semibold pr-2">{ref.count}</td>
                  </tr>
                ))}
                {topReferrers.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-6 text-center text-zinc-600">No referrers tracked yet</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Traffic Sources & UTM Campaigns */}
      <div className={`grid gap-6 ${utmCampaigns.length > 0 ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* Traffic Sources */}
        <div className="rounded-2xl border border-[#262626] bg-[#1a1a1a] p-6 space-y-6">
          <h3 className="font-syne text-lg font-bold text-white">Traffic Sources</h3>
          <div className="space-y-4">
            {trafficSources.map((source) => {
              const percent = totalTraffic > 0 ? Math.round((source.count / totalTraffic) * 100) : 0;
              return (
                <div key={source.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300 capitalize">{source.name}</span>
                    <span className="text-zinc-500">{source.count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-[#262626] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#F59E0B] h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* UTM Campaigns (Only if any exist) */}
        {utmCampaigns.length > 0 && (
          <div className="rounded-2xl border border-[#262626] bg-[#1a1a1a] p-6 space-y-4">
            <h3 className="font-syne text-lg font-bold text-white">UTM Campaigns</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-[13px]">
                <thead>
                  <tr className="border-b border-[#262626] text-zinc-500 font-mono text-xs uppercase">
                    <th className="pb-3 font-medium">Campaign</th>
                    <th className="pb-3 font-medium">Source</th>
                    <th className="pb-3 font-medium">Medium</th>
                    <th className="pb-3 text-right font-medium">Visits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]/50">
                  {utmCampaigns.map((utm, index) => (
                    <tr
                      key={`${utm.campaign}-${utm.source}-${utm.medium}`}
                      className={index % 2 === 1 ? "bg-[#1a1a1a]" : "bg-black/10"}
                    >
                      <td className="py-3 font-mono text-[#F59E0B] font-semibold truncate max-w-[150px] px-2">
                        {utm.campaign}
                      </td>
                      <td className="py-3 font-mono text-zinc-300 truncate max-w-[100px]">
                        {utm.source}
                      </td>
                      <td className="py-3 font-mono text-zinc-400 truncate max-w-[100px]">
                        {utm.medium}
                      </td>
                      <td className="py-3 text-right text-white font-semibold pr-2">{utm.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ROW 4: Countries, Devices, and Browsers Breakdown */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Countries Breakdown */}
        <div className="rounded-2xl border border-[#262626] bg-[#1a1a1a] p-6 space-y-4">
          <h3 className="font-syne text-lg font-bold text-white">Countries</h3>
          <div className="space-y-3">
            {byCountry.slice(0, 5).map((c) => {
              const percent = totalCountry > 0 ? Math.round((c.count / totalCountry) * 100) : 0;
              return (
                <div key={c.country} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300">{c.country}</span>
                    <span className="text-zinc-500">{c.count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-[#262626] h-1.5 overflow-hidden">
                    <div className="bg-[#F59E0B] h-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
            {byCountry.length === 0 ? <p className="text-sm text-zinc-650 text-center py-4">No country data yet</p> : null}
          </div>
        </div>

        {/* Devices Breakdown */}
        <div className="rounded-2xl border border-[#262626] bg-[#1a1a1a] p-6 space-y-4">
          <h3 className="font-syne text-lg font-bold text-white">Devices</h3>
          <div className="space-y-3">
            {byDevice.map((d) => {
              const percent = totalDevice > 0 ? Math.round((d.count / totalDevice) * 100) : 0;
              return (
                <div key={d.device} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300 capitalize">{d.device}</span>
                    <span className="text-zinc-500">{d.count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-[#262626] h-1.5 overflow-hidden">
                    <div className="bg-[#F59E0B] h-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
            {byDevice.length === 0 ? <p className="text-sm text-zinc-650 text-center py-4">No device data yet</p> : null}
          </div>
        </div>

        {/* Browsers Breakdown */}
        <div className="rounded-2xl border border-[#262626] bg-[#1a1a1a] p-6 space-y-4">
          <h3 className="font-syne text-lg font-bold text-white">Browsers</h3>
          <div className="space-y-3">
            {byBrowser.slice(0, 5).map((b) => {
              const percent = totalBrowser > 0 ? Math.round((b.count / totalBrowser) * 100) : 0;
              return (
                <div key={b.browser} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300">{b.browser}</span>
                    <span className="text-zinc-500">{b.count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-[#262626] h-1.5 overflow-hidden">
                    <div className="bg-[#F59E0B] h-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
            {byBrowser.length === 0 ? <p className="text-sm text-zinc-650 text-center py-4">No browser data yet</p> : null}
          </div>
        </div>
      </div>

      {/* ROW 5: Recent Visitors */}
      <div className="rounded-2xl border border-[#262626] bg-[#1a1a1a] p-6">
        <h3 className="mb-4 font-syne text-lg font-bold text-white">Recent Visitors</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-[13px]">
            <thead>
              <tr className="border-b border-[#262626] text-zinc-500 font-mono text-xs uppercase">
                <th className="pb-3 font-medium">Country</th>
                <th className="pb-3 font-medium">Device</th>
                <th className="pb-3 font-medium">Browser</th>
                <th className="pb-3 font-medium">First Seen</th>
                <th className="pb-3 font-medium">Last Seen</th>
                <th className="pb-3 text-right font-medium">Visits</th>
                <th className="pb-3 text-right font-medium">Pages</th>
                <th className="pb-3 text-center font-medium">Consent</th>
                <th className="pb-3 text-right font-medium">Forms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/50">
              {recentVisitors.map((visitor) => (
                <tr key={visitor.id} className="hover:bg-white/[0.01]">
                  <td className="py-4 font-medium text-zinc-200">
                    {visitor.city && visitor.country
                      ? `${visitor.city}, ${visitor.country}`
                      : visitor.country || "—"}
                  </td>
                  <td className="py-4 text-zinc-400 capitalize">{visitor.device || "—"}</td>
                  <td className="py-4 text-zinc-400">{visitor.browser || "—"}</td>
                  <td className="py-4 text-zinc-500 font-mono text-[11px]">
                    {formatShortDate(visitor.firstSeen)}
                  </td>
                  <td className="py-4 text-zinc-500 font-mono text-[11px]">
                    {formatShortDate(visitor.lastSeen)}
                  </td>
                  <td className="py-4 text-right text-white font-semibold font-mono">{visitor.visits}</td>
                  <td className="py-4 text-right text-white font-semibold font-mono">
                    {visitor._count.pageViews}
                  </td>
                  <td className="py-4 text-center">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        visitor.consentType === "all"
                          ? "bg-green-dim text-[#10B981]"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {visitor.consentType}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    {visitor._count.formSubmissions > 0 ? (
                      <span className="inline-block rounded bg-[#14532D] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#10B981]">
                        ✉ Contact
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {recentVisitors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-zinc-600">No visitors tracked yet</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
