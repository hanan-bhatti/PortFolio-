/**
 * @file app/admin/(protected)/analytics/clicks/page.tsx
 * @description Admin page for post-wise grouped interaction metrics, link clicks, shares, and code copy statistics.
 * 
 * @exports
 * - AnalyticsInteractionsPage (default): Main React component
 * - dynamic: Constant / Helper
 */

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import { formatDate } from "@/lib/utils";
import AnalyticsChart from "@/components/admin/AnalyticsChart";

export const dynamic = "force-dynamic";

export default async function AnalyticsInteractionsPage() {
  const [posts, totalCopies, totalLinkClicks, totalShareClicks] = await Promise.all([
    prisma.post.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        shortLinks: {
          select: {
            id: true,
            type: true,
            clicks: { select: { createdAt: true } },
          },
        },
        codeCopyEvents: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.codeCopyEvent.count(),
    prisma.shortLinkClick.count({ where: { shortLink: { type: "link" } } }),
    prisma.shortLinkClick.count({ where: { shortLink: { type: "share" } } }),
  ]);

  // Aggregate stats per post
  const postsWithStats = posts.map((post) => {
    const linkClicks = post.shortLinks
      .filter((l) => l.type === "link")
      .reduce((sum, l) => sum + l.clicks.length, 0);

    const shareClicks = post.shortLinks
      .filter((l) => l.type === "share")
      .reduce((sum, l) => sum + l.clicks.length, 0);

    const codeCopies = post.codeCopyEvents.length;
    const totalInteractions = linkClicks + shareClicks + codeCopies;

    // Find last activity date
    const clickTimes = post.shortLinks.flatMap((l) => l.clicks.map((c) => c.createdAt.getTime()));
    const copyTimes = post.codeCopyEvents.map((e) => e.createdAt.getTime());
    const allTimes = [...clickTimes, ...copyTimes];
    const lastActivity = allTimes.length > 0 ? new Date(Math.max(...allTimes)) : null;

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      linkClicks,
      shareClicks,
      codeCopies,
      totalInteractions,
      lastActivity,
    };
  });

  // Global short links not associated with a specific post or project
  const orphanShortLinks = await prisma.shortLink.findMany({
    where: { postId: null, projectId: null },
    include: { clicks: true },
  });

  const orphanClicks = orphanShortLinks.reduce((sum, l) => sum + l.clicks.length, 0);

  // Grouped project clicks
  const projectsWithClicks = await prisma.project.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      createdAt: true,
      shortLinks: {
        select: {
          id: true,
          targetUrl: true,
          clicks: { select: { createdAt: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const projectsStats = projectsWithClicks.map((proj) => {
    let githubTotal = 0;
    let liveTotal = 0;
    
    const sourceBreakdown: Record<string, number> = {
      homepage_experiments: 0,
      projects_list: 0,
      project_detail: 0,
    };

    proj.shortLinks.forEach((link) => {
      const isGithub = link.targetUrl.toLowerCase().includes("github.com");
      const isLive = !isGithub;
      const clicksCount = link.clicks.length;

      if (isGithub) githubTotal += clicksCount;
      if (isLive) liveTotal += clicksCount;

      let source = "other";
      try {
        const url = new URL(link.targetUrl);
        const utmSource = url.searchParams.get("utm_source");
        if (utmSource) source = utmSource;
      } catch {
        if (link.targetUrl.includes("utm_source=")) {
          const match = link.targetUrl.match(/utm_source=([^&]+)/);
          if (match && match[1]) source = match[1];
        }
      }

      if (source in sourceBreakdown) {
        sourceBreakdown[source] += clicksCount;
      } else {
        sourceBreakdown[source] = (sourceBreakdown[source] || 0) + clicksCount;
      }
    });

    const totalClicks = githubTotal + liveTotal;
    const clickTimes = proj.shortLinks.flatMap((l) => l.clicks.map((c) => c.createdAt.getTime()));
    const lastActivity = clickTimes.length > 0 ? new Date(Math.max(...clickTimes)) : null;

    return {
      id: proj.id,
      title: proj.title,
      slug: proj.slug,
      githubTotal,
      liveTotal,
      totalClicks,
      sourceBreakdown,
      lastActivity,
    };
  });

  // Sorting for top performing posts chart (max 5)
  const topPosts = [...postsWithStats]
    .filter((p) => p.totalInteractions > 0)
    .sort((a, b) => b.totalInteractions - a.totalInteractions)
    .slice(0, 5);

  // Generate global activity timeline for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return d;
  }).reverse();

  const globalChartData = last7Days.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    // Calculate global click count for this day
    let clicksCount = 0;
    posts.forEach((post) => {
      post.shortLinks.forEach((link) => {
        clicksCount += link.clicks.filter((click) => {
          const time = click.createdAt.getTime();
          return time >= day.getTime() && time < nextDay.getTime();
        }).length;
      });
    });

    // Add orphan clicks
    orphanShortLinks.forEach((link) => {
      clicksCount += link.clicks.filter((click) => {
        const time = click.createdAt.getTime();
        return time >= day.getTime() && time < nextDay.getTime();
      }).length;
    });

    // Calculate global copies count for this day
    let copiesCount = 0;
    posts.forEach((post) => {
      copiesCount += post.codeCopyEvents.filter((event) => {
        const time = event.createdAt.getTime();
        return time >= day.getTime() && time < nextDay.getTime();
      }).length;
    });

    return {
      label: day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      clicks: clicksCount,
      copies: copiesCount,
      total: clicksCount + copiesCount,
    };
  });

  // Prepare chart datasets
  const timelineChartData = {
    labels: globalChartData.map((d) => d.label),
    datasets: [
      {
        label: "Clicks",
        data: globalChartData.map((d) => d.clicks),
        backgroundColor: "#16A34A",
        borderColor: "#16A34A",
        borderWidth: 1,
      },
      {
        label: "Copies",
        data: globalChartData.map((d) => d.copies),
        backgroundColor: "#F59E0B",
        borderColor: "#F59E0B",
        borderWidth: 1,
      },
    ],
  };

  const timelineChartOptions = {
    scales: {
      x: { stacked: true },
      y: { stacked: true, ticks: { precision: 0 } },
    },
  };

  const breakdownChartData = {
    labels: ["External Clicks", "Share Clicks", "Copies"],
    datasets: [
      {
        data: [totalLinkClicks, totalShareClicks, totalCopies],
        backgroundColor: ["#16A34A", "#F59E0B", "#71717a"],
        borderColor: ["#0c0c0c", "#0c0c0c", "#0c0c0c"],
        borderWidth: 2,
      },
    ],
  };

  const topPostsChartData = {
    labels: topPosts.map((p) => p.title),
    datasets: [
      {
        label: "Interactions",
        data: topPosts.map((p) => p.totalInteractions),
        backgroundColor: "#F59E0B",
        borderColor: "#F59E0B",
        borderWidth: 1,
      },
    ],
  };

  const topPostsChartOptions = {
    indexAxis: "y" as const,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { ticks: { precision: 0 } },
    },
  };

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Analytics — Interactions"
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Analytics", href: "/admin/analytics" },
          { label: "Interactions" },
        ]}
      />

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#262626] pb-4">
        <Link
          href="/admin/analytics"
          className="text-xs font-mono font-bold text-zinc-500 hover:text-white transition-colors pb-1"
        >
          TRAFFIC OVERVIEW
        </Link>
        <Link
          href="/admin/analytics/clicks"
          className="text-xs font-mono font-bold text-amber border-b-2 border-amber pb-1"
        >
          INTERACTIONS & CLICKS
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Total Code Copies
          </p>
          <p className="mt-2 font-mono text-3xl font-bold text-white">{totalCopies}</p>
        </div>
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            External Link Clicks
          </p>
          <p className="mt-2 font-mono text-3xl font-bold text-[#16A34A]">{totalLinkClicks}</p>
        </div>
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Share Link Clicks
          </p>
          <p className="mt-2 font-mono text-3xl font-bold text-amber">{totalShareClicks}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timeline Chart */}
        <div className="lg:col-span-2 border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
          <h3 className="font-syne text-xs font-bold uppercase tracking-wider text-white">
            Activity Timeline (Last 7 Days)
          </h3>
          <AnalyticsChart type="bar" data={timelineChartData} options={timelineChartOptions} height={200} />
        </div>

        {/* Share/Breakdown Chart */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
          <h3 className="font-syne text-xs font-bold uppercase tracking-wider text-white">
            Interactions Share
          </h3>
          <div className="flex items-center justify-center h-[200px]">
            <AnalyticsChart type="doughnut" data={breakdownChartData} height={180} />
          </div>
        </div>
      </div>

      {/* Top Posts Chart */}
      {topPosts.length > 0 && (
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
          <h3 className="font-syne text-xs font-bold uppercase tracking-wider text-white">
            Top Posts by Interactions
          </h3>
          <AnalyticsChart type="bar" data={topPostsChartData} options={topPostsChartOptions} height={200} />
        </div>
      )}

      {/* Post-wise Grouped Table */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400">
          Post Interactions Summary
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#262626] text-zinc-500">
                <th className="pb-3 font-bold uppercase tracking-wider">Post Title</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Link Clicks</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Share Clicks</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Code Copies</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Total</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Last Activity</th>
                <th className="pb-3 text-right font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {postsWithStats.map((post) => (
                <tr key={post.id} className="text-zinc-300 hover:bg-white/[0.01]">
                  <td className="py-3.5 max-w-[280px] truncate font-bold text-white">
                    <Link href={`/admin/analytics/clicks/${post.id}`} className="hover:text-amber hover:underline">
                      {post.title}
                    </Link>
                  </td>
                  <td className="py-3.5 text-zinc-400">{post.linkClicks}</td>
                  <td className="py-3.5 text-zinc-400">{post.shareClicks}</td>
                  <td className="py-3.5 text-zinc-400">{post.codeCopies}</td>
                  <td className="py-3.5 font-bold text-amber">{post.totalInteractions}</td>
                  <td className="py-3.5 text-zinc-500">
                    {post.lastActivity ? formatDate(post.lastActivity) : "—"}
                  </td>
                  <td className="py-3.5 text-right">
                    <Link
                      href={`/admin/analytics/clicks/${post.id}`}
                      className="border border-[#262626] bg-black/40 px-2.5 py-1 text-[10px] font-bold text-zinc-400 hover:border-amber hover:text-amber transition-colors rounded-none cursor-pointer"
                    >
                      VIEW DETAILS →
                    </Link>
                  </td>
                </tr>
              ))}
              {orphanShortLinks.map((link) => {
                let sourceLabel = "";
                let baseTargetUrl = link.targetUrl;
                try {
                  const url = new URL(link.targetUrl);
                  const utmSource = url.searchParams.get("utm_source");
                  if (utmSource) {
                    sourceLabel = ` (${utmSource.charAt(0).toUpperCase() + utmSource.slice(1)})`;
                  }
                  if (url.protocol === "mailto:") {
                    baseTargetUrl = `mailto:${url.pathname}`;
                  } else {
                    baseTargetUrl = url.origin + url.pathname;
                  }
                } catch {
                  if (link.targetUrl.includes("utm_source=")) {
                    const match = link.targetUrl.match(/utm_source=([^&]+)/);
                    if (match && match[1]) {
                      sourceLabel = ` (${match[1].charAt(0).toUpperCase() + match[1].slice(1)})`;
                    }
                    baseTargetUrl = link.targetUrl.split("?")[0];
                  }
                }

                const targetDisplay = baseTargetUrl.includes("github.com")
                  ? `GitHub Profile${sourceLabel}`
                  : baseTargetUrl.includes("linkedin.com")
                  ? `LinkedIn Profile${sourceLabel}`
                  : baseTargetUrl.includes("twitter.com") || baseTargetUrl.includes("x.com")
                  ? `Twitter / X Profile${sourceLabel}`
                  : baseTargetUrl.includes("mailto:")
                  ? `Email Link (${baseTargetUrl.replace("mailto:", "").split("?")[0]})${sourceLabel}`
                  : `${baseTargetUrl}${sourceLabel}`;

                const lastClickTime = link.clicks.length > 0
                  ? new Date(Math.max(...link.clicks.map((c) => c.createdAt.getTime())))
                  : null;

                return (
                  <tr key={link.id} className="text-zinc-300 hover:bg-white/[0.01] bg-black/10">
                    <td className="py-3.5 max-w-[280px] truncate font-bold text-zinc-400">
                      <div>{targetDisplay}</div>
                      <div className="text-[10px] text-zinc-500 font-normal mt-0.5">/s/{link.code}</div>
                    </td>
                    <td className="py-3.5 text-zinc-400">{link.clicks.length}</td>
                    <td className="py-3.5 text-zinc-500">—</td>
                    <td className="py-3.5 text-zinc-500">—</td>
                    <td className="py-3.5 font-bold text-amber">{link.clicks.length}</td>
                    <td className="py-3.5 text-zinc-500">
                      {lastClickTime ? formatDate(lastClickTime) : "—"}
                    </td>
                    <td className="py-3.5 text-right">
                      <a
                        href={link.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-[#262626] bg-black/40 px-2.5 py-1 text-[10px] font-bold text-zinc-400 hover:border-amber hover:text-amber transition-colors rounded-none cursor-pointer inline-block"
                      >
                        VISIT LINK →
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project-wise Grouped Table */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400">
          Project Link Clicks Summary
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#262626] text-zinc-500">
                <th className="pb-3 font-bold uppercase tracking-wider">Project</th>
                <th className="pb-3 font-bold uppercase tracking-wider">GitHub Clicks</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Live Clicks</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Source Breakdown</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Total</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Last Click</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {projectsStats.map((proj) => (
                <tr key={proj.id} className="text-zinc-300 hover:bg-white/[0.01]">
                  <td className="py-3.5 font-bold text-white">
                    {proj.title}
                  </td>
                  <td className="py-3.5 text-zinc-400">{proj.githubTotal}</td>
                  <td className="py-3.5 text-zinc-400">{proj.liveTotal}</td>
                  <td className="py-3.5 text-[10px] text-zinc-500">
                    <span className="text-zinc-400">Home:</span> {proj.sourceBreakdown.homepage_experiments} |{" "}
                    <span className="text-zinc-400">List:</span> {proj.sourceBreakdown.projects_list} |{" "}
                    <span className="text-zinc-400">Detail:</span> {proj.sourceBreakdown.project_detail}
                  </td>
                  <td className="py-3.5 font-bold text-amber">{proj.totalClicks}</td>
                  <td className="py-3.5 text-zinc-500">
                    {proj.lastActivity ? formatDate(proj.lastActivity) : "—"}
                  </td>
                </tr>
              ))}
              {projectsStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-550 uppercase">
                    No projects found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
